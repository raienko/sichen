import { getEnemy, RULES } from "../data";

import type { PackDef } from "./types";

/** Pack id → when it was cleared (ms since epoch). */
export type ClearedPacks = Record<string, number>;

export function packRank(pack: PackDef): keyof typeof RULES.respawn {
  if (pack.enemies.some((e) => getEnemy(e.enemyId).boss)) return "boss";
  return pack.rank ?? "common";
}

/** Seconds this pack stays gone after it is cleared. */
export function respawnSeconds(pack: PackDef): number {
  return RULES.respawn[packRank(pack)];
}

/** Whether a pack is still gone at `now`. Quest packs never come back. */
export function isCleared(
  pack: PackDef,
  cleared: ClearedPacks,
  now: number,
): boolean {
  const at = cleared[pack.id];
  if (at === undefined) return false;
  return !!pack.quest || now - at < respawnSeconds(pack) * 1000;
}

/**
 * Packs whose time is up and whose home the hero is not standing near, so
 * they can come back without appearing on top of the hero.
 */
export function respawning(
  packs: readonly PackDef[],
  cleared: ClearedPacks,
  now: number,
  hero: { x: number; z: number },
): string[] {
  return packs
    .filter(
      (p) =>
        cleared[p.id] !== undefined &&
        !isCleared(p, cleared, now) &&
        Math.hypot(p.x - hero.x, p.z - hero.z) > RULES.respawnClearance,
    )
    .map((p) => p.id);
}
