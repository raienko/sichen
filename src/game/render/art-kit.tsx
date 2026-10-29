import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
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
  gable: gableGeometry(),
};

/** A unit gable roof: ridge along x at height 1, eaves at y 0, z ±0.5. */
function gableGeometry(): THREE.BufferGeometry {
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

/** Bobs and swings a figure while it moves; reads the speed it is given. */
function useWalk(speed: () => number) {
  const body = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const phase = useRef(0);
  useFrame((_, dt) => {
    const s = speed();
    phase.current += dt * (s > 0.05 ? 10 : 0);
    const swing = s > 0.05 ? Math.sin(phase.current) * 0.6 : 0;
    if (left.current) left.current.rotation.x = swing;
    if (right.current) right.current.rotation.x = -swing;
    if (body.current)
      body.current.position.y =
        s > 0.05 ? Math.abs(Math.sin(phase.current)) * 0.06 : 0;
  });
  return { body, left, right };
}

// ---------------------------------------------------------------- heroes

const CLASS_COAT: Record<string, number> = {
  lytsar: 0x8c1d1d,
  plastun: 0x2f4a2a,
  kharakternyk: 0x2b2e5a,
};

function Weapon({ kind }: { kind?: string }) {
  switch (kind) {
    case "bow":
      return (
        <group position={[0.38, 0.85, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <Part geometry={G.torus} color={0x6b4423} scale={[1, 1.4, 1]} />
        </group>
      );
    case "staff":
      return (
        <group position={[0.4, 0.9, 0.05]}>
          <Part geometry={G.cyl} color={0x5b3a1e} scale={[0.07, 1.7, 0.07]} />
          <Part
            geometry={G.octa}
            color={0xff8a2a}
            emissive={0xff6a00}
            position={[0, 0.9, 0]}
            scale={[0.18, 0.18, 0.18]}
          />
        </group>
      );
    case "spear":
      return (
        <group position={[0.4, 1, 0.05]}>
          <Part geometry={G.cyl} color={0x5b3a1e} scale={[0.06, 2.2, 0.06]} />
          <Part
            geometry={G.cone}
            color={0xb8b8c0}
            position={[0, 1.2, 0]}
            scale={[0.12, 0.3, 0.12]}
          />
        </group>
      );
    case "bulava":
      return (
        <group position={[0.42, 0.7, 0.15]} rotation={[0.6, 0, 0]}>
          <Part geometry={G.cyl} color={0x5b3a1e} scale={[0.06, 0.7, 0.06]} />
          <Part
            geometry={G.dodeca}
            color={0xc9a24a}
            position={[0, 0.4, 0]}
            scale={[0.22, 0.22, 0.22]}
          />
        </group>
      );
    case "pistol":
      return (
        <group position={[0.42, 0.75, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <Part geometry={G.box} color={0x3a2a1a} scale={[0.08, 0.4, 0.1]} />
        </group>
      );
    default:
      // A sabre, curved by a slight tilt.
      return (
        <group position={[0.42, 0.72, 0.2]} rotation={[0.9, 0, 0.1]}>
          <Part
            geometry={G.box}
            color={0xd8dbe0}
            position={[0, 0.35, 0]}
            scale={[0.04, 0.75, 0.09]}
          />
          <Part geometry={G.box} color={0xc9a24a} scale={[0.2, 0.05, 0.08]} />
        </group>
      );
  }
}

export function HeroFigure({
  look,
  classId,
  weapon,
  helmet,
  speed,
}: {
  look: Look;
  classId: string;
  weapon?: string;
  helmet?: boolean;
  speed: () => number;
}) {
  const { body, left, right } = useWalk(speed);
  const skin = SKIN_TONES[look.face % SKIN_TONES.length]!;
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length]!;
  const coat = CLASS_COAT[classId] ?? 0x8c1d1d;
  const woman = look.body === "kozachka";
  return (
    <group>
      <group ref={body}>
        {/* Sharovary, coat, sash */}
        <Part
          geometry={woman ? G.cone : G.box}
          color={woman ? coat : 0x22324a}
          position={[0, 0.55, 0]}
          scale={woman ? [0.75, 0.75, 0.6] : [0.5, 0.35, 0.34]}
        />
        <Part
          geometry={G.box}
          color={coat}
          position={[0, 0.95, 0]}
          scale={[0.52, 0.5, 0.34]}
        />
        <Part
          geometry={G.box}
          color={0xc9a24a}
          position={[0, 0.74, 0]}
          scale={[0.54, 0.08, 0.36]}
        />
        {/* Head */}
        <Part
          geometry={G.sphere}
          color={skin}
          position={[0, 1.42, 0]}
          scale={[0.36, 0.4, 0.36]}
        />
        {helmet ? (
          <Part
            geometry={G.cyl}
            color={0x2a2018}
            position={[0, 1.64, 0]}
            scale={[0.36, 0.22, 0.36]}
          />
        ) : woman ? (
          <>
            {/* Vinok: a wreath of flowers, with a braid down the back */}
            <Part
              geometry={G.cyl}
              color={0xd23a3a}
              position={[0, 1.6, 0]}
              scale={[0.38, 0.07, 0.38]}
            />
            <Part
              geometry={G.box}
              color={hair}
              position={[0, 1.2, -0.2]}
              scale={[0.1, 0.5 + look.hair * 0.1, 0.08]}
            />
          </>
        ) : look.hair === 0 ? (
          // Oseledets: the shaved head's single long lock.
          <Part
            geometry={G.box}
            color={hair}
            position={[0.05, 1.62, -0.05]}
            rotation={[0, 0, -0.6]}
            scale={[0.07, 0.3, 0.07]}
          />
        ) : (
          <Part
            geometry={G.sphere}
            color={hair}
            position={[0, 1.52, -0.02]}
            scale={[0.38, 0.26, 0.38]}
          />
        )}
        {look.mustache && !woman ? (
          <Part
            geometry={G.box}
            color={hair}
            position={[0, 1.34, 0.17]}
            scale={[0.3, 0.04, 0.04]}
          />
        ) : null}
        <Weapon kind={weapon} />
      </group>
      {!woman ? (
        <>
          <group ref={left} position={[-0.13, 0.4, 0]}>
            <Part
              geometry={G.box}
              color={0x22324a}
              position={[0, -0.18, 0]}
              scale={[0.17, 0.4, 0.2]}
            />
            <Part
              geometry={G.box}
              color={0x3a1a10}
              position={[0, -0.38, 0.03]}
              scale={[0.18, 0.12, 0.26]}
            />
          </group>
          <group ref={right} position={[0.13, 0.4, 0]}>
            <Part
              geometry={G.box}
              color={0x22324a}
              position={[0, -0.18, 0]}
              scale={[0.17, 0.4, 0.2]}
            />
            <Part
              geometry={G.box}
              color={0x3a1a10}
              position={[0, -0.38, 0.03]}
              scale={[0.18, 0.12, 0.26]}
            />
          </group>
        </>
      ) : null}
    </group>
  );
}

// ---------------------------------------------------------------- npcs

const NPC_COLORS: Record<
  string,
  { coat: number; hat?: number; glow?: number }
> = {
  otaman: { coat: 0x7a1414, hat: 0x1a1410 },
  olha: { coat: 0x5a1a4a, hat: 0xc9a24a, glow: 0xff6a00 },
  sviatoslav: { coat: 0x6a6a72, hat: 0x8a8a92 },
  karmaliuk: { coat: 0x1f2a1a, hat: 0x111111 },
  merchant: { coat: 0x7a5a2a, hat: 0x3a2a1a },
  healer: { coat: 0x3a5a3a },
};

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
  const c = NPC_COLORS[kind] ?? { coat: 0x555555 };
  return (
    <group>
      <Part
        geometry={G.cone}
        color={c.coat}
        position={[0, 0.6, 0]}
        scale={[0.75, 1.2, 0.6]}
      />
      <Part
        geometry={G.sphere}
        color={0xd8ae88}
        position={[0, 1.38, 0]}
        scale={[0.36, 0.4, 0.36]}
      />
      {c.hat ? (
        <Part
          geometry={G.cyl}
          color={c.hat}
          position={[0, 1.6, 0]}
          scale={[0.36, 0.2, 0.36]}
        />
      ) : null}
      {c.glow ? (
        <Part
          geometry={G.octa}
          color={0xffb04a}
          emissive={c.glow}
          position={[0.4, 1.1, 0.2]}
          scale={[0.18, 0.18, 0.18]}
        />
      ) : null}
    </group>
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

export function InteractableFigure({ kind }: { kind: string }) {
  if (kind === "shrine") {
    return (
      <group>
        <Part
          geometry={G.box}
          color={0x6a5a48}
          position={[0, 0.8, 0]}
          scale={[1.4, 1.6, 1.4]}
        />
        <Part
          geometry={G.cone4}
          color={0x3a2a1a}
          position={[0, 2, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[1.4, 0.9, 1.4]}
        />
        <Part
          geometry={G.box}
          color={0xc9a24a}
          emissive={0x6a4a00}
          position={[0, 2.75, 0]}
          scale={[0.06, 0.6, 0.06]}
        />
        <Part
          geometry={G.box}
          color={0xc9a24a}
          emissive={0x6a4a00}
          position={[0, 2.85, 0]}
          scale={[0.34, 0.06, 0.06]}
        />
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

const TILE_ART: Record<string, InstanceSpec[]> = {
  "#": [
    {
      geometry: G.cyl,
      color: 0x4a3220,
      offset: [0, 0.5, 0],
      scale: [0.25, 1, 0.25],
    },
    {
      geometry: G.cone,
      color: 0x1f3a24,
      offset: [0, 1.9, 0],
      scale: [1.5, 2.4, 1.5],
      jitter: true,
    },
  ],
  r: [
    {
      geometry: G.dodeca,
      color: 0x6a665e,
      offset: [0, 0.35, 0],
      scale: [1.3, 0.9, 1.2],
      jitter: true,
    },
  ],
  W: [
    { geometry: G.box, color: 0x5a4028, offset: [0, 1, 0], scale: [2, 2, 0.6] },
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
  "~": [
    {
      geometry: G.plane,
      color: 0x1e3446,
      offset: [0, 0.02, 0],
      scale: [2, 2, 1],
    },
  ],
  "=": [
    {
      geometry: G.plane,
      color: 0x4e4130,
      offset: [0, 0.015, 0],
      scale: [2, 2, 1],
    },
  ],
  ",": [
    {
      geometry: G.cone,
      color: 0x3c5a2a,
      offset: [0, 0.2, 0],
      scale: [0.5, 0.4, 0.5],
      jitter: true,
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
  const flat = spec.geometry === G.plane;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    cells.forEach(([x, z], i) => {
      const r = spec.jitter ? hash(x, z) : 0;
      e.set(flat ? -Math.PI / 2 : 0, r * Math.PI * 2, 0);
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
  }, [cells, spec, flat]);
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

/** St. Sophia's: a white body, a golden central dome and four cupolas. */
function Church({ w, d }: { w: number; d: number }) {
  const dome = (x: number, z: number, big: boolean) => (
    <group key={`${x},${z}`} position={[x, 3, z]}>
      <mesh
        geometry={G.cyl}
        position={[0, 0.5, 0]}
        scale={big ? [1.8, 1, 1.8] : [0.9, 0.8, 0.9]}
      >
        <Mat color={0xe8e2d4} />
      </mesh>
      <mesh
        geometry={G.sphere}
        position={[0, big ? 1.4 : 1.1, 0]}
        scale={big ? [2.1, 2.3, 2.1] : [1.1, 1.2, 1.1]}
      >
        <Mat color={0xc9a24a} emissive={0x2a1a00} />
      </mesh>
      <mesh
        geometry={G.box}
        position={[0, big ? 2.9 : 1.95, 0]}
        scale={[0.08, big ? 0.7 : 0.45, 0.08]}
      >
        <Mat color={0xd9b860} />
      </mesh>
    </group>
  );
  const cx = w / 2 - 1.1;
  const cz = d / 2 - 1.1;
  return (
    <group>
      <mesh
        geometry={G.box}
        position={[0, 1.5, 0]}
        scale={[w - 0.4, 3, d - 0.4]}
      >
        <Mat color={0xe8e2d4} />
      </mesh>
      {dome(0, 0, true)}
      {dome(-cx, -cz, false)}
      {dome(cx, -cz, false)}
      {dome(-cx, cz, false)}
      {dome(cx, cz, false)}
      <mesh
        geometry={G.box}
        position={[0, 0.9, d / 2 - 0.15]}
        scale={[1, 1.8, 0.1]}
      >
        <Mat color={0x4a3220} />
      </mesh>
    </group>
  );
}

function Buildings({ map }: { map: readonly string[] }) {
  const blocks = useMemo(() => buildingBlocks(map), [map]);
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
    </>
  );
}

export function Tiles({ map }: { map: readonly string[] }) {
  const byKind = useMemo(() => {
    const out = new Map<string, [number, number][]>();
    map.forEach((row, z) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!;
        if (!TILE_ART[ch]) continue;
        out.set(ch, [...(out.get(ch) ?? []), [x, z]]);
      }
    });
    return out;
  }, [map]);
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
