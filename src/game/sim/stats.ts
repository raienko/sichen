import {
  getBase,
  getClass,
  getEnemy,
  getNode,
  getSet,
  getUnique,
  getAffix,
} from "../data";

import type { EnemyDef, Hero, Item, StatKey, StatMods, Stats } from "./types";

const KEYS: readonly StatKey[] = [
  "str",
  "dex",
  "int",
  "maxHp",
  "maxMana",
  "maxStamina",
  "hpRegen",
  "manaRegen",
  "staminaRegen",
  "weaponMin",
  "weaponMax",
  "addedPhysical",
  "accuracy",
  "evasion",
  "speed",
  "resPhysical",
  "resMagical",
  "resChaos",
  "incPhysical",
  "incMagical",
  "incChaos",
  "incMaxHp",
  "critChance",
  "critMulti",
];

export const RES_CAP = 75;

export function emptyStats(): Stats {
  return Object.fromEntries(KEYS.map((k) => [k, 0])) as Stats;
}

export function addMods(target: Stats, mods: StatMods, times = 1): Stats {
  for (const [key, value] of Object.entries(mods)) {
    target[key as StatKey] += (value ?? 0) * times;
  }
  return target;
}

/** Every modifier an item gives: base implicit, rolled affixes, unique or set piece. */
export function itemMods(item: Item): StatMods[] {
  const mods: StatMods[] = [getBase(item.baseId).implicit];
  for (const affix of item.affixes) {
    mods.push({ [getAffix(affix.id).stat]: affix.value });
  }
  if (item.uniqueId) mods.push(getUnique(item.uniqueId).mods);
  if (item.setId) {
    const piece = getSet(item.setId).pieces.find(
      (p) => p.baseId === item.baseId,
    );
    if (piece) mods.push(piece.mods);
  }
  return mods;
}

/** How many pieces of each set the hero wears. */
export function setCounts(hero: Hero): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of Object.values(hero.equipment)) {
    if (item?.setId) counts.set(item.setId, (counts.get(item.setId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Turns attributes into the numbers they feed, and applies the "increased"
 * percentages. Done last, so every source of an attribute counts.
 */
function finish(stats: Stats): Stats {
  stats.maxHp += stats.str * 1.5;
  stats.incPhysical += stats.str * 0.5;
  stats.accuracy += stats.dex * 1;
  stats.evasion += stats.dex * 0.6;
  stats.critChance += stats.dex * 0.1;
  stats.maxMana += stats.int * 1;
  stats.incMagical += stats.int * 0.6;
  stats.manaRegen += stats.int * 0.05;
  stats.maxHp *= 1 + stats.incMaxHp / 100;
  if (stats.critMulti === 0) stats.critMulti = 150;
  for (const key of ["maxHp", "maxMana", "maxStamina"] as const) {
    stats[key] = Math.max(1, Math.round(stats[key]));
  }
  for (const key of ["resPhysical", "resMagical", "resChaos"] as const) {
    stats[key] = Math.min(RES_CAP, stats[key]);
  }
  return stats;
}

export function heroStats(hero: Hero): Stats {
  const cls = getClass(hero.classId);
  const stats = emptyStats();
  addMods(stats, cls.base);
  addMods(stats, cls.perLevel, hero.level - 1);
  for (const id of hero.tree) addMods(stats, getNode(id).mods);
  const weapon = hero.equipment.weapon;
  if (!weapon) addMods(stats, { weaponMin: 2, weaponMax: 4 });
  for (const item of Object.values(hero.equipment)) {
    if (item) for (const mods of itemMods(item)) addMods(stats, mods);
  }
  for (const [setId, count] of setCounts(hero)) {
    for (const bonus of getSet(setId).bonuses) {
      if (count >= bonus.pieces) addMods(stats, bonus.mods);
    }
  }
  return finish(stats);
}

export function enemyStats(def: EnemyDef | string, level: number): Stats {
  const enemy = typeof def === "string" ? getEnemy(def) : def;
  const stats = emptyStats();
  addMods(stats, enemy.base);
  addMods(stats, enemy.perLevel, level - 1);
  return finish(stats);
}
