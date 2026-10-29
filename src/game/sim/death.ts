import type { Rng } from "./rng";
import type { Hero } from "./types";

/**
 * The death god's cards (Taern style). After a lost battle the player picks
 * one face-down card. The worst outcomes take level progress or gold, but a
 * hero never loses a level and gold never goes below zero.
 */
export type DeathCard =
  | { kind: "mercy" }
  | { kind: "xp"; percent: number }
  | { kind: "gold"; percent: number };

const POOL: readonly DeathCard[] = [
  { kind: "mercy" },
  { kind: "mercy" },
  { kind: "xp", percent: 25 },
  { kind: "xp", percent: 60 },
  { kind: "gold", percent: 15 },
  { kind: "gold", percent: 40 },
];

export function drawCards(rng: Rng, count = 5): DeathCard[] {
  return rng.shuffle(POOL).slice(0, count);
}

export function applyCard(
  card: DeathCard,
  hero: Hero,
  gold: number,
): { hero: Hero; gold: number; lostXp: number; lostGold: number } {
  if (card.kind === "xp") {
    const lostXp = Math.floor((hero.xp * card.percent) / 100);
    return {
      hero: { ...hero, xp: hero.xp - lostXp },
      gold,
      lostXp,
      lostGold: 0,
    };
  }
  if (card.kind === "gold") {
    const lostGold = Math.floor((gold * card.percent) / 100);
    return { hero, gold: gold - lostGold, lostXp: 0, lostGold };
  }
  return { hero, gold, lostXp: 0, lostGold: 0 };
}
