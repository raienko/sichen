import {
  Canvas,
  useFrame,
  useThree,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

import { getBase, getEnemy, getNpc, getZone } from "../data";
import * as actions from "../state/actions";
import { runtime } from "../state/runtime";
import type { SaveData } from "../state/save";
import { FloatingStick } from "../ui/input";
import { offeredBy, readyFor } from "../sim/quests";

import {
  GroundRing,
  HeroFigure,
  InteractableFigure,
  MonsterFigure,
  NpcFigure,
  QuestMarker,
  Tiles,
  TILE,
} from "./art-kit";
import { distance, step, walkable } from "./movement";
import { ANTIALIAS, GLFrame, paceFrames } from "./native-gl";

const HERO_SPEED = 4.2;
const CHASE_SPEED = 3.3;
const AGGRO_RANGE = 4.2;
const CONTACT = 0.95;
const CAMERA = new THREE.Vector3(0, 13.5, 10);

type Props = { save: SaveData; version: number };

/** Reads gamepad sticks on the web; native gamepads come later. */
function readGamepad(): { x: number; z: number } | null {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
  for (const pad of navigator.getGamepads()) {
    if (!pad) continue;
    const x = pad.axes[0] ?? 0;
    const z = pad.axes[1] ?? 0;
    if (Math.hypot(x, z) > 0.2) return { x, z };
  }
  return null;
}

function Hero({ save }: { save: SaveData }) {
  const ref = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const zone = getZone(save.world.zoneId);
  const { camera } = useThree();
  const regen = useRef(0);
  const weapon = save.hero.equipment.weapon;

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    const gamepad = readGamepad();
    let { x: ix, z: iz } = gamepad ?? runtime.input;
    if (Math.hypot(ix, iz) > 0.15) {
      runtime.moveTarget = null;
    } else if (runtime.moveTarget) {
      const t = runtime.moveTarget;
      const d = distance(runtime.x, runtime.z, t.x, t.z);
      if (d < (t.then ? 1.3 : 0.2)) {
        runtime.moveTarget = null;
        t.then?.();
      } else {
        ix = (t.x - runtime.x) / d;
        iz = (t.z - runtime.z) / d;
      }
    }
    const len = Math.hypot(ix, iz);
    if (len > 0.15) {
      const k = Math.min(1, len);
      const nx = (ix / len) * k * HERO_SPEED * dt;
      const nz = (iz / len) * k * HERO_SPEED * dt;
      const moved = step(zone.map, runtime.x, runtime.z, nx, nz);
      speed.current = Math.hypot(moved.x - runtime.x, moved.z - runtime.z) / dt;
      runtime.x = moved.x;
      runtime.z = moved.z;
      runtime.heading = Math.atan2(ix, iz);
    } else {
      speed.current = 0;
    }
    if (ref.current) {
      ref.current.position.set(runtime.x * TILE, 0, runtime.z * TILE);
      ref.current.rotation.y = runtime.heading;
    }
    camera.position.set(
      runtime.x * TILE + CAMERA.x,
      CAMERA.y,
      runtime.z * TILE + CAMERA.z,
    );
    camera.lookAt(runtime.x * TILE, 0.8, runtime.z * TILE);

    for (const exit of zone.exits) {
      if (distance(runtime.x, runtime.z, exit.x, exit.z) < 0.8) {
        actions.enterZone(exit.to, exit.spawn);
        return;
      }
    }
    regen.current += dt;
    if (regen.current > 1) {
      actions.regenerate(regen.current);
      actions.respawnPacks();
      regen.current = 0;
    }
  });

  return (
    <group ref={ref}>
      <HeroFigure
        look={save.hero.look}
        classId={save.hero.classId}
        weapon={weapon ? getBase(weapon.baseId).kind : undefined}
        helmet={!!save.hero.equipment.helmet}
        speed={() => speed.current}
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={14}
        distance={12}
        color={0xffc890}
        decay={1.6}
      />
    </group>
  );
}

function Pack({
  id,
  homeX,
  homeZ,
  enemies,
  aggressive,
  heroLevel,
  map,
}: {
  id: string;
  homeX: number;
  homeZ: number;
  enemies: readonly { enemyId: string; level: number }[];
  aggressive: boolean;
  heroLevel: number;
  map: readonly string[];
}) {
  const ref = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const wander = useRef({ t: 0, x: homeX, z: homeZ });
  const boss = enemies.some((e) => getEnemy(e.enemyId).boss);
  const topLevel = Math.max(...enemies.map((e) => e.level));
  // Far stronger packs attack on sight too.
  const hunts = aggressive || topLevel >= heroLevel + 3;

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    let mob = runtime.mobs.get(id);
    if (!mob) {
      mob = { x: homeX, z: homeZ, homeX, homeZ };
      runtime.mobs.set(id, mob);
    }
    const toHero = distance(mob.x, mob.z, runtime.x, runtime.z);
    const safe = Date.now() < runtime.safeUntil;
    let tx = wander.current.x;
    let tz = wander.current.z;
    let pace = 1.2;
    if (hunts && !safe && toHero < AGGRO_RANGE) {
      tx = runtime.x;
      tz = runtime.z;
      pace = CHASE_SPEED;
    } else {
      wander.current.t -= dt;
      if (wander.current.t <= 0) {
        wander.current = {
          t: 2 + Math.random() * 3,
          x: homeX + (Math.random() - 0.5) * 2.5,
          z: homeZ + (Math.random() - 0.5) * 2.5,
        };
      }
    }
    const d = distance(mob.x, mob.z, tx, tz);
    if (d > 0.1) {
      const moved = step(
        map,
        mob.x,
        mob.z,
        ((tx - mob.x) / d) * pace * dt,
        ((tz - mob.z) / d) * pace * dt,
      );
      speed.current = Math.hypot(moved.x - mob.x, moved.z - mob.z) / dt;
      if (ref.current)
        ref.current.rotation.y = Math.atan2(tx - mob.x, tz - mob.z);
      mob.x = moved.x;
      mob.z = moved.z;
    } else {
      speed.current = 0;
    }
    if (ref.current) ref.current.position.set(mob.x * TILE, 0, mob.z * TILE);
    if (hunts && !safe && toHero < CONTACT) actions.startBattle(id);
  });

  const onPress = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    actions.openPanel({ name: "inspect", packId: id });
  };

  return (
    <group
      ref={ref}
      position={[homeX * TILE, 0, homeZ * TILE]}
      userData={INTERACTIVE}
      onPointerDown={onPress}
    >
      {enemies.slice(0, 3).map((e, i) => (
        <group
          key={i}
          position={[i === 0 ? 0 : i === 1 ? -0.9 : 0.9, 0, i === 0 ? 0 : -0.7]}
        >
          <MonsterFigure
            kind={getEnemy(e.enemyId).kind}
            speed={() => speed.current}
          />
        </group>
      ))}
      {boss ? (
        <GroundRing color={0x9a3ad8} />
      ) : hunts ? (
        <GroundRing color={0xd8303a} />
      ) : null}
      {/* A larger invisible target, so a tap on a small mob still lands. */}
      <mesh position={[0, 1, 0]} visible={false}>
        <boxGeometry args={[2.4, 2.4, 2.4]} />
      </mesh>
    </group>
  );
}

function walkThen(x: number, z: number, then: () => void) {
  if (distance(runtime.x, runtime.z, x, z) < 1.4) {
    then();
    return;
  }
  runtime.moveTarget = { x, z, then };
}

function Ground({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: number;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[((width - 1) * TILE) / 2, 0, ((height - 1) * TILE) / 2]}
    >
      <planeGeometry args={[width * TILE + 40, height * TILE + 40]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/** Marks a group that takes taps itself (NPCs, foes, quest objects). */
const INTERACTIVE = { interactive: true };

/** The live scene, for hit tests on touches the canvas doesn't see. */
const view: { get: (() => RootState) | null } = { get: null };

function SceneHandle() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    view.get = get;
    return () => {
      if (view.get === get) view.get = null;
    };
  }, [get]);
  return null;
}

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function castFrom(at: { x: number; y: number }, width: number, height: number) {
  const state = view.get?.();
  if (!state || width <= 0 || height <= 0) return null;
  raycaster.setFromCamera(
    new THREE.Vector2((at.x / width) * 2 - 1, -(at.y / height) * 2 + 1),
    state.camera,
  );
  return state;
}

/** Whether a touch at this point lands on something that takes taps. */
function hitsInteractive(
  at: { x: number; y: number },
  width: number,
  height: number,
) {
  const state = castFrom(at, width, height);
  if (!state) return false;
  for (const hit of raycaster.intersectObjects(state.scene.children, true)) {
    for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
      if (o.userData.interactive) return true;
    }
  }
  return false;
}

/** Walks to the ground under a tap. */
function walkToTap(
  at: { x: number; y: number },
  width: number,
  height: number,
) {
  if (!castFrom(at, width, height)) return;
  const point = raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
  if (point) runtime.moveTarget = { x: point.x / TILE, z: point.z / TILE };
}

function Scene({ save }: { save: SaveData }) {
  const zone = getZone(save.world.zoneId);
  const width = zone.map[0]?.length ?? 0;
  const height = zone.map.length;
  const packs = zone.packs.filter(
    (p) => !p.quest && !(p.id in save.world.cleared),
  );
  return (
    <>
      <color attach="background" args={[zone.palette.sky]} />
      <fog attach="fog" args={[zone.palette.fog, 20, 52]} />
      <ambientLight intensity={zone.town ? 0.9 : 0.6} color={0xffe8c8} />
      <hemisphereLight args={[0x9ab0d8, 0x3a3020, zone.town ? 2.2 : 1.5]} />
      <directionalLight
        position={[-20, 30, 10]}
        intensity={zone.town ? 2.2 : 1.3}
        color={0xd8dcff}
      />
      <Ground width={width} height={height} color={zone.palette.ground} />
      <Tiles map={zone.map} />
      {zone.npcs.map((n) => {
        const npc = getNpc(n.npcId);
        const ready = readyFor(save.quests, npc.id).length > 0;
        const offer = offeredBy(save.quests, npc.id).length > 0;
        return (
          <group
            key={n.npcId}
            position={[n.x * TILE, 0, n.z * TILE]}
            rotation={[0, Math.PI, 0]}
            userData={INTERACTIVE}
            onPointerDown={(event) => {
              event.stopPropagation();
              walkThen(n.x, n.z + 0.9, () =>
                actions.openPanel({ name: "npc", npcId: n.npcId }),
              );
            }}
          >
            <NpcFigure kind={npc.kind} />
            {ready || offer ? <QuestMarker ready={ready} /> : null}
          </group>
        );
      })}
      {zone.interactables.map((it) => (
        <group
          key={it.id}
          position={[it.x * TILE, 0, it.z * TILE]}
          userData={INTERACTIVE}
          onPointerDown={(event) => {
            event.stopPropagation();
            walkThen(it.x, it.z + 1, () => actions.examine(it.id));
          }}
        >
          <InteractableFigure kind={it.kind} />
        </group>
      ))}
      {zone.exits.map((exit, i) => (
        <mesh
          key={i}
          position={[exit.x * TILE, 0.05, exit.z * TILE]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[1.1, 20]} />
          <meshBasicMaterial color={0x6ad0ff} transparent opacity={0.45} />
        </mesh>
      ))}
      {packs.map((p) => (
        <Pack
          key={p.id}
          id={p.id}
          homeX={p.x}
          homeZ={p.z}
          enemies={p.enemies}
          aggressive={!!p.aggressive}
          heroLevel={save.hero.level}
          map={zone.map}
        />
      ))}
      <Hero save={save} />
      <SceneHandle />
    </>
  );
}

export function startPackAttack(packId: string, x: number, z: number) {
  walkThen(x, z, () => actions.startBattle(packId));
}

export default function WorldScene({ save, version }: Props) {
  // A new zone or a finished battle remounts the scene with fresh state.
  const key = useMemo(
    () => `${save.world.zoneId}:${version}`,
    [save.world.zoneId, version],
  );
  return (
    <View style={styles.fill}>
      <FloatingStick
        claims={(at, frame) => !hitsInteractive(at, frame.width, frame.height)}
        onTap={(at, frame) => walkToTap(at, frame.width, frame.height)}
      >
        <GLFrame>
          <Canvas
            key={key}
            camera={{
              fov: 42,
              near: 0.5,
              far: 120,
              position: [runtime.x * TILE, 15, runtime.z * TILE + 11],
            }}
            dpr={[1, 1.75]}
            gl={{ antialias: ANTIALIAS, powerPreference: "high-performance" }}
            onCreated={paceFrames}
          >
            <Scene save={save} />
          </Canvas>
        </GLFrame>
      </FloatingStick>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

export { walkable };
