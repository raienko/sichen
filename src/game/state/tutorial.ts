import { content, getZone } from "../data";
import type { StringKey } from "../i18n";
import { skillAvailability, treePointsLeft } from "../sim/hero";

import type { SaveData } from "./save";

/**
 * The tutorial: short hints in Ivan Sirko's voice, each shown once, the
 * first time its moment comes. Skippable as a whole from any hint. The
 * order below is the priority when several apply at once.
 */
export type HintId =
  | "move"
  | "sirko"
  | "gate"
  | "mobs"
  | "battle"
  | "tactics"
  | "loot"
  | "tree"
  | "master"
  | "relics"
  | "death";

export type HintWhere = "world" | "battle" | "death";

type HintDef = {
  id: HintId;
  icon: string;
  where: HintWhere;
  key: StringKey;
  when: (save: SaveData, battleRound: number) => boolean;
};

const inTown = (s: SaveData) => !!getZone(s.world.zoneId).town;

export const HINTS: readonly HintDef[] = [
  {
    id: "death",
    icon: "skull",
    where: "death",
    key: "hint.death",
    when: () => true,
  },
  {
    id: "battle",
    icon: "hand-fist",
    where: "battle",
    key: "hint.battle",
    when: (_, round) => round === 1,
  },
  {
    id: "tactics",
    icon: "floppy-disk",
    where: "battle",
    key: "hint.tactics",
    when: (_, round) => round >= 2,
  },
  {
    id: "move",
    icon: "person-walking",
    where: "world",
    key: "hint.move",
    when: () => true,
  },
  {
    id: "sirko",
    icon: "comment",
    where: "world",
    key: "hint.sirko",
    when: (s) => inTown(s) && Object.keys(s.quests).length === 0,
  },
  {
    id: "loot",
    icon: "box-open",
    where: "world",
    key: "hint.loot",
    when: (s) => s.inventory.length > 0,
  },
  {
    id: "relics",
    icon: "gem",
    where: "world",
    key: "hint.relics",
    when: (s) =>
      s.stats.battles > 0 && Object.values(s.relics).some((n) => n > 0),
  },
  {
    id: "tree",
    icon: "sitemap",
    where: "world",
    key: "hint.tree",
    when: (s) => treePointsLeft(s.hero) > 0,
  },
  {
    id: "master",
    icon: "book-open",
    where: "world",
    key: "hint.master",
    when: (s) => {
      const cls = content.classes.find((c) => c.id === s.hero.classId);
      return (
        inTown(s) &&
        !!cls &&
        cls.skills.some(
          (id) => skillAvailability(s.hero, id, s.quests) === "learnable",
        )
      );
    },
  },
  {
    id: "gate",
    icon: "dungeon",
    where: "world",
    key: "hint.gate",
    when: (s) => inTown(s) && s.quests.q_smoke?.status === "active",
  },
  {
    id: "mobs",
    icon: "skull",
    where: "world",
    key: "hint.mobs",
    when: (s) => !inTown(s),
  },
];

/** The hint to show now, if any. */
export function nextHint(
  save: SaveData,
  where: HintWhere,
  battleRound = 0,
): HintDef | null {
  if (!save.settings.tutorial) return null;
  // Battle hints would flash by for a second under auto-battle; they wait
  // for a round the player plans by hand.
  if (where === "battle" && save.settings.autoBattle) return null;
  return (
    HINTS.find(
      (h) =>
        h.where === where &&
        !save.settings.hints.includes(h.id) &&
        h.when(save, battleRound),
    ) ?? null
  );
}
