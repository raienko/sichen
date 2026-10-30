import { useMemo } from "react";

import type { ZoneDef } from "../sim/types";

import { TILE } from "./art-kit";
import { Nature } from "./nature";

/**
 * The ground a battle is fought on: a clearing of the zone's own forest,
 * drawn by the world's nature kit from a small tile map made for the fight.
 * The fighters stand in the open middle; trees and rocks close in on the
 * far side and the flanks. The camera's side stays open, so nothing stands
 * between it and the allies.
 */

/** Arena size in tiles, and the tile under the middle of the field. */
const W = 24;
const H = 20;
const MID = { x: 11, z: 11 };

/** A repeatable 0-1 number for a tile and a seed. */
function rand(x: number, z: number, seed: number): number {
  const n = Math.sin(x * 91.7 + z * 271.3 + seed * 37.1) * 43758.5453;
  return n - Math.floor(n);
}

/** The arena's tile map, varied by `seed` so fights don't all look alike. */
export function arenaMap(seed: number, town: boolean): string[] {
  const rows: string[] = [];
  for (let z = 0; z < H; z++) {
    let row = "";
    for (let x = 0; x < W; x++) {
      // Distance from the field's middle on an oval: wide across, shallow
      // in depth, and stretched toward the camera (larger z) so that side
      // stays open.
      const dx = (x - MID.x) / 6.5;
      const dz = (z - MID.z) / (z > MID.z ? 9 : 4.5);
      const d = Math.hypot(dx, dz) + (rand(x, z, seed) - 0.5) * 0.35;
      const r = rand(x, z, seed + 1);
      if (d < 1) row += r < 0.06 ? "," : ".";
      else if (d < 1.25) row += r < 0.3 ? "," : r < 0.42 ? "r" : ".";
      else if (town) row += r < 0.35 ? "#" : r < 0.45 ? "r" : ".";
      else row += r < 0.75 ? "#" : r < 0.88 ? "r" : ",";
    }
    rows.push(row);
  }
  return rows;
}

/**
 * The arena around a battle field whose middle is at (`centreX`, 0, 0).
 * `seed` picks the layout; the zone gives the colours.
 */
export function Arena({
  zone,
  seed,
  centreX,
}: {
  zone: ZoneDef;
  seed: number;
  centreX: number;
}) {
  const map = useMemo(() => arenaMap(seed, !!zone.town), [seed, zone.town]);
  return (
    <group position={[centreX - MID.x * TILE, 0, -MID.z * TILE]}>
      <Nature map={map} grass={zone.palette.ground} town={!!zone.town} />
    </group>
  );
}
