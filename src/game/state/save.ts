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
  1: (old) => ({
    ...old,
    settings: {
      ...(old.settings as object),
      tactic: 0,
      tutorial: false,
      hints: [],
    },
    tactics: Array.from({ length: RULES.tactics }, () => null),
  }),
  // 3: packs respawn on a timer, so cleared packs carry when they fell.
  2: (old) => {
    const world = old.world as { cleared?: string[] };
    const now = Date.now();
    return {
      ...old,
      world: {
        ...world,
        cleared: Object.fromEntries(
          (world.cleared ?? []).map((id) => [id, now]),
        ),
      },
    };
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

export function loadSlots(storage: SlotStorage): (SaveData | null)[] {
  return Array.from({ length: RULES.saveSlots }, (_, slot) => {
    const text = storage.read(slot);
    return text ? deserialize(text) : null;
  });
}
