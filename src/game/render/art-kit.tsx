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

export function InteractableFigure({ kind }: { kind: string }) {
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
