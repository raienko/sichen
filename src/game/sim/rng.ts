/**
 * Seeded pseudo-random numbers (mulberry32). The whole state is one 32-bit
 * integer, so a battle or a loot roll can be saved, replayed, or run again on
 * a server with the same result.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 0x9e3779b9;
  }

  get seed(): number {
    return this.state;
  }

  /** A float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** An integer in [min, max], both ends included. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with the given chance, in percent. */
  chance(percent: number): boolean {
    return this.next() * 100 < percent;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick on an empty list");
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Picks by weight; entries with weight 0 never come up. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
    if (total <= 0) throw new Error("Rng.weighted with no positive weight");
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= Math.max(0, weight);
      if (roll < 0) return value;
    }
    return entries[entries.length - 1]![0];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
}

/** A fresh seed from the clock and Math.random, for new games and battles. */
export function newSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}
