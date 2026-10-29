import { content, getAffix, getBase, getSet, getUnique } from "../data";

import type { Rng } from "./rng";
import type {
  AffixDef,
  Item,
  ItemBase,
  Rarity,
  Relic,
  Requirement,
  RolledAffix,
} from "./types";

/** Affix counts by rarity: [min, max] total, max per kind. */
const AFFIX_COUNT: Record<
  "magic" | "rare",
  { min: number; max: number; perKind: number }
> = {
  magic: { min: 1, max: 2, perKind: 1 },
  rare: { min: 3, max: 4, perKind: 3 },
};

const RARITY_WEIGHTS: Record<
  "normal" | "boss",
  readonly (readonly [Rarity, number])[]
> = {
  normal: [
    ["normal", 48],
    ["magic", 34],
    ["rare", 12.5],
    ["set", 4],
    ["unique", 1.5],
  ],
  boss: [
    ["magic", 25],
    ["rare", 45],
    ["set", 20],
    ["unique", 10],
  ],
};

function makeUid(rng: Rng): string {
  return `i${rng.int(0, 2 ** 31 - 1).toString(36)}${rng.int(0, 2 ** 31 - 1).toString(36)}`;
}

function pickBase(
  rng: Rng,
  ilvl: number,
  filter?: (b: ItemBase) => boolean,
): ItemBase {
  const pool = content.bases.filter(
    (b) => b.level <= ilvl && (!filter || filter(b)),
  );
  const list =
    pool.length > 0 ? pool : content.bases.filter((b) => b.level === 1);
  return rng.weighted(list.map((b) => [b, 1 + b.level / 3] as const));
}

function tierFor(affix: AffixDef, ilvl: number): number {
  let tier = 0;
  affix.tiers.forEach(([from], i) => {
    if (ilvl >= from) tier = i;
  });
  return tier;
}

export function rollAffix(rng: Rng, item: Item): RolledAffix | null {
  const base = getBase(item.baseId);
  const taken = new Set(item.affixes.map((a) => a.id));
  const limit = item.rarity === "rare" ? AFFIX_COUNT.rare.perKind : 1;
  const counts = { prefix: 0, suffix: 0 };
  for (const a of item.affixes) counts[getAffix(a.id).kind] += 1;
  const pool = content.affixes.filter(
    (a) =>
      a.slots.includes(base.slot) && !taken.has(a.id) && counts[a.kind] < limit,
  );
  if (pool.length === 0) return null;
  const affix = rng.pick(pool);
  const top = tierFor(affix, item.ilvl);
  const tier = rng.int(Math.max(0, top - 1), top);
  const [, min, max] = affix.tiers[tier]!;
  return { id: affix.id, tier, value: rng.int(min, max) };
}

function fillAffixes(rng: Rng, item: Item, count: number): Item {
  for (let i = 0; i < count; i++) {
    const affix = rollAffix(rng, item);
    if (affix) item.affixes.push(affix);
  }
  return item;
}

export function rollItem(
  rng: Rng,
  ilvl: number,
  rarity: Rarity = rng.weighted(RARITY_WEIGHTS.normal),
): Item {
  if (rarity === "unique") {
    const pool = content.uniques.filter(
      (u) => !u.source && getBase(u.baseId).level <= ilvl + 3,
    );
    if (pool.length > 0) return makeUnique(rng, rng.pick(pool).id, ilvl);
    rarity = "rare";
  }
  if (rarity === "set") {
    const pieces = content.sets.flatMap((s) =>
      s.pieces
        .filter((p) => getBase(p.baseId).level <= ilvl + 2)
        .map((p) => ({ setId: s.id, baseId: p.baseId })),
    );
    if (pieces.length > 0) {
      const piece = rng.pick(pieces);
      const item: Item = {
        uid: makeUid(rng),
        baseId: piece.baseId,
        rarity: "set",
        ilvl,
        affixes: [],
        setId: piece.setId,
        sockets: [],
      };
      // Set pieces carry their fixed bonus plus rolled base affixes.
      // Rolled as a magic item would be: one prefix, one suffix at most.
      const rolled = fillAffixes(
        rng,
        { ...item, rarity: "magic" },
        rng.int(1, 2),
      );
      return { ...item, affixes: rolled.affixes };
    }
    rarity = "rare";
  }
  const base = pickBase(rng, ilvl);
  const item: Item = {
    uid: makeUid(rng),
    baseId: base.id,
    rarity,
    ilvl,
    affixes: [],
    sockets: [],
  };
  if (rarity === "magic" || rarity === "rare") {
    const { min, max } = AFFIX_COUNT[rarity];
    fillAffixes(rng, item, rng.int(min, max));
  }
  return item;
}

export function makeUnique(rng: Rng, uniqueId: string, ilvl: number): Item {
  const unique = getUnique(uniqueId);
  return {
    uid: makeUid(rng),
    baseId: unique.baseId,
    rarity: "unique",
    ilvl,
    affixes: [],
    uniqueId,
    sockets: [],
  };
}

export function makeNormal(rng: Rng, baseId: string): Item {
  return {
    uid: makeUid(rng),
    baseId,
    rarity: "normal",
    ilvl: 1,
    affixes: [],
    sockets: [],
  };
}

export function itemName(item: Item): { en: string; uk: string } {
  if (item.uniqueId) return getUnique(item.uniqueId).name;
  const base = getBase(item.baseId);
  if (item.setId) {
    const piece = getSet(item.setId).pieces.find(
      (p) => p.baseId === item.baseId,
    );
    if (piece) return piece.name;
  }
  if (item.rarity === "magic") {
    const prefix = item.affixes
      .map((a) => getAffix(a.id))
      .find((a) => a.kind === "prefix");
    const suffix = item.affixes
      .map((a) => getAffix(a.id))
      .find((a) => a.kind === "suffix");
    return {
      en: [prefix?.name.en, base.name.en, suffix?.name.en]
        .filter(Boolean)
        .join(" "),
      uk: [prefix?.name.uk, base.name.uk, suffix?.name.uk]
        .filter(Boolean)
        .join(" "),
    };
  }
  return base.name;
}

export function requirement(item: Item): Requirement {
  const base = getBase(item.baseId);
  const level =
    item.rarity === "normal"
      ? base.req.level
      : Math.max(base.req.level, Math.floor(item.ilvl * 0.8));
  return { ...base.req, level };
}

const RARITY_VALUE: Record<Rarity, number> = {
  normal: 1,
  magic: 2,
  rare: 4,
  set: 6,
  unique: 8,
};

/** What a merchant pays. */
export function sellValue(item: Item): number {
  return Math.round((4 + item.ilvl * 2) * RARITY_VALUE[item.rarity]);
}

// ---------------------------------------------------------------- drops

export type Drops = {
  items: Item[];
  gold: number;
  relics: Partial<Record<Relic, number>>;
  potions: { hp: number; mana: number };
};

export function rollDrops(
  rng: Rng,
  enemies: readonly { level: number; boss?: boolean; summoned?: boolean }[],
): Drops {
  const counted = enemies.filter((e) => !e.summoned);
  const top = Math.max(1, ...counted.map((e) => e.level));
  const boss = counted.some((e) => e.boss);
  const drops: Drops = {
    items: [],
    gold: 0,
    relics: {},
    potions: { hp: 0, mana: 0 },
  };
  for (const e of counted) drops.gold += rng.int(2, 5) * e.level;
  const count = boss ? 3 : Math.min(3, rng.int(1, Math.max(1, counted.length)));
  for (let i = 0; i < count; i++) {
    const rarity = rng.weighted(
      boss ? RARITY_WEIGHTS.boss : RARITY_WEIGHTS.normal,
    );
    drops.items.push(rollItem(rng, top + (boss ? 1 : 0), rarity));
  }
  if (boss) drops.items.push(makeUnique(rng, "likho_eye", top));
  if (rng.chance(boss ? 100 : 18)) {
    const relic = rng.weighted<Relic>([
      ["change", 4],
      ["ascent", 3],
      ["addition", 2],
      ["purge", 2],
    ]);
    drops.relics[relic] = (drops.relics[relic] ?? 0) + 1;
  }
  if (rng.chance(30)) drops.potions.hp += 1;
  if (rng.chance(20)) drops.potions.mana += 1;
  return drops;
}

// ---------------------------------------------------------------- crafting

export function canUseRelic(relic: Relic, item: Item): boolean {
  if (item.rarity === "unique" || item.rarity === "set") return false;
  switch (relic) {
    case "change":
      return item.rarity === "magic" || item.rarity === "rare";
    case "ascent":
      return item.rarity === "normal" || item.rarity === "magic";
    case "addition":
      return (
        (item.rarity === "magic" &&
          item.affixes.length < AFFIX_COUNT.magic.max) ||
        (item.rarity === "rare" &&
          item.affixes.length < AFFIX_COUNT.rare.max + 2)
      );
    case "purge":
      return item.affixes.length > 0;
  }
}

/** Returns the changed item, or null if the relic does nothing to it. */
export function useRelic(rng: Rng, relic: Relic, item: Item): Item | null {
  if (!canUseRelic(relic, item)) return null;
  const next: Item = { ...item, affixes: [...item.affixes] };
  switch (relic) {
    case "change": {
      const { min, max } = AFFIX_COUNT[next.rarity as "magic" | "rare"];
      next.affixes = [];
      return fillAffixes(rng, next, rng.int(min, max));
    }
    case "ascent":
      if (next.rarity === "normal") {
        next.rarity = "magic";
        return fillAffixes(rng, next, 1);
      }
      next.rarity = "rare";
      return fillAffixes(rng, next, Math.max(1, 3 - next.affixes.length));
    case "addition": {
      const affix = rollAffix(rng, next);
      if (!affix) return null;
      next.affixes.push(affix);
      return next;
    }
    case "purge":
      next.affixes.splice(rng.int(0, next.affixes.length - 1), 1);
      return next;
  }
}
