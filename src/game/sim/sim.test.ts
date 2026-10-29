import { readFileSync } from "node:fs";
import { join } from "node:path";

import { content, getBase, getSkill, validateContent } from "../data";
import { deserialize, serialize, type SaveData } from "../state/save";
import { decodeSave, encodeSave } from "../state/codec";

import { planFor } from "./ai";
import {
  createBattle,
  hitChance,
  living,
  resolveRound,
  sanitizePlan,
  type BattleState,
  type Plan,
} from "./battle";
import { applyCard, drawCards } from "./death";
import {
  allocate,
  battleActions,
  canAllocate,
  createHero,
  equip,
  gainXp,
  heroCombatant,
  meetsRequirement,
  restore,
  xpToNext,
} from "./hero";
import { canUseRelic, rollDrops, rollItem, applyRelicTo } from "./loot";
import { accept, onKills, turnIn } from "./quests";
import { Rng } from "./rng";
import { emptyStats, heroStats } from "./stats";
import type { Look } from "./types";

const LOOK: Look = {
  body: "kozak",
  face: 0,
  hair: 0,
  hairColor: 0,
  mustache: true,
};

function fight(
  seed: number,
  classId: string,
  level: number,
  pack: { enemyId: string; level: number }[],
) {
  const rng = new Rng(seed);
  let hero = createHero(rng, "Ostap", LOOK, classId);
  hero = gainXp(
    hero,
    Array.from({ length: level - 1 }, (_, i) => xpToNext(i + 1)).reduce(
      (a, b) => a + b,
      0,
    ),
  ).hero;
  for (const id of getClassSkills(classId)) {
    if (!hero.learned.includes(id))
      hero = { ...hero, learned: [...hero.learned, id] };
  }
  hero = { ...hero, bar: hero.learned.slice(0, 6) };
  // Roughly what a player has found by this level: some magic and rare
  // gear they can wear, and the tree points spent.
  for (let i = 0; i < 12; i++) {
    const item = rollItem(rng, level, rng.pick(["magic", "rare"] as const));
    const kind = getBase(item.baseId).slot;
    if (kind !== "weapon" && meetsRequirement(hero, item))
      hero = equip(hero, item).hero;
  }
  for (let i = 0; i < 300; i++) {
    const node = rng.pick(content.tree.nodes);
    if (canAllocate(hero, node.id)) hero = allocate(hero, node.id);
  }
  hero = restore(hero);
  let state: BattleState = createBattle(seed, [heroCombatant(hero)], pack);
  const events = [];
  for (let round = 0; round < 40 && !state.result; round++) {
    const plans: Record<string, Plan> = {};
    for (const actor of living(state)) {
      plans[actor.id] = planFor(
        state,
        actor,
        rng,
        actor.controller === "player" ? battleActions(hero) : actor.skills,
      );
    }
    const out = resolveRound(state, plans);
    state = out.state;
    events.push(...out.events);
  }
  return { state, events };
}

function getClassSkills(classId: string) {
  return content.classes.find((c) => c.id === classId)!.skills.slice(0, 6);
}

describe("content", () => {
  it("passes validation", () => {
    expect(validateContent()).toEqual([]);
  });

  it("uses only icons the icon font has", () => {
    const meta = JSON.parse(
      readFileSync(
        join(
          __dirname,
          "../../../node_modules/@react-native-vector-icons/fontawesome6/glyphmaps/FontAwesome6_meta.json",
        ),
        "utf8",
      ),
    ) as { solid: string[] };
    const solid = new Set(meta.solid);
    const icons = [
      ...content.skills.map((s) => s.icon),
      ...content.enemies.map((e) => e.icon),
      ...content.bases.map((b) => b.icon),
      ...content.classes.map((c) => c.icon),
      ...content.quests.map((q) => q.icon),
    ];
    expect(icons.filter((i) => !solid.has(i))).toEqual([]);
  });

  it("gives every class 6 taught + 2 hidden skills", () => {
    for (const cls of content.classes) {
      expect(cls.skills).toHaveLength(8);
      expect(
        cls.skills.filter((id) => getSkill(id).learn?.hiddenBy),
      ).toHaveLength(2);
    }
  });
});

describe("rng", () => {
  it("is deterministic", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect(Array.from({ length: 5 }, () => a.int(0, 100))).toEqual(
      Array.from({ length: 5 }, () => b.int(0, 100)),
    );
  });
});

describe("battle", () => {
  it("resolves identically for the same seed and plans", () => {
    const one = fight(7, "lytsar", 3, [{ enemyId: "orc_grunt", level: 2 }]);
    const two = fight(7, "lytsar", 3, [{ enemyId: "orc_grunt", level: 2 }]);
    expect(one.events.map((e) => e.t)).toEqual(two.events.map((e) => e.t));
    expect(one.state.result).toBe(two.state.result);
  });

  it("lets each class beat an even fight most of the time", () => {
    for (const classId of ["lytsar", "plastun", "kharakternyk"]) {
      let wins = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const { state } = fight(seed, classId, 3, [
          { enemyId: "orc_grunt", level: 2 },
          { enemyId: "upyr", level: 2 },
        ]);
        if (state.result === "won") wins += 1;
      }
      expect(wins).toBeGreaterThanOrEqual(18);
    }
  });

  it("makes the boss a real fight for a level 9 hero", () => {
    let wins = 0;
    let phases = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { state, events } = fight(seed, "lytsar", 9, [
        { enemyId: "likho", level: 10 },
      ]);
      if (state.result === "won") wins += 1;
      if (events.some((e) => e.t === "phase")) phases += 1;
    }
    expect(phases).toBeGreaterThan(5);
    expect(wins).toBeGreaterThan(2);
    expect(wins).toBeLessThan(20);
  });

  it("caps a plan at the AP the actor has", () => {
    const rng = new Rng(1);
    const hero = heroCombatant(createHero(rng, "Ostap", LOOK, "lytsar"));
    const plan = sanitizePlan(hero, {
      attacks: Array.from({ length: 6 }, () => ({ skillId: "strike" })),
      defense: { melee: 3, ranged: 3, mental: 3 },
      readyAt: 10,
    });
    expect(plan.attacks).toHaveLength(5);
    expect(plan.defense).toEqual({ melee: 0, ranged: 0, mental: 0 });
  });

  it("rewards an undefended delivery and punishes a defended one", () => {
    const a = { ...emptyStats(), accuracy: 20 };
    const d = { ...emptyStats(), evasion: 10 };
    expect(hitChance(a, d, 0)).toBeGreaterThan(hitChance(a, d, 1));
    expect(hitChance(a, d, 3)).toBeGreaterThanOrEqual(5);
  });
});

describe("hero", () => {
  it("levels up and never past the cap", () => {
    const hero = createHero(new Rng(1), "Ostap", LOOK, "plastun");
    const { hero: leveled } = gainXp(hero, 1_000_000);
    expect(leveled.level).toBe(10);
    expect(leveled.xp).toBe(0);
  });

  it("allocates only connected nodes with points left", () => {
    let hero = createHero(new Rng(1), "Ostap", LOOK, "lytsar");
    expect(canAllocate(hero, "str_1")).toBe(false);
    hero = gainXp(hero, xpToNext(1)).hero;
    expect(canAllocate(hero, "int_3")).toBe(false);
    expect(canAllocate(hero, "str_1")).toBe(true);
    hero = allocate(hero, "str_1");
    expect(hero.tree).toContain("str_1");
    expect(canAllocate(hero, "str_2")).toBe(false);
  });

  it("counts set bonuses by pieces worn, whatever the class", () => {
    let hero = createHero(new Rng(1), "Ostap", LOOK, "kharakternyk");
    const before = heroStats(hero).maxMana;
    for (const baseId of ["papakha", "kontush"]) {
      hero = equip(hero, {
        uid: baseId,
        baseId,
        rarity: "set",
        ilvl: 5,
        affixes: [],
        setId: "vigil",
        sockets: [],
      }).hero;
    }
    // Two pieces: +10 (hood) +25 (2-piece bonus), plus the kontush implicit.
    expect(heroStats(hero).maxMana).toBe(before + 10 + 25 + 14);
  });

  it("drops the off-hand when a two-handed weapon goes on", () => {
    let hero = createHero(new Rng(1), "Ostap", LOOK, "lytsar");
    hero = equip(hero, {
      uid: "s",
      baseId: "round_shield",
      rarity: "normal",
      ilvl: 1,
      affixes: [],
      sockets: [],
    }).hero;
    const { hero: after, removed } = equip(hero, {
      uid: "p",
      baseId: "spear",
      rarity: "normal",
      ilvl: 4,
      affixes: [],
      sockets: [],
    });
    expect(after.equipment.offhand).toBeUndefined();
    expect(removed.map((i) => i.baseId).sort()).toEqual([
      "round_shield",
      "sabre",
    ]);
  });
});

describe("loot", () => {
  it("rolls 1-3 items and gold per battle", () => {
    const rng = new Rng(3);
    for (let i = 0; i < 50; i++) {
      const drops = rollDrops(rng, [{ level: 4 }, { level: 3 }]);
      expect(drops.items.length).toBeGreaterThanOrEqual(1);
      expect(drops.items.length).toBeLessThanOrEqual(3);
      expect(drops.gold).toBeGreaterThan(0);
    }
  });

  it("gives magic and rare items their affix counts", () => {
    const rng = new Rng(9);
    for (let i = 0; i < 100; i++) {
      const magic = rollItem(rng, 6, "magic");
      expect(magic.affixes.length).toBeGreaterThanOrEqual(1);
      expect(magic.affixes.length).toBeLessThanOrEqual(2);
      const rare = rollItem(rng, 6, "rare");
      expect(rare.affixes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("applies relics only where they make sense", () => {
    const rng = new Rng(5);
    const normal = rollItem(rng, 3, "normal");
    expect(canUseRelic("change", normal)).toBe(false);
    const magic = applyRelicTo(rng, "ascent", normal)!;
    expect(magic.rarity).toBe("magic");
    expect(magic.affixes).toHaveLength(1);
    const rare = applyRelicTo(rng, "ascent", magic)!;
    expect(rare.rarity).toBe("rare");
  });
});

describe("quests and death", () => {
  it("progresses kill quests by tag and pays out once", () => {
    let log = accept({}, "q_smoke");
    for (let i = 0; i < 6; i++) log = onKills(log, [["orc"], ["undead"]]).log;
    expect(log.q_smoke?.status).toBe("ready");
    log = turnIn(log, "q_smoke");
    expect(log.q_smoke?.status).toBe("done");
    expect(turnIn(log, "q_smoke")).toBe(log);
  });

  it("never takes a level or more gold than there is", () => {
    const hero = {
      ...createHero(new Rng(1), "Ostap", LOOK, "lytsar"),
      level: 4,
      xp: 100,
    };
    for (const card of drawCards(new Rng(2), 5)) {
      const out = applyCard(card, hero, 50);
      expect(out.hero.level).toBe(4);
      expect(out.gold).toBeGreaterThanOrEqual(0);
      expect(out.hero.xp).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("saves", () => {
  it("round-trips through the codec, Cyrillic included", () => {
    const value = { name: "Ярослава", n: [1, 2, 3], ok: true };
    expect(decodeSave(encodeSave(value))).toEqual(value);
  });

  it("refuses a tampered save", () => {
    const text = encodeSave({ gold: 10 });
    const tampered =
      text.slice(0, -4) + (text.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(decodeSave(tampered)).toBeNull();
    expect(decodeSave("not a save")).toBeNull();
  });

  it("loads a current save", () => {
    const hero = createHero(new Rng(1), "Ostap", LOOK, "lytsar");
    const save: SaveData = {
      version: 1,
      id: "a",
      createdAt: 0,
      updatedAt: 0,
      hero,
      gold: 5,
      relics: { change: 0, ascent: 0, addition: 0, purge: 0 },
      inventory: [],
      stash: [],
      quests: {},
      world: { zoneId: "kyiv", x: 1, z: 1, cleared: [] },
      settings: { lootFilter: "normal", autoBattle: false },
      seed: 1,
      stats: { kills: 0, deaths: 0, battles: 0 },
    };
    expect(deserialize(serialize(save))).toEqual(save);
  });
});
