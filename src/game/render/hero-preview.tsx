import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { getBase, getClass } from "../data";
import type { Look } from "../sim/types";

import { HeroFigure } from "./art-kit";
import { ANTIALIAS, GLFrame, paceFrames } from "./native-gl";

function Turntable({
  look,
  classId,
  weapon,
  helmet,
}: {
  look: Look;
  classId: string;
  weapon?: string;
  helmet?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <HeroFigure
        look={look}
        classId={classId}
        weapon={weapon ?? getBase(getClass(classId).startWeapon).kind}
        helmet={helmet}
        speed={() => 0}
      />
    </group>
  );
}

/**
 * The hero, slowly turning: being made on the creation screen, or as worn
 * on the character screen. Without `weapon`, the class's starting one.
 */
export default function HeroPreview({
  look,
  classId,
  weapon,
  helmet,
}: {
  look: Look;
  classId: string;
  /** The weapon family to hold, as the art kit names it. */
  weapon?: string;
  helmet?: boolean;
}) {
  return (
    <GLFrame>
      <Canvas
        camera={{ fov: 30, position: [0, 1.3, 4.3] }}
        onCreated={(state) => {
          paceFrames(state);
          state.camera.lookAt(0, 0.85, 0);
        }}
        dpr={[1, 1.75]}
        gl={{ antialias: ANTIALIAS }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 3]} intensity={2.2} />
        <pointLight position={[-2, 2, -1]} intensity={6} color={0xffc890} />
        <Turntable
          look={look}
          classId={classId}
          weapon={weapon}
          helmet={helmet}
        />
      </Canvas>
    </GLFrame>
  );
}
