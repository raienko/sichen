import * as THREE from "three";

import { earthBank } from "./earth";

/**
 * Kyiv's landmarks, built from primitives like the rest of the art kit and
 * kept close to the real buildings in shape, colour and above all scale:
 * they stand many times the hero's height, and the world camera pulls out
 * near them (see `landmarks` on a zone) so the scale reads.
 *
 * Every model is centred on its block of map tiles; `w` is its size along
 * x and `d` along z, in world units. Units: the hero stands about 2.3 tall.
 */

type Vec3 = [number, number, number];

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.IcosahedronGeometry(0.5, 2),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  cone4: new THREE.ConeGeometry(0.72, 1, 4),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  oct: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  /**
   * A half cylinder, round side up, its axis along z: a zakomara gable one
   * unit wide and one tall, standing on y 0.
   */
  half: new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, false, 0, Math.PI)
    .rotateZ(Math.PI / 2)
    .rotateY(Math.PI / 2)
    .scale(1, 2, 1),
  /** A half cylinder standing up, its round side towards +x: an apse. */
  apse: new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, false, 0, Math.PI),
  /** The apse's half-cone roof. */
  apseRoof: new THREE.ConeGeometry(0.5, 1, 10, 1, false, 0, Math.PI),
  /** A half disc, round side up, facing +z: an arch. */
  arch: new THREE.CircleGeometry(0.5, 14, 0, Math.PI),
  gable: (() => {
    const a = [-0.5, 0, -0.5];
    const b = [-0.5, 0, 0.5];
    const c = [-0.5, 1, 0];
    const d = [0.5, 0, -0.5];
    const e = [0.5, 0, 0.5];
    const f = [0.5, 1, 0];
    const tris = [a, c, b, d, e, f, a, d, f, a, f, c, b, c, f, b, f, e];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(tris.flat(), 3),
    );
    geometry.computeVertexNormals();
    return geometry;
  })(),
};

/**
 * Landmarks draw front faces only: when the camera ends up inside one (the
 * hero just past a tall gate), its walls vanish instead of filling the
 * screen.
 */
function Mat({
  color,
  emissive,
  side = THREE.FrontSide,
  vertexColors,
}: {
  color: number;
  emissive?: number;
  side?: THREE.Side;
  /** Use the geometry's own colours (an earth bank's facets). */
  vertexColors?: boolean;
}) {
  return (
    <meshLambertMaterial
      color={color}
      vertexColors={vertexColors}
      flatShading
      side={side}
      emissive={emissive ?? 0x000000}
      emissiveIntensity={emissive ? 1 : 0}
    />
  );
}

function Box({
  at,
  size,
  color,
  emissive,
  turn,
}: {
  at: Vec3;
  size: Vec3;
  color: number;
  emissive?: number;
  turn?: Vec3;
}) {
  return (
    <mesh geometry={G.box} position={at} scale={size} rotation={turn}>
      <Mat color={color} emissive={emissive} />
    </mesh>
  );
}

const GOLD = 0xd9b04a;
const GOLD_GLOW = 0x3a2600;
const WHITE = 0xf2eee2;
const WHITE_SHADE = 0xd9d3c2;
const GREEN = 0x4f8a72;
const GREEN_DARK = 0x3f7260;
const AZURE = 0x6fa8bd;
const WINDOW = 0x2a2a30;

/**
 * A Ukrainian-baroque dome, as on St. Sophia's after its 17th-century
 * rebuilding: a drum, a pear-shaped bulb, a slender neck, a small lantern
 * bulb and a gilded cross. One unit wide at the drum; about 3.3 tall.
 */
function BaroqueDome({
  at,
  size,
  color,
  drum = WHITE,
}: {
  at: Vec3;
  size: number;
  color: number;
  drum?: number;
}) {
  const glow = color === GOLD ? GOLD_GLOW : undefined;
  return (
    <group position={at} scale={size}>
      <mesh geometry={G.oct} position={[0, 0.45, 0]} scale={[0.9, 0.9, 0.9]}>
        <Mat color={drum} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          at={[
            Math.sin((i * Math.PI) / 2) * 0.44,
            0.48,
            Math.cos((i * Math.PI) / 2) * 0.44,
          ]}
          size={[0.16, 0.42, 0.16]}
          turn={[0, (i * Math.PI) / 2, 0]}
          color={WINDOW}
        />
      ))}
      <mesh geometry={G.cyl} position={[0, 0.93, 0]} scale={[1, 0.08, 1]}>
        <Mat color={color} emissive={glow} />
      </mesh>
      <mesh
        geometry={G.sphere}
        position={[0, 1.38, 0]}
        scale={[1.12, 1.05, 1.12]}
      >
        <Mat color={color} emissive={glow} />
      </mesh>
      <mesh geometry={G.cone} position={[0, 2.02, 0]} scale={[0.6, 0.55, 0.6]}>
        <Mat color={color} emissive={glow} />
      </mesh>
      <mesh geometry={G.cyl} position={[0, 2.35, 0]} scale={[0.16, 0.22, 0.16]}>
        <Mat color={color} emissive={glow} />
      </mesh>
      <mesh
        geometry={G.sphere}
        position={[0, 2.6, 0]}
        scale={[0.36, 0.42, 0.36]}
      >
        <Mat color={color} emissive={glow} />
      </mesh>
      <Box
        at={[0, 3.05, 0]}
        size={[0.05, 0.62, 0.05]}
        color={GOLD}
        emissive={GOLD_GLOW}
      />
      <Box
        at={[0, 3.15, 0]}
        size={[0.3, 0.05, 0.05]}
        color={GOLD}
        emissive={GOLD_GLOW}
      />
    </group>
  );
}

/** A dark arched window on a face looking along +z, its sill at y 0. */
function ArchWindow({
  at,
  width,
  height,
  turn = 0,
  color = WINDOW,
}: {
  at: Vec3;
  width: number;
  height: number;
  turn?: number;
  color?: number;
}) {
  const straight = height - width / 2;
  return (
    <group position={at} rotation={[0, turn, 0]}>
      <Box
        at={[0, straight / 2, 0]}
        size={[width, straight, 0.06]}
        color={color}
      />
      <mesh
        geometry={G.arch}
        position={[0, straight, 0.031]}
        scale={[width, width, 1]}
      >
        <Mat color={color} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- St. Sophia

/**
 * St. Sophia's Cathedral as Kyiv knows it since Mohyla and Mazepa rebuilt
 * it: a broad whitewashed body of galleries under green roofs, curved
 * baroque gables, five apses to the east, and a pyramid of thirteen domes
 * rising to the great gilded one in the middle. The long side runs along
 * x, the apses at +x. Full size on a block about 22 × 18; smaller blocks
 * (the far view from outside the walls) get a smaller cathedral.
 */
export function SophiaCathedral({ w, d }: { w: number; d: number }) {
  const s = Math.max(0.4, Math.min(1, Math.min(w, d) / 18));
  // The body leaves room at +x for the apses.
  const apseRoom = 2.4 * s;
  const bw = w - apseRoom - 0.4;
  const bd = d - 0.6;
  const cx = -w / 2 + 0.2 + bw / 2;
  const h1 = 5.4 * s;
  const h2 = 9.6 * s;
  const h3 = 11.8 * s;
  const mid = { w: bw * 0.6, d: bd * 0.62 };
  const core = { w: bw * 0.3, d: bd * 0.34 };
  const gables = (count: number, span: number) =>
    Array.from(
      { length: count },
      (_, i) => -span / 2 + (span * (i + 0.5)) / count,
    );
  const outer: Vec3[] = [
    [cx - bw / 2 + 1.5 * s, h1 + 0.5 * s, -bd / 2 + 1.5 * s],
    [cx - bw / 2 + 1.5 * s, h1 + 0.5 * s, bd / 2 - 1.5 * s],
    [cx + bw / 2 - 1.5 * s, h1 + 0.5 * s, -bd / 2 + 1.5 * s],
    [cx + bw / 2 - 1.5 * s, h1 + 0.5 * s, bd / 2 - 1.5 * s],
    [cx, h1 + 0.5 * s, -bd / 2 + 1.3 * s],
    [cx, h1 + 0.5 * s, bd / 2 - 1.3 * s],
    [cx - bw / 2 + 1.3 * s, h1 + 0.5 * s, 0],
    [cx + bw / 2 - 1.1 * s, h1 + 0.5 * s, 0],
  ];
  return (
    <group>
      {/* A low stone plinth, then the galleries. */}
      <Box
        at={[cx, 0.25, 0]}
        size={[bw + 0.3, 0.5, bd + 0.3]}
        color={WHITE_SHADE}
      />
      <Box at={[cx, h1 / 2, 0]} size={[bw, h1, bd]} color={WHITE} />
      {/* Cornice and green gallery roof. */}
      <Box
        at={[cx, h1, 0]}
        size={[bw + 0.3, 0.25 * s, bd + 0.3]}
        color={WHITE_SHADE}
      />
      <Box
        at={[cx, h1 + 0.3 * s, 0]}
        size={[bw - 0.2, 0.5 * s, bd - 0.2]}
        color={GREEN}
      />
      {/* Curved baroque gables along the long sides and the west front. */}
      {[-1, 1].flatMap((side) =>
        gables(5, bw - 1).map((x) => (
          <group
            key={`l${side}${x}`}
            position={[cx + x, h1, side * (bd / 2 - 0.2)]}
          >
            <mesh geometry={G.half} scale={[2.6 * s, 2.4 * s, 0.5]}>
              <Mat color={WHITE} />
            </mesh>
            <mesh
              geometry={G.half}
              position={[0, 0.02, -side * 0.3]}
              scale={[2.9 * s, 2.7 * s, 0.4]}
            >
              <Mat color={GREEN} />
            </mesh>
          </group>
        )),
      )}
      {gables(4, bd - 1).map((z) => (
        <group
          key={`w${z}`}
          position={[cx - bw / 2 + 0.2, h1, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <mesh geometry={G.half} scale={[2.6 * s, 2.4 * s, 0.5]}>
            <Mat color={WHITE} />
          </mesh>
          <mesh
            geometry={G.half}
            position={[0, 0.02, 0.3]}
            scale={[2.9 * s, 2.7 * s, 0.4]}
          >
            <Mat color={GREEN} />
          </mesh>
        </group>
      ))}
      {/* Two rows of arched windows round the galleries, and pilasters. */}
      {[-1, 1].flatMap((side) =>
        gables(8, bw - 1.4).flatMap((x) =>
          [1.0, 3.3].map((y) => (
            <ArchWindow
              key={`${side}${x}${y}`}
              at={[cx + x, y * s, side * (bd / 2 + 0.01)]}
              width={0.7 * s}
              height={1.5 * s}
              turn={side > 0 ? 0 : Math.PI}
            />
          )),
        ),
      )}
      {[-1, 1].flatMap((side) =>
        gables(9, bw).map((x) => (
          <Box
            key={`p${side}${x}`}
            at={[cx + x - bw / 18, h1 / 2, side * (bd / 2 + 0.05)]}
            size={[0.35 * s, h1, 0.12]}
            color={WHITE_SHADE}
          />
        )),
      )}
      {gables(6, bd - 1.6).flatMap((z) =>
        [1.0, 3.3].map((y) => (
          <ArchWindow
            key={`ww${z}${y}`}
            at={[cx - bw / 2 - 0.01, y * s, z]}
            width={0.7 * s}
            height={1.5 * s}
            turn={-Math.PI / 2}
          />
        )),
      )}
      {/* The west door. */}
      <ArchWindow
        at={[cx - bw / 2 - 0.03, 0, 0]}
        width={1.6 * s}
        height={3 * s}
        turn={-Math.PI / 2}
        color={0x4a3220}
      />
      {/* Five apses to the east, the middle one tallest. */}
      {(
        [
          [0, 2.1, h2 * 0.78],
          [-1, 1.5, h1 * 1.05],
          [1, 1.5, h1 * 1.05],
          [-2, 1.1, h1 * 0.85],
          [2, 1.1, h1 * 0.85],
        ] as const
      ).map(([k, r, h]) => {
        const z = k * (bd / 2 - 1.2 * s) * (Math.abs(k) === 2 ? 0.5 : 0.42);
        return (
          <group key={k} position={[cx + bw / 2 - 0.1, 0, z]}>
            <mesh
              geometry={G.apse}
              position={[0, h / 2, 0]}
              scale={[r * 2 * s, h, r * 2 * s]}
            >
              <Mat color={WHITE} />
            </mesh>
            <mesh
              geometry={G.apseRoof}
              position={[0, h + 0.5 * s, 0]}
              scale={[r * 2.2 * s, 1 * s, r * 2.2 * s]}
            >
              <Mat color={GREEN} />
            </mesh>
            <ArchWindow
              at={[r * s + 0.02, h * 0.45, 0]}
              width={0.6 * s}
              height={1.4 * s}
              turn={Math.PI / 2}
            />
          </group>
        );
      })}
      {/* The raised middle and the core under the great dome. */}
      <Box
        at={[cx, (h1 + h2) / 2, 0]}
        size={[mid.w, h2 - h1, mid.d]}
        color={WHITE}
      />
      <Box
        at={[cx, h2, 0]}
        size={[mid.w + 0.3, 0.25 * s, mid.d + 0.3]}
        color={WHITE_SHADE}
      />
      <Box
        at={[cx, h2 + 0.25 * s, 0]}
        size={[mid.w - 0.2, 0.4 * s, mid.d - 0.2]}
        color={GREEN}
      />
      {[-1, 1].flatMap((side) =>
        gables(3, mid.w - 0.6).map((x) => (
          <group
            key={`m${side}${x}`}
            position={[cx + x, h2, side * (mid.d / 2 - 0.2)]}
          >
            <mesh geometry={G.half} scale={[2.4 * s, 2.2 * s, 0.5]}>
              <Mat color={WHITE} />
            </mesh>
            <mesh
              geometry={G.half}
              position={[0, 0.02, -side * 0.3]}
              scale={[2.7 * s, 2.5 * s, 0.4]}
            >
              <Mat color={GREEN} />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].flatMap((side) =>
        gables(4, mid.w - 1).map((x) => (
          <ArchWindow
            key={`mw${side}${x}`}
            at={[cx + x, h1 + 1.2 * s, side * (mid.d / 2 + 0.01)]}
            width={0.7 * s}
            height={1.7 * s}
            turn={side > 0 ? 0 : Math.PI}
          />
        )),
      )}
      <Box
        at={[cx, (h2 + h3) / 2, 0]}
        size={[core.w, h3 - h2, core.d]}
        color={WHITE}
      />
      <Box
        at={[cx, h3 + 0.15 * s, 0]}
        size={[core.w - 0.1, 0.3 * s, core.d - 0.1]}
        color={GREEN}
      />
      {/* Thirteen domes: the gilded great dome, four round it, eight below. */}
      <BaroqueDome at={[cx, h3 + 0.3 * s, 0]} size={3.1 * s} color={GOLD} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <BaroqueDome
          key={`${sx}${sz}`}
          at={[cx + sx! * mid.w * 0.34, h2 + 0.45 * s, sz! * mid.d * 0.3]}
          size={1.9 * s}
          color={GREEN}
        />
      ))}
      {outer.map((p, i) => (
        <BaroqueDome key={i} at={p} size={1.25 * s} color={GREEN} />
      ))}
    </group>
  );
}

/**
 * St. Sophia's bell tower, the monastery's gate onto the square: four
 * tiers in azure and white, each with paired columns and arched openings,
 * under a gilded baroque dome. It is the tallest thing in the Upper Town.
 * The road passes through an arch in its base, along x when `alongX`.
 */
export function SophiaBellTower({ alongX }: { alongX: boolean }) {
  const tiers: { wd: number; h: number }[] = [
    { wd: 7.2, h: 7.6 },
    { wd: 6.2, h: 6 },
    { wd: 5, h: 5 },
    { wd: 3.9, h: 4.2 },
  ];
  const passage = 2.6;
  const spring = 4.4;
  let y = 0;
  const parts = tiers.map((t, i) => {
    const base = y;
    y += t.h + 0.4;
    return { ...t, base, i };
  });
  return (
    <group rotation={[0, alongX ? 0 : Math.PI / 2, 0]}>
      {parts.map(({ wd, h, base, i }) => (
        <group key={i} position={[0, base, 0]}>
          {i === 0 ? (
            <>
              {/* Two piers either side of the passage, the vault above. */}
              {[-1, 1].map((sz) => (
                <Box
                  key={sz}
                  at={[0, h / 2, (sz * (wd / 2 + passage / 2)) / 2]}
                  size={[wd, h, wd / 2 - passage / 2]}
                  color={AZURE}
                />
              ))}
              <Box
                at={[0, (h + spring) / 2, 0]}
                size={[wd, h - spring, passage]}
                color={AZURE}
              />
              {[-1, 1].map((sx) => (
                <group
                  key={sx}
                  position={[sx * (wd / 2 + 0.03), spring, 0]}
                  rotation={[0, (sx * Math.PI) / 2, 0]}
                >
                  <mesh
                    geometry={G.arch}
                    scale={[passage + 0.8, passage + 0.8, 1]}
                  >
                    <Mat color={WHITE} />
                  </mesh>
                  <mesh
                    geometry={G.arch}
                    position={[0, 0, 0.02]}
                    scale={[passage, passage, 1]}
                  >
                    <Mat color={0x1e1c1a} />
                  </mesh>
                </group>
              ))}
            </>
          ) : (
            <Box at={[0, h / 2, 0]} size={[wd, h, wd]} color={AZURE} />
          )}
          {/* White corner pilasters and the cornice. */}
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz]) => (
            <Box
              key={`${sx}${sz}`}
              at={[(sx! * wd) / 2, h / 2, (sz! * wd) / 2]}
              size={[0.55, h, 0.55]}
              color={WHITE}
            />
          ))}
          <Box
            at={[0, h + 0.2, 0]}
            size={[wd + 0.5, 0.4, wd + 0.5]}
            color={WHITE}
          />
          {i > 0
            ? [0, 1, 2, 3].map((f) => {
                const turn = (f * Math.PI) / 2;
                const nx = Math.sin(turn);
                const nz = Math.cos(turn);
                const open = i === 3 ? 1.5 : 1.2;
                return (
                  <group key={f}>
                    <ArchWindow
                      at={[
                        nx * (wd / 2 + 0.02),
                        h * 0.22,
                        nz * (wd / 2 + 0.02),
                      ]}
                      width={open}
                      height={h * 0.6}
                      turn={turn}
                      color={0x1e1c1a}
                    />
                    {/* Paired white columns either side of each opening. */}
                    {[-1, 1].map((k) => (
                      <Box
                        key={k}
                        at={[
                          nx * (wd / 2 + 0.12) + nz * k * (open / 2 + 0.35),
                          h / 2,
                          nz * (wd / 2 + 0.12) - nx * k * (open / 2 + 0.35),
                        ]}
                        size={[
                          Math.abs(nz) > 0.5 ? 0.3 : 0.25,
                          h - 0.2,
                          Math.abs(nz) > 0.5 ? 0.25 : 0.3,
                        ]}
                        color={WHITE}
                      />
                    ))}
                  </group>
                );
              })
            : null}
        </group>
      ))}
      <BaroqueDome at={[0, y, 0]} size={2.3} color={GOLD} drum={AZURE} />
    </group>
  );
}

// ---------------------------------------------------------------- Golden Gates

const BRICK = 0xb86a48;
const BRICK_DARK = 0x94523a;
const STONE = 0xc9b89a;
const WOOD = 0x8a5a32;
const WOOD_DARK = 0x6b4430;
const SHINGLE = 0x4a3a2c;
/** Kyiv's ground, for a gate drawn without a zone's own. */
const GROUND = 0x6a6840;
const SCRUB = 0x4a6a2a;
const SCRUB_DARK = 0x37522a;

/** A timber wall with a roofed gallery, `length` long along x. */
function TimberWall({ length, height }: { length: number; height: number }) {
  return (
    <group>
      <Box at={[0, height / 2, 0]} size={[length, height, 0.8]} color={WOOD} />
      {[0.3, 0.55, 0.8].map((k) => (
        <Box
          key={k}
          at={[0, height * k, 0]}
          size={[length + 0.02, 0.08, 0.86]}
          color={WOOD_DARK}
        />
      ))}
      <Box at={[0, height + 0.35, 0]} size={[length, 0.7, 1.4]} color={WOOD} />
      <mesh
        geometry={G.gable}
        position={[0, height + 0.7, 0]}
        scale={[length + 0.1, 0.8, 2]}
      >
        <Mat color={SHINGLE} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * The Golden Gates of Yaroslav the Wise, as the old engravings show them:
 * a massive stone-and-brick tower with the road through a tall arch, its
 * leaves sheathed in gilded copper, the Church of the Annunciation on top
 * under a gilded dome, and huge earth ramparts either side carrying timber
 * walls and blockhouses. The road runs along z with the outside at +z; `w`
 * is the block's width across the road, `d` its depth along it. The
 * ramparts are faceted and coloured like the zone's `ground`.
 */
export function GoldenGate({
  w,
  d,
  ground = GROUND,
}: {
  w: number;
  d: number;
  ground?: number;
}) {
  /** The tower: across the road, along it, and to its parapet. */
  const tw = 9.2;
  const td = Math.max(d + 1.6, 6);
  const th = 11;
  const passage = 3.4;
  const spring = 5.6;
  /** The ramparts run from the tower's sides to the block's ends. */
  const run = Math.max(0, w / 2 - tw / 2 + 0.4);
  const rise = 6.8;
  const merlons = (len: number, n: number) =>
    Array.from({ length: n }, (_, i) => -len / 2 + (len * (i + 0.5)) / n);
  /** The bank's section: inner foot, crest, outer foot, in (z, y). */
  const section = [
    [-d / 2, 0],
    [-0.9, rise],
    [2.1, rise],
    [d / 2 + 2, 0],
  ] as const;
  const ramparts =
    run > 0.5
      ? ([0, 1] as const).map((seed) =>
          earthBank({ length: run, section, ground, seed }),
        )
      : null;
  return (
    <group>
      {/* Two piers either side of the passage, on a stone footing. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * (tw / 2 + passage / 2)) / 2, 0, 0]}>
          <Box
            at={[0, th / 2, 0]}
            size={[tw / 2 - passage / 2, th, td]}
            color={BRICK}
          />
          <Box
            at={[0, 0.7, 0]}
            size={[tw / 2 - passage / 2 + 0.3, 1.4, td + 0.3]}
            color={STONE}
          />
          {/* Courses of stone laid in the brick (opus mixtum). */}
          {[3.2, 6.4, 9.2].map((y) => (
            <Box
              key={y}
              at={[0, y, 0]}
              size={[tw / 2 - passage / 2 + 0.06, 0.3, td + 0.06]}
              color={BRICK_DARK}
            />
          ))}
        </group>
      ))}
      <Box
        at={[0, (th + spring) / 2, 0]}
        size={[passage, th - spring, td]}
        color={BRICK}
      />
      {/* The arch on both faces: a dark opening under a ring of brick. */}
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[0, spring, s * (td / 2 + 0.02)]}
          rotation={[0, s > 0 ? 0 : Math.PI, 0]}
        >
          <mesh geometry={G.arch} scale={[passage + 1.2, passage + 1.2, 1]}>
            <Mat color={STONE} />
          </mesh>
          <mesh
            geometry={G.arch}
            position={[0, 0, 0.02]}
            scale={[passage, passage, 1]}
          >
            <Mat color={0x1e1a16} />
          </mesh>
          {/* Two blind arches above the portal. */}
          {[-1, 1].map((k) => (
            <ArchWindow
              key={k}
              at={[k * 2.2, 3.1, 0.01]}
              width={1.1}
              height={2}
              color={BRICK_DARK}
            />
          ))}
        </group>
      ))}
      {/* The leaves of the gate, thrown open against the passage walls. */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          at={[s * (passage / 2 - 0.12), 2.6, td / 2 - 1.1]}
          size={[0.16, 5.2, 1.7]}
          color={GOLD}
          emissive={GOLD_GLOW}
        />
      ))}
      {/* The parapet: a fighting platform and merlons round the top. */}
      <Box
        at={[0, th + 0.1, 0]}
        size={[tw + 0.4, 0.3, td + 0.4]}
        color={BRICK_DARK}
      />
      {merlons(tw, 7).flatMap((x) =>
        [-1, 1].map((s) => (
          <Box
            key={`z${x}${s}`}
            at={[x, th + 0.75, s * (td / 2 + 0.05)]}
            size={[0.7, 1, 0.5]}
            color={BRICK}
          />
        )),
      )}
      {merlons(td, 6).flatMap((z) =>
        [-1, 1].map((s) => (
          <Box
            key={`x${z}${s}`}
            at={[s * (tw / 2 + 0.05), th + 0.75, z]}
            size={[0.5, 1, 0.7]}
            color={BRICK}
          />
        )),
      )}
      {/* The gate church: a brick cube with three arched gables a side. */}
      <group position={[0, th + 0.25, 0]}>
        <Box at={[0, 2.3, 0]} size={[5.6, 4.6, 5.6]} color={BRICK} />
        <Box at={[0, 0.4, 0]} size={[6.4, 0.8, 6.4]} color={BRICK_DARK} />
        {[0, 1, 2, 3].map((f) => {
          const turn = (f * Math.PI) / 2;
          return (
            <group key={f} rotation={[0, turn, 0]}>
              {[-1.75, 0, 1.75].map((k) => (
                <group key={k}>
                  <mesh
                    geometry={G.half}
                    position={[k, 4.6, 2.5]}
                    scale={[1.75, 1.5, 0.6]}
                  >
                    <Mat color={BRICK} />
                  </mesh>
                  <mesh
                    geometry={G.half}
                    position={[k, 4.62, 2.2]}
                    scale={[1.9, 1.7, 0.4]}
                  >
                    <Mat color={GREEN_DARK} />
                  </mesh>
                  <ArchWindow at={[k, 1.6, 2.81]} width={0.6} height={1.8} />
                </group>
              ))}
            </group>
          );
        })}
        {/* The drum and its gilded helmet dome. */}
        <mesh geometry={G.oct} position={[0, 5.9, 0]} scale={[2.6, 2.6, 2.6]}>
          <Mat color={BRICK} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Box
            key={i}
            at={[
              Math.sin((i * Math.PI) / 4 + Math.PI / 8) * 1.2,
              5.9,
              Math.cos((i * Math.PI) / 4 + Math.PI / 8) * 1.2,
            ]}
            size={[0.25, 1.2, 0.25]}
            turn={[0, (i * Math.PI) / 4 + Math.PI / 8, 0]}
            color={WINDOW}
          />
        ))}
        <mesh geometry={G.sphere} position={[0, 7.9, 0]} scale={[3, 2.8, 3]}>
          <Mat color={GOLD} emissive={GOLD_GLOW} />
        </mesh>
        <mesh geometry={G.cone} position={[0, 9.6, 0]} scale={[1.2, 1.3, 1.2]}>
          <Mat color={GOLD} emissive={GOLD_GLOW} />
        </mesh>
        <Box
          at={[0, 10.8, 0]}
          size={[0.12, 1.4, 0.12]}
          color={GOLD}
          emissive={GOLD_GLOW}
        />
        <Box
          at={[0, 11.1, 0]}
          size={[0.8, 0.12, 0.12]}
          color={GOLD}
          emissive={GOLD_GLOW}
        />
      </group>
      {/* The ramparts either side, with a timber wall and a blockhouse. */}
      {ramparts
        ? [-1, 1].map((s) => {
            const cx = s * (tw / 2 + run / 2 - 0.2);
            return (
              <group key={s} position={[cx, 0, 0]}>
                <mesh geometry={ramparts[s > 0 ? 1 : 0]}>
                  <Mat color={0xffffff} vertexColors />
                </mesh>
                {/* Scrub along the foot and the crest of the bank. */}
                {Array.from(
                  { length: Math.max(2, Math.round(run / 1.6)) },
                  (_, i) => {
                    const x =
                      -run / 2 +
                      (run * (i + 0.5)) / Math.max(2, Math.round(run / 1.6));
                    const k = 0.8 + ((i * 37) % 10) / 20;
                    return (
                      <group key={i}>
                        <mesh
                          geometry={G.sphere}
                          position={[x, 0.5 * k, d / 2 + 1.5]}
                          scale={[1.6 * k, 1.1 * k, 1.2 * k]}
                        >
                          <Mat color={i % 3 ? SCRUB : SCRUB_DARK} />
                        </mesh>
                        {i % 2 ? (
                          <mesh
                            geometry={G.sphere}
                            position={[x + 0.4, rise * 0.5, d / 2 - 0.4]}
                            scale={[1.1 * k, 0.8 * k, 0.9 * k]}
                          >
                            <Mat color={SCRUB_DARK} />
                          </mesh>
                        ) : null}
                      </group>
                    );
                  },
                )}
                {/* The cut end, faced with logs where it meets the wall. */}
                <Box
                  at={[(s * run) / 2, rise / 2, 0.4]}
                  size={[0.4, rise, d * 0.7]}
                  color={WOOD_DARK}
                />
                <group position={[0, rise, 0.6]}>
                  <TimberWall length={run} height={2.4} />
                </group>
                {/* A blockhouse at the far end, its upper storey jutting. */}
                <group position={[(s * run) / 2 - s * 1.4, rise, 0.6]}>
                  <Box at={[0, 1.2, 0]} size={[2.6, 2.4, 2.6]} color={WOOD} />
                  <Box
                    at={[0, 3.1, 0]}
                    size={[3.2, 1.4, 3.2]}
                    color={WOOD_DARK}
                  />
                  {[-0.8, 0, 0.8].map((x) => (
                    <Box
                      key={x}
                      at={[x, 3.1, 1.62]}
                      size={[0.4, 0.14, 0.04]}
                      color={0x1a120c}
                    />
                  ))}
                  <mesh
                    geometry={G.cone4}
                    position={[0, 4.6, 0]}
                    rotation={[0, Math.PI / 4, 0]}
                    scale={[3.1, 1.8, 3.1]}
                  >
                    <Mat color={SHINGLE} />
                  </mesh>
                </group>
              </group>
            );
          })
        : null}
    </group>
  );
}

// ---------------------------------------------------------------- registry

/** Tiles drawn as one landmark per map (the bounding box of all of them). */
export const UNIQUE_LANDMARKS = new Set(["g", "b"]);
