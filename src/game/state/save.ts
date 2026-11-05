import logger from "@/features/logger";

import { getZone, RULES } from "../data";
import type { Tactic } from "../sim/battle";
import type { QuestLog } from "../sim/quests";
import type { ClearedPacks } from "../sim/respawn";
import type { Hero, Item, Rarity, Relic } from "../sim/types";

import { decodeSave, encodeSave } from "./codec";

/** Bump with a migration below whenever the shape changes. */
export const SAVE_VERSION = 3;

export type SaveData = {
  version: number;
  id: string;
  createdAt: number;
  updatedAt: number;
  hero: Hero;
  gold: number;
  relics: Record<Relic, number>;
  inventory: Item[];
  stash: Item[];
  quests: QuestLog;
  world: {
    zoneId: string;
    x: number;
    z: number;
    /** Packs beaten and not yet back (see sim/respawn). */
    cleared: ClearedPacks;
  };
  settings: {
    lootFilter: Rarity;
    autoBattle: boolean;
    /** The selected battle tactic. */
    tactic: number;
    /** Tutorial hints on; off after "Skip tutorial". */
    tutorial: boolean;
    /** Hints already shown. */
    hints: string[];
  };
  /** Battle presets, RULES.tactics of them; null is an empty one. */
  tactics: (Tactic | null)[];
  seed: number;
  stats: { kills: number; deaths: number; battles: number };
};

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/**
 * version → the step that brings a save from it to version + 1. Saves are
 * never thrown away for being old; they walk up this list on load.
 */
const MIGRATIONS: Record<number, Migration> = {
  // 2: battle tactics, defence became on/off per delivery, and the
  // tutorial (off for heroes who already played).
  //
  // Older builds wrote every new hero as version 1 in the current shape,
  // so each step keeps what a save already has: a mislabelled save comes
  // through as it was, not reset.
  1: (old) => {
    const settings = (old.settings ?? {}) as Record<string, unknown>;
    return {
      ...old,
      settings: {
        ...settings,
        tactic: settings.tactic ?? 0,
        tutorial: settings.tutorial ?? false,
        hints: settings.hints ?? [],
      },
      tactics: Array.isArray(old.tactics)
        ? old.tactics
        : Array.from({ length: RULES.tactics }, () => null),
    };
  },
  // 3: packs respawn on a timer, so cleared packs carry when they fell.
  2: (old) => {
    const world = old.world as { cleared?: unknown };
    const now = Date.now();
    const cleared = Array.isArray(world.cleared)
      ? Object.fromEntries(world.cleared.map((id) => [id, now]))
      : (world.cleared ?? {});
    return { ...old, world: { ...world, cleared } };
  },
};

export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  let save = raw as Record<string, unknown>;
  let version = typeof save.version === "number" ? save.version : 0;
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    save = { ...step(save), version: version + 1 };
    version += 1;
  }
  const data = save as unknown as SaveData;
  if (!data.hero || !data.world) return null;
  // A zone removed from the content falls back to town.
  try {
    getZone(data.world.zoneId);
  } catch {
    data.world = { ...data.world, zoneId: "kyiv", ...getZone("kyiv").spawn };
  }
  return data;
}

export function serialize(save: SaveData): string {
  return encodeSave(save);
}

export function deserialize(text: string): SaveData | null {
  return migrate(decodeSave(text));
}

/** Storage for the save slots; the platform part is injected (see store.ts). */
export type SlotStorage = {
  read(slot: number): string | null;
  write(slot: number, text: string): void;
  remove(slot: number): void;
};

/**
 * Every slot, read for the title screen. A slot that fails to load reads as
 * empty (and stays on disk until a new hero is made there): one bad save
 * must not crash the title screen on every launch.
 */
export function loadSlots(storage: SlotStorage): (SaveData | null)[] {
  return Array.from({ length: RULES.saveSlots }, (_, slot) => {
    try {
      const text = storage.read(slot);
      return text ? deserialize(text) : null;
    } catch (error) {
      logger.error(`Save slot ${slot} couldn't be loaded.`, error);
      return null;
    }
  });
}
