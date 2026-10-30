import { useMemo } from "react";
import * as THREE from "three";

import { gableGeometry, Tiles, TILE } from "./art-kit";
import { Instances, type Item } from "./nature";

/**
 * A town's walls, after the reconstructed Cossack fortresses: a timber
 * wall of horizontal planks on an earth bank, a roofed fighting gallery
 * along the top, and square timber towers with tent roofs at the corners
 * and every few tiles along each side. Drawn from the map's wall tiles
 * (`W`), all instanced: a whole circuit is six draw calls.
 */

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  gable: gableGeometry(),
  tent: new THREE.ConeGeometry(0.72, 1, 4),
};

const C = {
  earth: 0x5f6a34,
  plank: 0xb8925e,
  seam: 0x8a6a42,
  post: 0x7a5a38,
  roof: 0x7d7a72,
  tower: 0xc09a64,
};

/** Wall-tile spacing between the towers along a side. */
const TOWER_EVERY = 7;
/** The bank's height and the wall's above it. */
const BANK = 0.7;
const WALL = 2.6;

const isWall = (map: readonly string[], x: number, z: number) => {
  const ch = map[z]?.[x];
  return ch === "W" || ch === "g";
};

function wallItems(map: readonly string[]) {
  const boxes: Item[] = [];
  const roofs: Item[] = [];
  const tents: Item[] = [];
  const box = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    color: number,
    turn = 0,
  ) => boxes.push({ x, y, z, turn, scale: [sx, sy, sz], color });

  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "W") continue;
      const cx = x * TILE;
      const cz = z * TILE;
      const alongX = isWall(map, x - 1, z) || isWall(map, x + 1, z);
      const alongZ = isWall(map, x, z - 1) || isWall(map, x, z + 1);
      const corner = alongX && alongZ;
      // Towers at the corners and every few tiles along a side.
      const tower =
        corner ||
        (alongX && !alongZ && x % TOWER_EVERY === 0) ||
        (alongZ && !alongX && z % TOWER_EVERY === 0);
      // The bank under everything.
      box(cx, BANK / 2, cz, TILE + 0.02, BANK, TILE + 0.02, C.earth);
      if (tower) {
        const h = 6.2;
        box(cx, BANK + h / 2, cz, 1.9, h, 1.9, C.tower);
        // Plank seams round the body, and an open lookout with posts.
        for (const y of [1.6, 3, 4.4])
          box(cx, BANK + y, cz, 1.94, 0.08, 1.94, C.seam);
        box(cx, BANK + h + 0.08, cz, 2.3, 0.16, 2.3, C.post);
        for (const [dx, dz] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const)
          box(cx + dx, BANK + h + 0.55, cz + dz, 0.14, 0.9, 0.14, C.post);
        tents.push({
          x: cx,
          y: BANK + h + 1.6,
          z: cz,
          turn: Math.PI / 4,
          scale: [2.2, 1.6, 2.2],
          color: C.roof,
        });
        box(cx, BANK + h + 2.6, cz, 0.08, 0.6, 0.08, C.post);
        continue;
      }
      // A straight piece; a lone tile stands along x.
      const turn = alongZ && !alongX ? Math.PI / 2 : 0;
      const along = (dx: number, dz: number) =>
        turn ? { x: cx + dz, z: cz + dx } : { x: cx + dx, z: cz + dz };
      const mid = along(0, 0);
      box(mid.x, BANK + WALL / 2, mid.z, TILE + 0.02, WALL, 0.7, C.plank, turn);
      for (const y of [0.55, 1.25, 1.95])
        box(mid.x, BANK + y, mid.z, TILE + 0.04, 0.07, 0.74, C.seam, turn);
      // Posts at the joints and the gallery under its roof.
      const post = along(-TILE / 2, 0);
      box(
        post.x,
        BANK + WALL / 2 + 0.3,
        post.z,
        0.22,
        WALL + 0.6,
        0.8,
        C.post,
        turn,
      );
      box(
        mid.x,
        BANK + WALL + 0.35,
        mid.z,
        TILE + 0.02,
        0.7,
        1.2,
        C.plank,
        turn,
      );
      roofs.push({
        x: mid.x,
        y: BANK + WALL + 0.7,
        z: mid.z,
        turn,
        scale: [TILE + 0.06, 0.6, 1.7],
        color: C.roof,
      });
    }
  });
  return { boxes, roofs, tents };
}

export function Walls({ map }: { map: readonly string[] }) {
  const items = useMemo(() => wallItems(map), [map]);
  return (
    <>
      <Instances geometry={G.box} items={items.boxes} />
      <Instances geometry={G.gable} items={items.roofs} />
      <Instances geometry={G.tent} items={items.tents} />
    </>
  );
}

/** Tiles of town shown beyond the wall, and of margin past the zone's ends. */
const DEPTH = 8;
const MARGIN = 6;

/**
 * A strip of the town beyond the wall, in its own frame: the wall runs down
 * the last column, the Golden Gates stand across the road at row `road`,
 * and a few houses and the cathedral show behind.
 */
function edgeMap(rows: number, road: number): string[] {
  const m = Array.from({ length: rows }, () => Array<string>(DEPTH).fill("."));
  const set = (x: number, z: number, ch: string) => {
    if (m[z] && x >= 0 && x < DEPTH) m[z]![x] = ch;
  };
  for (let z = 0; z < rows; z++) set(DEPTH - 1, z, "W");
  for (let z = road - 3; z <= road + 3; z++)
    if (z !== road) {
      set(DEPTH - 2, z, "g");
      set(DEPTH - 1, z, "g");
    }
  set(DEPTH - 1, road, ".");
  const block = (x0: number, z0: number, w: number, d: number, ch: string) => {
    for (let z = z0; z < z0 + d; z++)
      for (let x = x0; x < x0 + w; x++) set(x, z, ch);
  };
  block(2, road - 7, 3, 2, "h");
  block(1, road + 5, 3, 2, "h");
  block(3, road + 9, 3, 2, "h");
  block(0, road - 13, 4, 4, "c");
  return m.map((r) => r.join(""));
}

/**
 * Seen from outside a town: its wall, the Golden Gates where the road
 * leaves the zone towards it, and the roofs behind. Drawn past the zone's
 * west or east edge, for an exit on that edge; decoration only.
 */
export function TownEdge({
  exit,
  width,
  height,
}: {
  exit: { x: number; z: number };
  width: number;
  height: number;
}) {
  const west = exit.x === 0;
  const east = exit.x === width - 1;
  const rows = height + MARGIN * 2;
  // In the strip's frame the town lies at low x and the wall faces +x.
  const road = west ? exit.z + MARGIN : height - 1 - exit.z + MARGIN;
  const map = useMemo(() => edgeMap(rows, road), [rows, road]);
  if (!west && !east) return null;
  return (
    <group
      position={
        west
          ? [-DEPTH * TILE, 0, -MARGIN * TILE]
          : [(width + DEPTH - 1) * TILE, 0, (height - 1 + MARGIN) * TILE]
      }
      rotation={[0, west ? 0 : Math.PI, 0]}
    >
      <Tiles map={map} town />
      <Walls map={map} />
    </group>
  );
}
