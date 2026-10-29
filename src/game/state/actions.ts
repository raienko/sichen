import { RULES, getEnemy, getQuest, getSkill, getZone } from "../data";
import type { StringKey, Vars } from "../i18n";
import { planFor } from "../sim/ai";
import {
  apFor,
  createBattle,
  emptyPlan,
  living,
  planCost,
  resolveRound,
  type Plan,
} from "../sim/battle";
import { applyCard, drawCards } from "../sim/death";
import {
  allocate,
  assignBar,
  battleActions,
  createHero,
  enemyXp,
  equip,
  gainXp,
  heroCombatant,
  learnSkill,
  meetsRequirement,
  respec,
  restore,
  unequip,
} from "../sim/hero";
import {
  itemName,
  makeUnique,
  rollDrops,
  sellValue,
  applyRelicTo,
} from "../sim/loot";
import * as quests from "../sim/quests";
import { newSeed, Rng } from "../sim/rng";
import { heroStats } from "../sim/stats";
import {
  RARITIES,
  type Delivery,
  type EquipSlot,
  type Item,
  type Look,
  type QuestReward,
  type Rarity,
  type Relic,
} from "../sim/types";

import { slotStorage } from "./platform";
import { resetRuntime, runtime } from "./runtime";
import { loadSlots, serialize, type SaveData } from "./save";
import { store, type Panel, type Rewards } from "./store";

const { get, set } = store;

function save(): SaveData {
  const current = get().save;
  if (!current) throw new Error("No game loaded");
  return current;
}

function rng(): Rng {
  return new Rng(newSeed());
}

/** Replaces the loaded save, and writes it to its slot. */
function commit(update: (s: SaveData) => SaveData, persist = true) {
  const next = { ...update(save()), updatedAt: Date.now() };
  set({ save: next });
  if (persist) writeSlot(next);
}

function writeSlot(data: SaveData) {
  const slot = get().slot;
  if (slot === null) return;
  slotStorage.write(slot, serialize(data));
  const slots = [...get().slots];
  slots[slot] = data;
  set({ slots });
}

let toastId = 0;
export function toast(
  icon: string,
  key: StringKey,
  vars?: Vars,
  tone?: "good" | "bad" | "loot",
) {
  toastId += 1;
  const id = toastId;
  set((s) => ({
    toasts: [...s.toasts.slice(-3), { id, icon, key, vars, tone }],
  }));
  setTimeout(
    () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    3200,
  );
}

// ---------------------------------------------------------------- slots

export function refreshSlots() {
  set({ slots: loadSlots(slotStorage) });
}

export function goToCreate(slot: number) {
  set({ scene: { name: "create", slot } });
}

export function goToTitle() {
  refreshSlots();
  set({
    scene: { name: "title" },
    save: null,
    slot: null,
    panel: null,
    battle: null,
  });
}

export function createGame(
  slot: number,
  name: string,
  look: Look,
  classId: string,
) {
  const r = rng();
  const hero = createHero(r, name, look, classId);
  const kyiv = getZone("kyiv");
  const data: SaveData = {
    version: 1,
    id: `${Date.now().toString(36)}${r.int(0, 1e6)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hero,
    gold: 20,
    relics: { change: 0, ascent: 1, addition: 0, purge: 0 },
    inventory: [],
    stash: [],
    quests: {},
    world: { zoneId: "kyiv", ...kyiv.spawn, cleared: [] },
    settings: { lootFilter: "normal", autoBattle: false },
    seed: r.seed,
    stats: { kills: 0, deaths: 0, battles: 0 },
  };
  set({ slot });
  enterLoaded(data);
  writeSlot(data);
}

export function continueGame(slot: number) {
  const data = get().slots[slot];
  if (!data) return;
  set({ slot });
  enterLoaded(data);
}

function enterLoaded(data: SaveData) {
  resetRuntime(data.world.x, data.world.z);
  runtime.safeUntil = Date.now() + 2000;
  set((s) => ({
    save: data,
    scene: { name: "world" },
    panel: null,
    battle: null,
    worldVersion: s.worldVersion + 1,
  }));
}

export function deleteSlot(slot: number) {
  slotStorage.remove(slot);
  refreshSlots();
}

/** Writes the hero's position and everything else to the slot. */
export function saveGame() {
  if (!get().save) return;
  commit((s) => ({
    ...s,
    world: {
      ...s.world,
      x: Math.round(runtime.x * 10) / 10,
      z: Math.round(runtime.z * 10) / 10,
    },
  }));
}

// ---------------------------------------------------------------- world

export function openPanel(panel: Panel | null) {
  set({ panel });
}

export function enterZone(zoneId: string, spawn: { x: number; z: number }) {
  const zone = getZone(zoneId);
  const from = getZone(save().world.zoneId);
  commit((s) => ({
    ...s,
    // Packs come back each time the hero rides out from town.
    world: {
      zoneId,
      ...spawn,
      cleared: from.town && !zone.town ? [] : s.world.cleared,
    },
    hero: zone.town ? restore(s.hero) : s.hero,
  }));
  resetRuntime(spawn.x, spawn.z);
  runtime.safeUntil = Date.now() + 1500;
  set((s) => ({ panel: null, worldVersion: s.worldVersion + 1 }));
  toast(zone.town ? "house" : "map", "toast.zone", { name: zone.name });
}

/** Out-of-battle regeneration, called by the world a few times a second. */
export function regenerate(seconds: number) {
  const data = get().save;
  if (!data) return;
  const stats = heroStats(data.hero);
  const { hero } = data;
  if (
    hero.hp >= stats.maxHp &&
    hero.mana >= stats.maxMana &&
    hero.stamina >= stats.maxStamina
  ) {
    return;
  }
  const rate = seconds / 25;
  commit(
    (s) => ({
      ...s,
      hero: {
        ...s.hero,
        hp: Math.min(
          stats.maxHp,
          Math.round(s.hero.hp + stats.maxHp * rate + 0.5),
        ),
        mana: Math.min(
          stats.maxMana,
          Math.round(s.hero.mana + stats.maxMana * rate + 0.5),
        ),
        stamina: Math.min(
          stats.maxStamina,
          Math.round(s.hero.stamina + stats.maxStamina * rate + 0.5),
        ),
      },
    }),
    false,
  );
}

export function examine(interactableId: string) {
  const data = save();
  const choiceQuest = Object.entries(data.quests).find(([id, st]) => {
    const q = getQuest(id);
    return (
      st.status === "active" &&
      q.objective.type === "choice" &&
      q.objective.interactableId === interactableId
    );
  });
  const { log, changed } = quests.onExplore(data.quests, interactableId);
  if (changed.length > 0) {
    commit((s) => ({ ...s, quests: log }));
    for (const id of changed)
      toast(
        "circle-check",
        "toast.questReady",
        { name: getQuest(id).name },
        "good",
      );
  }
  set({
    panel:
      choiceQuest || changed.length === 0
        ? { name: "interact", interactableId }
        : null,
  });
}

// ---------------------------------------------------------------- quests

function payReward(reward: QuestReward) {
  const r = rng();
  let levels = 0;
  commit((s) => {
    const gained = gainXp(s.hero, reward.xp);
    levels = gained.levels;
    const relics = { ...s.relics };
    for (const [relic, n] of Object.entries(reward.relics ?? {})) {
      relics[relic as Relic] += n ?? 0;
    }
    const inventory = reward.uniqueId
      ? [...s.inventory, makeUnique(r, reward.uniqueId, s.hero.level)]
      : s.inventory;
    return {
      ...s,
      hero: gained.hero,
      gold: s.gold + reward.gold,
      relics,
      inventory,
    };
  });
  if (reward.uniqueId)
    toast(
      "gem",
      "toast.loot",
      { name: itemName(save().inventory.at(-1)!) },
      "loot",
    );
  if (levels > 0)
    toast("circle-up", "toast.levelUp", { level: save().hero.level }, "good");
}

export function acceptQuest(questId: string) {
  commit((s) => ({ ...s, quests: quests.accept(s.quests, questId) }));
  toast(getQuest(questId).icon, "toast.quest", {
    name: getQuest(questId).name,
  });
}

export function turnInQuest(questId: string) {
  const quest = getQuest(questId);
  commit((s) => ({ ...s, quests: quests.turnIn(s.quests, questId) }));
  payReward(quest.reward);
  toast("circle-check", "toast.questReady", { name: quest.name }, "good");
}

export function makeChoice(questId: string, choiceId: string) {
  const quest = getQuest(questId);
  if (quest.objective.type !== "choice") return;
  const choice = quest.objective.options.find((o) => o.id === choiceId);
  if (!choice) return;
  if (choice.battlePackId) {
    set({ panel: null });
    startBattle(choice.battlePackId, { questId, choiceId });
    return;
  }
  commit((s) => ({ ...s, quests: quests.choose(s.quests, questId, choiceId) }));
  payReward(choice.reward);
  set({ panel: null });
}

// ---------------------------------------------------------------- npcs

export function learn(skillId: string) {
  const skill = getSkill(skillId);
  const price = skill.learn?.gold ?? 0;
  if (save().gold < price) return;
  commit((s) => ({
    ...s,
    gold: s.gold - price,
    hero: learnSkill(s.hero, skillId),
  }));
  toast(skill.icon, "toast.learned", { name: skill.name }, "good");
}

export function buyPotion(kind: "hp" | "mana") {
  const price = RULES.potionPrice[kind];
  const data = save();
  if (data.gold < price || data.hero.potions[kind] >= RULES.potionCap) return;
  commit((s) => ({
    ...s,
    gold: s.gold - price,
    hero: {
      ...s.hero,
      potions: { ...s.hero.potions, [kind]: s.hero.potions[kind] + 1 },
    },
  }));
}

export function heal() {
  commit((s) => ({ ...s, hero: restore(s.hero) }));
}

export function respecTree() {
  if (save().gold < RULES.respecPrice) return;
  commit((s) => ({
    ...s,
    gold: s.gold - RULES.respecPrice,
    hero: respec(s.hero),
  }));
}

export function allocateNode(nodeId: string) {
  commit((s) => ({ ...s, hero: allocate(s.hero, nodeId) }));
}

export function setBarSlot(index: number, skillId: string | null) {
  commit((s) => ({ ...s, hero: assignBar(s.hero, index, skillId) }));
}

export function setLootFilter(lootFilter: Rarity) {
  commit((s) => ({ ...s, settings: { ...s.settings, lootFilter } }));
}

// ---------------------------------------------------------------- items

export function equipItem(uid: string) {
  const data = save();
  const item = data.inventory.find((i) => i.uid === uid);
  if (!item || !meetsRequirement(data.hero, item)) return;
  const { hero, removed } = equip(data.hero, item);
  commit((s) => ({
    ...s,
    hero,
    inventory: [...s.inventory.filter((i) => i.uid !== uid), ...removed],
  }));
}

export function unequipItem(slot: EquipSlot) {
  const data = save();
  if (data.inventory.length >= RULES.inventorySize) {
    toast("box-archive", "inv.full", undefined, "bad");
    return;
  }
  const { hero, removed } = unequip(data.hero, slot);
  if (!removed) return;
  commit((s) => ({ ...s, hero, inventory: [...s.inventory, removed] }));
}

export function sellItem(uid: string) {
  const item = save().inventory.find((i) => i.uid === uid);
  if (!item) return;
  commit((s) => ({
    ...s,
    gold: s.gold + sellValue(item),
    inventory: s.inventory.filter((i) => i.uid !== uid),
  }));
}

export function dropItem(uid: string) {
  commit((s) => ({
    ...s,
    inventory: s.inventory.filter((i) => i.uid !== uid),
  }));
}

export function moveToStash(uid: string) {
  const data = save();
  const item = data.inventory.find((i) => i.uid === uid);
  if (!item || data.stash.length >= RULES.stashSize) return;
  commit((s) => ({
    ...s,
    inventory: s.inventory.filter((i) => i.uid !== uid),
    stash: [...s.stash, item],
  }));
}

export function takeFromStash(uid: string) {
  const data = save();
  const item = data.stash.find((i) => i.uid === uid);
  if (!item || data.inventory.length >= RULES.inventorySize) return;
  commit((s) => ({
    ...s,
    stash: s.stash.filter((i) => i.uid !== uid),
    inventory: [...s.inventory, item],
  }));
}

export function applyRelic(relic: Relic, uid: string) {
  const data = save();
  if (data.relics[relic] <= 0) return;
  const inInventory = data.inventory.find((i) => i.uid === uid);
  const slot = (Object.keys(data.hero.equipment) as EquipSlot[]).find(
    (k) => data.hero.equipment[k]?.uid === uid,
  );
  const item = inInventory ?? (slot ? data.hero.equipment[slot] : undefined);
  if (!item) return;
  const changed = applyRelicTo(rng(), relic, item);
  if (!changed) return;
  commit((s) => ({
    ...s,
    relics: { ...s.relics, [relic]: s.relics[relic] - 1 },
    inventory: s.inventory.map((i) => (i.uid === uid ? changed : i)),
    hero: slot
      ? { ...s.hero, equipment: { ...s.hero.equipment, [slot]: changed } }
      : s.hero,
  }));
}

// ---------------------------------------------------------------- battle

function packSpecs(packId: string) {
  const zone = getZone(save().world.zoneId);
  const pack =
    zone.packs.find((p) => p.id === packId) ??
    getZone("vyshhorod").packs.find((p) => p.id === packId);
  if (!pack) throw new Error(`Unknown pack ${packId}`);
  return pack.enemies;
}

export function startBattle(
  packId: string,
  questChoice?: { questId: string; choiceId: string },
) {
  if (get().battle) return;
  const data = save();
  const state = createBattle(
    newSeed(),
    [heroCombatant(data.hero)],
    packSpecs(packId),
  );
  runtime.moveTarget = null;
  set({
    scene: { name: "battle" },
    panel: null,
    battle: {
      state,
      before: state,
      packId,
      questChoice,
      plan: emptyPlan(),
      deadline: Date.now() + RULES.roundSeconds * 1000,
      phase: "planning",
      events: [],
      rewards: null,
      returnTo: { x: runtime.x, z: runtime.z },
    },
  });
}

function updatePlan(update: (plan: Plan) => Plan) {
  const battle = get().battle;
  if (!battle || battle.phase !== "planning") return;
  set({ battle: { ...battle, plan: update(battle.plan) } });
}

export function planBudget(): number {
  const battle = get().battle;
  const hero = battle?.state.actors.find((a) => a.id === "hero");
  if (!battle || !hero) return 0;
  return apFor(hero) - planCost(battle.plan);
}

export function addAttack(skillId: string, targetId?: string) {
  const skill = getSkill(skillId);
  if (planBudget() < skill.ap) return;
  updatePlan((plan) =>
    plan.attacks.length >= RULES.attackSlots
      ? plan
      : { ...plan, attacks: [...plan.attacks, { skillId, targetId }] },
  );
}

export function removeAttack(index: number) {
  updatePlan((plan) => ({
    ...plan,
    attacks: plan.attacks.filter((_, i) => i !== index),
  }));
}

export function changeDefense(kind: Delivery, delta: number) {
  if (delta > 0 && planBudget() < delta) return;
  updatePlan((plan) => ({
    ...plan,
    defense: {
      ...plan.defense,
      [kind]: Math.max(0, plan.defense[kind] + delta),
    },
  }));
}

export function toggleAuto() {
  commit((s) => ({
    ...s,
    settings: { ...s.settings, autoBattle: !s.settings.autoBattle },
  }));
}

export function autoPlan() {
  const battle = get().battle;
  const hero = battle?.state.actors.find((a) => a.id === "hero");
  if (!battle || !hero || battle.phase !== "planning") return;
  const plan = planFor(battle.state, hero, rng(), battleActions(save().hero));
  set({ battle: { ...battle, plan } });
}

export function flee() {
  updatePlan(() => ({ ...emptyPlan(), flee: true }));
  ready();
}

/** Locks in the hero's plan, plans the enemies and resolves the round. */
export function ready() {
  const battle = get().battle;
  if (!battle || battle.phase !== "planning") return;
  const r = new Rng(battle.state.rng ^ 0x5bd1e995);
  const secondsLeft = Math.max(0, (battle.deadline - Date.now()) / 1000);
  const plans: Record<string, Plan> = {
    hero: { ...battle.plan, readyAt: secondsLeft },
  };
  for (const actor of living(battle.state)) {
    if (actor.controller === "ai")
      plans[actor.id] = planFor(battle.state, actor, r);
  }
  const { state, events } = resolveRound(battle.state, plans);
  set({
    battle: {
      ...battle,
      before: battle.state,
      state,
      events,
      phase: "playing",
    },
  });
}

/** The UI calls this once it has played the round's events. */
export function finishPlayback() {
  const battle = get().battle;
  if (!battle || battle.phase !== "playing") return;
  const { state } = battle;
  if (!state.result) {
    set({
      battle: {
        ...battle,
        phase: "planning",
        plan: emptyPlan(),
        deadline: Date.now() + RULES.roundSeconds * 1000,
        events: [],
      },
    });
    return;
  }
  const hero = state.actors.find((a) => a.id === "hero")!;
  // The hero leaves battle with what they had left, potions included.
  commit(
    (s) => ({
      ...s,
      hero: {
        ...s.hero,
        hp: Math.max(1, hero.hp),
        mana: hero.mana,
        stamina: hero.stamina,
        potions: { ...hero.potions },
      },
      stats: { ...s.stats, battles: s.stats.battles + 1 },
    }),
    false,
  );
  if (state.result === "won") {
    set({ battle: { ...battle, phase: "over", rewards: grantVictory() } });
  } else if (state.result === "fled") {
    set({ battle: { ...battle, phase: "over", rewards: null } });
  } else {
    commit((s) => ({
      ...s,
      stats: { ...s.stats, deaths: s.stats.deaths + 1 },
    }));
    set({
      scene: { name: "death", cards: drawCards(rng()), picked: null },
      battle: null,
    });
  }
}

function grantVictory(): Rewards {
  const battle = get().battle!;
  const data = save();
  const r = rng();
  const foes = battle.state.actors.filter((a) => a.side === 1 && !a.summoned);
  const xp = foes.reduce(
    (sum, f) => sum + enemyXp(f.xp, f.level, data.hero.level),
    0,
  );
  const drops = rollDrops(r, foes);
  const filterRank = RARITIES.indexOf(data.settings.lootFilter);
  let salvaged = 0;
  const kept: Item[] = [];
  let room = RULES.inventorySize - data.inventory.length;
  for (const item of drops.items) {
    if (RARITIES.indexOf(item.rarity) < filterRank || room <= 0) {
      salvaged += sellValue(item);
    } else {
      kept.push(item);
      room -= 1;
    }
  }
  let log = data.quests;
  const updated: string[] = [];
  const kills = quests.onKills(
    log,
    battle.state.actors
      .filter((a) => a.side === 1 && a.hp <= 0 && a.enemyId)
      .map((a) => [...getEnemy(a.enemyId!).tags]),
  );
  log = kills.log;
  updated.push(...kills.changed);
  if (battle.packId) {
    const defeated = quests.onPackDefeated(log, battle.packId);
    log = defeated.log;
    updated.push(...defeated.changed);
  }
  const gained = gainXp(data.hero, xp);
  commit((s) => {
    const relics = { ...s.relics };
    for (const [relic, n] of Object.entries(drops.relics))
      relics[relic as Relic] += n ?? 0;
    return {
      ...s,
      hero: {
        ...gained.hero,
        potions: {
          hp: Math.min(
            RULES.potionCap,
            gained.hero.potions.hp + drops.potions.hp,
          ),
          mana: Math.min(
            RULES.potionCap,
            gained.hero.potions.mana + drops.potions.mana,
          ),
        },
      },
      gold: s.gold + drops.gold + salvaged,
      relics,
      inventory: [...s.inventory, ...kept],
      quests: log,
      world: battle.packId
        ? { ...s.world, cleared: [...s.world.cleared, battle.packId] }
        : s.world,
      stats: { ...s.stats, kills: s.stats.kills + foes.length },
    };
  });
  for (const id of new Set(updated)) {
    const st = save().quests[id];
    if (st?.status === "ready")
      toast(
        "circle-check",
        "toast.questReady",
        { name: getQuest(id).name },
        "good",
      );
  }
  if (battle.questChoice) {
    const { questId, choiceId } = battle.questChoice;
    const quest = getQuest(questId);
    commit((s) => ({
      ...s,
      quests: quests.choose(s.quests, questId, choiceId),
    }));
    if (quest.objective.type === "choice") {
      const choice = quest.objective.options.find((o) => o.id === choiceId);
      if (choice) payReward(choice.reward);
    }
  }
  if (gained.levels > 0)
    toast("circle-up", "toast.levelUp", { level: gained.hero.level }, "good");
  return {
    ...drops,
    items: kept,
    xp,
    levels: gained.levels,
    salvaged,
    questsUpdated: updated,
  };
}

export function leaveBattle() {
  const battle = get().battle;
  if (!battle) return;
  runtime.x = battle.returnTo.x;
  runtime.z = battle.returnTo.z;
  runtime.safeUntil = Date.now() + 2500;
  set((s) => ({
    scene: { name: "world" },
    battle: null,
    worldVersion: s.worldVersion + 1,
  }));
  saveGame();
}

export function pickDeathCard(index: number) {
  const scene = get().scene;
  if (scene.name !== "death" || scene.picked !== null) return;
  const card = scene.cards[index];
  if (!card) return;
  const data = save();
  const out = applyCard(card, data.hero, data.gold);
  commit((s) => ({ ...s, hero: restore(out.hero), gold: out.gold }));
  set({ scene: { ...scene, picked: index } });
}

export function riseAgain() {
  const kyiv = getZone("kyiv");
  commit((s) => ({
    ...s,
    world: { ...s.world, zoneId: "kyiv", ...kyiv.spawn },
  }));
  enterLoaded(save());
}
