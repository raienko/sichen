import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getEnemy } from "../data";
import type { Combatant } from "../sim/battle";
import type { Look } from "../sim/types";

import { HeroFigure, MonsterFigure } from "./art-kit";
import { ANTIALIAS, GL_SCALE, GLFrame, paceFrames } from "./native-gl";

/**
 * The battle in 2.5D, Taern style: the world's own figures on two rows of
 * three a side, facing each other, seen from the front and a little above.
 * The canvas is transparent so the painted backdrop shows behind it. Labels,
 * bars and taps live in a React Native overlay placed by `onProject`.
 */

/** Screen points of a unit, in the canvas' own pixels. */
export type UnitSpot = { x: number; head: number; feet: number };

export type HeroLookProps = {
  look: Look;
  classId: string;
  weapon?: string;
  helmet?: boolean;
};

/** Where a unit stands: side 0 on the left, front rows facing each other. */
export function spotOf(actor: Combatant): THREE.Vector3 {
  const dir = actor.side === 0 ? -1 : 1;
  const x = dir * (actor.row === 0 ? 2 : 4.1);
  // Slot 1 in the middle, 0 behind it (up the screen), 2 in front.
  const z = (actor.slot - 1) * 2.1 + (actor.row === 0 ? 0 : 0.4);
  return new THREE.Vector3(x, 0, z);
}

function heightOf(actor: Combatant): number {
  // Likho's figure is already a giant; scaled by BOSS_SCALE it is this tall.
  return actor.boss ? 3.5 : 2.1;
}

type Motion = { acting: boolean; hitAt?: number };

/** The boss figure is modelled huge for the world; it stands smaller here. */
const BOSS_SCALE = 0.8;

function Fighter({
  actor,
  hero,
  motion,
}: {
  actor: Combatant;
  hero: HeroLookProps;
  motion: Motion;
}) {
  const ref = useRef<THREE.Group>(null);
  const home = useMemo(() => spotOf(actor), [actor]);
  const lungeStart = useRef(0);
  const flash = useRef(0);
  const fall = useRef(actor.hp <= 0 ? 1 : 0);
  const speed = useRef(0);
  const dir = actor.side === 0 ? 1 : -1;

  useEffect(() => {
    if (motion.acting) lungeStart.current = performance.now();
  }, [motion.acting]);
  useEffect(() => {
    if (motion.hitAt) flash.current = 1;
  }, [motion.hitAt]);

  useFrame((_, rawDt) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(0.05, rawDt);
    // Lunge: a step toward the other side and back, about a third of a second.
    const t = (performance.now() - lungeStart.current) / 320;
    const lunge = t >= 0 && t < 1 ? Math.sin(t * Math.PI) * 0.9 : 0;
    speed.current = lunge > 0.05 ? 1 : 0;
    // Hit: a shake and a white flash that fade out.
    flash.current = Math.max(0, flash.current - dt * 3.5);
    const shake = flash.current > 0 ? Math.sin(flash.current * 40) * 0.08 : 0;
    // Death: tip over backwards and sink a little.
    const dead = actor.hp <= 0;
    fall.current = dead
      ? Math.min(1, fall.current + dt * 2.5)
      : Math.max(0, fall.current - dt * 4);
    g.position.set(home.x + dir * lunge + shake, -fall.current * 0.25, home.z);
    // Facing the other side, turned a little toward the camera (3/4 view).
    g.rotation.set(
      0,
      dir * (Math.PI / 2 - 0.45),
      (-dir * fall.current * Math.PI) / 2.2,
    );
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as
        THREE.MeshLambertMaterial | undefined;
      if (!m || !("emissive" in m)) return;
      if (m.userData.baseEmissive === undefined)
        m.userData.baseEmissive = m.emissive.getHex();
      if (flash.current > 0) {
        m.emissive.setRGB(flash.current, flash.current, flash.current);
        m.emissiveIntensity = 1;
      } else if (m.emissive.getHex() !== m.userData.baseEmissive) {
        m.emissive.setHex(m.userData.baseEmissive);
      }
    });
  });

  const scale = actor.boss ? BOSS_SCALE : 1;
  return (
    <group ref={ref} position={home} scale={scale}>
      {actor.enemyId ? (
        <MonsterFigure
          kind={getEnemy(actor.enemyId).kind}
          speed={() => speed.current}
        />
      ) : (
        <HeroFigure {...hero} speed={() => speed.current} />
      )}
      {/* A soft shadow so figures stand on the painted ground. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Frames both sides whatever the screen's shape, and reports each unit's
 * screen position whenever the canvas or the line-up changes.
 */
function Rig({
  actors,
  onProject,
}: {
  actors: Combatant[];
  onProject: (spots: Record<string, UnitSpot>) => void;
}) {
  const { camera, size } = useThree();
  const key = actors.map((a) => `${a.id}:${a.side}${a.row}${a.slot}`).join();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    // Far enough that both sides (x ±5.4) fit across the band and both
    // rows plus a head's height (±3.3) fit top to bottom.
    const half = Math.tan(((cam.fov / 2) * Math.PI) / 180);
    const distance = Math.max(10, 5.4 / (half * aspect), 3.3 / half);
    // About 40° down, like Taern's view, so rows and slots separate.
    const dir = new THREE.Vector3(0, 0.85, 1).normalize();
    cam.position.copy(dir.multiplyScalar(distance));
    cam.lookAt(0, 0.7, 0.3);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    const spots: Record<string, UnitSpot> = {};
    const toScreen = (v: THREE.Vector3) => {
      const p = v.clone().project(cam);
      return {
        x: ((p.x + 1) / 2) * size.width * GL_SCALE,
        y: ((1 - p.y) / 2) * size.height * GL_SCALE,
      };
    };
    for (const a of actors) {
      const at = spotOf(a);
      const feet = toScreen(at);
      const head = toScreen(at.clone().setY(heightOf(a)));
      spots[a.id] = { x: feet.x, head: head.y, feet: feet.y };
    }
    onProject(spots);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key covers actors
  }, [camera, size.width, size.height, key, onProject]);
  return null;
}

export default function BattleStage({
  actors,
  hero,
  motion,
  onProject,
}: {
  actors: Combatant[];
  hero: HeroLookProps;
  motion: { acting: string | null; hitAt: Record<string, number> };
  onProject: (spots: Record<string, UnitSpot>) => void;
}) {
  return (
    <GLFrame>
      <Canvas
        camera={{ fov: 30, near: 0.5, far: 80, position: [0, 6, 14] }}
        dpr={[1, 1.75]}
        gl={{ antialias: ANTIALIAS, alpha: true }}
        onCreated={(state) => {
          paceFrames(state);
          state.gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.85} color={0xffe8c8} />
        <hemisphereLight args={[0x9ab0d8, 0x3a3020, 1.6]} />
        <directionalLight
          position={[-6, 10, 8]}
          intensity={1.8}
          color={0xffe0c0}
        />
        {actors.map((a) => (
          <Fighter
            key={a.id}
            actor={a}
            hero={hero}
            motion={{
              acting: motion.acting === a.id,
              hitAt: motion.hitAt[a.id],
            }}
          />
        ))}
        <Rig actors={actors} onProject={onProject} />
      </Canvas>
    </GLFrame>
  );
}
