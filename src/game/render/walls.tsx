import { useMemo } from "react";
import * as THREE from "three";

import { gableGeometry, Tiles, TILE } from "./art-kit";
import { earthBank, earthMound } from "./earth";
import { Instances, type Item } from "./nature";

/**
 * A town's walls, after the old engravings of Kyiv: a high earth rampart
 * carrying a timber wall of horizontal planks and a roofed fighting
 * gallery, about as high as the Golden Gates' own ramparts. The wall runs
 * straight or at 45° between its tiles, so a town can be a star fort, and
 * square timber towers with tent roofs, as tall as the gates' blockhouses,
 * stand on the tower tiles. Drawn from the map's wall tiles (`W`, `T`),
 * all instanced: a whole circuit is ten draw calls.
 */

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  gable: gableGeometry(),
  tent: new THREE.ConeGeometry(0.72, 1, 4),
};

/** The Golden Gates' timber colours (see landmarks.tsx), so they match. */
const C = {
  plank: 0x8a5a32,
  seam: 0x6b4430,
  post: 0x6b4430,
  roof: 0x4a3a2c,
  tower: 0x8a5a32,
};

/** Spacing of the towers along the wall seen from outside a town. */
const TOWER_EVERY = 7;
/**
 * The rampart's height and the wall's above it: with the gallery and its
 * roof, as high as the Golden Gates' ramparts (about four times the hero).
 */
const BANK = 6.2;
const WALL = 2.8;
/** The bank's width at the foot, kept to the wall's own tile plus a little. */
const BANK_FOOT = 2.8;
const BANK_CREST = 1.5;
/** Kyiv's ground, for walls drawn without a zone's own. */
const GROUND = 0x6a6840;
/** Facet patterns for the bank, so its tiles don't all repeat one. */
const BANK_KINDS = 3;

/** One tile of rampart, faceted like the ground: its crest along x. */
function bankGeometries(ground: number) {
  return Array.from({ length: BANK_KINDS }, (_, seed) =>
    earthBank({
      length: TILE + 0.02,
      section: [
        [-BANK_FOOT / 2, 0],
        [-BANK_CREST / 2, BANK],
        [BANK_CREST / 2, BANK],
        [BANK_FOOT / 2, 0],
      ],
      ground,
      seed,
    }),
  );
}
/**
 * A tower's height above the rampart's crest, and its width: its roof
 * peaks level with the Golden Gates' blockhouses.
 */
const TOWER = 4.2;
const TOWER_W = 2.6;

/** A wall tile: plain (`W`) or crowned by a tower (`T`). */
const isWall = (map: readonly string[], x: number, z: number) => {
  const ch = map[z]?.[x];
  return ch === "W" || ch === "T";
};
const isGate = (map: readonly string[], x: number, z: number) =>
  map[z]?.[x] === "g";

/** A run of wall from one tile centre towards another, in world units. */
type Segment = { ax: number; az: number; bx: number; bz: number };

/**
 * The wall's runs: between neighbouring wall tiles, straight or at 45°
 * (a diagonal only where no straight step joins the two), and half a tile
 * into the Golden Gates' ramparts where the wall meets them. Each pair is
 * joined once. Also, per wall tile, the directions it is joined in.
 */
function wallSegments(map: readonly string[]) {
  const segments: Segment[] = [];
  const joins = new Map<string, [number, number][]>();
  const join = (x: number, z: number, dx: number, dz: number) => {
    const key = `${x},${z}`;
    joins.set(key, [...(joins.get(key) ?? []), [dx, dz]]);
  };
  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      if (!isWall(map, x, z)) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, 1],
      ] as const) {
        if (!isWall(map, x + dx, z + dz)) continue;
        const diagonal = dx !== 0 && dz !== 0;
        if (
          diagonal &&
          (isWall(map, x + dx, z) ||
            isWall(map, x, z + dz) ||
            isGate(map, x + dx, z) ||
            isGate(map, x, z + dz))
        )
          continue;
        segments.push({
          ax: x * TILE,
          az: z * TILE,
          bx: (x + dx) * TILE,
          bz: (z + dz) * TILE,
        });
        join(x, z, dx, dz);
        join(x + dx, z + dz, -dx, -dz);
      }
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        if (!isGate(map, x + dx, z + dz)) continue;
        segments.push({
          ax: x * TILE,
          az: z * TILE,
          bx: (x + dx / 2) * TILE,
          bz: (z + dz / 2) * TILE,
        });
        join(x, z, dx, dz);
      }
    }
  });
  return { segments, joins };
}

function wallItems(map: readonly string[]) {
  const boxes: Item[] = [];
  const banks: Item[][] = Array.from({ length: BANK_KINDS }, () => []);
  const mounds: Item[] = [];
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

  const { segments, joins } = wallSegments(map);
  segments.forEach(({ ax, az, bx, bz }, i) => {
    const length = Math.hypot(bx - ax, bz - az);
    // Turns the pieces' x axis from a to b.
    const turn = Math.atan2(-(bz - az), bx - ax);
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    banks[i % BANK_KINDS]!.push({
      x: mx,
      y: 0,
      z: mz,
      turn,
      scale: [length / TILE, 1, 1],
    });
    box(mx, BANK + WALL / 2, mz, length + 0.02, WALL, 0.7, C.plank, turn);
    for (const y of [0.6, 1.35, 2.1])
      box(mx, BANK + y, mz, length + 0.04, 0.07, 0.74, C.seam, turn);
    // A post at the start, and the gallery under its roof.
    box(ax, BANK + WALL / 2 + 0.3, az, 0.22, WALL + 0.6, 0.8, C.post, turn);
    box(mx, BANK + WALL + 0.35, mz, length + 0.02, 0.7, 1.2, C.plank, turn);
    roofs.push({
      x: mx,
      y: BANK + WALL + 0.7,
      z: mz,
      turn,
      scale: [length + 0.06, 0.6, 1.7],
      color: C.roof,
    });
  });

  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      if (!isWall(map, x, z)) continue;
      const cx = x * TILE;
      const cz = z * TILE;
      const dirs = joins.get(`${x},${z}`) ?? [];
      const straight =
        dirs.length === 2 &&
        dirs[0]![0] === -dirs[1]![0] &&
        dirs[0]![1] === -dirs[1]![1];
      if (!straight) {
        // Where the wall turns (a bastion's flank or point), a round of
        // earth closes the banks, and a timber post the walls.
        mounds.push({ x: cx, y: 0, z: cz, scale: [1, 1, 1] });
        box(cx, BANK + WALL / 2, cz, 1.1, WALL, 1.1, C.plank, Math.PI / 4);
        box(cx, BANK + WALL + 0.35, cz, 1.6, 0.7, 1.6, C.plank, Math.PI / 4);
        tents.push({
          x: cx,
          y: BANK + WALL + 1.1,
          z: cz,
          turn: Math.PI / 4,
          scale: [1.6, 0.9, 1.6],
          color: C.roof,
        });
      }
      if (map[z]![x] !== "T") continue;
      // A tall timber tower rising from the foot of the rampart.
      const top = BANK + TOWER;
      box(cx, top / 2, cz, TOWER_W, top, TOWER_W, C.tower);
      // Plank seams round the body, and an open lookout with posts.
      for (let y = BANK + 1.4; y < top - 0.5; y += 1.8)
        box(cx, y, cz, TOWER_W + 0.04, 0.1, TOWER_W + 0.04, C.seam);
      // An overhanging fighting storey under the lookout.
      box(cx, top - 1.4, cz, TOWER_W + 0.7, 1.6, TOWER_W + 0.7, C.seam);
      for (const [dx, dz] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ] as const)
        box(
          cx + dx * (TOWER_W / 2 + 0.36),
          top - 1.4,
          cz + dz * (TOWER_W / 2 + 0.36),
          dx ? 0.04 : 0.8,
          0.18,
          dx ? 0.8 : 0.04,
          0x1a120c,
        );
      box(cx, top + 0.08, cz, TOWER_W + 0.9, 0.16, TOWER_W + 0.9, C.post);
      for (const [dx, dz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        box(
          cx + dx * (TOWER_W / 2 + 0.2),
          top + 0.6,
          cz + dz * (TOWER_W / 2 + 0.2),
          0.16,
          1,
          0.16,
          C.post,
        );
      tents.push({
        x: cx,
        y: top + 2.1,
        z: cz,
        turn: Math.PI / 4,
        scale: [3.1, 2.4, 3.1],
        color: C.roof,
      });
      box(cx, top + 3.6, cz, 0.1, 0.8, 0.1, C.post);
    }
  });
  return { boxes, banks, mounds, roofs, tents };
}

export function Walls({
  map,
  ground = GROUND,
}: {
  map: readonly string[];
  /** The zone's ground colour: the banks are the land heaped up. */
  ground?: number;
}) {
  const items = useMemo(() => wallItems(map), [map]);
  const banks = useMemo(() => bankGeometries(ground), [ground]);
  const mound = useMemo(
    () =>
      earthMound({
        top: BANK_CREST / 2,
        bottom: BANK_FOOT / 2,
        height: BANK,
        ground,
      }),
    [ground],
  );
  return (
    <>
      {/* The wall stands taller than the hero, so it dissolves round him. */}
      <Instances geometry={G.box} items={items.boxes} fade />
      {banks.map((geometry, i) => (
        <Instances
          key={i}
          geometry={geometry}
          items={items.banks[i]!}
          fade
          vertexColors
        />
      ))}
      <Instances geometry={mound} items={items.mounds} fade vertexColors />
      <Instances geometry={G.gable} items={items.roofs} fade />
      <Instances geometry={G.tent} items={items.tents} fade />
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
  for (let z = 0; z < rows; z++)
    set(DEPTH - 1, z, z % TOWER_EVERY === 0 ? "T" : "W");
  for (let z = road - 5; z <= road + 5; z++)
    if (z !== road) for (let x = DEPTH - 3; x < DEPTH; x++) set(x, z, "g");
  set(DEPTH - 1, road, ".");
  const block = (x0: number, z0: number, w: number, d: number, ch: string) => {
    for (let z = z0; z < z0 + d; z++)
      for (let x = x0; x < x0 + w; x++) set(x, z, ch);
  };
  block(2, road - 7, 3, 2, "h");
  block(1, road + 5, 3, 2, "h");
  block(3, road + 9, 3, 2, "h");
  block(0, road - 15, 5, 4, "c");
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
  ground,
}: {
  exit: { x: number; z: number };
  width: number;
  height: number;
  /** The ground of the zone it is seen from. */
  ground?: number;
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
      <Tiles map={map} town ground={ground} />
      <Walls map={map} ground={ground} />
    </group>
  );
}
