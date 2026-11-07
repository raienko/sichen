import { BLOCKING } from "../data";

/** Positions are in tiles (fractional); a tile's centre is its integer. */
export function walkable(
  map: readonly string[],
  x: number,
  z: number,
): boolean {
  const ch = map[Math.round(z)]?.[Math.round(x)];
  return ch !== undefined && !BLOCKING.has(ch);
}

const RADIUS = 0.3;

function clear(map: readonly string[], x: number, z: number): boolean {
  return (
    walkable(map, x - RADIUS, z - RADIUS) &&
    walkable(map, x + RADIUS, z - RADIUS) &&
    walkable(map, x - RADIUS, z + RADIUS) &&
    walkable(map, x + RADIUS, z + RADIUS)
  );
}

/** Moves by (dx, dz), sliding along walls instead of stopping dead. */
export function step(
  map: readonly string[],
  x: number,
  z: number,
  dx: number,
  dz: number,
): { x: number; z: number } {
  if (clear(map, x + dx, z + dz)) return { x: x + dx, z: z + dz };
  if (dx !== 0 && clear(map, x + dx, z)) return { x: x + dx, z };
  if (dz !== 0 && clear(map, x, z + dz)) return { x, z: z + dz };
  return { x, z };
}

export function distance(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  return Math.hypot(ax - bx, az - bz);
}

/**
 * Where the hero can stand near (x, z): (x, z) itself when the hero fits
 * there and can walk to `from` (the zone's spawn), otherwise the centre of
 * the nearest open tile that can. Old saves can put the hero inside a
 * building that the map has since grown; `avoid` keeps the result off
 * spots such as exits, which would carry the hero away at once.
 */
export function freeSpot(
  map: readonly string[],
  from: { x: number; z: number },
  x: number,
  z: number,
  avoid: readonly { x: number; z: number }[] = [],
): { x: number; z: number } {
  const width = map[0]?.length ?? 0;
  const key = (i: number, j: number) => j * width + i;
  // Every tile the hero can walk to from `from`.
  const reached = new Set<number>();
  const start = { i: Math.round(from.x), j: Math.round(from.z) };
  const queue = walkable(map, start.i, start.j) ? [start] : [];
  if (queue.length) reached.add(key(start.i, start.j));
  for (let q = 0; q < queue.length; q++) {
    const { i, j } = queue[q]!;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di;
      const nj = j + dj;
      if (reached.has(key(ni, nj)) || !walkable(map, ni, nj)) continue;
      reached.add(key(ni, nj));
      queue.push({ i: ni, j: nj });
    }
  }
  const near = (i: number, j: number) =>
    avoid.some((a) => distance(i, j, a.x, a.z) < 2);
  if (
    clear(map, x, z) &&
    reached.has(key(Math.round(x), Math.round(z))) &&
    !near(x, z)
  )
    return { x, z };
  // The nearest reachable tile with open ground on every side, so the hero
  // can step away from it.
  let best: { x: number; z: number } | null = null;
  let bestDistance = Infinity;
  for (const k of reached) {
    const i = k % width;
    const j = (k - i) / width;
    if (near(i, j)) continue;
    const open =
      reached.has(key(i + 1, j)) &&
      reached.has(key(i - 1, j)) &&
      reached.has(key(i, j + 1)) &&
      reached.has(key(i, j - 1));
    if (!open) continue;
    const d = distance(i, j, x, z);
    if (d < bestDistance) {
      bestDistance = d;
      best = { x: i, z: j };
    }
  }
  return best ?? from;
}
