import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ComponentType } from "react";
import * as THREE from "three";

import type { Look } from "../sim/types";
import { HAIR_COLORS, SKIN_TONES } from "../ui/palette";

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
}: {
  geometry: THREE.BufferGeometry;
  color: THREE.ColorRepresentation;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  emissive?: THREE.ColorRepresentation;
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
        emissiveIntensity={emissive ? 1.2 : 0}
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
  belt: 0x1f1712,
  buckle: 0xc9a24a,
  sash: 0x7a1712,
  boot: 0x231a14,
  sole: 0x120d0a,
  bootWoman: 0x8c1d1d,
  steel: 0xd8dbe0,
  wood: 0x5b3a1e,
  brass: 0xc9a24a,
};

/** Where the hand sits in the arm's frame (the shoulder is the origin). */
const HAND: Vec3 = [0, -0.54, 0.02];

/**
 * How each weapon is held in the right hand: the weapon arm's rest pose,
 * and the direction (in the figure's frame) the weapon's own +y points.
 * Figures face +z, so their right side is -x. Weapons are drawn from the
 * grip outwards along +y.
 */
const GRIPS: Record<string, { arm: Vec3; aim: Vec3 }> = {
  sabre: { arm: [-0.3, 0, -0.16], aim: [-0.35, -0.35, 0.87] },
  staff: { arm: [-0.45, 0, -0.12], aim: [0, 1, 0.06] },
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
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.25, 0]}
            scale={[0.07, 1.7, 0.07]}
          />
          <Part
            geometry={G.octa}
            color={0xff8a2a}
            emissive={0xff6a00}
            position={[0, 1.18, 0]}
            scale={[0.18, 0.18, 0.18]}
          />
        </group>
      );
    case "spear":
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.3, 0]}
            scale={[0.06, 2.2, 0.06]}
          />
          <Part
            geometry={G.cone}
            color={0xb8b8c0}
            position={[0, 1.55, 0]}
            scale={[0.12, 0.3, 0.12]}
          />
        </group>
      );
    case "bulava":
      return (
        <group>
          <Part
            geometry={G.cyl}
            color={HERO.wood}
            position={[0, 0.2, 0]}
            scale={[0.06, 0.62, 0.06]}
          />
          <Part
            geometry={G.dodeca}
            color={HERO.brass}
            position={[0, 0.56, 0]}
            scale={[0.22, 0.22, 0.22]}
          />
        </group>
      );
    case "pistol":
      return (
        <group>
          <Part
            geometry={G.box}
            color={0x3a3a40}
            position={[0, 0.2, 0.03]}
            scale={[0.05, 0.4, 0.05]}
          />
          <Part
            geometry={G.box}
            color={0x3a2a1a}
            position={[0, 0, 0]}
            scale={[0.07, 0.16, 0.1]}
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

/** A loose-sleeved shirt arm from the shoulder down, with a stitched cuff. */
function Arm({
  skin,
  sleeve,
}: {
  skin: THREE.ColorRepresentation;
  sleeve: number;
}) {
  return (
    <>
      <Part
        geometry={G.sphere}
        color={sleeve}
        position={[0, -0.03, 0]}
        scale={[0.21, 0.2, 0.21]}
      />
      <Part
        geometry={G.box}
        color={sleeve}
        position={[0, -0.17, 0]}
        scale={[0.16, 0.28, 0.17]}
      />
      <Part
        geometry={G.box}
        color={HERO.stitch}
        position={[0, -0.13, 0]}
        scale={[0.168, 0.035, 0.178]}
      />
      <Part
        geometry={G.sphere}
        color={sleeve}
        position={[0, -0.37, 0.01]}
        scale={[0.19, 0.24, 0.19]}
      />
      <Part
        geometry={G.box}
        color={HERO.stitch}
        position={[0, -0.47, 0.015]}
        scale={[0.13, 0.04, 0.13]}
      />
      <Part
        geometry={G.box}
        color={skin}
        position={HAND}
        scale={[0.1, 0.12, 0.11]}
      />
    </>
  );
}

/** A boot from the hip down; under sharovary for him, a skirt for her. */
function Leg({
  woman,
  cloth,
  boot,
}: {
  woman: boolean;
  cloth: number;
  boot: number;
}) {
  return (
    <>
      {woman ? null : (
        // The wide sharovary leg, ballooning over the boot top.
        <Part
          geometry={G.sphere}
          color={cloth}
          position={[0, -0.24, 0]}
          scale={[0.3, 0.46, 0.32]}
        />
      )}
      <Part
        geometry={G.cyl}
        color={boot}
        position={[0, -0.46, 0]}
        scale={[0.15, 0.34, 0.16]}
      />
      <Part
        geometry={G.box}
        color={boot}
        position={[0, -0.6, 0.05]}
        scale={[0.15, 0.08, 0.27]}
      />
      <Part
        geometry={G.box}
        color={HERO.sole}
        position={[0, -0.645, -0.05]}
        scale={[0.13, 0.05, 0.08]}
      />
      <Part
        geometry={G.box}
        color={HERO.sole}
        position={[0, -0.648, 0.1]}
        scale={[0.14, 0.03, 0.16]}
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
      // A gold circlet with points over the hair, a braid down the back.
      return (
        <>
          <Part
            geometry={G.sphere}
            color={hair}
            position={[0, 1.58, -0.035]}
            scale={[0.36, 0.2, 0.36]}
          />
          <Part
            geometry={G.cyl}
            color={color}
            position={[0, 1.62, -0.01]}
            scale={[0.37, 0.07, 0.37]}
          />
          {[0, 1, 2, 3, 4].map((k) => {
            const a = ((k - 2) * Math.PI) / 5;
            return (
              <Part
                key={k}
                geometry={G.cone4}
                color={color}
                position={[Math.sin(a) * 0.17, 1.69, Math.cos(a) * 0.17]}
                scale={[0.06, 0.1, 0.06]}
              />
            );
          })}
          <Part
            geometry={G.sphere}
            color={trim}
            position={[0, 1.64, 0.185]}
            scale={[0.05, 0.05, 0.03]}
          />
          {woman ? (
            <Part
              geometry={G.box}
              color={hair}
              position={[0, 1.2, -0.2]}
              scale={[0.1, 0.6, 0.08]}
            />
          ) : null}
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
  const wrap = coat !== undefined ? 1.14 : 1;
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
        {woman ? (
          <>
            <Part
              geometry={G.skirt}
              color={cloth}
              position={[0, 0.56, 0]}
              scale={[0.9, 0.5, 0.75]}
            />
            <Part
              geometry={G.cyl}
              color={HERO.stitch}
              position={[0, 0.33, 0]}
              scale={[0.92, 0.05, 0.77]}
            />
          </>
        ) : (
          <Part
            geometry={G.sphere}
            color={cloth}
            position={[0, 0.67, 0]}
            scale={[0.54, 0.3, 0.38]}
          />
        )}
        {/* A scabbard at the left hip, the sabre out of it */}
        {kind === "sabre" ? (
          <group position={[0.27, 0.78, 0.06]} rotation={[0.93, 0, 0.12]}>
            <Part
              geometry={G.box}
              color={HERO.belt}
              position={[0, -0.36, 0]}
              rotation={[0.08, 0, 0]}
              scale={[0.05, 0.72, 0.09]}
            />
            <Part
              geometry={G.box}
              color={HERO.brass}
              position={[0, -0.04, 0]}
              scale={[0.06, 0.05, 0.1]}
            />
            <Part
              geometry={G.box}
              color={HERO.brass}
              position={[0, -0.7, -0.03]}
              scale={[0.06, 0.07, 0.1]}
            />
          </group>
        ) : null}
        {/* The upper body twists and leans from the waist in a move */}
        <group ref={upper} position={[0, 0.78, 0]}>
          <group position={[0, -0.78, 0]}>
            {/* A wide kushak sash under the belt, its ends at the left hip */}
            <Part
              geometry={G.box}
              color={sash}
              position={[0, 0.8, 0]}
              scale={[0.48 * wrap, 0.15, 0.33 * wrap]}
            />
            <Part
              geometry={G.box}
              color={HERO.belt}
              position={[0, 0.79, 0]}
              scale={[0.49 * wrap, 0.05, 0.34 * wrap]}
            />
            <Part
              geometry={G.box}
              color={HERO.buckle}
              position={[0, 0.79, 0.172 * wrap]}
              scale={[0.08, 0.07, 0.02]}
            />
            <Part
              geometry={G.box}
              color={sash}
              position={[0.16, 0.64, 0.155 * wrap]}
              rotation={[0, 0, -0.12]}
              scale={[0.08, 0.26, 0.03]}
            />
            <Part
              geometry={G.box}
              color={sash}
              position={[0.215, 0.66, 0.135 * wrap]}
              rotation={[0, 0.3, -0.25]}
              scale={[0.06, 0.22, 0.03]}
            />
            {/* Shirt: bloused over the sash, a broad chest narrowing to the
            waist, the collar slit with its embroidery */}
            <Part
              geometry={G.sphere}
              color={shirt}
              position={[0, 0.92, 0]}
              scale={[0.5, 0.16, 0.34]}
            />
            <Part
              geometry={G.taper}
              color={shirt}
              position={[0, 1.07, 0]}
              scale={[0.64, 0.4, 0.37]}
            />
            <Part
              geometry={G.box}
              color={skin}
              position={[0, 1.18, 0.157]}
              scale={[0.07, 0.13, 0.02]}
            />
            <Part
              geometry={G.box}
              color={HERO.stitch}
              position={[-0.055, 1.15, 0.161]}
              scale={[0.03, 0.16, 0.02]}
            />
            <Part
              geometry={G.box}
              color={HERO.stitch}
              position={[0.055, 1.15, 0.161]}
              scale={[0.03, 0.16, 0.02]}
            />
            {coat !== undefined ? (
              <>
                {/* The coat over the shirt, brass buttons down the front */}
                <Part
                  geometry={G.taper}
                  color={coat}
                  position={[0, 1.065, 0]}
                  scale={[0.68, 0.42, 0.41]}
                />
                {woman ? null : (
                  <Part
                    geometry={G.skirt}
                    color={coat}
                    position={[0, 0.58, 0]}
                    scale={[0.84, 0.48, 0.64]}
                  />
                )}
                {[0.96, 1.06, 1.16].map((y) => (
                  <Part
                    key={y}
                    geometry={G.box}
                    color={HERO.brass}
                    position={[0, y, 0.165 + (y - 0.96) * 0.06]}
                    scale={[0.04, 0.04, 0.02]}
                  />
                ))}
              </>
            ) : null}
            {outfit.stout ? (
              <Part
                geometry={G.sphere}
                color={coat ?? shirt}
                position={[0, 0.96, 0.08]}
                scale={[0.46, 0.36, 0.38]}
              />
            ) : null}
            {outfit.earring ? (
              <Part
                geometry={G.sphere}
                color={HERO.brass}
                position={[-0.18, 1.39, 0]}
                scale={[0.04, 0.05, 0.04]}
              />
            ) : null}
            {/* Neck and head */}
            <Part
              geometry={G.cyl}
              color={skin}
              position={[0, 1.28, 0]}
              scale={[0.14, 0.12, 0.14]}
            />
            <Part
              geometry={G.sphere}
              color={skin}
              position={[0, 1.46, 0]}
              scale={[0.34, 0.37, 0.33]}
            />
            <Part
              geometry={G.box}
              color={skin}
              position={[-0.17, 1.45, -0.01]}
              scale={[0.04, 0.08, 0.06]}
            />
            <Part
              geometry={G.box}
              color={skin}
              position={[0.17, 1.45, -0.01]}
              scale={[0.04, 0.08, 0.06]}
            />
            <Part
              geometry={G.box}
              color={skin}
              position={[0, 1.45, 0.17]}
              scale={[0.05, 0.08, 0.05]}
            />
            {/* Eyes and brows */}
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.068, 0, 0]}>
                <Part
                  geometry={G.box}
                  color={0x1a1210}
                  position={[0, 1.49, 0.153]}
                  scale={[0.045, 0.03, 0.02]}
                />
                <Part
                  geometry={G.box}
                  color={hair}
                  position={[0, 1.528, 0.15]}
                  rotation={[0, 0, side * -0.18]}
                  scale={[0.08, 0.026, 0.03]}
                />
              </group>
            ))}
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
                  position={[0, 1.58, -0.035]}
                  scale={[0.36, 0.2, 0.36]}
                />
                <Part
                  geometry={G.cyl}
                  color={0xd23a3a}
                  position={[0, 1.6, 0]}
                  scale={[0.38, 0.07, 0.38]}
                />
                {[-0.12, 0, 0.12].map((x) => (
                  <Part
                    key={x}
                    geometry={G.sphere}
                    color={x === 0 ? 0xf2c94c : 0xe8e0d0}
                    position={[x, 1.64, 0.13]}
                    scale={[0.08, 0.08, 0.08]}
                  />
                ))}
                <Part
                  geometry={G.box}
                  color={hair}
                  position={[0, 1.2, -0.2]}
                  scale={[0.1, 0.5 + look.hair * 0.1, 0.08]}
                />
              </>
            ) : look.hair === 0 ? (
              <>
                {/* Oseledets: a tuft on the crown of the shaved head and its
                long lock falling over to one side */}
                <Part
                  geometry={G.sphere}
                  color={hair}
                  position={[0, 1.645, -0.02]}
                  scale={[0.11, 0.09, 0.11]}
                />
                <Part
                  geometry={G.box}
                  color={hair}
                  position={[-0.07, 1.7, -0.03]}
                  rotation={[0, 0, 0.9]}
                  scale={[0.06, 0.16, 0.06]}
                />
                <Part
                  geometry={G.box}
                  color={hair}
                  position={[-0.17, 1.6, -0.05]}
                  rotation={[0.2, 0, -0.3]}
                  scale={[0.05, 0.2, 0.05]}
                />
              </>
            ) : (
              <>
                <Part
                  geometry={G.sphere}
                  color={hair}
                  position={[0, 1.585, -0.035]}
                  scale={[0.37, 0.2, 0.37]}
                />
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
            {look.mustache && !woman ? (
              <>
                {/* A long moustache drooping past the chin */}
                {[-1, 1].map((side) => (
                  <group key={side}>
                    <Part
                      geometry={G.box}
                      color={hair}
                      position={[side * 0.065, 1.4, 0.168]}
                      rotation={[0, 0, side * -0.4]}
                      scale={[0.12, 0.04, 0.05]}
                    />
                    <Part
                      geometry={G.box}
                      color={hair}
                      position={[side * 0.125, 1.33, 0.14]}
                      rotation={[0.15, 0, side * 0.12]}
                      scale={[0.035, 0.13, 0.035]}
                    />
                  </group>
                ))}
              </>
            ) : null}
            {/* Arms: the left (+x) swings; the right (-x) holds the weapon */}
            <group position={[0.32, 1.2, 0]} rotation={[0, 0, 0.12]}>
              <group ref={freeAcross}>
                <group ref={freeArm}>
                  <Arm skin={skin} sleeve={sleeve} />
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
            <group position={[-0.32, 1.2, 0]} rotation={grip.arm}>
              <group ref={weaponArm}>
                <Arm skin={skin} sleeve={sleeve} />
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
      <group ref={left} position={[-0.13, 0.66, 0]}>
        <Leg woman={woman} cloth={cloth} boot={boot} />
      </group>
      <group ref={right} position={[0.13, 0.66, 0]}>
        <Leg woman={woman} cloth={cloth} boot={boot} />
      </group>
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
    outfit: { cloth: 0x2c3f86, coat: 0x8c1d1d, sash: 0xb8892e },
  },
  // Olha: a purple gown, a gold circlet and a staff of fire.
  olha: {
    look: { body: "kozachka", face: 0, hair: 0, hairColor: 1, mustache: false },
    weapon: "staff",
    outfit: {
      cloth: 0x4a1640,
      coat: 0x6a1f5a,
      sash: 0xc9a24a,
      boot: 0x4a1640,
      hat: "crown",
      hatColor: 0xd8b04a,
      hatTrim: 0xb3261e,
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
