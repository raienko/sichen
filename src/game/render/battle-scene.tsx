import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { getEnemy } from "../data";
import type { Combatant } from "../sim/battle";
import type { Look, ZoneDef } from "../sim/types";

import { Arena } from "./arena";
import { HeroFigure, MonsterFigure } from "./art-kit";
import { heroOnScreen } from "./nature";
import { ANTIALIAS, GL_SCALE, GLFrame, paceFrames } from "./native-gl";

/**
 * The battle in 3D: the world's own figures on two rows of three a side,
 * facing each other across the screen's depth. The camera stands raised
 * behind the hero's right shoulder, so allies are large in the foreground
 * and foes face them further in. The canvas is transparent so the painted
 * backdrop shows behind it. Labels, bars and taps live in a React Native
 * overlay placed by `onProject`.
 */

/** The part of the canvas the fighters must fit in, in screen points. */
export type Band = { top: number; height: number };

/** Screen points of a unit, in the canvas' own pixels. */
export type UnitSpot = { x: number; head: number; feet: number };

export type HeroLookProps = {
  look: Look;
  classId: string;
  weapon?: string;
  helmet?: boolean;
};

/** Sideways spacing between the three slots of a row. */
const SLOT_WIDTH = 2.4;
/** Depth from the middle of the field to a front row, and between rows. */
const FRONT_DEPTH = 2.4;
const ROW_DEPTH = 2.2;

/**
 * Where a unit stands: allies (side 0) nearer the camera at +z, foes at -z,
 * front rows facing each other across the middle. The back rows sit half a
 * slot sideways, between the front row's units, so no fighter hides another.
 */
export function spotOf(actor: Combatant): THREE.Vector3 {
  const dir = actor.side === 0 ? 1 : -1;
  const back = actor.row === 0 ? 0 : 1;
  const x = (actor.slot - 1) * SLOT_WIDTH + (back * SLOT_WIDTH) / 2;
  const z = dir * (FRONT_DEPTH + back * ROW_DEPTH);
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
  highlight,
}: {
  actor: Combatant;
  hero: HeroLookProps;
  motion: Motion;
  /** Colours the shadow and rings it: the hero, or the selected foe. */
  highlight?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const home = useMemo(() => spotOf(actor), [actor]);
  const lungeStart = useRef(0);
  const flash = useRef(0);
  const fall = useRef(actor.hp <= 0 ? 1 : 0);
  const speed = useRef(0);
  // Allies face -z (away from the camera), foes +z (toward it).
  const dir = actor.side === 0 ? -1 : 1;

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
    g.position.set(home.x + shake, -fall.current * 0.25, home.z + dir * lunge);
    // Facing the other side; allies turn a little so the camera over their
    // right shoulder catches a three-quarter back view. A fall tips the
    // figure backwards about its own sideways axis.
    g.rotation.set(
      (-fall.current * Math.PI) / 2.2,
      dir < 0 ? Math.PI - 0.35 : 0,
      0,
      "YXZ",
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
      {/* A soft shadow so figures stand on the ground (above its facets); the selected
          one glows in its colour with a bright rim. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[0.62, 28]} />
        <meshBasicMaterial
          color={highlight ?? 0x000000}
          transparent
          opacity={highlight ? 0.38 : 0.35}
        />
      </mesh>
      {highlight && actor.hp > 0 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
          <ringGeometry args={[0.6, 0.72, 36]} />
          <meshBasicMaterial color={highlight} />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * Frames both sides whatever the screen's shape, and reports each unit's
 * screen position whenever the canvas or the line-up changes.
 */
function Rig({
  actors,
  band,
  onProject,
  onDistance,
}: {
  actors: Combatant[];
  band: Band | null;
  onProject: (spots: Record<string, UnitSpot>) => void;
  /** How far the camera ended up from the field's middle. */
  onDistance: (distance: number) => void;
}) {
  const { camera, size } = useThree();
  const key = actors.map((a) => `${a.id}:${a.side}${a.row}${a.slot}`).join();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // The band in canvas pixels; without one, the whole canvas.
    const top = band ? band.top / GL_SCALE : 0;
    const bottom = band ? (band.top + band.height) / GL_SCALE : size.height;
    // Centre the view on the band rather than on the canvas, so backing off
    // fills the band evenly.
    cam.setViewOffset(
      size.width,
      size.height,
      0,
      size.height / 2 - (top + bottom) / 2,
      size.width,
      size.height,
    );
    // The band's top and bottom as normalized device y (+1 is the top).
    const yTop = 1 - (2 * top) / size.height;
    const yBottom = 1 - (2 * bottom) / size.height;
    // Behind the allies, a little to the right and about 32° down, looking
    // past the hero's shoulder at the foes' front row. Wide, short bands
    // look flatter (about 22°), so the field's depth takes less height.
    const wide = size.width > size.height * 1.4;
    const dir = new THREE.Vector3(0.28, wide ? 0.42 : 0.66, 1).normalize();
    const xs = actors.map((a) => spotOf(a).x);
    const center = new THREE.Vector3(
      (Math.min(...xs) + Math.max(...xs)) / 2,
      0.9,
      -0.6,
    );
    // Back off until every fighter's head and feet are inside the band,
    // with a margin for tags at the top and the ground ring at the bottom.
    const points = actors.flatMap((a) => {
      const at = spotOf(a);
      const side = a.side === 0 ? 0.7 : 0.5;
      // Both sides and the near edge of the ground ring, and the tag.
      return [
        at.clone().setX(at.x - side),
        at.clone().setX(at.x + side),
        at.clone().setZ(at.z + 0.75),
        at.clone().setY(heightOf(a) + 0.5),
      ];
    });
    const fits = () =>
      points.every((v) => {
        const p = v.clone().project(cam);
        return Math.abs(p.x) < 0.9 && p.y > yBottom + 0.04 && p.y < yTop - 0.04;
      });
    // Never closer than 10: a solo hero would otherwise fill the band.
    let distance = 10;
    for (; distance < 60; distance += 0.5) {
      cam.position.copy(dir.clone().multiplyScalar(distance).add(center));
      cam.lookAt(center);
      cam.updateMatrixWorld();
      if (fits()) break;
    }
    onDistance(distance);
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
  }, [
    camera,
    size.width,
    size.height,
    key,
    band?.top,
    band?.height,
    onProject,
    onDistance,
  ]);
  return null;
}

export default function BattleStage({
  actors,
  hero,
  motion,
  highlights,
  band,
  zone,
  arenaSeed,
  onProject,
}: {
  actors: Combatant[];
  hero: HeroLookProps;
  motion: { acting: string | null; hitAt: Record<string, number> };
  /** Unit id → the colour its shadow glows (selection). */
  highlights: Record<string, number>;
  /** Where on the canvas the fighters must stand clear of the HUD. */
  band: Band | null;
  /** Whose forest the fight is in: colours and town or wild. */
  zone: ZoneDef;
  /** Picks the clearing's layout; the same pack gets the same clearing. */
  arenaSeed: number;
  onProject: (spots: Record<string, UnitSpot>) => void;
}) {
  // Fog starts a little past the field and swallows the far forest.
  const [distance, setDistance] = useState(20);
  // The world's trees fade around the hero on screen; here nothing should.
  useEffect(() => {
    heroOnScreen.uHero.value.set(-1e4, -1e4, 0);
  }, []);
  return (
    <GLFrame>
      <Canvas
        camera={{ fov: 38, near: 0.5, far: 90, position: [3, 7, 14] }}
        dpr={[1, 1.75]}
        gl={{ antialias: ANTIALIAS, alpha: true }}
        onCreated={(state) => {
          paceFrames(state);
          state.gl.setClearColor(0x000000, 0);
        }}
      >
        {/* The world's light: a warm low sun and a cool sky fill. */}
        <ambientLight intensity={0.45} color={0xffe8c8} />
        <hemisphereLight args={[0xbcd2ff, 0x3a3020, 1.2]} />
        <directionalLight
          position={[-20, 30, 10]}
          intensity={2.4}
          color={0xffd9a0}
        />
        <fog
          attach="fog"
          args={[zone.palette.fog, distance + 6, distance + 34]}
        />
        <Arena zone={zone} seed={arenaSeed} centreX={SLOT_WIDTH} />
        {actors.map((a) => (
          <Fighter
            key={a.id}
            actor={a}
            hero={hero}
            motion={{
              acting: motion.acting === a.id,
              hitAt: motion.hitAt[a.id],
            }}
            highlight={highlights[a.id]}
          />
        ))}
        <Rig
          actors={actors}
          band={band}
          onProject={onProject}
          onDistance={setDistance}
        />
      </Canvas>
    </GLFrame>
  );
}
