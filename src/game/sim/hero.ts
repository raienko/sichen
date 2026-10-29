import {
  BASIC_ACTIONS,
  POTION_ACTIONS,
  RULES,
  getBase,
  getClass,
  getSkill,
  treeNeighbours,
} from "../data";

import type { Combatant } from "./battle";
import { makeNormal, requirement } from "./loot";
import type { Rng } from "./rng";
import { heroStats } from "./stats";
import type { EquipSlot, Hero, Item, Look, QuestState } from "./types";

export function xpToNext(level: number): number {
  return Math.round(30 * level ** 1.5);
}

/** XP an enemy is worth to a hero of this level. */
export function enemyXp(
  base: number,
  enemyLevel: number,
  heroLevel: number,
): number {
  const raw = base * (1 + 0.35 * (enemyLevel - 1));
  const gap = heroLevel - enemyLevel;
  const factor = gap >= 4 ? 0.3 : gap >= 2 ? 0.7 : 1;
  return Math.max(1, Math.round(raw * factor));
}

export function createHero(
  rng: Rng,
  name: string,
  look: Look,
  classId: string,
): Hero {
  const cls = getClass(classId);
  const first = cls.skills[0]!;
  const hero: Hero = {
    name,
    look,
    classId,
    level: 1,
    xp: 0,
    learned: [first],
    bar: [first, null, null, null, null, null],
    tree: [cls.treeStart],
    equipment: {
      weapon: makeNormal(rng, cls.startWeapon),
      chest: makeNormal(rng, "zhupan"),
    },
    hp: 0,
    mana: 0,
    stamina: 0,
    potions: { hp: 3, mana: 2 },
  };
  return restore(hero);
}

/** Back to full HP, mana and stamina (town, a new level, the healer). */
export function restore(hero: Hero): Hero {
  const stats = heroStats(hero);
  return {
    ...hero,
    hp: stats.maxHp,
    mana: stats.maxMana,
    stamina: stats.maxStamina,
  };
}

/** Keeps current resources inside their maximums after gear or tree changes. */
export function clampResources(hero: Hero): Hero {
  const stats = heroStats(hero);
  return {
    ...hero,
    hp: Math.min(hero.hp, stats.maxHp),
    mana: Math.min(hero.mana, stats.maxMana),
    stamina: Math.min(hero.stamina, stats.maxStamina),
  };
}

export function gainXp(
  hero: Hero,
  amount: number,
): { hero: Hero; levels: number } {
  let { level, xp } = hero;
  xp += amount;
  let levels = 0;
  while (level < RULES.levelCap && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levels += 1;
  }
  if (level >= RULES.levelCap) xp = 0;
  const next = { ...hero, level, xp };
  return { hero: levels > 0 ? restore(next) : next, levels };
}

/** Where a skill's power level comes from; gems or gear plug in here later. */
export function skillLevel(hero: Hero): number {
  return hero.level;
}

// ---------------------------------------------------------------- skills

export type SkillAvailability = "learned" | "learnable" | "level" | "hidden";

export function skillAvailability(
  hero: Hero,
  skillId: string,
  quests: Record<string, QuestState>,
): SkillAvailability {
  if (hero.learned.includes(skillId)) return "learned";
  const learn = getSkill(skillId).learn;
  if (!learn) return "hidden";
  if (learn.hiddenBy && quests[learn.hiddenBy]?.status !== "done")
    return "hidden";
  return hero.level >= learn.level ? "learnable" : "level";
}

export function learnSkill(hero: Hero, skillId: string): Hero {
  if (hero.learned.includes(skillId)) return hero;
  const bar = [...hero.bar];
  const free = bar.indexOf(null);
  if (free >= 0) bar[free] = skillId;
  return { ...hero, learned: [...hero.learned, skillId], bar };
}

export function assignBar(
  hero: Hero,
  index: number,
  skillId: string | null,
): Hero {
  const bar = hero.bar.map((id) => (id === skillId ? null : id));
  bar[index] = skillId;
  return { ...hero, bar };
}

/** Everything the hero can do in battle, in bar order. */
export function battleActions(hero: Hero): string[] {
  return [
    ...BASIC_ACTIONS,
    ...hero.bar.filter((id): id is string => id !== null),
    ...POTION_ACTIONS,
  ];
}

export function heroCombatant(hero: Hero): Combatant {
  const base = heroStats(hero);
  return {
    id: "hero",
    side: 0,
    row: 0,
    slot: 1,
    name: { en: hero.name, uk: hero.name },
    kind: `hero_${hero.classId}`,
    icon: getClass(hero.classId).icon,
    level: hero.level,
    base,
    hp: Math.max(1, Math.min(hero.hp, base.maxHp)),
    mana: Math.min(hero.mana, base.maxMana),
    stamina: Math.min(hero.stamina, base.maxStamina),
    statuses: [],
    buffs: [],
    skills: battleActions(hero),
    skillLevel: skillLevel(hero),
    potions: { ...hero.potions },
    controller: "player",
    phase: 0,
    xp: 0,
  };
}

// ---------------------------------------------------------------- tree

export function treePointsLeft(hero: Hero): number {
  return hero.level - 1 - (hero.tree.length - 1);
}

export function canAllocate(hero: Hero, nodeId: string): boolean {
  if (hero.tree.includes(nodeId) || treePointsLeft(hero) <= 0) return false;
  return treeNeighbours(nodeId).some((n) => hero.tree.includes(n));
}

export function allocate(hero: Hero, nodeId: string): Hero {
  if (!canAllocate(hero, nodeId)) return hero;
  return clampResources({ ...hero, tree: [...hero.tree, nodeId] });
}

export function respec(hero: Hero): Hero {
  return clampResources({ ...hero, tree: [getClass(hero.classId).treeStart] });
}

// ---------------------------------------------------------------- gear

export function meetsRequirement(hero: Hero, item: Item): boolean {
  const req = requirement(item);
  const stats = heroStats(hero);
  return (
    hero.level >= req.level &&
    stats.str >= (req.str ?? 0) &&
    stats.dex >= (req.dex ?? 0) &&
    stats.int >= (req.int ?? 0)
  );
}

export function slotFor(hero: Hero, item: Item): EquipSlot {
  const slot = getBase(item.baseId).slot;
  if (slot !== "ring") return slot;
  if (!hero.equipment.ring1) return "ring1";
  if (!hero.equipment.ring2) return "ring2";
  return "ring1";
}

/** Puts an item on; returns the hero and whatever came off. */
export function equip(
  hero: Hero,
  item: Item,
  target?: EquipSlot,
): { hero: Hero; removed: Item[] } {
  const slot = target ?? slotFor(hero, item);
  const equipment = { ...hero.equipment };
  const removed: Item[] = [];
  const take = (s: EquipSlot) => {
    const current = equipment[s];
    if (current) removed.push(current);
    delete equipment[s];
  };
  take(slot);
  const base = getBase(item.baseId);
  if (slot === "weapon" && base.twoHanded) take("offhand");
  if (
    slot === "offhand" &&
    equipment.weapon &&
    getBase(equipment.weapon.baseId).twoHanded
  ) {
    take("weapon");
  }
  equipment[slot] = item;
  return { hero: clampResources({ ...hero, equipment }), removed };
}

export function unequip(
  hero: Hero,
  slot: EquipSlot,
): { hero: Hero; removed: Item | null } {
  const item = hero.equipment[slot];
  if (!item) return { hero, removed: null };
  const equipment = { ...hero.equipment };
  delete equipment[slot];
  return { hero: clampResources({ ...hero, equipment }), removed: item };
}
