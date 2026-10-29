import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { getBase, getClass } from "../data";
import type { Look } from "../sim/types";

import { HeroFigure } from "./art-kit";
import { ANTIALIAS, GLFrame, paceFrames } from "./native-gl";

function Turntable({ look, classId }: { look: Look; classId: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <HeroFigure
        look={look}
        classId={classId}
        weapon={getBase(getClass(classId).startWeapon).kind}
        speed={() => 0}
      />
    </group>
  );
}

/** The hero being made, slowly turning, for the character creation screen. */
export default function HeroPreview({
  look,
  classId,
}: {
  look: Look;
  classId: string;
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
        <Turntable look={look} classId={classId} />
      </Canvas>
    </GLFrame>
  );
}
