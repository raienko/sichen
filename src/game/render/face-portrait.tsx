import { Canvas, useThree } from "@react-three/fiber";
import { memo, useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

import type { Look } from "../sim/types";

import { HeroFigure, MonsterFigure } from "./art-kit";
import {
  ANTIALIAS,
  GLFrame,
  paceFrames,
  useShaderWarmup,
  WarmFade,
} from "./native-gl";

export type FaceSubject =
  | { hero: { look: Look; classId: string; helmet?: boolean } }
  | { monster: string };

type Head = { at: [number, number, number]; span: number };

/** The hero's head and neck, in the figure's own units. */
const HERO_HEAD: Head = { at: [0, 1.6, 0], span: 0.62 };

/**
 * Each monster's head (see MonsterFigure) and how much around it to show.
 * A kind not listed is framed from its bounds instead.
 */
const MONSTER_HEADS: Record<string, Head> = {
  orc: { at: [0, 1.42, 0.05], span: 0.72 },
  orc_shaman: { at: [0, 1.42, 0.05], span: 0.72 },
  orc_brute: { at: [0, 1.86, 0.07], span: 0.95 },
  upyr: { at: [0, 1.6, 0.05], span: 0.68 },
  wolf: { at: [0, 0.98, 0.6], span: 0.75 },
  mavka: { at: [0, 1.5, 0], span: 0.7 },
  drowned: { at: [0, 1.35, 0.3], span: 0.7 },
  chort: { at: [0, 1.5, 0.05], span: 0.78 },
  likho: { at: [0, 1.55, 0.3], span: 1 },
  protector: { at: [0, 1.85, 0], span: 0.85 },
};

const still = () => 0;
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Points the camera at the figure's head: where it is for the hero and each
 * known monster; for any other, the top third of the figure's bounds.
 */
function Framed({
  head,
  turn,
  children,
}: {
  head: Head | undefined;
  /** The figure's turn about its vertical axis. */
  turn: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    let target: THREE.Vector3;
    let span: number;
    if (head) {
      // The head turns with the figure.
      target = new THREE.Vector3(...head.at).applyAxisAngle(UP, turn);
      span = head.span;
    } else {
      g.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(g);
      const size = box.getSize(new THREE.Vector3());
      span = Math.max(0.5, size.y * 0.38);
      const centre = box.getCenter(new THREE.Vector3());
      target = new THREE.Vector3(centre.x, box.max.y - span * 0.55, centre.z);
    }
    const distance = span / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(target.x, target.y + span * 0.08, target.z + distance);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    invalidate();
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * A HUD avatar: the fighter's own 3D model from the world and battle,
 * framed on the face and turned towards the middle of the screen (`facing`
 * 1 looks right, -1 left). It draws once per change, not every frame, and
 * the canvas is transparent so the crest shows behind.
 */
function FacePortrait({
  subject,
  facing = 1,
}: {
  subject: FaceSubject;
  facing?: 1 | -1;
}) {
  const head = "hero" in subject ? HERO_HEAD : MONSTER_HEADS[subject.monster];
  const turn = 0.45 * facing;
  const { ready, frameloop, warmup } = useShaderWarmup("demand");
  return (
    <GLFrame>
      <WarmFade ready={ready}>
        <Canvas
          frameloop={frameloop}
          camera={{ fov: 24, position: [0, 1.6, 3] }}
          onCreated={(state) => {
            paceFrames(state);
            state.gl.setClearColor(0x000000, 0);
          }}
          dpr={[1, 2]}
          gl={{ antialias: ANTIALIAS, alpha: true }}
        >
          <ambientLight intensity={0.95} />
          <directionalLight position={[2 * facing, 4, 3]} intensity={2.2} />
          <pointLight
            position={[-1.5 * facing, 1.8, -1]}
            intensity={4}
            color={0xffb070}
          />
          <Framed head={head} turn={turn}>
            <group rotation={[0, turn, 0]}>
              {"hero" in subject ? (
                <HeroFigure
                  look={subject.hero.look}
                  classId={subject.hero.classId}
                  helmet={subject.hero.helmet}
                  weapon="none"
                  speed={still}
                />
              ) : (
                <MonsterFigure kind={subject.monster} speed={still} />
              )}
            </group>
          </Framed>
          {warmup}
        </Canvas>
      </WarmFade>
    </GLFrame>
  );
}

const key = (s: FaceSubject) =>
  "hero" in s
    ? JSON.stringify([s.hero.look, s.hero.classId, !!s.hero.helmet])
    : s.monster;

/** The HUD re-renders several times a second; the portrait only on change. */
export default memo(
  FacePortrait,
  (a, b) => a.facing === b.facing && key(a.subject) === key(b.subject),
);
