import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { TILE } from "./art-kit";

/**
 * The world's natural tiles in the low-poly crawler look (see
 * docs/game/poc): one faceted ground mesh coloured per tile, stacked-cone
 * pines with autumn ones among them, jittered rocks, water over a sunken
 * bed, and grass, flowers and reeds. Everything repeated is instanced, so a
 * whole zone costs about twenty draw calls. Decoration only: collision and
 * placement still come from the tile map.
 */

type Map = readonly string[];

/** A repeatable 0-1 number for a grid point and a purpose. */
function rand(x: number, z: number, salt: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const pick = <T,>(list: readonly T[], r: number): T =>
  list[Math.min(list.length - 1, Math.floor(r * list.length))]!;

const tileAt = (map: Map, x: number, z: number) => map[z]?.[x];
const near = (map: Map, x: number, z: number, ch: string) =>
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dz]) => tileAt(map, x + dx!, z + dz!) === ch);

const COLORS = {
  dirt: [0xa58457, 0x9c7c50, 0xae8c5d],
  cobble: [0x857d6d, 0x81796a, 0x8b8372],
  marsh: [0x55702e, 0x5b7632, 0x4f6a2c],
  bed: 0x2f5566,
  water: 0x4f8db0,
  pines: [0x2f5a35, 0x3b6b3c, 0x2a4f31],
  autumn: [0xd29a2a, 0xc8762a, 0xb5352a, 0xd8b03a],
  trunk: 0x5a3f2a,
  rocks: [0x5f5d66, 0x67656e, 0x585660],
  tuft: [0x8a9a45, 0x6d8a38, 0x55702e],
  flowers: [0xf2ead6, 0xe0b040, 0xc0302a],
  reed: 0x7a8a3a,
  stone: 0x8a8794,
};

// ---------------------------------------------------------------- ground

/** Quarter-tile facets: each tile is 2 × 2 cells of two triangles. */
const SUB = 2;
/** How far the bed under water sinks. */
const BED = -0.35;

function groundGeometry(map: Map, base: number, town: boolean) {
  const w = map[0]?.length ?? 0;
  const h = map.length;
  const gw = w * SUB;
  const gh = h * SUB;
  const step = TILE / SUB;
  // Grid points: a small random height, sunk where water touches them.
  const height = (i: number, j: number) => {
    let water = 0;
    let all = 0;
    for (const [tx, tz] of [
      [Math.floor((i - 1) / SUB), Math.floor((j - 1) / SUB)],
      [Math.floor(i / SUB), Math.floor((j - 1) / SUB)],
      [Math.floor((i - 1) / SUB), Math.floor(j / SUB)],
      [Math.floor(i / SUB), Math.floor(j / SUB)],
    ] as const) {
      const ch = tileAt(map, tx, tz);
      if (ch === undefined) continue;
      all += 1;
      if (ch === "~") water += 1;
    }
    const sink = all > 0 ? (BED * water) / all : 0;
    return sink + (rand(i, j, 1) - 0.5) * 0.16;
  };
  const grass = new THREE.Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  grass.getHSL(hsl);
  const tileColor = (tx: number, tz: number, r: number) => {
    const ch = tileAt(map, tx, tz);
    if (ch === "~") return new THREE.Color(COLORS.bed);
    if (ch === "=")
      return new THREE.Color(pick(town ? COLORS.cobble : COLORS.dirt, r));
    if (ch === ",") return new THREE.Color(pick(COLORS.marsh, r));
    // Ragged edges on wild paths: some grass facets beside them turn to dirt.
    if (
      !town &&
      ch === "." &&
      near(map, tx, tz, "=") &&
      rand(tx, tz, r * 9) < 0.35
    )
      return new THREE.Color(pick(town ? COLORS.cobble : COLORS.dirt, r));
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l + (r - 0.5) * 0.06);
  };
  const positions: number[] = [];
  const colors: number[] = [];
  const point = (i: number, j: number) =>
    [i * step - TILE / 2, height(i, j), j * step - TILE / 2] as const;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const tx = Math.floor(i / SUB);
      const tz = Math.floor(j / SUB);
      const a = point(i, j);
      const b = point(i + 1, j);
      const c = point(i, j + 1);
      const d = point(i + 1, j + 1);
      // Alternate the diagonal so the facets don't line up in rows.
      const tris =
        rand(i, j, 2) < 0.5
          ? [
              [a, c, b],
              [b, c, d],
            ]
          : [
              [a, c, d],
              [a, d, b],
            ];
      tris.forEach((tri, k) => {
        const color = tileColor(tx, tz, rand(i, j, 3 + k));
        for (const p of tri) {
          positions.push(...p);
          colors.push(color.r, color.g, color.b);
        }
      });
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * One quad per water tile, merged, floating above the sunken bed. Corners
 * on the bank move a little, the same way for every tile sharing them, so
 * the shore is irregular without gaps.
 */
function waterGeometry(map: Map) {
  const positions: number[] = [];
  const wet = (x: number, z: number) => tileAt(map, x, z) === "~";
  // Corner (cx, cz) sits between tiles cx-1..cx and cz-1..cz.
  const corner = (cx: number, cz: number) => {
    const shore = !(
      wet(cx - 1, cz - 1) &&
      wet(cx, cz - 1) &&
      wet(cx - 1, cz) &&
      wet(cx, cz)
    );
    const dx = shore ? (rand(cx, cz, 90) - 0.5) * 0.9 : 0;
    const dz = shore ? (rand(cx, cz, 91) - 0.5) * 0.9 : 0;
    return [(cx - 0.5) * TILE + dx, -0.08, (cz - 0.5) * TILE + dz] as const;
  };
  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "~") continue;
      const a = corner(x, z);
      const b = corner(x, z + 1);
      const c = corner(x + 1, z);
      const d = corner(x + 1, z + 1);
      positions.push(...a, ...b, ...c, ...c, ...b, ...d);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------- see-through

/**
 * Where the hero stands on screen, for fading what stands in front of him:
 * x and y in drawing-buffer pixels from the bottom left, z the depth buffer
 * value (0-1). The world scene updates it every frame; off screen by default.
 */
export const heroOnScreen = {
  uHero: { value: new THREE.Vector3(-1e4, -1e4, 0) },
  uFadeRadius: { value: 0 },
};

/**
 * Trees and rocks nearer the camera than the hero, inside an oval around
 * him, dissolve in a dither, so he never vanishes behind the forest from
 * the high camera. Done per pixel in the shader, so batching still works.
 */
function fadeAroundHero(shader: THREE.WebGLProgramParametersWithUniforms) {
  Object.assign(shader.uniforms, heroOnScreen);
  shader.fragmentShader =
    "uniform vec3 uHero;\nuniform float uFadeRadius;\n" +
    shader.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      `#include <clipping_planes_fragment>
      {
        // A tall oval: the hero is taller than wide.
        float r = length((gl_FragCoord.xy - uHero.xy) / vec2(1.0, 1.6));
        if (gl_FragCoord.z < uHero.z && r < uFadeRadius) {
          float k = 1.0 - smoothstep(uFadeRadius * 0.55, uFadeRadius, r);
          float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
          if (n < k * 0.8) discard;
        }
      }`,
    );
}

// ---------------------------------------------------------------- instances

export type Item = {
  x: number;
  y: number;
  z: number;
  /** Turn about the vertical axis. */
  turn?: number;
  scale: readonly [number, number, number];
  color?: number;
};

/** One instanced mesh: a geometry repeated at each item, each tinted. */
export function Instances({
  geometry,
  items,
  color = 0xffffff,
  shadow,
  fade,
}: {
  geometry: THREE.BufferGeometry;
  items: Item[];
  color?: number;
  /** A soft dark disc on the ground rather than a lit solid. */
  shadow?: boolean;
  /** Dissolves in front of the hero (see fadeAroundHero). */
  fade?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      e.set(shadow ? -Math.PI / 2 : 0, it.turn ?? 0, 0, "YXZ");
      q.setFromEuler(e);
      m.compose(
        new THREE.Vector3(it.x, it.y, it.z),
        q,
        new THREE.Vector3(...it.scale),
      );
      mesh.setMatrixAt(i, m);
      if (it.color !== undefined) mesh.setColorAt(i, c.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, shadow]);
  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]}>
      {shadow ? (
        <meshBasicMaterial
          color={0x000000}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      ) : (
        <meshLambertMaterial
          color={color}
          flatShading
          onBeforeCompile={fade ? fadeAroundHero : undefined}
        />
      )}
    </instancedMesh>
  );
}

/** Icosahedrons with their corners pushed about: four rock shapes. */
function rockGeometries() {
  return [0, 1, 2, 3].map((v) => {
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const p = geometry.attributes.position!;
    for (let i = 0; i < p.count; i++)
      p.setXYZ(
        i,
        p.getX(i) * (0.8 + rand(i, v, 4) * 0.4),
        p.getY(i) * (0.7 + rand(i, v, 5) * 0.3),
        p.getZ(i) * (0.8 + rand(i, v, 6) * 0.4),
      );
    geometry.computeVertexNormals();
    return geometry;
  });
}

const G = {
  cone: new THREE.ConeGeometry(1, 1, 7),
  trunk: new THREE.CylinderGeometry(0.18, 0.25, 1, 6),
  disc: new THREE.CircleGeometry(1, 16),
  tuft: new THREE.ConeGeometry(0.12, 0.7, 3),
  flower: new THREE.IcosahedronGeometry(0.12, 0),
  reed: new THREE.CylinderGeometry(0.05, 0.05, 1.1, 4),
  stone: new THREE.CylinderGeometry(0.55, 0.62, 0.25, 6),
  rocks: rockGeometries(),
};

/** Shadows fall away from the sun, which stands west and south. */
const SHADOW = { x: 0.35, z: -0.25 };

function natureItems(map: Map, town: boolean) {
  const tiers: Item[][] = [[], [], []];
  const trunks: Item[] = [];
  const shadows: Item[] = [];
  const rocks: Item[][] = [[], [], [], []];
  const tufts: Item[] = [];
  const flowers: Item[] = [];
  const reeds: Item[] = [];
  const stones: Item[] = [];
  const autumnShare = town ? 0.4 : 0.12;
  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!;
      const cx = x * TILE;
      const cz = z * TILE;
      const r = rand(x, z, 10);
      const at = (salt: number, spread = 0.85) => ({
        x: cx + (rand(x, z, salt) - 0.5) * TILE * spread,
        z: cz + (rand(x, z, salt + 50) - 0.5) * TILE * spread,
      });
      if (ch === "#") {
        // About twice the hero's height: a forest, not a wall of giants.
        const k = 0.62 + r * 0.3;
        const px = cx + (rand(x, z, 11) - 0.5) * 0.7;
        const pz = cz + (rand(x, z, 12) - 0.5) * 0.7;
        const color =
          rand(x, z, 13) < autumnShare
            ? pick(COLORS.autumn, rand(x, z, 14))
            : pick(COLORS.pines, rand(x, z, 14));
        trunks.push({ x: px, y: 0.5 * k, z: pz, scale: [k, k, k] });
        tiers.forEach((list, t) => {
          const radius = (1.5 - t * 0.36) * k;
          list.push({
            x: px,
            y: (1.3 + t * 1.05) * k,
            z: pz,
            turn: rand(x, z, 15 + t) * 6,
            scale: [radius, 1.6 * k, radius],
            color,
          });
        });
        shadows.push({
          x: px + SHADOW.x * k * 2,
          y: 0.03,
          z: pz + SHADOW.z * k * 2,
          scale: [1.5 * k, 1.5 * k, 1],
        });
      } else if (ch === "r") {
        const k = 0.6 + rand(x, z, 20) * 0.4;
        const p = at(21, 0.3);
        rocks[Math.floor(r * 4)]!.push({
          x: p.x,
          y: 0.35 * k,
          z: p.z,
          turn: rand(x, z, 22) * 6,
          scale: [1.2 * k, 0.9 * k, 1.2 * k],
          color: pick(COLORS.rocks, rand(x, z, 23)),
        });
        shadows.push({
          x: p.x + SHADOW.x * k,
          y: 0.03,
          z: p.z + SHADOW.z * k,
          scale: [1.3 * k, 1.3 * k, 1],
        });
      } else if (ch === "=" && near(map, x, z, "~")) {
        // A ford: flat stones to step on.
        for (let s = 0; s < 2; s++) {
          const p = at(30 + s, 0.6);
          stones.push({
            x: p.x,
            y: 0.05,
            z: p.z,
            turn: rand(x, z, 32 + s),
            scale: [1, 1, 1],
          });
        }
      } else if (ch === "." || ch === ",") {
        const marsh = ch === ",";
        const wild = !town;
        const count = marsh ? 5 : wild ? (r < 0.6 ? 2 : 0) : r < 0.15 ? 1 : 0;
        for (let s = 0; s < count; s++) {
          const p = at(40 + s);
          tufts.push({
            x: p.x,
            y: 0.3,
            z: p.z,
            turn: rand(x, z, 45 + s) * 6,
            scale: [1, 0.7 + rand(x, z, 46 + s) * 0.6, 1],
            color: pick(COLORS.tuft, rand(x, z, 47 + s)),
          });
        }
        if (wild && !marsh && rand(x, z, 60) < 0.25) {
          for (let s = 0; s < 1 + Math.floor(rand(x, z, 61) * 3); s++) {
            const p = at(62 + s);
            flowers.push({
              x: p.x,
              y: 0.12,
              z: p.z,
              scale: [1, 1, 1],
              color: pick(COLORS.flowers, rand(x, z, 66)),
            });
          }
        }
        if (wild && !marsh && rand(x, z, 70) < 0.06) {
          const p = at(71);
          const k = 0.25 + rand(x, z, 72) * 0.2;
          rocks[Math.floor(rand(x, z, 73) * 4)]!.push({
            x: p.x,
            y: 0.1,
            z: p.z,
            turn: rand(x, z, 74) * 6,
            scale: [k, k * 0.8, k],
            color: pick(COLORS.rocks, rand(x, z, 75)),
          });
        }
        if (near(map, x, z, "~")) {
          for (let s = 0; s < 3; s++) {
            const p = at(80 + s);
            reeds.push({ x: p.x, y: 0.5, z: p.z, scale: [1, 1, 1] });
          }
        }
      }
    }
  });
  return { tiers, trunks, shadows, rocks, tufts, flowers, reeds, stones };
}

/**
 * Ground, water, trees, rocks and ground cover for a zone. `grass` is the
 * zone's ground colour; towns get cobbled roads and more autumn trees.
 */
export function Nature({
  map,
  grass,
  town,
}: {
  map: Map;
  grass: number;
  town: boolean;
}) {
  const ground = useMemo(
    () => groundGeometry(map, grass, town),
    [map, grass, town],
  );
  const water = useMemo(() => waterGeometry(map), [map]);
  useEffect(
    () => () => {
      ground.dispose();
      water.dispose();
    },
    [ground, water],
  );
  const items = useMemo(() => natureItems(map, town), [map, town]);
  return (
    <>
      <mesh geometry={ground}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={water}>
        <meshLambertMaterial
          color={COLORS.water}
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </mesh>
      <Instances geometry={G.disc} items={items.shadows} shadow />
      <Instances
        geometry={G.trunk}
        items={items.trunks}
        color={COLORS.trunk}
        fade
      />
      {items.tiers.map((list, t) => (
        <Instances key={t} geometry={G.cone} items={list} fade />
      ))}
      {items.rocks.map((list, v) => (
        <Instances key={v} geometry={G.rocks[v]!} items={list} fade />
      ))}
      <Instances geometry={G.tuft} items={items.tufts} />
      <Instances geometry={G.flower} items={items.flowers} />
      <Instances geometry={G.reed} items={items.reeds} color={COLORS.reed} />
      <Instances geometry={G.stone} items={items.stones} color={COLORS.stone} />
    </>
  );
}
