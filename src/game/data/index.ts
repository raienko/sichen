import type {
  AffixDef,
  ClassDef,
  EnemyDef,
  ItemBase,
  NpcDef,
  QuestDef,
  SetDef,
  Skill,
  TreeNode,
  UniqueDef,
  ZoneDef,
} from "../sim/types";

import { CLASSES } from "./classes";
import { ENEMIES } from "./enemies";
import { AFFIXES, ITEM_BASES, SETS, UNIQUES } from "./items";
import { SKILLS } from "./skills";
import { TREE } from "./tree";
import { NPCS, QUESTS } from "./world";
import { ZONES } from "./zones";

export { BASIC_ACTIONS, POTION_ACTIONS } from "./skills";
export { BLOCKING } from "./zones";
export { NAMES } from "./world";

/** Game-wide tuning that is not owned by any one piece of content. */
export const RULES = {
  /** The slice stops here; the design goes to 20. */
  levelCap: 10,
  ap: 5,
  attackSlots: 5,
  skillSlots: 6,
  inventorySize: 40,
  stashSize: 40,
  roundSeconds: 15,
  maxSummons: 4,
  /**
   * Griefing protection: a protector joins a side when the sum of the
   * other side's player levels is above `ratio` times the sum of this
   * side's (two level-2 heroes can be attacked by a level-8 hero, or by
   * two level-4 ones, but not more; see guardSides).
   */
  protector: { ratio: 2, enemyId: "oberih" },
  /**
   * Gold is scarce: monsters pay little and drop few items, and vendors
   * pay little; the real money is in red-zone quests (docs/game/
   * risk-zones-pvp.md).
   */
  economy: {
    /** Gold per monster, times its level. */
    goldPerLevel: [1, 3] as const,
    /** Items from an ordinary fight: 0 up to this many (bosses: 3). */
    maxItems: 2,
    /** Chance in percent that an ordinary fight drops no item at all. */
    noItemChance: 35,
    /** A vendor pays this share of an item's value. */
    sellShare: 0.6,
  },
  potionPrice: { hp: 20, mana: 20 },
  potionCap: 10,
  respecPrice: 60,
  saveSlots: 3,
  /** Saved attack/defence presets on the battle planner. */
  tactics: 3,
  /** Seconds before a cleared pack comes back, by its rank. */
  respawn: { common: 120, elite: 360, boss: 1200 },
  /** A pack waits to respawn while the hero is this close (tiles). */
  respawnClearance: 8,
} as const;

function index<T extends { id: string }>(
  list: readonly T[],
  what: string,
): (id: string) => T {
  const map = new Map(list.map((item) => [item.id, item]));
  if (map.size !== list.length) throw new Error(`Duplicate ${what} id`);
  return (id: string) => {
    const found = map.get(id);
    if (!found) throw new Error(`Unknown ${what}: ${id}`);
    return found;
  };
}

export const content = {
  classes: CLASSES,
  skills: SKILLS,
  enemies: ENEMIES,
  bases: ITEM_BASES,
  affixes: AFFIXES,
  sets: SETS,
  uniques: UNIQUES,
  tree: TREE,
  npcs: NPCS,
  quests: QUESTS,
  zones: ZONES,
};

export const getClass: (id: string) => ClassDef = index(CLASSES, "class");
export const getSkill: (id: string) => Skill = index(SKILLS, "skill");
export const getEnemy: (id: string) => EnemyDef = index(ENEMIES, "enemy");
export const getBase: (id: string) => ItemBase = index(ITEM_BASES, "item base");
export const getAffix: (id: string) => AffixDef = index(AFFIXES, "affix");
export const getSet: (id: string) => SetDef = index(SETS, "set");
export const getUnique: (id: string) => UniqueDef = index(UNIQUES, "unique");
export const getNode: (id: string) => TreeNode = index(TREE.nodes, "tree node");
export const getNpc: (id: string) => NpcDef = index(NPCS, "npc");
export const getQuest: (id: string) => QuestDef = index(QUESTS, "quest");
export const getZone: (id: string) => ZoneDef = index(ZONES, "zone");

const neighbours = new Map<string, string[]>();
for (const [a, b] of TREE.edges) {
  neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
  neighbours.set(b, [...(neighbours.get(b) ?? []), a]);
}
export function treeNeighbours(id: string): readonly string[] {
  return neighbours.get(id) ?? [];
}

export { validateContent } from "./validate";
