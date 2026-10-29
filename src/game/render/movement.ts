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
