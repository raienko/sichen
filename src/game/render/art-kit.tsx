import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ComponentType } from "react";
import * as THREE from "three";

import type { Look } from "../sim/types";
import { HAIR_COLORS, SKIN_TONES } from "../ui/palette";

import { CY, FACE, HEADS } from "./head-mesh";

/**
 * The slice's art kit: low-poly figures and props built from primitives in
 * code, so the build downloads no models. Every scene asks the kit for an
 * actor or a tile kind by name; a kit made from glTF models or 2D sprites
 * can replace this file without touching the world or the game logic.
 */

export const TILE = 2;

type Vec3 = [number, number, number];

function Part({
  geometry,
  color,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  emissive,
  glow = 1.2,
  side = THREE.FrontSide,
}: {
  geometry: THREE.BufferGeometry;
  color: THREE.ColorRepresentation;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  emissive?: THREE.ColorRepresentation;
  /** How strongly `emissive` shows: low, it is a soft fill light. */
  glow?: number;
  /** Which faces to draw: the inside of a cloak, both sides of a veil. */
  side?: THREE.Side;
}) {
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <meshLambertMaterial
        color={color}
        flatShading
        emissive={emissive ?? 0x000000}
        emissiveIntensity={emissive ? glow : 0}
        side={side}
      />
    </mesh>
  );
}

/** Shared geometry, made once. */
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.IcosahedronGeometry(0.5, 1),
  cone: new THREE.ConeGeometry(0.5, 1, 6),
  cone4: new THREE.ConeGeometry(0.72, 1, 4),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 7),
  ring: new THREE.RingGeometry(0.55, 0.72, 24),
  octa: new THREE.OctahedronGeometry(0.5, 0),
  dodeca: new THREE.DodecahedronGeometry(0.5, 0),
  torus: new THREE.TorusGeometry(0.4, 0.05, 5, 12, Math.PI),
  plane: new THREE.PlaneGeometry(1, 1),
  skirt: new THREE.CylinderGeometry(0.3, 0.5, 1, 8),
  /** A square frustum, wider on top: a chest narrowing to the waist. */
  taper: new THREE.CylinderGeometry(0.62, 0.5, 1, 4, 1).rotateY(Math.PI / 4),
  gable: gableGeometry(),
};

/** A unit gable roof: ridge along x at height 1, eaves at y 0, z ±0.5. */
export function gableGeometry(): THREE.BufferGeometry {
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
}

// ---------------------------------------------------------------- walk cycle

/**
 * Bobs and swings a figure while it moves; reads the speed it is given.
 * `left`/`right` are the legs at -x/+x (figures face +z, so `left` is the
 * figure's own right leg). Arms, when a figure has them, swing against the
 * leg on their side: the free arm at +x fully, the weapon arm at -x only a
 * little.
 */
function useWalk(
  speed: () => number,
  /** Arm angles that win over the walk (a battle move), when given. */
  arms?: () => { weapon: number; free: number } | null,
) {
  const body = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const freeArm = useRef<THREE.Group>(null);
  const weaponArm = useRef<THREE.Group>(null);
  const phase = useRef(0);
  useFrame(({ clock }, dt) => {
    const s = speed();
    const moving = s > 0.05;
    phase.current += dt * (moving ? 10 : 0);
    const swing = moving ? Math.sin(phase.current) * 0.6 : 0;
    // Standing still, a slow breath: a rise of the body and a slight sway
    // of the arms, so an idle figure never looks frozen.
    const breath = moving ? 0 : Math.sin(clock.elapsedTime * 2.2);
    if (left.current) left.current.rotation.x = swing;
    if (right.current) right.current.rotation.x = -swing;
    const set = arms?.();
    if (freeArm.current)
      freeArm.current.rotation.x = set?.free ?? swing * 0.8 + breath * 0.04;
    if (weaponArm.current)
      weaponArm.current.rotation.x =
        set?.weapon ?? -swing * 0.25 - breath * 0.02;
    if (body.current)
      body.current.position.y = moving
        ? Math.abs(Math.sin(phase.current)) * 0.06
        : (breath + 1) * 0.008;
  });
  return { body, left, right, freeArm, weaponArm };
}

// ---------------------------------------------------------------- heroes

/** The class's cloth: the kozak's sharovary, the kozachka's skirt. */
const CLASS_CLOTH: Record<string, number> = {
  lytsar: 0xb3261e,
  plastun: 0x4f5e2e,
  kharakternyk: 0x2c3f86,
};

const HERO = {
  shirt: 0xece5d5,
  stitch: 0xb3261e,
  belt: 0x4a2c1c,
  buckle: 0xc9a24a,
  sash: 0x7a1712,
  boot: 0x4b3022,
  sole: 0x1e1410,
  scabbard: 0x24170f,
  bootWoman: 0x8c1d1d,
  steel: 0xd8dbe0,
  wood: 0x5b3a1e,
  brass: 0xc9a24a,
};

/** Where the hand sits in the arm's frame (the shoulder is the origin). */
const HAND: Vec3 = [0, -0.64, 0.02];

type Profile = readonly (readonly [number, number])[];

/** A turned shape from a [radius, height] profile, bottom to top, closed. */
function lathe(
  profile: Profile,
  segments = 8,
  /** Turned only part way round, from +z (the front) towards +x. */
  phiStart = 0,
  phiLength = Math.PI * 2,
): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
    phiStart,
    phiLength,
  );
}

/** A profile made a little larger, for a layer laid over another. */
const grown = (profile: Profile, k: number): Profile =>
  profile.map(([r, y]) => [r * k, y] as const);

/** The profile's radius at a height. */
function radiusAt(profile: Profile, y: number): number {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1]!;
    const [r1, y1] = profile[i]!;
    if (y >= y0 && y <= y1 && y1 > y0)
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return 0;
}

/**
 * The hero's body, turned from profiles in the figure's own units (metres,
 * the ground at 0). The torso and sash are squashed front to back, so the
 * chest is broad and the body flat-ish, like the reference renders.
 */
const TORSO: Profile = [
  [0, 0.97],
  [0.2, 0.98],
  [0.235, 1.06],
  [0.212, 1.14],
  [0.232, 1.25],
  [0.262, 1.35],
  [0.255, 1.42],
  [0.2, 1.475],
  [0.08, 1.505],
  [0, 1.505],
];
/** The torso's squash: wide across the shoulders, shallow front to back. */
const TORSO_X = 1.22;
const TORSO_Z = 0.72;
/** Where the shirt's front is at a height, for what is sewn onto it. */
const chestZ = (y: number) => radiusAt(TORSO, y) * TORSO_Z;

/** Her skirt, from the waist to the calf. */
const SKIRT: Profile = [
  [0, 0.3],
  [0.36, 0.3],
  [0.335, 0.5],
  [0.28, 0.75],
  [0.225, 0.95],
  [0.205, 1.0],
  [0, 1.0],
];
const SKIRT_SCALE: Vec3 = [1.05, 1, 0.85];

/** Part of a profile between two heights, closed at both ends. */
function band(profile: Profile, y0: number, y1: number, k: number): Profile {
  const inner = profile.filter(([r, y]) => r > 0 && y > y0 && y < y1);
  return [
    [0, y0],
    [radiusAt(profile, y0) * k, y0],
    ...inner.map(([r, y]) => [r * k, y] as const),
    [radiusAt(profile, y1) * k, y1],
    [0, y1],
  ];
}

const BODY = {
  torso: lathe(TORSO),
  sash: lathe([
    [0, 0.9],
    [0.236, 0.9],
    [0.247, 0.965],
    [0.236, 1.035],
    [0, 1.035],
  ]),
  belt: lathe([
    [0, 0.94],
    [0.253, 0.94],
    [0.253, 0.99],
    [0, 0.99],
  ]),
  collar: lathe([
    [0, 1.455],
    [0.098, 1.455],
    [0.09, 1.53],
    [0, 1.53],
  ]),
  neck: lathe(
    [
      [0, 1.46],
      [0.066, 1.46],
      [0.06, 1.6],
      [0, 1.6],
    ],
    7,
  ),
  /** The sharovary's seat, joining the two legs under the sash. */
  seat: lathe([
    [0, 0.74],
    [0.14, 0.76],
    [0.215, 0.84],
    [0.228, 0.93],
    [0, 0.94],
  ]),
  /** A knee-long coat's skirt, flaring from the waist. */
  coatSkirt: lathe([
    [0, 0.42],
    [0.34, 0.42],
    [0.3, 0.62],
    [0.25, 0.85],
    [0.225, 1.0],
    [0, 1.0],
  ]),
  /** Her skirt, from the waist to the calf. */
  skirt: lathe(SKIRT),
  hem: lathe([
    [0, 0.3],
    [0.366, 0.3],
    [0.355, 0.4],
    [0, 0.4],
  ]),
  hemLine: lathe([
    [0, 0.44],
    [0.352, 0.44],
    [0.349, 0.46],
    [0, 0.46],
  ]),
  // In the leg's frame: the hip joint at 0, the ground at -0.92.
  /** A wide sharovary leg, ballooning and gathered over the boot top. */
  trouser: lathe(
    [
      [0, -0.74],
      [0.096, -0.74],
      [0.134, -0.705],
      [0.17, -0.62],
      [0.182, -0.47],
      [0.175, -0.32],
      [0.165, -0.18],
      [0.148, -0.05],
      [0, 0],
    ],
    10,
  ),
  /** His short, soft boots, the sharovary hanging over their tops. */
  bootLow: lathe(
    [
      [0, -0.88],
      [0.068, -0.88],
      [0.072, -0.74],
      [0.082, -0.64],
      [0, -0.64],
    ],
    7,
  ),
  bootShaft: lathe(
    [
      [0, -0.88],
      [0.068, -0.88],
      [0.066, -0.8],
      [0.076, -0.62],
      [0.084, -0.5],
      [0, -0.5],
    ],
    7,
  ),
  // In the arm's frame: the shoulder at 0, the hand at HAND.
  /** A loose shirt sleeve, rolled up to the forearm. */
  sleeve: lathe(
    [
      [0, -0.43],
      [0.07, -0.425],
      [0.087, -0.37],
      [0.078, -0.27],
      [0.084, -0.13],
      [0.088, -0.04],
      [0, 0.04],
    ],
    7,
  ),
  cuff: lathe(
    [
      [0, -0.47],
      [0.066, -0.47],
      [0.073, -0.41],
      [0, -0.41],
    ],
    7,
  ),
  forearm: lathe(
    [
      [0, -0.6],
      [0.042, -0.6],
      [0.05, -0.53],
      [0.057, -0.46],
      [0, -0.45],
    ],
    6,
  ),
};

/** A princess's floor-length gown, from the waist down. */
const GOWN: Profile = [
  [0, 0.05],
  [0.4, 0.05],
  [0.385, 0.25],
  [0.34, 0.5],
  [0.28, 0.75],
  [0.225, 0.95],
  [0.205, 1.0],
  [0, 1.0],
];
const GOWN_SCALE: Vec3 = [1.05, 1, 0.88];
/** Where the gown's front is at a height. */
const gownZ = (y: number) => radiusAt(GOWN, y) * GOWN_SCALE[2];
/** The coat layer's squash over the torso (see HeroFigure). */
const COAT_X = 1.08;
const COAT_Z = 1.14;
/** Half the width of the gold band down the front, as an angle. */
const BAND = 0.2;

const REGAL = {
  gown: lathe(GOWN, 10),
  /** The gold band down the front of the skirt and of the bodice. */
  gownBand: lathe(grown(GOWN, 1.015), 2, -BAND, BAND * 2),
  bodiceBand: lathe(grown(TORSO, 1.012), 2, -BAND * 1.1, BAND * 2.2),
  /** A wide gold hem over a pale underdress at the feet. */
  hem: lathe(
    [
      [0, 0.07],
      [0.407, 0.07],
      [0.393, 0.28],
      [0, 0.28],
    ],
    10,
  ),
  underdress: lathe(
    [
      [0, 0.0],
      [0.375, 0.0],
      [0.39, 0.08],
      [0, 0.08],
    ],
    10,
  ),
  /** The gold yoke over the shoulders, set with gems. */
  yoke: lathe(
    [
      [0, 1.32],
      ...[1.32, 1.36, 1.4, 1.43, 1.46, 1.48].map(
        (y) => [radiusAt(TORSO, y) * 1.035, y] as const,
      ),
      [0, 1.49],
    ],
    8,
  ),
  /** A cape over the shoulders to the ground, open in front. */
  cloak: lathe(
    [
      [0.53, 0.06],
      [0.5, 0.45],
      [0.455, 0.8],
      [0.405, 1.1],
      [0.365, 1.3],
      [0.335, 1.42],
      [0.23, 1.5],
      [0.12, 1.535],
    ],
    12,
    1.1,
    Math.PI * 2 - 2.2,
  ),
  /** A wide bell sleeve over the forearm, with a gold edge. */
  bell: lathe(
    [
      [0, -0.6],
      [0.122, -0.6],
      [0.112, -0.53],
      [0.088, -0.42],
      [0.075, -0.36],
      [0, -0.35],
    ],
    7,
  ),
  bellEdge: lathe(
    [
      [0, -0.618],
      [0.13, -0.618],
      [0.128, -0.585],
      [0, -0.585],
    ],
    7,
  ),
  // In the head's (old, larger) frame:
  /** A veil over the head and shoulders, the face left open. */
  veil: lathe(
    [
      [0.32, 1.06],
      [0.27, 1.2],
      [0.21, 1.32],
      [0.188, 1.42],
      [0.19, 1.52],
      [0.172, 1.6],
      [0.1, 1.66],
      [0, 1.68],
    ],
    10,
    0.62,
    Math.PI * 2 - 1.24,
  ),
};

/** Half the width of an apron over the skirt, as an angle. */
const APRON = 0.45;
const COAT_SKIRT: Profile = [
  [0, 0.42],
  [0.34, 0.42],
  [0.3, 0.62],
  [0.25, 0.85],
  [0.225, 1.0],
  [0, 1.0],
];

const EXTRA = {
  /** A fartukh over the front of her skirt, and its embroidered band. */
  apron: lathe(band(SKIRT, 0.36, 0.96, 1.025), 4, -APRON, APRON * 2),
  apronBand: lathe(band(SKIRT, 0.4, 0.47, 1.04), 4, -APRON, APRON * 2),
  /** Rows of mail rings over a mail shirt, chest to knee. */
  mail: [0.5, 0.58, 0.66, 0.74, 0.82, 0.9]
    .map((y) => lathe(band(COAT_SKIRT, y, y + 0.014, 1.02), 8))
    .concat(
      [1.06, 1.13, 1.2, 1.27, 1.34, 1.41].map((y) =>
        lathe(band(TORSO, y, y + 0.012, 1.025), 8),
      ),
    ),
  /** A fur collar over the shoulders. */
  fur: lathe(
    [
      [0, 1.39],
      [0.215, 1.39],
      [0.245, 1.425],
      [0.23, 1.47],
      [0.14, 1.515],
      [0, 1.515],
    ],
    9,
  ),
};

/**
 * The head is built at the old, larger scale around (0, 1.46, 0) and then
 * scaled into place on the neck, so hats and hair keep their numbers.
 */
/** The upper body's pivot at the waist, the shoulders and the hips. */
const WAIST = 0.97;
const SHOULDER_Y = 1.395;
const HIP_X = 0.125;
const HIP_Y = 0.92;

const HEAD_SCALE = 0.82;
const HEAD_AT: Vec3 = [0, 1.69 - 1.46 * HEAD_SCALE, 0.005];

/**
 * How each weapon is held in the right hand: the weapon arm's rest pose,
 * and the direction (in the figure's frame) the weapon's own +y points.
 * Figures face +z, so their right side is -x. Weapons are drawn from the
 * grip outwards along +y.
 */
const GRIPS: Record<string, { arm: Vec3; aim: Vec3 }> = {
  sabre: { arm: [-0.3, 0, -0.16], aim: [-0.35, -0.35, 0.87] },
  staff: { arm: [-0.45, 0, -0.12], aim: [-0.14, 1, 0.06] },
  spear: { arm: [-0.45, 0, -0.12], aim: [0, 1, 0.12] },
  bulava: { arm: [-0.55, 0, -0.16], aim: [-0.15, 0.55, 0.8] },
  pistol: { arm: [-1.1, 0, -0.08], aim: [-0.05, 0.05, 1] },
  // The bow arm hangs out from the side. This is the bow as it is drawn,
  // upright; at rest it is tilted low in the fist (see BOW_IDLE).
  bow: { arm: [-0.1, 0, -0.4], aim: [0, 1, 0] },
  /** Empty hands: the arm hangs like the other one. */
  none: { arm: [0, 0, -0.12], aim: [0, 1, 0] },
};

/** The weapon's rotation inside the (resting) arm, so it points at `aim`. */
function gripRotation(grip: { arm: Vec3; aim: Vec3 }): Vec3 {
  const arm = new THREE.Quaternion().setFromEuler(new THREE.Euler(...grip.arm));
  const aim = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(...grip.aim).normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(arm.invert().multiply(aim));
  return [e.x, e.y, e.z];
}

const GRIP_ROTATION: Record<string, Vec3> = Object.fromEntries(
  Object.entries(GRIPS).map(([kind, grip]) => [kind, gripRotation(grip)]),
);

// ---------------------------------------------------------------- hero moves

/** What the hero does with hands and weapon in a battle action. */
export type HeroMove = "strike" | "shot" | "cast" | "drink";

/** A move under way: which, and how far through it (0 to 1). */
export type HeroAction = { move: HeroMove; t: number };

/** How long a move takes, in seconds; the hit lands a little before half. */
export const HERO_MOVE_TIME = 0.7;

/** Keyframes of one channel: [time 0..1, value], eased between. */
type Keys = readonly (readonly [number, number])[];

function sample(keys: Keys, t: number): number {
  let [t0, v0] = keys[0]!;
  if (t <= t0) return v0;
  for (const [t1, v1] of keys) {
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0 || 1);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
    [t0, v0] = [t1, v1];
  }
  return v0;
}

/**
 * One move as offsets from the rest pose: the weapon arm's and the free
 * arm's swing forward (negative raises the arm in front), the free arm's
 * swing across the body, and the upper body's twist (positive brings the
 * weapon shoulder forward) and lean (positive leans in).
 */
type Pose = {
  weapon: Keys;
  free: Keys;
  across?: Keys;
  twist: Keys;
  lean: Keys;
  /** Keeps the weapon upright while the arm rises (a drawn bow). */
  upright?: boolean;
  /** Shows the flask in the free hand. */
  flask?: boolean;
};

const STILL: Keys = [[0, 0]];

const POSES = {
  // Overhead and down in a diagonal cut, stepping into it.
  slash: {
    weapon: [
      [0, 0],
      [0.35, -2.4],
      [0.52, -0.5],
      [1, 0],
    ],
    free: [
      [0, 0],
      [0.35, 0.35],
      [0.52, -0.45],
      [1, 0],
    ],
    twist: [
      [0, 0],
      [0.35, -0.35],
      [0.52, 0.32],
      [1, 0],
    ],
    lean: [
      [0, 0],
      [0.35, -0.06],
      [0.52, 0.14],
      [1, 0],
    ],
  },
  // Drawn back, then driven forward.
  thrust: {
    weapon: [
      [0, 0],
      [0.32, 0.35],
      [0.5, -1.25],
      [1, 0],
    ],
    free: [
      [0, 0],
      [0.32, -0.3],
      [0.5, 0.3],
      [1, 0],
    ],
    twist: [
      [0, 0],
      [0.32, -0.4],
      [0.5, 0.4],
      [1, 0],
    ],
    lean: [
      [0, 0],
      [0.32, -0.05],
      [0.5, 0.16],
      [1, 0],
    ],
  },
  // A stone, overhand with the free hand.
  throw: {
    weapon: [
      [0, 0],
      [0.35, 0.2],
      [0.52, -0.2],
      [1, 0],
    ],
    free: [
      [0, 0],
      [0.35, -2.7],
      [0.52, -1.0],
      [1, 0],
    ],
    twist: [
      [0, 0],
      [0.35, 0.35],
      [0.52, -0.35],
      [1, 0],
    ],
    lean: [
      [0, 0],
      [0.35, -0.08],
      [0.52, 0.12],
      [1, 0],
    ],
  },
  // Bow up, string drawn to the chest, loosed.
  bow: {
    weapon: [
      [0, 0],
      [0.3, -1.35],
      [0.75, -1.35],
      [1, 0],
    ],
    free: [
      [0, 0],
      [0.3, -1.45],
      [0.48, -1.3],
      [0.53, -0.85],
      [0.75, -0.95],
      [1, 0],
    ],
    across: [
      [0, 0],
      [0.3, -0.85],
      [0.75, -0.85],
      [1, 0],
    ],
    twist: [
      [0, 0],
      [0.3, 0.25],
      [0.75, 0.25],
      [1, 0],
    ],
    lean: STILL,
    upright: true,
  },
  // Aimed level, a kick of recoil.
  pistol: {
    weapon: [
      [0, 0],
      [0.3, -0.4],
      [0.44, -0.4],
      [0.5, -0.95],
      [0.72, -0.45],
      [1, 0],
    ],
    free: STILL,
    twist: [
      [0, 0],
      [0.3, 0.3],
      [0.72, 0.3],
      [1, 0],
    ],
    lean: [
      [0, 0],
      [0.44, 0],
      [0.5, -0.08],
      [1, 0],
    ],
  },
  // Both hands raised, then thrust at the foe.
  cast: {
    weapon: [
      [0, 0],
      [0.35, -1.0],
      [0.52, -1.45],
      [1, 0],
    ],
    free: [
      [0, 0],
      [0.35, -2.5],
      [0.52, -1.5],
      [1, 0],
    ],
    across: [
      [0, 0],
      [0.35, 0.35],
      [0.52, -0.1],
      [1, 0],
    ],
    twist: [
      [0, 0],
      [0.35, -0.12],
      [0.52, 0.12],
      [1, 0],
    ],
    lean: [
      [0, 0],
      [0.35, -0.1],
      [0.52, 0.12],
      [1, 0],
    ],
  },
  // A flask to the lips, head back.
  drink: {
    weapon: STILL,
    free: [
      [0, 0],
      [0.3, -2.1],
      [0.75, -2.1],
      [1, 0],
    ],
    across: [
      [0, 0],
      [0.3, -0.65],
      [0.75, -0.65],
      [1, 0],
    ],
    twist: STILL,
    lean: [
      [0, 0],
      [0.3, -0.12],
      [0.75, -0.12],
      [1, 0],
    ],
    flask: true,
  },
} satisfies Record<string, Pose>;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * The bow at rest, as a turn of the hand's frame: low at the side in the
 * hand held out from the hip, tilted about 50° from upright (upper limb
 * forward and up, lower limb back past the leg), the belly out and the
 * string on the inner side of the hand, clear of the hips and the arm.
 * Built from the bow's world turn, moved into the resting arm's frame
 * and taken back off the drawn grip.
 */
const BOW_IDLE = (() => {
  const arm = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...GRIPS.bow!.arm),
  );
  // Turned about its own limbs so the string faces the body, then tilted.
  const world = new THREE.Quaternion()
    .setFromAxisAngle(X_AXIS, 0.87)
    .multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, -1.3));
  const drawn = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...GRIP_ROTATION.bow!),
  );
  return arm.invert().multiply(world).multiply(drawn.invert());
})();
const bowHeld = new THREE.Quaternion();
const bowDrawn = new THREE.Quaternion();
/** How upright the bow is through the shot (0 level, 1 upright). */
const BOW_RAISE: Keys = [
  [0, 0],
  [0.25, 1],
  [0.8, 1],
  [1, 0],
];

function poseFor(move: HeroMove, weapon: string): Pose {
  switch (move) {
    case "strike":
      return weapon === "spear" ? POSES.thrust : POSES.slash;
    case "shot":
      if (weapon === "bow") return POSES.bow;
      return weapon === "pistol" ? POSES.pistol : POSES.throw;
    case "cast":
      return POSES.cast;
    case "drink":
      return POSES.drink;
  }
}

/** A weapon drawn from its grip (the origin) along +y. */
function Weapon({ kind }: { kind: string }) {
  switch (kind) {
    case "none":
      return null;
    case "bow":
      // Upright, belly forward; the string and tips turn a little outwards
      // and the bow sits on the outside of the fist, clear of the arm and
      // the body.
      return (
        <group position={[-0.04, 0, 0]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
          <Part
            geometry={G.torus}
            color={0x6b4423}
            position={[-0.28, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            scale={[1.6, 0.7, 1.2]}
          />
          <Part
            geometry={G.box}
            color={0xe8dcc0}
            position={[-0.28, 0, 0]}
            scale={[0.018, 1.28, 0.018]}
          />
        </group>
      );
    case "staff":
      // A carved staff: brass bands down the shaft, a forked head of three
      // prongs holding the fire crystal, a brass foot.
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.25, 0]}
            scale={[0.065, 1.7, 0.065]}
          />
          {[-0.45, 0.05, 0.62, 0.95].map((y) => (
            <Part
              key={y}
              geometry={G.cyl}
              color={HERO.brass}
              position={[0, y, 0]}
              scale={[0.08, 0.035, 0.08]}
            />
          ))}
          <Part
            geometry={G.cone}
            color={HERO.brass}
            position={[0, -0.62, 0]}
            rotation={[Math.PI, 0, 0]}
            scale={[0.07, 0.08, 0.07]}
          />
          {[0, 1, 2].map((k) => {
            const a = (k * Math.PI * 2) / 3;
            return (
              <Part
                key={k}
                geometry={G.box}
                color={HERO.wood}
                position={[Math.sin(a) * 0.06, 1.13, Math.cos(a) * 0.06]}
                rotation={[Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35]}
                scale={[0.03, 0.22, 0.03]}
              />
            );
          })}
          <Part
            geometry={G.octa}
            color={0xff8a2a}
            emissive={0xff6a00}
            position={[0, 1.2, 0]}
            scale={[0.15, 0.2, 0.15]}
          />
        </group>
      );
    case "spear":
      // An ash shaft, a leaf blade with lugs under it, a red horsehair
      // tassel.
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.3, 0]}
            scale={[0.055, 2.2, 0.055]}
          />
          <Part
            geometry={G.cyl}
            color={0x8a8a92}
            position={[0, 1.42, 0]}
            scale={[0.06, 0.1, 0.06]}
          />
          <Part
            geometry={G.box}
            color={0x8a8a92}
            position={[0, 1.37, 0]}
            scale={[0.14, 0.025, 0.025]}
          />
          <Part
            geometry={G.octa}
            color={0xc8c8d0}
            position={[0, 1.6, 0]}
            scale={[0.1, 0.34, 0.035]}
          />
          {[-1, 0, 1].map((k) => (
            <Part
              key={k}
              geometry={G.box}
              color={0xb3261e}
              position={[k * 0.02, 1.28, k * -0.01]}
              rotation={[0, 0, k * 0.15]}
              scale={[0.03, 0.14, 0.03]}
            />
          ))}
        </group>
      );
    case "bulava":
      // The otaman's bulava: a gold head of six flanges round a ball, a
      // knob on top, a collar over the shaft.
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.2, 0]}
            scale={[0.055, 0.62, 0.055]}
          />
          <Part
            geometry={G.cyl}
            color={HERO.brass}
            position={[0, -0.1, 0]}
            scale={[0.07, 0.05, 0.07]}
          />
          <Part
            geometry={G.cyl}
            color={HERO.brass}
            position={[0, 0.47, 0]}
            scale={[0.08, 0.05, 0.08]}
          />
          <Part
            geometry={G.sphere}
            color={HERO.brass}
            position={[0, 0.56, 0]}
            scale={[0.16, 0.16, 0.16]}
          />
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k * Math.PI) / 3;
            return (
              <Part
                key={k}
                geometry={G.box}
                color={0xe0bc58}
                position={[Math.sin(a) * 0.075, 0.56, Math.cos(a) * 0.075]}
                rotation={[0, a, 0]}
                scale={[0.02, 0.16, 0.07]}
              />
            );
          })}
          <Part
            geometry={G.sphere}
            color={HERO.brass}
            position={[0, 0.67, 0]}
            scale={[0.06, 0.06, 0.06]}
          />
        </group>
      );
    case "pistol":
      // A flintlock: the barrel along +y over a wooden fore-stock, the lock
      // and cock on the side, the butt bending down into the fist with a
      // brass cap.
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={0x3a3a40}
            position={[0, 0.22, 0.035]}
            scale={[0.04, 0.38, 0.04]}
          />
          <Part
            geometry={G.cyl}
            color={HERO.brass}
            position={[0, 0.41, 0.035]}
            scale={[0.048, 0.025, 0.048]}
          />
          <Part
            geometry={G.box}
            color={0x4a2c18}
            position={[0, 0.16, 0.0]}
            scale={[0.04, 0.3, 0.035]}
          />
          <Part
            geometry={G.box}
            color={0x8a8a92}
            position={[0.025, 0.04, 0.02]}
            scale={[0.012, 0.08, 0.04]}
          />
          <Part
            geometry={G.box}
            color={0x5a5a62}
            position={[0.03, 0.08, 0.05]}
            rotation={[0.5, 0, 0]}
            scale={[0.01, 0.04, 0.015]}
          />
          <Part
            geometry={G.box}
            color={0x4a2c18}
            position={[0, -0.03, -0.035]}
            rotation={[0.55, 0, 0]}
            scale={[0.045, 0.16, 0.055]}
          />
          <Part
            geometry={G.sphere}
            color={HERO.brass}
            position={[0, -0.1, -0.075]}
            scale={[0.06, 0.06, 0.07]}
          />
          <Part
            geometry={G.torus}
            color={HERO.brass}
            position={[0, 0.015, 0.0]}
            rotation={[0, Math.PI / 2, Math.PI]}
            scale={[0.08, 0.08, 0.3]}
          />
        </group>
      );
    default:
      // A shabla: grip, crossguard, and a blade that curves back towards
      // its spine in three bends.
      return (
        <group>
          <Part
            geometry={G.sphere}
            color={HERO.brass}
            position={[0, -0.09, 0]}
            scale={[0.06, 0.06, 0.06]}
          />
          <Part geometry={G.box} color={0x2a1a10} scale={[0.045, 0.15, 0.05]} />
          <Part
            geometry={G.box}
            color={HERO.brass}
            position={[0, 0.085, 0]}
            scale={[0.05, 0.035, 0.17]}
          />
          <group position={[0, 0.1, 0]}>
            <Part
              geometry={G.box}
              color={HERO.steel}
              position={[0, 0.15, 0]}
              scale={[0.022, 0.3, 0.07]}
            />
            <group position={[0, 0.3, 0]} rotation={[-0.16, 0, 0]}>
              <Part
                geometry={G.box}
                color={HERO.steel}
                position={[0, 0.14, 0]}
                scale={[0.022, 0.28, 0.065]}
              />
              <group position={[0, 0.28, 0]} rotation={[-0.22, 0, 0]}>
                <Part
                  geometry={G.cone4}
                  color={HERO.steel}
                  position={[0, 0.1, 0.0]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[0.03, 0.2, 0.09]}
                />
              </group>
            </group>
          </group>
        </group>
      );
  }
}

/**
 * An arm from the shoulder down: a loose sleeve rolled up to a stitched
 * cuff, the bare forearm and a fist. Under a coat the sleeve runs to the
 * wrist. `side` is +1 for the arm at +x, -1 for the one at -x.
 */
function Arm({
  skin,
  sleeve,
  cuff,
  covered,
  side,
  bell = false,
}: {
  skin: THREE.ColorRepresentation;
  sleeve: number;
  cuff: number;
  /** The coat's sleeve reaches the wrist. */
  covered: boolean;
  side: 1 | -1;
  /** The sleeve flares wide over the forearm. */
  bell?: boolean;
}) {
  return (
    <>
      <Part
        geometry={G.sphere}
        color={sleeve}
        position={[0, -0.02, 0]}
        scale={[0.185, 0.17, 0.18]}
      />
      <Part geometry={BODY.sleeve} color={sleeve} />
      {/* Stitching round the upper arm */}
      <Part
        geometry={G.cyl}
        color={cuff}
        position={[0, -0.15, 0]}
        scale={[0.172, 0.022, 0.172]}
      />
      <Part geometry={BODY.cuff} color={cuff} />
      <Part geometry={BODY.forearm} color={covered ? sleeve : skin} />
      {bell ? (
        <>
          <Part geometry={REGAL.bell} color={sleeve} />
          <Part geometry={REGAL.bellEdge} color={cuff} />
        </>
      ) : covered ? (
        <Part
          geometry={G.cyl}
          color={cuff}
          position={[0, -0.585, 0]}
          scale={[0.1, 0.03, 0.1]}
        />
      ) : null}
      {/* A fist: palm, curled fingers and the thumb on the inner side */}
      <group position={HAND}>
        <Part geometry={G.box} color={skin} scale={[0.07, 0.1, 0.095]} />
        <Part
          geometry={G.box}
          color={skin}
          position={[0, -0.035, 0.035]}
          scale={[0.072, 0.06, 0.06]}
        />
        <Part
          geometry={G.box}
          color={skin}
          position={[-side * 0.035, 0.01, 0.035]}
          rotation={[0.3, 0, 0]}
          scale={[0.03, 0.065, 0.032]}
        />
      </group>
    </>
  );
}

/** A leg from the hip: tall boots, under wide sharovary or a skirt. */
function Leg({
  woman,
  cloth,
  boot,
  inward,
}: {
  woman: boolean;
  cloth: number;
  boot: number;
  /** Which way, along x, the inner side of this leg is. */
  inward: 1 | -1;
}) {
  return (
    <>
      {woman ? null : (
        <>
          {/* Wide sharovary hanging straight to the ankle, gathered over the
          boot, a tassel on the inner side of the hem */}
          <Part geometry={BODY.trouser} color={cloth} />
          <group position={[inward * 0.07, -0.73, 0.03]}>
            <Part
              geometry={G.box}
              color={HERO.stitch}
              position={[0, -0.025, 0]}
              scale={[0.008, 0.05, 0.008]}
            />
            <Part
              geometry={G.cone}
              color={HERO.stitch}
              position={[0, -0.065, 0]}
              scale={[0.03, 0.05, 0.03]}
            />
          </group>
        </>
      )}
      <Part geometry={woman ? BODY.bootShaft : BODY.bootLow} color={boot} />
      {/* The foot: instep, a rounded toe, sole and heel */}
      <Part
        geometry={G.box}
        color={boot}
        position={[0, -0.85, 0.045]}
        scale={[0.125, 0.085, 0.2]}
      />
      <Part
        geometry={G.sphere}
        color={boot}
        position={[0, -0.865, 0.14]}
        scale={[0.125, 0.08, 0.1]}
      />
      <Part
        geometry={G.box}
        color={HERO.sole}
        position={[0, -0.905, 0.07]}
        scale={[0.13, 0.03, 0.26]}
      />
      <Part
        geometry={G.box}
        color={HERO.sole}
        position={[0, -0.9, -0.04]}
        scale={[0.115, 0.04, 0.07]}
      />
    </>
  );
}

/** Headwear over the shaved head or the hair. */
function Hat({
  kind,
  color,
  trim,
  hair,
  woman,
}: {
  kind: NonNullable<Outfit["hat"]>;
  color: number;
  trim: number;
  hair: THREE.ColorRepresentation;
  woman: boolean;
}) {
  switch (kind) {
    case "kuchma":
      // A tall fur hat with a cloth top falling to one side.
      return (
        <>
          <Part
            geometry={G.cyl}
            color={color}
            position={[0, 1.66, -0.01]}
            scale={[0.38, 0.3, 0.38]}
          />
          <Part
            geometry={G.sphere}
            color={trim}
            position={[0, 1.81, -0.01]}
            scale={[0.3, 0.1, 0.3]}
          />
          <Part
            geometry={G.box}
            color={trim}
            position={[0.17, 1.74, -0.06]}
            rotation={[0, 0, -0.5]}
            scale={[0.1, 0.18, 0.08]}
          />
        </>
      );
    case "brim":
      // A wide-brimmed black brylka.
      return (
        <>
          <Part
            geometry={G.cyl}
            color={color}
            position={[0, 1.6, -0.01]}
            scale={[0.62, 0.035, 0.62]}
          />
          <Part
            geometry={G.cyl}
            color={color}
            position={[0, 1.68, -0.01]}
            scale={[0.34, 0.16, 0.34]}
          />
          <Part
            geometry={G.cyl}
            color={trim}
            position={[0, 1.63, -0.01]}
            scale={[0.35, 0.03, 0.35]}
          />
        </>
      );
    case "crown":
      // A princess's crown over a white veil: gemmed gold panels with round
      // tops on a pearled band, a cap inside, a cross above, pearl strings
      // at the temples; the veil wraps the head and falls to the shoulders.
      return (
        <>
          <Part
            geometry={REGAL.veil}
            color={0xf1ead8}
            scale={[1.15, 1, 1.0]}
            side={THREE.DoubleSide}
          />
          <Part
            geometry={G.cyl}
            color={color}
            position={[0, 1.6, -0.01]}
            scale={[0.42, 0.07, 0.42]}
          />
          <Part
            geometry={G.sphere}
            color={color}
            position={[0, 1.72, -0.01]}
            scale={[0.36, 0.24, 0.36]}
          />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4;
            const at = (r: number, y: number): Vec3 => [
              Math.sin(a) * r,
              y,
              Math.cos(a) * r - 0.01,
            ];
            return (
              <group key={k}>
                <Part
                  geometry={G.box}
                  color={color}
                  position={at(0.205, 1.7)}
                  rotation={[0, a, 0]}
                  scale={[0.15, 0.17, 0.025]}
                />
                <Part
                  geometry={G.cyl}
                  color={color}
                  position={at(0.205, 1.785)}
                  rotation={[Math.PI / 2, 0, a]}
                  scale={[0.15, 0.025, 0.15]}
                />
                <Part
                  geometry={G.box}
                  color={trim}
                  position={at(0.222, 1.715)}
                  rotation={[0, a, 0]}
                  scale={[0.055, 0.08, 0.02]}
                />
                <Part
                  geometry={G.sphere}
                  color={0xf4efe2}
                  position={at(0.218, 1.6)}
                  scale={[0.035, 0.035, 0.035]}
                />
              </group>
            );
          })}
          <Part
            geometry={G.box}
            color={color}
            position={[0, 1.92, -0.01]}
            scale={[0.025, 0.13, 0.025]}
          />
          <Part
            geometry={G.box}
            color={color}
            position={[0, 1.94, -0.01]}
            scale={[0.085, 0.025, 0.025]}
          />
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.225, 1.53, 0.07]}>
              {[0, 1, 2, 3].map((i) => (
                <Part
                  key={i}
                  geometry={G.sphere}
                  color={0xf4efe2}
                  position={[0, -i * 0.045, 0]}
                  scale={[0.032, 0.032, 0.032]}
                />
              ))}
              <Part
                geometry={G.octa}
                color={trim}
                position={[0, -0.2, 0]}
                scale={[0.045, 0.06, 0.045]}
              />
            </group>
          ))}
        </>
      );
    case "scarf":
      // A khustka over the hair, knotted at the nape.
      return (
        <>
          <Part
            geometry={G.sphere}
            color={color}
            position={[0, 1.53, -0.05]}
            scale={[0.39, 0.34, 0.38]}
          />
          <Part
            geometry={G.cyl}
            color={trim}
            position={[0, 1.6, -0.04]}
            scale={[0.395, 0.035, 0.385]}
          />
          <Part
            geometry={G.box}
            color={color}
            position={[0, 1.34, -0.2]}
            rotation={[0.3, 0, 0]}
            scale={[0.12, 0.16, 0.04]}
          />
        </>
      );
  }
}

/**
 * What a figure wears beyond the hero's defaults, so NPCs share the hero's
 * body: colours, a coat, a hat, what is in hand.
 */
export type Outfit = {
  /** Sharovary or skirt; the class's colour when not given. */
  cloth?: number;
  shirt?: number;
  sash?: number;
  boot?: number;
  /** A zhupan over the shirt: knee-long for a kozak, a short keptar for a kozachka. */
  coat?: number;
  /** A sleeveless coat (a vest, a mail shirt) leaves the shirt sleeves. */
  sleeveless?: boolean;
  hat?: "kuchma" | "brim" | "crown" | "scarf";
  hatColor?: number;
  /** A second colour: the kuchma's cloth top, the scarf's pattern. */
  hatTrim?: number;
  earring?: boolean;
  /** A round belly under the coat. */
  stout?: boolean;
  /**
   * A princess's dress: a floor-length gown under the coat's bodice, gold
   * bands set with gems down the front, a gold yoke and hem, bell sleeves.
   */
  regal?: boolean;
  /** An apron over the skirt: its colour; its band is the stitch red. */
  apron?: number;
  /** Gold frogging across the coat's chest, an otaman's. */
  frogs?: number;
  /** The coat is a mail shirt, ringed in rows. */
  mail?: boolean;
  /** A fur collar over the coat's shoulders. */
  fur?: number;
  /** What hangs at the belt besides a scabbard. */
  belt?: "pistol" | "purse" | "herbs";
  /** A leather strap across the chest, a powder flask on it. */
  bandolier?: boolean;
  /** A cape from the shoulders, open in front: its colour and lining. */
  cloak?: { color: number; lining: number };
};

/**
 * The hero: a kozak in a white stitched shirt, wide sharovary in the class's
 * colour, a black belt with a red sash and dark boots, the oseledets lock on
 * a shaved head; or a kozachka in a skirt, red boots and a vinok.
 */
export function HeroFigure({
  look,
  classId,
  weapon,
  helmet,
  speed,
  action,
  outfit = {},
}: {
  look: Look;
  classId: string;
  /** The weapon family in the right hand; "none" for empty hands. */
  weapon?: string;
  helmet?: boolean;
  speed: () => number;
  /** The battle move under way, if any; read every frame. */
  action?: () => HeroAction | null;
  outfit?: Outfit;
}) {
  const kind = weapon && GRIPS[weapon] ? weapon : "sabre";
  const grip = GRIPS[kind]!;
  /** The move under way as a pose and how far through it. */
  const current = () => {
    const now = action?.();
    return now ? { pose: poseFor(now.move, kind), t: now.t } : null;
  };
  const { body, left, right, freeArm, weaponArm } = useWalk(speed, () => {
    const c = current();
    return c
      ? { weapon: sample(c.pose.weapon, c.t), free: sample(c.pose.free, c.t) }
      : null;
  });
  const upper = useRef<THREE.Group>(null);
  const freeAcross = useRef<THREE.Group>(null);
  const held = useRef<THREE.Group>(null);
  const flask = useRef<THREE.Group>(null);
  const skin = SKIN_TONES[look.face % SKIN_TONES.length]!;
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length]!;
  const woman = look.body === "kozachka";
  const cloth = outfit.cloth ?? CLASS_CLOTH[classId] ?? CLASS_CLOTH.lytsar!;
  const shirt = outfit.shirt ?? HERO.shirt;
  const sash = outfit.sash ?? HERO.sash;
  const boot = outfit.boot ?? (woman ? HERO.bootWoman : HERO.boot);
  const coat = outfit.coat;
  const sleeve = coat !== undefined && !outfit.sleeveless ? coat : shirt;
  // Over a coat the sash wraps a little wider.
  const wrap = (coat !== undefined ? 1.1 : 1) * (outfit.stout ? 1.12 : 1);
  /** A coat's sleeve runs to the wrist, cuffed in the sash's colour. */
  const covered = coat !== undefined && !outfit.sleeveless;
  const cuff = covered ? sash : HERO.stitch;
  /** Her fartukh: dark with a stitched band, unless the outfit says. */
  const apron = woman && !outfit.regal ? (outfit.apron ?? 0x221c19) : undefined;
  const torsoX = woman ? 1.0 : TORSO_X;
  const shoulder = woman ? 0.265 : 0.32;
  useFrame(() => {
    const c = current();
    const pose = c?.pose;
    const at = (keys: Keys | undefined) => (c && keys ? sample(keys, c.t) : 0);
    if (freeAcross.current) freeAcross.current.rotation.z = at(pose?.across);
    if (upper.current)
      upper.current.rotation.set(at(pose?.lean), at(pose?.twist), 0);
    if (held.current) {
      const upright = pose?.upright ? -at(pose.weapon) : 0;
      if (kind === "bow") {
        // Level at rest; it turns upright as the arm comes up to shoot.
        const raise = pose === POSES.bow ? sample(BOW_RAISE, c!.t) : 0;
        bowDrawn.setFromAxisAngle(X_AXIS, upright);
        bowHeld.slerpQuaternions(BOW_IDLE, bowDrawn, raise);
        held.current.quaternion.copy(bowHeld);
      } else held.current.rotation.x = upright;
    }
    if (flask.current)
      flask.current.visible = !!pose?.flask && (c?.t ?? 1) < 0.85;
  });
  return (
    <group>
      <group ref={body}>
        {/* Hips: the sharovary's seat, or the skirt with a stitched hem */}
        {outfit.regal ? (
          <Gown cloth={cloth} gold={sash} gem={outfit.hatTrim ?? HERO.stitch} />
        ) : woman ? (
          <>
            <Part geometry={BODY.skirt} color={cloth} scale={[1.05, 1, 0.85]} />
            <Part
              geometry={BODY.hem}
              color={HERO.stitch}
              scale={[1.05, 1, 0.85]}
            />
            <Part
              geometry={BODY.hemLine}
              color={HERO.stitch}
              scale={[1.05, 1, 0.85]}
            />
            {apron !== undefined ? (
              <>
                <Part
                  geometry={EXTRA.apron}
                  color={apron}
                  scale={SKIRT_SCALE}
                />
                <Part
                  geometry={EXTRA.apronBand}
                  color={HERO.stitch}
                  scale={SKIRT_SCALE}
                />
              </>
            ) : null}
          </>
        ) : (
          <Part geometry={BODY.seat} color={cloth} scale={[1.15, 1, 0.82]} />
        )}
        {/* A scabbard at the left hip, the sabre out of it */}
        {kind === "sabre" ? (
          <group position={[0.26, 0.96, 0.05]} rotation={[0.93, 0, 0.12]}>
            <Part
              geometry={G.box}
              color={HERO.scabbard}
              position={[0, -0.38, 0]}
              rotation={[0.08, 0, 0]}
              scale={[0.045, 0.74, 0.085]}
            />
            <Part
              geometry={G.box}
              color={HERO.brass}
              position={[0, -0.04, 0]}
              scale={[0.055, 0.05, 0.095]}
            />
            <Part
              geometry={G.box}
              color={HERO.brass}
              position={[0, -0.36, 0.005]}
              scale={[0.052, 0.03, 0.092]}
            />
            <Part
              geometry={G.box}
              color={HERO.brass}
              position={[0, -0.73, -0.03]}
              scale={[0.055, 0.07, 0.095]}
            />
          </group>
        ) : null}
        {/* The upper body twists and leans from the waist in a move */}
        <group ref={upper} position={[0, WAIST, 0]}>
          <group position={[0, -WAIST, 0]}>
            {coat !== undefined && !woman ? (
              // The coat's skirt to the knee, under the sash.
              <Part
                geometry={BODY.coatSkirt}
                color={coat}
                scale={[1.1, 1, 0.82]}
              />
            ) : null}
            {/* Shirt: bloused over the sash, a broad chest */}
            <Part
              geometry={BODY.torso}
              color={shirt}
              scale={[torsoX, 1, TORSO_Z]}
            />
            {/* The collar slit, its embroidered bands and a stand-up collar */}
            {outfit.regal ? null : (
              <>
                <Part
                  geometry={G.box}
                  color={skin}
                  position={[0, 1.42, chestZ(1.42) + 0.003]}
                  scale={[0.032, 0.09, 0.02]}
                />
                {[-1, 1].map((s) =>
                  [1.435, 1.4, 1.365, 1.33].map((y, i) => (
                    <Part
                      key={`${s}${y}`}
                      geometry={G.box}
                      color={HERO.stitch}
                      position={[s * 0.048, y, chestZ(y) + 0.006]}
                      rotation={[0, 0, Math.PI / 4]}
                      scale={
                        i === 3 ? [0.022, 0.022, 0.01] : [0.03, 0.03, 0.01]
                      }
                    />
                  )),
                )}
                <Part
                  geometry={G.box}
                  color={HERO.stitch}
                  position={[0, 1.3, chestZ(1.3) + 0.006]}
                  rotation={[0, 0, Math.PI / 4]}
                  scale={[0.03, 0.03, 0.01]}
                />
              </>
            )}
            <Part
              geometry={BODY.collar}
              color={outfit.regal ? sash : HERO.stitch}
              scale={[1, 1, 0.9]}
            />
            {coat !== undefined ? (
              <>
                {/* The coat over the shirt, brass buttons down the front */}
                <Part
                  geometry={BODY.torso}
                  color={coat}
                  position={[0, -0.01, 0]}
                  scale={[torsoX * COAT_X, 0.985, TORSO_Z * COAT_Z]}
                />
                {outfit.regal ? (
                  <Bodice
                    torsoX={torsoX}
                    gold={sash}
                    gem={outfit.hatTrim ?? HERO.stitch}
                  />
                ) : outfit.sleeveless ? null : (
                  <Part
                    geometry={G.box}
                    color={sash}
                    position={[0, 1.2, chestZ(1.2) * 1.14 + 0.004]}
                    scale={[0.03, 0.42, 0.01]}
                  />
                )}
                {(outfit.regal ? [] : [1.1, 1.2, 1.3]).map((y) => (
                  <Part
                    key={y}
                    geometry={G.sphere}
                    color={HERO.brass}
                    position={[0, y, chestZ(y) * 1.14 + 0.012]}
                    scale={[0.035, 0.035, 0.025]}
                  />
                ))}
              </>
            ) : null}
            {outfit.stout ? (
              // A round belly, the coat stretched over it.
              <Part
                geometry={BODY.torso}
                color={coat ?? shirt}
                position={[0, -0.02, 0.05]}
                scale={[torsoX * 1.1, 0.96, TORSO_Z * 1.5]}
              />
            ) : null}
            {/* A wide kushak sash, the belt and its buckle, the sash ends at
            the left hip */}
            <Part
              geometry={BODY.sash}
              color={sash}
              scale={[torsoX * wrap, 1, 0.76 * wrap]}
            />
            {outfit.regal ? null : (
              <>
                <Part
                  geometry={BODY.belt}
                  color={HERO.belt}
                  scale={[torsoX * wrap, 1, 0.76 * wrap]}
                />
                <group position={[0, 0.965, 0.253 * 0.76 * wrap + 0.006]}>
                  <Part
                    geometry={G.box}
                    color={HERO.buckle}
                    scale={[0.075, 0.065, 0.014]}
                  />
                  <Part
                    geometry={G.box}
                    color={HERO.belt}
                    position={[0, 0, 0.004]}
                    scale={[0.04, 0.032, 0.012]}
                  />
                </group>
                <Part
                  geometry={G.box}
                  color={sash}
                  position={[0.17, 0.83, 0.15 * wrap]}
                  rotation={[0.1, 0, -0.1]}
                  scale={[0.075, 0.24, 0.03]}
                />
                <Part
                  geometry={G.box}
                  color={sash}
                  position={[0.225, 0.85, 0.125 * wrap]}
                  rotation={[0.1, 0.4, -0.22]}
                  scale={[0.06, 0.2, 0.03]}
                />
                <Part
                  geometry={G.box}
                  color={HERO.stitch}
                  position={[0.172, 0.72, 0.158 * wrap]}
                  rotation={[0.1, 0, -0.1]}
                  scale={[0.078, 0.02, 0.032]}
                />
              </>
            )}
            <Extras
              outfit={outfit}
              woman={woman}
              torsoX={torsoX}
              coat={coat}
              sash={sash}
            />
            {outfit.cloak ? (
              <Cloak
                {...outfit.cloak}
                clasp={outfit.regal ? sash : HERO.brass}
                gem={outfit.hatTrim}
              />
            ) : null}
            <Part geometry={BODY.neck} color={skin} />
            {/* The head, built large and scaled down onto the neck */}
            <group position={HEAD_AT} scale={HEAD_SCALE}>
              <Head
                look={look}
                outfit={outfit}
                helmet={helmet}
                skin={skin}
                hair={hair}
                sash={sash}
              />
            </group>
            {/* Arms: the left (+x) swings; the right (-x) holds the weapon */}
            <group position={[shoulder, SHOULDER_Y, 0]} rotation={[0, 0, 0.1]}>
              <group ref={freeAcross}>
                <group ref={freeArm}>
                  <Arm
                    skin={skin}
                    sleeve={sleeve}
                    cuff={cuff}
                    covered={covered}
                    side={1}
                    bell={outfit.regal}
                  />
                  <group ref={flask} position={HAND} visible={false}>
                    <Part
                      geometry={G.sphere}
                      color={0xb3261e}
                      position={[0, 0, 0.09]}
                      scale={[0.11, 0.12, 0.11]}
                    />
                    <Part
                      geometry={G.cyl}
                      color={0x5b3a1e}
                      position={[0, 0.09, 0.09]}
                      scale={[0.04, 0.07, 0.04]}
                    />
                  </group>
                </group>
              </group>
            </group>
            <group position={[-shoulder, SHOULDER_Y, 0]} rotation={grip.arm}>
              <group ref={weaponArm}>
                <Arm
                  skin={skin}
                  sleeve={sleeve}
                  cuff={cuff}
                  covered={covered}
                  side={-1}
                  bell={outfit.regal}
                />
                <group ref={held} position={HAND}>
                  <group rotation={GRIP_ROTATION[kind]}>
                    <Weapon kind={kind} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      <group ref={left} position={[-HIP_X, HIP_Y, 0]}>
        <Leg woman={woman} cloth={cloth} boot={boot} inward={1} />
      </group>
      <group ref={right} position={[HIP_X, HIP_Y, 0]}>
        <Leg woman={woman} cloth={cloth} boot={boot} inward={-1} />
      </group>
    </group>
  );
}

/** Where a layer's front is at a height and across: the shirt or a coat. */
function frontZ(y: number, x: number, torsoX: number, coat: boolean): number {
  const sx = torsoX * (coat ? COAT_X : 1);
  const sz = TORSO_Z * (coat ? COAT_Z : 1);
  const r = radiusAt(TORSO, coat ? (y + 0.01) / 0.985 : y);
  const u = Math.min(0.98, Math.abs(x) / (r * sx));
  return Math.sqrt(1 - u * u) * r * sz;
}

/**
 * What makes one figure differ from the next beyond colours: a woman's coral
 * namysto, an otaman's gold frogging, mail rings, a fur collar, a strap and
 * flask, what hangs at the belt.
 */
function Extras({
  outfit,
  woman,
  torsoX,
  coat,
  sash,
}: {
  outfit: Outfit;
  woman: boolean;
  torsoX: number;
  coat?: number;
  sash: number;
}) {
  const coated = coat !== undefined;
  return (
    <>
      {woman && !outfit.regal
        ? // Three strands of coral beads, a gold dukach on the lowest.
          [0, 1, 2].map((k) =>
            Array.from({ length: 11 + k * 2 }, (_, i) => {
              const t = (i / (10 + k * 2)) * 2 - 1;
              const x = t * (0.085 + k * 0.022);
              const y = 1.44 - k * 0.028 - (1 - t * t) * (0.045 + k * 0.022);
              return (
                <Part
                  key={`${k}-${i}`}
                  geometry={G.sphere}
                  color={k === 1 ? 0xb3201a : 0xd2382a}
                  position={[x, y, frontZ(y, x, torsoX, coated) + 0.01]}
                  scale={[0.024, 0.024, 0.024]}
                />
              );
            }),
          )
        : null}
      {woman && !outfit.regal ? (
        <Part
          geometry={G.cyl}
          color={HERO.brass}
          position={[0, 1.31, frontZ(1.31, 0, torsoX, coated) + 0.012]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[0.045, 0.01, 0.045]}
        />
      ) : null}
      {outfit.frogs !== undefined
        ? [1.1, 1.18, 1.26, 1.34].map((y) => (
            <group key={y}>
              <Part
                geometry={G.box}
                color={outfit.frogs!}
                position={[0, y, frontZ(y, 0, torsoX, coated) + 0.004]}
                scale={[0.17 - (1.34 - y) * 0.1, 0.016, 0.012]}
              />
              {[-1, 1].map((s) => {
                const x = s * (0.085 - (1.34 - y) * 0.05);
                return (
                  <Part
                    key={s}
                    geometry={G.sphere}
                    color={outfit.frogs!}
                    position={[x, y, frontZ(y, x, torsoX, coated) + 0.008]}
                    scale={[0.028, 0.028, 0.02]}
                  />
                );
              })}
            </group>
          ))
        : null}
      {outfit.mail
        ? EXTRA.mail.map((g, i) => (
            <Part
              key={i}
              geometry={g}
              color={0x5c6068}
              position={i < 6 ? [0, 0, 0] : [0, -0.01, 0]}
              scale={
                i < 6
                  ? [1.1, 1, 0.82]
                  : [torsoX * COAT_X, 0.985, TORSO_Z * COAT_Z]
              }
            />
          ))
        : null}
      {outfit.fur !== undefined ? (
        <Part
          geometry={EXTRA.fur}
          color={outfit.fur}
          scale={[torsoX * COAT_X * 1.04, 1, TORSO_Z * COAT_Z * 1.2]}
        />
      ) : null}
      {outfit.bandolier ? (
        // From the right shoulder down to the left hip, a flask on it.
        <group>
          <Part
            geometry={G.box}
            color={0x3a2414}
            position={[0, 1.17, frontZ(1.17, 0, torsoX, coated) + 0.012]}
            rotation={[0, 0, -0.64]}
            scale={[0.04, 0.48, 0.014]}
          />
          <Part
            geometry={G.cone}
            color={0x6a4a2a}
            position={[0.17, 1.0, frontZ(1.0, 0.17, torsoX, coated) + 0.03]}
            rotation={[0, 0, 2.4]}
            scale={[0.07, 0.12, 0.05]}
          />
          <Part
            geometry={G.cyl}
            color={HERO.brass}
            position={[0.13, 1.04, frontZ(1.04, 0.13, torsoX, coated) + 0.03]}
            rotation={[0, 0, 2.4]}
            scale={[0.025, 0.04, 0.025]}
          />
        </group>
      ) : null}
      {outfit.belt === "pistol" ? (
        // A second pistol thrust through the sash, butt up.
        <group position={[0.12, 1.0, 0.21]} rotation={[0.2, 0, 2.75]}>
          <Weapon kind="pistol" />
        </group>
      ) : outfit.belt === "purse" ? (
        // A leather kalyta at the right hip, a brass clasp.
        <group position={[-0.22, 0.86, 0.11]} rotation={[0, -0.6, 0]}>
          <Part geometry={G.box} color={0x5a3a20} scale={[0.11, 0.12, 0.05]} />
          <Part
            geometry={G.box}
            color={0x4a2e18}
            position={[0, 0.045, 0.012]}
            rotation={[0.2, 0, 0]}
            scale={[0.115, 0.05, 0.04]}
          />
          <Part
            geometry={G.sphere}
            color={HERO.brass}
            position={[0, 0.02, 0.035]}
            scale={[0.025, 0.025, 0.02]}
          />
        </group>
      ) : outfit.belt === "herbs" ? (
        // A bundle of herbs tied at the hip.
        <group position={[0.2, 0.86, 0.14]} rotation={[0.1, 0, -0.25]}>
          {[-0.025, 0, 0.025].map((x, i) => (
            <Part
              key={x}
              geometry={G.cone4}
              color={i === 1 ? 0x6f8a3a : 0x4f6e2e}
              position={[x, -0.06, 0]}
              rotation={[Math.PI, 0, x * 6]}
              scale={[0.04, 0.16, 0.04]}
            />
          ))}
          <Part
            geometry={G.sphere}
            color={0xb48ac0}
            position={[0, -0.15, 0.01]}
            scale={[0.04, 0.03, 0.04]}
          />
          <Part
            geometry={G.cyl}
            color={sash}
            position={[0, 0.0, 0]}
            scale={[0.075, 0.025, 0.06]}
          />
        </group>
      ) : null}
    </>
  );
}

/** A princess's gown: gold hem and band, gems, a scatter of flowers. */
function Gown({
  cloth,
  gold,
  gem,
}: {
  cloth: number;
  gold: number;
  gem: number;
}) {
  return (
    <>
      <Part geometry={REGAL.underdress} color={0xd5dde3} scale={GOWN_SCALE} />
      <Part geometry={REGAL.gown} color={cloth} scale={GOWN_SCALE} />
      <Part geometry={REGAL.hem} color={gold} scale={GOWN_SCALE} />
      <Part geometry={REGAL.gownBand} color={gold} scale={GOWN_SCALE} />
      {[0.38, 0.55, 0.72, 0.88].map((y, i) => (
        <group key={y} position={[0, y, gownZ(y) + 0.008]}>
          {i % 2 ? (
            <Part
              geometry={G.box}
              color={gem}
              rotation={[0, 0, Math.PI / 4]}
              scale={[0.045, 0.045, 0.02]}
            />
          ) : (
            <>
              <Part
                geometry={G.cyl}
                color={0xa07a2a}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[0.075, 0.012, 0.075]}
              />
              <Part
                geometry={G.box}
                color={gold}
                position={[0, 0, 0.008]}
                scale={[0.012, 0.055, 0.01]}
              />
              <Part
                geometry={G.box}
                color={gold}
                position={[0, 0, 0.008]}
                scale={[0.055, 0.012, 0.01]}
              />
            </>
          )}
        </group>
      ))}
      {/* Embroidered flowers over the cream silk */}
      {[-1.1, -0.65, 0.65, 1.1].flatMap((a, i) =>
        [0.42, 0.62, 0.82].map((y, j) => {
          const r = radiusAt(GOWN, y) + 0.004;
          return (
            <Part
              key={`${a}${y}`}
              geometry={G.box}
              color={(i + j) % 2 ? 0xd9776a : 0x8aa6c8}
              position={[
                Math.sin(a + j * 0.12) * r * GOWN_SCALE[0],
                y,
                Math.cos(a + j * 0.12) * r * GOWN_SCALE[2],
              ]}
              rotation={[0, a, Math.PI / 4]}
              scale={[0.03, 0.03, 0.01]}
            />
          );
        }),
      )}
    </>
  );
}

/** The bodice's gold: a gemmed yoke and the band down to the waist. */
function Bodice({
  torsoX,
  gold,
  gem,
}: {
  torsoX: number;
  gold: number;
  gem: number;
}) {
  const scale: Vec3 = [torsoX * COAT_X, 0.985, TORSO_Z * COAT_Z];
  return (
    <>
      <Part
        geometry={REGAL.yoke}
        color={gold}
        position={[0, -0.01, 0]}
        scale={scale}
      />
      <Part
        geometry={REGAL.bodiceBand}
        color={gold}
        position={[0, -0.01, 0]}
        scale={scale}
      />
      {[-0.7, -0.35, 0, 0.35, 0.7].map((a) => {
        const r = radiusAt(TORSO, 1.42) * 1.035 + 0.012;
        return (
          <Part
            key={a}
            geometry={G.box}
            color={gem}
            position={[
              Math.sin(a) * r * scale[0],
              1.395,
              Math.cos(a) * r * scale[2],
            ]}
            rotation={[0, a, 0]}
            scale={[0.035, 0.035, 0.015]}
          />
        );
      })}
      {[1.08, 1.2].map((y) => (
        <Part
          key={y}
          geometry={G.box}
          color={gem}
          position={[0, y, chestZ(y + 0.01) * COAT_Z * 1.012 + 0.008]}
          rotation={[0, 0, Math.PI / 4]}
          scale={[0.035, 0.035, 0.015]}
        />
      ))}
    </>
  );
}

/** A cape from the shoulders, lined in another colour, a clasp in front. */
function Cloak({
  color,
  lining,
  clasp,
  gem,
}: {
  color: number;
  lining: number;
  clasp: number;
  gem?: number;
}) {
  const scale: Vec3 = [1.08, 1, 0.82];
  return (
    <>
      <Part geometry={REGAL.cloak} color={color} scale={scale} />
      <Part
        geometry={REGAL.cloak}
        color={lining}
        scale={scale}
        side={THREE.BackSide}
      />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.26, 1.43, 0.17]}>
          <Part
            geometry={G.cyl}
            color={clasp}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.075, 0.02, 0.075]}
          />
          {gem !== undefined ? (
            <Part
              geometry={G.box}
              color={gem}
              position={[0, 0, 0.012]}
              scale={[0.03, 0.03, 0.012]}
            />
          ) : null}
        </group>
      ))}
    </>
  );
}

/** Where the features sit on the sculpted faces (see head-mesh). */
function faceMarks(front: (x: number, y: number) => number) {
  return {
    eyeY: CY - 0.004,
    eye: front(0.062, CY - 0.004) + 0.009,
    browY: CY + 0.038,
    brow: front(0.064, CY + 0.042) + 0.004,
    mouthY: CY - 0.128,
    mouth: front(0, CY - 0.128) + 0.002,
    lipY: CY - 0.098,
    lip: front(0.03, CY - 0.098),
  };
}
const FACE_HIM = faceMarks(FACE.him);
const FACE_HER = faceMarks(FACE.her);

/**
 * A head at the old, larger scale around (0, 1.46, 0): a shaved skull or
 * hair, a square jaw, a strong nose under heavy brows, the long moustache
 * and a chin tuft; or a hat over it all.
 */
function Head({
  look,
  outfit,
  helmet,
  skin,
  hair,
  sash,
}: {
  look: Look;
  outfit: Outfit;
  helmet?: boolean;
  skin: THREE.ColorRepresentation;
  hair: THREE.ColorRepresentation;
  sash: number;
}) {
  const woman = look.body === "kozachka";
  const at = woman ? FACE_HER : FACE_HIM;
  const shade = (k: number) => new THREE.Color(skin).multiplyScalar(k).getHex();
  return (
    <>
      {/* The head, softly lit from within so the face under the brow and
      the jaw never goes dark */}
      <Part
        geometry={woman ? HEADS.her : HEADS.him}
        color={skin}
        emissive={skin}
        glow={0.22}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* An ear and its lobe, close to the head */}
          <Part
            geometry={G.box}
            color={skin}
            position={[side * 0.16, 1.465, -0.02]}
            rotation={[0, side * 0.35, side * -0.08]}
            scale={[0.03, 0.075, 0.05]}
          />
          <Part
            geometry={G.box}
            color={skin}
            position={[side * 0.158, 1.42, -0.012]}
            scale={[0.024, 0.028, 0.03]}
          />
          {/* An eye under the brow, a little narrowed and its outer corner
          lifted: the white, a dark iris, the upper lid over them */}
          <group
            position={[side * 0.062, at.eyeY, at.eye]}
            rotation={[0, 0, side * 0.1]}
          >
            <Part
              geometry={G.box}
              color={0xe4dccc}
              position={[0, 0, -0.004]}
              scale={[0.046, 0.022, 0.012]}
            />
            <Part
              geometry={G.box}
              color={0x24170f}
              position={[-side * 0.004, -0.001, 0.001]}
              scale={[0.022, 0.022, 0.008]}
            />
            <Part
              geometry={G.box}
              color={shade(0.6)}
              position={[0, 0.011, 0.001]}
              scale={[0.054, 0.011, 0.012]}
            />
          </group>
          {/* A brow a little lower at the inner end, sure of itself; his
          left one cocked up */}
          <Part
            geometry={G.box}
            color={hair}
            position={[
              side * 0.064,
              at.browY + (!woman && side === 1 ? 0.013 : 0),
              at.brow,
            ]}
            rotation={[
              -0.2,
              side * 0.25,
              woman ? side * 0.07 : side === 1 ? 0.03 : side * 0.11,
            ]}
            scale={woman ? [0.075, 0.016, 0.022] : [0.09, 0.026, 0.028]}
          />
        </group>
      ))}
      {/* The mouth: a smile for her, a smirk with one corner up for him */}
      <Part
        geometry={G.box}
        color={woman ? 0xa8433a : shade(0.68)}
        position={[0, at.mouthY, at.mouth]}
        scale={woman ? [0.046, 0.013, 0.014] : [0.044, 0.01, 0.012]}
      />
      {(woman ? [-1, 1] : [1]).map((side) => (
        <Part
          key={side}
          geometry={G.box}
          color={woman ? 0xa8433a : shade(0.68)}
          position={[side * 0.027, at.mouthY + 0.005, at.mouth - 0.002]}
          rotation={[0, 0, side * 0.6]}
          scale={[0.018, woman ? 0.011 : 0.009, 0.012]}
        />
      ))}
      {outfit.earring ? (
        <Part
          geometry={G.sphere}
          color={HERO.brass}
          position={[-0.165, 1.385, -0.005]}
          scale={[0.045, 0.055, 0.045]}
        />
      ) : null}
      {look.mustache && !woman ? (
        <>
          {/* A heavy moustache: thick over the lip, down past the mouth
          to the jaw in a horseshoe */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <Part
                geometry={G.box}
                color={hair}
                position={[
                  side * 0.042,
                  FACE_HIM.lipY - 0.004,
                  FACE_HIM.lip + 0.006,
                ]}
                rotation={[0.1, side * 0.32, side * -0.26]}
                scale={[0.085, 0.044, 0.042]}
              />
              <Part
                geometry={G.box}
                color={hair}
                position={[
                  side * 0.083,
                  FACE_HIM.lipY - 0.055,
                  FACE_HIM.lip - 0.022,
                ]}
                rotation={[0.12, side * 0.5, side * 0.08]}
                scale={[0.042, 0.09, 0.044]}
              />
              <Part
                geometry={G.cone4}
                color={hair}
                position={[
                  side * 0.088,
                  FACE_HIM.lipY - 0.115,
                  FACE_HIM.lip - 0.034,
                ]}
                rotation={[Math.PI + 0.1, side * 0.5 + Math.PI / 4, side * 0.1]}
                scale={[0.05, 0.045, 0.05]}
              />
            </group>
          ))}
        </>
      ) : null}
      {/* Hair, or a hat */}
      {outfit.hat ? (
        <Hat
          kind={outfit.hat}
          color={outfit.hatColor ?? 0x2a2018}
          trim={outfit.hatTrim ?? sash}
          hair={hair}
          woman={woman}
        />
      ) : helmet ? (
        <>
          <Part
            geometry={G.cyl}
            color={0x2a2018}
            position={[0, 1.61, 0]}
            scale={[0.37, 0.2, 0.37]}
          />
          <Part
            geometry={G.cyl}
            color={HERO.sash}
            position={[0, 1.715, 0]}
            scale={[0.3, 0.04, 0.3]}
          />
        </>
      ) : woman ? (
        <>
          {/* Hair, a vinok of flowers and a braid down the back */}
          <Part
            geometry={G.sphere}
            color={hair}
            position={[0, 1.585, -0.035]}
            scale={[0.355, 0.2, 0.36]}
          />
          <Part
            geometry={G.sphere}
            color={hair}
            position={[0, 1.47, -0.075]}
            scale={[0.35, 0.3, 0.27]}
          />
          <Part
            geometry={G.cyl}
            color={0xd23a3a}
            position={[0, 1.605, 0]}
            scale={[0.375, 0.07, 0.375]}
          />
          {[-0.13, 0, 0.13].map((x) => (
            <Part
              key={x}
              geometry={G.sphere}
              color={x === 0 ? 0xf2c94c : 0xe8e0d0}
              position={[x, 1.645, 0.13 - Math.abs(x) * 0.25]}
              scale={[0.085, 0.085, 0.085]}
            />
          ))}
          <Braid hair={hair} length={0.55 + look.hair * 0.12} />
          {/* The vinok's ribbons down her back */}
          {[0xc8281e, 0xe8b830, 0x3f7a3a, 0x2f5aa8, 0xeee6d6].map((c, i) => (
            <Part
              key={c}
              geometry={G.box}
              color={c}
              position={[(i - 2) * 0.034, 1.3 - Math.abs(i - 2) * 0.03, -0.25]}
              rotation={[0.3, 0, (i - 2) * 0.05]}
              scale={[0.03, 0.62, 0.012]}
            />
          ))}
        </>
      ) : look.hair === 0 ? (
        <>
          {/* Oseledets: a single lock from the crown of the bare,
          shaved head, falling over to the side, past the ear */}
          <Part geometry={HEADS.crest} color={hair} />
          <Part
            geometry={G.box}
            color={hair}
            position={[-0.06, 1.675, -0.035]}
            rotation={[0, 0, 1.1]}
            scale={[0.07, 0.14, 0.065]}
          />
          <Part
            geometry={G.box}
            color={hair}
            position={[-0.135, 1.625, -0.045]}
            rotation={[0, 0, 0.62]}
            scale={[0.064, 0.12, 0.06]}
          />
          <Part
            geometry={G.box}
            color={hair}
            position={[-0.168, 1.52, -0.05]}
            rotation={[0, 0, 0.14]}
            scale={[0.055, 0.14, 0.052]}
          />
          <Part
            geometry={G.box}
            color={hair}
            position={[-0.174, 1.395, -0.048]}
            rotation={[0, 0, -0.08]}
            scale={[0.045, 0.13, 0.045]}
          />
          <Part
            geometry={G.cone4}
            color={hair}
            position={[-0.17, 1.3, -0.046]}
            rotation={[Math.PI, 0, -0.08]}
            scale={[0.05, 0.08, 0.05]}
          />
        </>
      ) : (
        <>
          <Part geometry={HEADS.crop} color={hair} />
          {look.hair === 2 ? (
            // A chupryna: the forelock swept over the brow.
            <Part
              geometry={G.box}
              color={hair}
              position={[0.05, 1.6, 0.13]}
              rotation={[0.4, 0, -0.5]}
              scale={[0.16, 0.06, 0.08]}
            />
          ) : null}
        </>
      )}
    </>
  );
}

/** A braid from the back of the head down her back, in the head's frame. */
function Braid({
  hair,
  length,
}: {
  hair: THREE.ColorRepresentation;
  length: number;
}) {
  const links = Math.round(length / 0.1);
  return (
    <group position={[0, 1.42, -0.2]} rotation={[0.28, 0, 0]}>
      {Array.from({ length: links }, (_, i) => (
        <Part
          key={i}
          geometry={G.sphere}
          color={hair}
          position={[0, -0.06 - i * 0.1, 0]}
          scale={[0.09 - i * 0.004, 0.12, 0.08 - i * 0.003]}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- npcs

/**
 * Kyiv's people, dressed on the hero's body so they stand beside the hero
 * as the same kind of figure.
 */
const NPC_LOOKS: Record<
  string,
  { look: Look; weapon: string; outfit: Outfit }
> = {
  // Ivan Sirko: a grey oseledets, a crimson zhupan and the otaman's bulava.
  otaman: {
    look: { body: "kozak", face: 0, hair: 0, hairColor: 3, mustache: true },
    weapon: "bulava",
    outfit: {
      cloth: 0x2c3f86,
      coat: 0x8c1d1d,
      sash: 0xb8892e,
      frogs: 0xd8b04a,
    },
  },
  // Olha: a crown over a white veil, a cream gown banded in gold, a flame-red
  // cloak lined with orange, and a staff of fire.
  olha: {
    look: { body: "kozachka", face: 0, hair: 0, hairColor: 1, mustache: false },
    weapon: "staff",
    outfit: {
      cloth: 0xefe4cb,
      coat: 0xefe4cb,
      sash: 0xd2a944,
      boot: 0x3a2a1a,
      hat: "crown",
      hatColor: 0xd8b04a,
      hatTrim: 0x2c4aa0,
      regal: true,
      cloak: { color: 0xc4231a, lining: 0xf08a2a },
    },
  },
  // Sviatoslav: shaved head and oseledets, a gold earring, mail over the
  // shirt, a sabre.
  sviatoslav: {
    look: { body: "kozak", face: 1, hair: 0, hairColor: 2, mustache: true },
    weapon: "sabre",
    outfit: {
      cloth: 0x7a1712,
      coat: 0x7d8088,
      sleeveless: true,
      sash: 0x3a2a1a,
      earring: true,
      mail: true,
      cloak: { color: 0x8c1d1d, lining: 0x4a2a1a },
    },
  },
  // Ustym Karmaliuk: a dark svyta, a black brimmed hat, a pistol.
  karmaliuk: {
    look: { body: "kozak", face: 1, hair: 1, hairColor: 0, mustache: true },
    weapon: "pistol",
    outfit: {
      cloth: 0x2a2a2a,
      coat: 0x2f3a24,
      sash: 0x5a1410,
      hat: "brim",
      hatColor: 0x161210,
      hatTrim: 0x5a1410,
      belt: "pistol",
      bandolier: true,
    },
  },
  // Hordii: a stout merchant in a brown kuntush and a fur kuchma.
  merchant: {
    look: { body: "kozak", face: 0, hair: 1, hairColor: 1, mustache: true },
    weapon: "none",
    outfit: {
      cloth: 0x2c4a6a,
      coat: 0x7a5a2a,
      sash: 0x2c5a3a,
      hat: "kuchma",
      hatColor: 0x4a3020,
      hatTrim: 0x2c5a3a,
      stout: true,
      fur: 0x5a3c22,
      belt: "purse",
    },
  },
  // Motria: a grey-haired znakharka in a red khustka and a dark keptar.
  healer: {
    look: { body: "kozachka", face: 2, hair: 0, hairColor: 3, mustache: false },
    weapon: "none",
    outfit: {
      cloth: 0x3a5a3a,
      coat: 0x3a2a1a,
      sleeveless: true,
      sash: 0x8c1d1d,
      hat: "scarf",
      hatColor: 0x8c1d1d,
      hatTrim: 0xe8d8b0,
      apron: 0xeee6d6,
      belt: "herbs",
    },
  },
};

const STANDING = () => 0;

/** Whether a kind of NPC is a person drawn on the hero's body. */
export function isPersonNpc(kind: string | undefined): boolean {
  return !!kind && kind in NPC_LOOKS;
}

export function NpcFigure({ kind }: { kind: string }) {
  if (kind === "chest") {
    return (
      <group>
        <Part
          geometry={G.box}
          color={0x5a3a1e}
          position={[0, 0.3, 0]}
          scale={[1, 0.6, 0.6]}
        />
        <Part
          geometry={G.box}
          color={0xc9a24a}
          position={[0, 0.62, 0]}
          scale={[1.02, 0.06, 0.62]}
        />
      </group>
    );
  }
  const npc = NPC_LOOKS[kind] ?? NPC_LOOKS.merchant!;
  return (
    <HeroFigure
      look={npc.look}
      classId=""
      weapon={npc.weapon}
      speed={STANDING}
      outfit={npc.outfit}
    />
  );
}

/** "!" for a quest to give, "?" for one to hand in, floating above an NPC. */
export function QuestMarker({ ready }: { ready: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 2.2 + Math.sin(clock.elapsedTime * 3) * 0.1;
      ref.current.rotation.y = clock.elapsedTime * 1.5;
    }
  });
  return (
    <group ref={ref}>
      <Part
        geometry={G.octa}
        color={ready ? 0x7bd06a : 0xffd24a}
        emissive={ready ? 0x3a8a2a : 0xaa7a00}
        scale={[0.3, 0.45, 0.3]}
      />
    </group>
  );
}

// ---------------------------------------------------------------- monsters

export function MonsterFigure({
  kind,
  speed,
}: {
  kind: string;
  speed: () => number;
}) {
  const { body, left, right } = useWalk(speed);
  const legs = (color: number, width = 0.18) => (
    <>
      <group ref={left} position={[-0.15, 0.4, 0]}>
        <Part
          geometry={G.box}
          color={color}
          position={[0, -0.2, 0]}
          scale={[width, 0.42, width]}
        />
      </group>
      <group ref={right} position={[0.15, 0.4, 0]}>
        <Part
          geometry={G.box}
          color={color}
          position={[0, -0.2, 0]}
          scale={[width, 0.42, width]}
        />
      </group>
    </>
  );
  switch (kind) {
    case "orc":
    case "orc_brute":
    case "orc_shaman": {
      const scale = kind === "orc_brute" ? 1.35 : 1;
      const skin = 0x5d6b3a;
      return (
        <group scale={[scale, scale, scale]}>
          <group ref={body}>
            {kind === "orc_shaman" ? (
              <Part
                geometry={G.cone}
                color={0x3a2a1a}
                position={[0, 0.6, 0]}
                scale={[0.8, 1.2, 0.7]}
              />
            ) : (
              <Part
                geometry={G.box}
                color={0x4a3a2a}
                position={[0, 0.95, 0]}
                scale={[0.7, 0.62, 0.45]}
              />
            )}
            <Part
              geometry={G.box}
              color={skin}
              position={[0, 1.45, 0.05]}
              scale={[0.42, 0.38, 0.4]}
            />
            <Part
              geometry={G.cone}
              color={0xeeeeee}
              position={[-0.1, 1.33, 0.26]}
              rotation={[-0.4, 0, 0]}
              scale={[0.05, 0.14, 0.05]}
            />
            <Part
              geometry={G.cone}
              color={0xeeeeee}
              position={[0.1, 1.33, 0.26]}
              rotation={[-0.4, 0, 0]}
              scale={[0.05, 0.14, 0.05]}
            />
            {kind === "orc_shaman" ? (
              <Part
                geometry={G.sphere}
                color={0xe8e0d0}
                emissive={0x2a8a2a}
                position={[0.45, 1.5, 0.1]}
                scale={[0.2, 0.2, 0.2]}
              />
            ) : (
              <Part
                geometry={G.box}
                color={0x888888}
                position={[0.48, 0.9, 0.2]}
                rotation={[0.8, 0, 0]}
                scale={[0.08, 0.6, 0.25]}
              />
            )}
          </group>
          {kind !== "orc_shaman" ? legs(0x2a2018, 0.22) : null}
        </group>
      );
    }
    case "upyr":
      return (
        <group>
          <group ref={body}>
            <Part
              geometry={G.cone}
              color={0x1a1418}
              position={[0, 0.75, 0]}
              scale={[0.75, 1.5, 0.6]}
            />
            <Part
              geometry={G.sphere}
              color={0xc8c8c0}
              position={[0, 1.6, 0]}
              scale={[0.34, 0.4, 0.34]}
            />
            <Part
              geometry={G.sphere}
              color={0xff2020}
              emissive={0xff0000}
              position={[-0.08, 1.64, 0.16]}
              scale={[0.06, 0.06, 0.06]}
            />
            <Part
              geometry={G.sphere}
              color={0xff2020}
              emissive={0xff0000}
              position={[0.08, 1.64, 0.16]}
              scale={[0.06, 0.06, 0.06]}
            />
          </group>
        </group>
      );
    case "wolf":
      return (
        <group>
          <group ref={body}>
            <Part
              geometry={G.box}
              color={0x4a4744}
              position={[0, 0.65, 0]}
              scale={[0.45, 0.45, 1]}
            />
            <Part
              geometry={G.box}
              color={0x4a4744}
              position={[0, 0.9, 0.55]}
              scale={[0.36, 0.34, 0.4]}
            />
            <Part
              geometry={G.cone}
              color={0x3a3734}
              position={[-0.11, 1.12, 0.5]}
              scale={[0.09, 0.16, 0.09]}
            />
            <Part
              geometry={G.cone}
              color={0x3a3734}
              position={[0.11, 1.12, 0.5]}
              scale={[0.09, 0.16, 0.09]}
            />
            <Part
              geometry={G.sphere}
              color={0xffd24a}
              emissive={0xaa8800}
              position={[0, 0.95, 0.76]}
              scale={[0.16, 0.05, 0.05]}
            />
            <Part
              geometry={G.cone}
              color={0x3a3734}
              position={[0, 0.75, -0.6]}
              rotation={[-1.9, 0, 0]}
              scale={[0.1, 0.5, 0.1]}
            />
          </group>
          {legs(0x3a3734, 0.12)}
        </group>
      );
    case "mavka":
      return (
        <group>
          <group ref={body}>
            <Part
              geometry={G.cone}
              color={0x2f6a3a}
              emissive={0x0a3a1a}
              position={[0, 0.65, 0]}
              scale={[0.65, 1.3, 0.55]}
            />
            <Part
              geometry={G.sphere}
              color={0xcfe0c0}
              position={[0, 1.45, 0]}
              scale={[0.32, 0.38, 0.32]}
            />
            <Part
              geometry={G.box}
              color={0x6a8a3a}
              position={[0, 1.15, -0.18]}
              scale={[0.3, 0.8, 0.1]}
            />
            <Part
              geometry={G.cyl}
              color={0xe8e05a}
              emissive={0x6a6a00}
              position={[0, 1.65, 0]}
              scale={[0.34, 0.05, 0.34]}
            />
          </group>
        </group>
      );
    case "drowned":
      return (
        <group>
          <group ref={body}>
            <Part
              geometry={G.box}
              color={0x4a5a62}
              position={[0, 0.9, 0.1]}
              rotation={[0.35, 0, 0]}
              scale={[0.6, 0.7, 0.4]}
            />
            <Part
              geometry={G.sphere}
              color={0x8a9aa0}
              position={[0, 1.4, 0.3]}
              scale={[0.34, 0.36, 0.34]}
            />
            <Part
              geometry={G.box}
              color={0x2a4a2a}
              position={[0, 1.2, 0.36]}
              scale={[0.4, 0.4, 0.05]}
            />
          </group>
          {legs(0x3a4a52, 0.2)}
        </group>
      );
    case "chort":
      return (
        <group scale={[0.85, 0.85, 0.85]}>
          <group ref={body}>
            <Part
              geometry={G.box}
              color={0x6a1a14}
              position={[0, 0.9, 0]}
              scale={[0.5, 0.55, 0.38]}
            />
            <Part
              geometry={G.sphere}
              color={0x8a2a1a}
              position={[0, 1.4, 0.05]}
              scale={[0.4, 0.38, 0.38]}
            />
            <Part
              geometry={G.cone}
              color={0x1a1410}
              position={[-0.14, 1.66, 0]}
              rotation={[0, 0, 0.4]}
              scale={[0.07, 0.24, 0.07]}
            />
            <Part
              geometry={G.cone}
              color={0x1a1410}
              position={[0.14, 1.66, 0]}
              rotation={[0, 0, -0.4]}
              scale={[0.07, 0.24, 0.07]}
            />
            <Part
              geometry={G.sphere}
              color={0xffaa00}
              emissive={0xff6a00}
              position={[0, 1.42, 0.2]}
              scale={[0.22, 0.06, 0.05]}
            />
            <Part
              geometry={G.cone}
              color={0x4a1410}
              position={[0, 0.7, -0.4]}
              rotation={[-2.2, 0, 0]}
              scale={[0.06, 0.6, 0.06]}
            />
          </group>
          {legs(0x2a0a08, 0.15)}
        </group>
      );
    case "likho":
      return (
        <group scale={[1.9, 1.9, 1.9]}>
          <group ref={body}>
            <Part
              geometry={G.sphere}
              color={0x2a2420}
              position={[0, 0.9, 0]}
              scale={[1, 1.1, 0.9]}
            />
            <Part
              geometry={G.sphere}
              color={0x3a322a}
              position={[0, 1.55, 0.25]}
              scale={[0.6, 0.55, 0.55]}
            />
            <Part
              geometry={G.sphere}
              color={0xfff0a0}
              emissive={0xffc000}
              position={[0, 1.6, 0.52]}
              scale={[0.26, 0.26, 0.12]}
            />
            <Part
              geometry={G.box}
              color={0x2a2420}
              position={[-0.55, 0.7, 0.2]}
              rotation={[0.3, 0, 0.3]}
              scale={[0.18, 0.8, 0.18]}
            />
            <Part
              geometry={G.box}
              color={0x2a2420}
              position={[0.55, 0.7, 0.2]}
              rotation={[0.3, 0, -0.3]}
              scale={[0.18, 0.8, 0.18]}
            />
          </group>
        </group>
      );
    case "protector":
      // Oberih: a tall robed warden in white and gold, a glowing halo and
      // a staff; its light should read as "do not touch" from any distance.
      return (
        <group ref={body} scale={1.5}>
          {legs(0xe8e2d4, 0.2)}
          <Part
            geometry={G.cone}
            color={0xf2eee2}
            position={[0, 0.95, 0]}
            scale={[0.95, 1.3, 0.95]}
          />
          <Part
            geometry={G.box}
            color={0xc9a24a}
            emissive={0x3a2600}
            position={[0, 0.95, 0]}
            scale={[0.62, 0.1, 0.5]}
          />
          <Part
            geometry={G.sphere}
            color={0xe0b48f}
            position={[0, 1.8, 0]}
            scale={[0.38, 0.42, 0.38]}
          />
          <Part
            geometry={G.torus}
            color={0xffd76a}
            emissive={0xffb020}
            position={[0, 2.1, -0.08]}
            rotation={[0, 0, 0]}
            scale={[0.75, 0.75, 0.75]}
          />
          <Part
            geometry={G.torus}
            color={0xffd76a}
            emissive={0xffb020}
            position={[0, 2.1, -0.08]}
            rotation={[0, 0, Math.PI]}
            scale={[0.75, 0.75, 0.75]}
          />
          <Part
            geometry={G.cyl}
            color={0x8a6a42}
            position={[0.5, 1.1, 0.1]}
            scale={[0.07, 2.2, 0.07]}
          />
          <Part
            geometry={G.octa}
            color={0xffd76a}
            emissive={0xffb020}
            position={[0.5, 2.3, 0.1]}
            scale={[0.28, 0.4, 0.28]}
          />
        </group>
      );
    default:
      return (
        <group ref={body}>
          <Part
            geometry={G.box}
            color={0x777777}
            position={[0, 0.8, 0]}
            scale={[0.6, 1.2, 0.5]}
          />
        </group>
      );
  }
}

/** A ring on the ground: red for aggressive packs, violet for bosses. */
export function GroundRing({ color }: { color: number }) {
  return (
    <mesh
      geometry={G.ring}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.03, 0]}
      scale={[1.4, 1.4, 1.4]}
    >
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

/** A chumak ox-cart: plank bed, four wheels, sacks of salt under a hide. */
function SaltCart() {
  const WOOD = 0x7a5636;
  const wheels: Vec3[] = [
    [-0.9, 0.55, -0.85],
    [0.9, 0.55, -0.85],
    [-0.9, 0.55, 0.85],
    [0.9, 0.55, 0.85],
  ];
  return (
    <group rotation={[0, 0.4, 0]}>
      <Part
        geometry={G.box}
        color={WOOD}
        position={[0, 0.85, 0]}
        scale={[1.5, 0.25, 2.4]}
      />
      {wheels.map((p, i) => (
        <Part
          key={i}
          geometry={G.cyl}
          color={0x5a3f2a}
          position={p}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1.1, 0.14, 1.1]}
        />
      ))}
      {[-0.45, 0.45].flatMap((x) =>
        [-0.75, 0, 0.75].map((z) => (
          <Part
            key={`${x}${z}`}
            geometry={G.sphere}
            color={0xf2eee2}
            position={[x, 1.25, z]}
            scale={[0.7, 0.55, 0.65]}
          />
        )),
      )}
      {/* The shaft, and a heap of salt spilt beside the cart. */}
      <Part
        geometry={G.box}
        color={WOOD}
        position={[0, 0.7, 1.9]}
        rotation={[0.15, 0, 0]}
        scale={[0.12, 0.12, 1.6]}
      />
      <Part
        geometry={G.cone}
        color={0xfaf6ea}
        position={[1.5, 0.25, 0.4]}
        scale={[0.9, 0.5, 0.9]}
      />
    </group>
  );
}

export function InteractableFigure({ kind }: { kind: string }) {
  if (kind === "salt_cart") {
    return (
      <group>
        <group position={[-1.2, 0, 0]}>
          <SaltCart />
        </group>
        <group position={[1.4, 0, -0.6]} rotation={[0, -0.8, 0]}>
          <SaltCart />
        </group>
      </group>
    );
  }
  if (kind === "shrine") {
    // A roadside shrine: stone plinth, timber body under a pitched roof, a
    // red rushnyk over the icon and candles burning in front.
    const candles: Vec3[] = [
      [-0.8, 0.5, 0.75],
      [0.85, 0.5, 0.7],
      [-0.45, 0.5, 0.95],
      [0.5, 0.5, 1.0],
    ];
    return (
      <group>
        <Part
          geometry={G.box}
          color={0x8a8794}
          position={[0, 0.25, 0.2]}
          scale={[2.4, 0.5, 2]}
        />
        <Part
          geometry={G.box}
          color={0x6b4a30}
          position={[0, 1.45, 0]}
          scale={[1.2, 1.9, 0.9]}
        />
        <Part
          geometry={G.cone4}
          color={0x4d4f5a}
          position={[0, 2.85, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.5, 0.9, 1.2]}
        />
        <Part
          geometry={G.box}
          color={0x6b4a30}
          position={[0, 3.6, 0]}
          scale={[0.12, 0.8, 0.12]}
        />
        <Part
          geometry={G.box}
          color={0x6b4a30}
          position={[0, 3.7, 0]}
          scale={[0.5, 0.1, 0.1]}
        />
        <Part
          geometry={G.box}
          color={0xb8302a}
          position={[0, 1.35, 0.47]}
          scale={[0.8, 1.1, 0.04]}
        />
        <Part
          geometry={G.box}
          color={0xf2ead6}
          position={[0, 1.5, 0.5]}
          scale={[0.5, 0.5, 0.04]}
        />
        {candles.map((p, i) => (
          <group key={i} position={p}>
            <Part
              geometry={G.cyl}
              color={0xf0e6c8}
              position={[0, 0.17, 0]}
              scale={[0.13, 0.34, 0.13]}
            />
            <Part
              geometry={G.sphere}
              color={0xffc860}
              emissive={0xffa030}
              position={[0, 0.42, 0]}
              scale={[0.14, 0.2, 0.14]}
            />
          </group>
        ))}
        {/* The candles' glow on the ground, without a real light. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0.85]}>
          <circleGeometry args={[1.3, 20]} />
          <meshBasicMaterial
            color={0xffa040}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <Part
        geometry={G.sphere}
        color={0x3e4a2c}
        position={[0, 0, 0]}
        scale={[3, 1.6, 3]}
      />
      <Part
        geometry={G.box}
        color={0x8a8478}
        position={[0, 1.2, 0]}
        rotation={[0, 0.3, 0.05]}
        scale={[0.4, 1.4, 0.25]}
      />
    </group>
  );
}

// ---------------------------------------------------------------- tiles

type InstanceSpec = {
  geometry: THREE.BufferGeometry;
  color: number;
  /** Local transform of each instance, relative to its tile. */
  offset: Vec3;
  scale: Vec3;
  emissive?: number;
  jitter?: boolean;
};

/**
 * Built tiles. Trees, rocks, water, roads and grass are drawn by
 * `nature.tsx` in one pass over the map.
 */
const TILE_ART: Record<string, InstanceSpec[]> = {
  // A palisade: four sharpened logs per tile, so it reads either way round.
  W: [
    {
      geometry: G.cyl,
      color: 0x6b4a30,
      offset: [-0.5, 1.25, -0.5],
      scale: [0.95, 2.5, 0.95],
    },
    {
      geometry: G.cone,
      color: 0x5a3f2a,
      offset: [-0.5, 2.8, -0.5],
      scale: [0.95, 0.6, 0.95],
    },
    {
      geometry: G.cyl,
      color: 0x6b4a30,
      offset: [0.5, 1.4, -0.5],
      scale: [0.95, 2.8, 0.95],
    },
    {
      geometry: G.cone,
      color: 0x5a3f2a,
      offset: [0.5, 3.0999999999999996, -0.5],
      scale: [0.95, 0.6, 0.95],
    },
    {
      geometry: G.cyl,
      color: 0x6b4a30,
      offset: [-0.5, 1.35, 0.5],
      scale: [0.95, 2.7, 0.95],
    },
    {
      geometry: G.cone,
      color: 0x5a3f2a,
      offset: [-0.5, 3.0, 0.5],
      scale: [0.95, 0.6, 0.95],
    },
    {
      geometry: G.cyl,
      color: 0x6b4a30,
      offset: [0.5, 1.2, 0.5],
      scale: [0.95, 2.4, 0.95],
    },
    {
      geometry: G.cone,
      color: 0x5a3f2a,
      offset: [0.5, 2.6999999999999997, 0.5],
      scale: [0.95, 0.6, 0.95],
    },
  ],
  t: [
    {
      geometry: G.cone,
      color: 0x6a4a2a,
      offset: [0, 0.9, 0],
      scale: [2, 1.8, 2],
    },
  ],
  f: [
    {
      geometry: G.octa,
      color: 0xff7a2a,
      offset: [0, 0.3, 0],
      scale: [0.5, 0.6, 0.5],
      emissive: 0xff4a00,
    },
  ],
};

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function TileInstances({
  spec,
  cells,
}: {
  spec: InstanceSpec;
  cells: [number, number][];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    cells.forEach(([x, z], i) => {
      const r = spec.jitter ? hash(x, z) : 0;
      e.set(0, r * Math.PI * 2, 0);
      q.setFromEuler(e);
      const k = spec.jitter ? 0.8 + r * 0.45 : 1;
      m.compose(
        new THREE.Vector3(
          x * TILE + spec.offset[0] + (spec.jitter ? (r - 0.5) * 0.6 : 0),
          spec.offset[1] * k,
          z * TILE + spec.offset[2],
        ),
        q,
        new THREE.Vector3(
          spec.scale[0] * k,
          spec.scale[1] * k,
          spec.scale[2] * k,
        ),
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells, spec]);
  return (
    <instancedMesh ref={ref} args={[spec.geometry, undefined, cells.length]}>
      <meshLambertMaterial
        color={spec.color}
        flatShading
        emissive={spec.emissive ?? 0x000000}
        emissiveIntensity={spec.emissive ? 1 : 0}
      />
    </instancedMesh>
  );
}

/** Building tiles drawn as one building per connected block. */
const BUILDINGS = new Set(["h", "c"]);
/** Landmark tiles drawn one per tile (bell tower, stalls). */
const SINGLES: Record<string, ComponentType> = {
  b: BellTower,
  m: Stall,
};

/** Connected blocks of one building tile, as tile bounding boxes. */
function buildingBlocks(map: readonly string[]) {
  const seen = new Set<string>();
  const blocks: {
    ch: string;
    x0: number;
    z0: number;
    x1: number;
    z1: number;
  }[] = [];
  map.forEach((row, z) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!;
      if (!BUILDINGS.has(ch) || seen.has(`${x},${z}`)) continue;
      const block = { ch, x0: x, z0: z, x1: x, z1: z };
      const stack: [number, number][] = [[x, z]];
      seen.add(`${x},${z}`);
      while (stack.length > 0) {
        const [cx, cz] = stack.pop()!;
        block.x0 = Math.min(block.x0, cx);
        block.x1 = Math.max(block.x1, cx);
        block.z0 = Math.min(block.z0, cz);
        block.z1 = Math.max(block.z1, cz);
        for (const [nx, nz] of [
          [cx + 1, cz],
          [cx - 1, cz],
          [cx, cz + 1],
          [cx, cz - 1],
        ] as const) {
          if (map[nz]?.[nx] !== ch || seen.has(`${nx},${nz}`)) continue;
          seen.add(`${nx},${nz}`);
          stack.push([nx, nz]);
        }
      }
      blocks.push(block);
    }
  });
  return blocks;
}

function Mat({ color, emissive }: { color: number; emissive?: number }) {
  return (
    <meshLambertMaterial
      color={color}
      flatShading
      side={THREE.DoubleSide}
      emissive={emissive ?? 0x000000}
      emissiveIntensity={emissive ? 1 : 0}
    />
  );
}

/** A whitewashed khata with a thatched gable roof and a door. */
function House({ w, d }: { w: number; d: number }) {
  const alongX = w >= d;
  return (
    <group>
      <mesh
        geometry={G.box}
        position={[0, 0.8, 0]}
        scale={[w - 0.3, 1.6, d - 0.3]}
      >
        <Mat color={0xd8d0bc} />
      </mesh>
      <mesh
        geometry={G.gable}
        position={[0, 1.6, 0]}
        rotation={[0, alongX ? 0 : Math.PI / 2, 0]}
        scale={alongX ? [w + 0.2, 1.3, d + 0.4] : [d + 0.2, 1.3, w + 0.4]}
      >
        <Mat color={0x8a7440} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, 0.5, d / 2 - 0.12]}
        scale={[0.6, 1, 0.08]}
      >
        <Mat color={0x4a3220} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[w / 4, 1, d / 2 - 0.12]}
        scale={[0.45, 0.4, 0.08]}
      >
        <Mat color={0x2a3a4a} emissive={0x1a1200} />
      </mesh>
    </group>
  );
}

const GOLD = 0xd9b04a;
const GOLD_GLOW = 0x3a2600;
const SOPHIA_WHITE = 0xf2eee2;
const SOPHIA_GREEN = 0x4f8a72;

/** An onion dome on a drum, with a cross: gold or the cathedral's green. */
function Dome({ at, size, gold }: { at: Vec3; size: number; gold: boolean }) {
  const color = gold ? GOLD : SOPHIA_GREEN;
  return (
    <group position={at} scale={size}>
      <mesh geometry={G.cyl} position={[0, 0.5, 0]} scale={[0.9, 1, 0.9]}>
        <Mat color={SOPHIA_WHITE} />
      </mesh>
      <mesh
        geometry={G.sphere}
        position={[0, 1.25, 0]}
        scale={[1.05, 1.1, 1.05]}
      >
        <Mat color={color} emissive={gold ? GOLD_GLOW : undefined} />
      </mesh>
      <mesh geometry={G.cone} position={[0, 1.95, 0]} scale={[0.35, 0.5, 0.35]}>
        <Mat color={color} emissive={gold ? GOLD_GLOW : undefined} />
      </mesh>
      <mesh geometry={G.box} position={[0, 2.45, 0]} scale={[0.06, 0.55, 0.06]}>
        <Mat color={GOLD} emissive={GOLD_GLOW} />
      </mesh>
      <mesh geometry={G.box} position={[0, 2.5, 0]} scale={[0.3, 0.06, 0.06]}>
        <Mat color={GOLD} emissive={GOLD_GLOW} />
      </mesh>
    </group>
  );
}

/**
 * St. Sophia's Cathedral: a white stepped body under green roofs, a tall
 * golden central dome, four golden domes round it and eight green cupolas
 * on the outer corners and sides (thirteen in all, as in Kyiv).
 */
function Church({ w, d }: { w: number; d: number }) {
  const outer: Vec3[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      outer.push([sx * (w / 2 - 0.9), 2.6, sz * (d / 2 - 0.9)]);
      outer.push([sx * (w / 2 - 0.9), 2.6, 0]);
    }
  // Two of the eight sit front and back on the middle line.
  outer.splice(1, 1, [0, 2.6, -(d / 2 - 0.9)]);
  outer.splice(3, 1, [0, 2.6, d / 2 - 0.9]);
  return (
    <group>
      {/* Lower galleries, then the raised core. */}
      <mesh
        geometry={G.box}
        position={[0, 1.3, 0]}
        scale={[w - 0.3, 2.6, d - 0.3]}
      >
        <Mat color={SOPHIA_WHITE} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, 2.68, 0]}
        scale={[w - 0.1, 0.16, d - 0.1]}
      >
        <Mat color={SOPHIA_GREEN} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, 3.6, 0]}
        scale={[w * 0.55, 1.9, d * 0.55]}
      >
        <Mat color={SOPHIA_WHITE} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, 4.6, 0]}
        scale={[w * 0.6, 0.16, d * 0.6]}
      >
        <Mat color={SOPHIA_GREEN} />
      </mesh>
      {/* Pilasters and windows on the front. */}
      {[-0.36, -0.12, 0.12, 0.36].map((k) => (
        <mesh
          key={k}
          geometry={G.box}
          position={[k * w, 1.4, d / 2 - 0.12]}
          scale={[0.5, 1.1, 0.06]}
        >
          <Mat color={0x2e3a44} emissive={0x0a0806} />
        </mesh>
      ))}
      <mesh
        geometry={G.box}
        position={[0, 0.95, d / 2 - 0.1]}
        scale={[1.1, 1.9, 0.1]}
      >
        <Mat color={0x4a3220} />
      </mesh>
      <Dome at={[0, 4.6, 0]} size={1.6} gold />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Dome
          key={`${sx}${sz}`}
          at={[sx! * w * 0.2, 4.6, sz! * d * 0.2]}
          size={0.85}
          gold
        />
      ))}
      {outer.map((p, i) => (
        <Dome key={i} at={p} size={0.6} gold={false} />
      ))}
    </group>
  );
}

/** St. Sophia's bell tower: white and green tiers under a golden dome. */
function BellTower() {
  const tiers: [number, number, number][] = [
    // width, height, colour
    [1.9, 3, SOPHIA_WHITE],
    [1.6, 2.4, SOPHIA_GREEN],
    [1.35, 2, SOPHIA_WHITE],
    [1.1, 1.6, SOPHIA_GREEN],
  ];
  let y = 0;
  return (
    <group>
      {tiers.map(([wd, h, c], i) => {
        const at = y + h / 2;
        y += h;
        return (
          <group key={i}>
            <mesh geometry={G.box} position={[0, at, 0]} scale={[wd, h, wd]}>
              <Mat color={c} />
            </mesh>
            {/* An arched opening on each face of the upper tiers. */}
            {i > 0 ? (
              <mesh
                geometry={G.box}
                position={[0, at, wd / 2 + 0.01]}
                scale={[wd * 0.4, h * 0.55, 0.04]}
              >
                <Mat color={0x2a2620} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      <Dome at={[0, y, 0]} size={0.9} gold />
    </group>
  );
}

/**
 * The Golden Gates, after the reconstructed gate in Kyiv: a brick tower
 * with the road through its arch, crenellated steps up to the gate church
 * (three arched gables and a golden dome), and earth ramparts running off
 * both sides, grassed on the slope, faced with stepped log walls and topped
 * by timber blockhouses. `w` runs along the road, `d` across it.
 */
function GoldenGate({ w, d }: { w: number; d: number }) {
  const BRICK = 0xc66a48;
  const BRICK_DARK = 0xa8553a;
  const WOOD = 0x8a5a32;
  const WOOD_DARK = 0x6b4430;
  const GRASS = 0x5a7a2e;
  /** The tower's size: along the road, across it, and to its parapet. */
  // The tower stands well proud of the ramparts on both faces, as in Kyiv.
  const tx = w + 2.4;
  const tz = 4.4;
  const th = 6;
  const passage = 2.2;
  /** The rampart runs from the tower's side to the end of the block. */
  const inner = tz / 2;
  const outer = d / 2;
  const run = outer - inner;
  const rise = 4.7;
  const slope = Math.atan2(rise, run);
  /** The ramparts' thickness along the road: the town wall's. */
  const ramp = w * 0.6;
  const merlons = (len: number, n: number) =>
    Array.from({ length: n }, (_, i) => -len / 2 + (len * (i + 0.5)) / n);
  return (
    <group>
      {/* The tower, its parapet steps and merlons. */}
      {/* Two piers either side of the passage, the vault over it. */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={G.box}
          position={[0, th / 2, (s * (tz / 2 + passage / 2)) / 2]}
          scale={[tx, th, tz / 2 - passage / 2]}
        >
          <Mat color={BRICK} />
        </mesh>
      ))}
      <mesh
        geometry={G.box}
        position={[0, (th + 3.2) / 2, 0]}
        scale={[tx, th - 3.2, passage]}
      >
        <Mat color={BRICK} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, th + 0.7, 0]}
        scale={[tx * 0.8, 1.4, tz * 0.78]}
      >
        <Mat color={BRICK} />
      </mesh>
      {merlons(tz, 5).map((z) =>
        [-1, 1].map((s) => (
          <mesh
            key={`x${z}${s}`}
            geometry={G.box}
            position={[(s * tx) / 2 - s * 0.2, th + 0.25, z]}
            scale={[0.4, 0.5, 0.45]}
          >
            <Mat color={BRICK} />
          </mesh>
        )),
      )}
      {/* The arch through the tower, on both faces along the road. */}
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * (tx / 2 + 0.02), 0, 0]}
          rotation={[0, (s * Math.PI) / 2, 0]}
        >
          <mesh position={[0, 3.2, 0]} scale={[1.3, 1.3, 1]}>
            <circleGeometry args={[passage / 2 + 0.25, 18, 0, Math.PI]} />
            <meshBasicMaterial color={BRICK_DARK} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 3.2, 0.01]}>
            <circleGeometry args={[passage / 2, 16, 0, Math.PI]} />
            <meshBasicMaterial color={0x2a2420} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* The gate church: a brick block, three arched gables a side. */}
      <group position={[0, th + 1.4, 0]}>
        <mesh geometry={G.box} position={[0, 0.9, 0]} scale={[2.6, 1.8, 2.6]}>
          <Mat color={BRICK} />
        </mesh>
        {[-1, 1].flatMap((s) =>
          [-0.85, 0, 0.85].map((k) => (
            <group key={`${s}${k}`}>
              <mesh
                geometry={G.cyl}
                position={[s * 1.05, 1.8, k]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[0.86, 0.55, 0.86]}
              >
                <Mat color={BRICK} />
              </mesh>
              <mesh
                geometry={G.cyl}
                position={[k, 1.8, s * 1.05]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[0.86, 0.55, 0.86]}
              >
                <Mat color={BRICK} />
              </mesh>
            </group>
          )),
        )}
        <Dome at={[0, 2.1, 0]} size={0.85} gold />
      </group>
      {/* The ramparts, one each side of the tower. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* The grassed slope. */}
          <mesh
            geometry={G.box}
            position={[0, rise / 2 + 0.2, s * (inner + run / 2)]}
            rotation={[s * slope, 0, 0]}
            scale={[ramp, 0.3, Math.hypot(run, rise)]}
          >
            <Mat color={GRASS} />
          </mesh>
          {/* Stepped log walls on both ends, closing the earth. */}
          {[-1, 1].map((e) =>
            [0, 1, 2, 3].map((k) => {
              const step = run / 4;
              const h = rise + 0.4 - k * (rise / 4);
              return (
                <mesh
                  key={`${e}${k}`}
                  geometry={G.box}
                  position={[
                    e * (ramp / 2 - 0.25),
                    h / 2,
                    s * (inner + step * (k + 0.5)),
                  ]}
                  scale={[0.5, h, step + 0.02]}
                >
                  <Mat color={k % 2 ? WOOD : WOOD_DARK} />
                </mesh>
              );
            }),
          )}
          {/* A timber blockhouse on top, its upper storey overhanging. */}
          <group position={[0, rise, s * (inner + 1)]}>
            <mesh
              geometry={G.box}
              position={[0, 0.8, 0]}
              scale={[ramp - 0.2, 1.6, 1.8]}
            >
              <Mat color={WOOD} />
            </mesh>
            <mesh
              geometry={G.box}
              position={[0, 2.1, s * 0.15]}
              scale={[ramp + 0.2, 1, 2.2]}
            >
              <Mat color={WOOD_DARK} />
            </mesh>
            {/* Loopholes. */}
            {[-ramp / 4, 0, ramp / 4].map((x) => (
              <mesh
                key={x}
                geometry={G.box}
                position={[x, 2.1, s * 1.27]}
                scale={[0.45, 0.14, 0.04]}
              >
                <Mat color={0x1a120c} />
              </mesh>
            ))}
            <mesh
              geometry={G.gable}
              position={[0, 2.6, s * 0.15]}
              scale={[ramp + 0.5, 0.8, 2.6]}
            >
              <Mat color={0x4a3424} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/** A market stall: posts, a counter of goods, an embroidered awning. */
function Stall() {
  return (
    <group>
      {[
        [-0.8, -0.7],
        [0.8, -0.7],
        [-0.8, 0.7],
        [0.8, 0.7],
      ].map(([x, z]) => (
        <mesh
          key={`${x}${z}`}
          geometry={G.box}
          position={[x!, 1.1, z!]}
          scale={[0.12, 2.2, 0.12]}
        >
          <Mat color={0x5a3f2a} />
        </mesh>
      ))}
      <mesh geometry={G.box} position={[0, 0.5, 0.3]} scale={[1.7, 1, 0.8]}>
        <Mat color={0x7a5636} />
      </mesh>
      {[0x8a2a20, 0x3a5a8a, 0xc9a24a, 0x6a4a2a].map((c, i) => (
        <mesh
          key={c}
          geometry={G.sphere}
          position={[-0.6 + i * 0.4, 1.12, 0.3]}
          scale={[0.3, 0.26, 0.3]}
        >
          <Mat color={c} />
        </mesh>
      ))}
      {/* Linen awning with red embroidered bands. */}
      <mesh
        geometry={G.box}
        position={[0, 2.25, 0]}
        rotation={[0.18, 0, 0]}
        scale={[2, 0.06, 1.8]}
      >
        <Mat color={0xf2ead6} />
      </mesh>
      {[-0.6, 0, 0.6].map((x) => (
        <mesh
          key={x}
          geometry={G.box}
          position={[x, 2.26, 0]}
          rotation={[0.18, 0, 0]}
          scale={[0.16, 0.07, 1.82]}
        >
          <Mat color={0xb8302a} />
        </mesh>
      ))}
    </group>
  );
}

function Buildings({ map }: { map: readonly string[] }) {
  const blocks = useMemo(() => buildingBlocks(map), [map]);
  const { singles, gate } = useMemo(() => {
    const singles: { ch: string; x: number; z: number }[] = [];
    // The gate's two halves, either side of the road, are one landmark.
    const gateTiles: [number, number][] = [];
    map.forEach((row, z) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!;
        if (SINGLES[ch]) singles.push({ ch, x, z });
        if (ch === "g") gateTiles.push([x, z]);
      }
    });
    const xs = gateTiles.map(([x]) => x);
    const zs = gateTiles.map(([, z]) => z);
    const gate =
      gateTiles.length > 0
        ? {
            x0: Math.min(...xs),
            x1: Math.max(...xs),
            z0: Math.min(...zs),
            z1: Math.max(...zs),
          }
        : null;
    return { singles, gate };
  }, [map]);
  return (
    <>
      {blocks.map((b) => {
        const w = (b.x1 - b.x0 + 1) * TILE;
        const d = (b.z1 - b.z0 + 1) * TILE;
        return (
          <group
            key={`${b.ch}${b.x0},${b.z0}`}
            position={[
              ((b.x0 + b.x1) / 2) * TILE,
              0,
              ((b.z0 + b.z1) / 2) * TILE,
            ]}
          >
            {b.ch === "c" ? <Church w={w} d={d} /> : <House w={w} d={d} />}
          </group>
        );
      })}
      {singles.map(({ ch, x, z }) => {
        const Single = SINGLES[ch]!;
        return (
          <group key={`${ch}${x},${z}`} position={[x * TILE, 0, z * TILE]}>
            <Single />
          </group>
        );
      })}
      {gate ? (
        <group
          position={[
            ((gate.x0 + gate.x1) / 2) * TILE,
            0,
            ((gate.z0 + gate.z1) / 2) * TILE,
          ]}
        >
          <GoldenGate
            w={(gate.x1 - gate.x0 + 1) * TILE}
            d={(gate.z1 - gate.z0 + 1) * TILE}
          />
        </group>
      ) : null}
    </>
  );
}

export function Tiles({
  map,
  town,
}: {
  map: readonly string[];
  /** Towns draw their wall tiles as timber fortress walls instead. */
  town?: boolean;
}) {
  const byKind = useMemo(() => {
    const out = new Map<string, [number, number][]>();
    map.forEach((row, z) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!;
        if (!TILE_ART[ch] || (town && ch === "W")) continue;
        out.set(ch, [...(out.get(ch) ?? []), [x, z]]);
      }
    });
    return out;
  }, [map, town]);
  return (
    <>
      {[...byKind.entries()].flatMap(([ch, cells]) =>
        (TILE_ART[ch] ?? []).map((spec, i) => (
          <TileInstances key={`${ch}${i}`} spec={spec} cells={cells} />
        )),
      )}
      <Buildings map={map} />
    </>
  );
}
