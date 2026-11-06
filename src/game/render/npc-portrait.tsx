import { Canvas } from "@react-three/fiber";

import { NpcFigure } from "./art-kit";
import {
  ANTIALIAS,
  GLFrame,
  paceFrames,
  useShaderWarmup,
  WarmFade,
} from "./native-gl";

/**
 * A speaker in a dialogue: the NPC's own 3D figure from the world, framed
 * from the belt up and turned a little towards the viewer, breathing. The
 * canvas is transparent so the dialogue's painted backdrop shows behind.
 */
export default function NpcPortrait({ kind }: { kind: string }) {
  const { ready, frameloop, warmup } = useShaderWarmup();
  return (
    <GLFrame>
      <WarmFade ready={ready}>
        <Canvas
          frameloop={frameloop}
          camera={{ fov: 30, position: [-0.3, 1.72, 2.55] }}
          onCreated={(state) => {
            paceFrames(state);
            state.gl.setClearColor(0x000000, 0);
            state.camera.lookAt(0, 1.4, 0);
          }}
          dpr={[1, 1.75]}
          gl={{ antialias: ANTIALIAS, alpha: true }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[2, 4, 3]} intensity={2.2} />
          {/* Warm firelight from below and behind, as in the backdrop. */}
          <pointLight position={[1.5, 1, -1]} intensity={5} color={0xffb070} />
          <group rotation={[0, 0.4, 0]}>
            <NpcFigure kind={kind} />
          </group>
          {warmup}
        </Canvas>
      </WarmFade>
    </GLFrame>
  );
}
