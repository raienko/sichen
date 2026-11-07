import {
  Canvas,
  useFrame,
  useThree,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";

import { getBase, getEnemy, getNpc, getZone } from "../data";
import type { LandmarkDef, ZoneDef } from "../sim/types";
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
import { fadeAroundHero, heroOnScreen, Nature } from "./nature";
import { TownEdge, Walls } from "./walls";
import {
  AdaptiveDpr,
  ANTIALIAS,
  sceneDpr,
  GLFrame,
  paceFrames,
  useShaderWarmup,
  WarmFade,
} from "./native-gl";

const HERO_SPEED = 4.2;
const CHASE_SPEED = 3.3;
const AGGRO_RANGE = 4.2;
const CONTACT = 0.95;
/** Raised behind the hero, about 48° down: more from behind than above. */
const CAMERA = new THREE.Vector3(0, 10, 9).normalize();
/**
 * Near a landmark the camera drops to about 30° and looks up a little, so
 * a tall front reads as tall, as in the old engravings.
 */
const CAMERA_LOW = new THREE.Vector3(0, 6, 10).normalize();
const LOOK_UP = 5.5;
/** Looking almost straight down, for the hero just behind a landmark. */
const CAMERA_TOP = new THREE.Vector3(0, 10, 3).normalize();
const CAMERA_DIR = new THREE.Vector3();
/**
 * The camera aims this far ahead of the hero (up the screen), so the hero
 * stands in the lower middle with the way ahead in view.
 */
const LOOK_AHEAD = 2;
const SCRATCH = new THREE.Vector3();
const BUFFER = new THREE.Vector2();
const FOV = 42;
/**
 * People and creatures stand larger than life against the trees, as in the
 * crawler concept, so they read from the high camera. Movement and contact
 * distances are unchanged.
 */
const ACTOR_SCALE = 1.35;
/** How fast the camera eases out near a landmark and back in, per second. */
const LANDMARK_EASE = 1.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/**
 * How the zone's landmarks move the camera, for the hero at (x, z).
 *
 * In front of one (south of it: the camera looks north) the camera pulls
 * out by up to the landmark's `zoom` and drops lower, so the whole front
 * fits: `pull` 0-1, full inside 45% of its radius, none past it. Just
 * behind one (north of it), while the camera, `behind` tiles south of the
 * hero, would sit inside the building, it rises to look almost straight
 * down instead: `over` 0-1. Further north the hero stays in the usual
 * view, and the building dissolves round him where it hides him.
 */
function landmarkPull(zone: ZoneDef, x: number, z: number, behind = 4) {
  let best: {
    zoom: number;
    pull: number;
    over: number;
    mark: LandmarkDef | null;
  } = { zoom: 1, pull: 0, over: 0, mark: null };
  let over = 0;
  for (const mark of zone.landmarks ?? []) {
    const d = distance(x, z, mark.x, mark.z);
    const near = smooth((mark.radius - d) / (mark.radius * 0.55));
    const north = mark.z - z;
    const pull = near * smooth((1 - north) / 2);
    const beside = clamp01(1 - (Math.abs(x - mark.x) - mark.radius * 0.45) / 2);
    over = Math.max(
      over,
      smooth(north / 1.5) * (1 - smooth((north - behind - 2.5) / 1.5)) * beside,
    );
    const zoom = 1 + (mark.zoom - 1) * pull;
    if (zoom > best.zoom) best = { zoom, pull, over: 0, mark };
  }
  return { ...best, over };
}

const HALF_FOV = ((FOV / 2) * Math.PI) / 180;
/** Keep a landmark's top this far (radians) under the screen's top edge. */
const TOP_MARGIN = 0.04;
/** And the hero's feet this far over the bottom edge. */
const FEET_MARGIN = 0.12;

/** A point's angle above the camera's line of sight, in radians. */
function angleUp(camera: THREE.Camera, x: number, y: number, z: number) {
  const v = SCRATCH.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
  return Math.atan2(v.y, -v.z);
}

/**
 * How much further back than `base` the camera must stand (`back`, a
 * multiplier), and how far it must then tip up (`pitch`, radians), to
 * show a landmark's top and its vistas' above the hero's feet. `place`
 * puts the camera at a distance; it is left wherever the last try put it.
 */
function frameTops(
  camera: THREE.Camera,
  mark: LandmarkDef,
  place: (far: number) => void,
  base: number,
): { back: number; pitch: number } | null {
  const tops: [number, number, number][] = (mark.vistas ?? []).map((v) => [
    v.x,
    v.top,
    v.z,
  ]);
  if (mark.top !== undefined) tops.push([mark.x, mark.top, mark.z]);
  if (!tops.length) return null;
  let back = 1;
  let pitch = 0;
  for (let k = 0; k < 10; k++) {
    place(base * back);
    let up = -Infinity;
    for (const [x, y, z] of tops)
      up = Math.max(up, angleUp(camera, x * TILE, y, z * TILE));
    const feet = angleUp(camera, runtime.x * TILE, 0, runtime.z * TILE);
    const need = up - (HALF_FOV - TOP_MARGIN);
    const room = feet + (HALF_FOV - FEET_MARGIN);
    pitch = Math.max(0, Math.min(need, room));
    if (need <= room) break;
    back *= 1.12;
  }
  return { back, pitch };
}

/**
 * How far the camera stands from the hero: far enough to show at least 9
 * units across and 11 top to bottom around the hero, so a narrow
 * portrait screen sees as much of the clearing as a wide one.
 */
function cameraDistance(aspect: number): number {
  const half = Math.tan(((FOV / 2) * Math.PI) / 180);
  return Math.max(4.5 / (half * aspect), 5.5 / half);
}

type Props = {
  save: SaveData;
  version: number;
  /** Kept but not drawn while a battle is on, so coming back is quick. */
  paused?: boolean;
};

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
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const regen = useRef(0);
  const weapon = save.hero.equipment.weapon;
  /** The landmark camera: its zoom, its aim's pull, the last one named. */
  const sight = useRef({
    zoom: landmarkPull(zone, runtime.x, runtime.z).zoom,
    tilt: landmarkPull(zone, runtime.x, runtime.z).pull,
    over: landmarkPull(zone, runtime.x, runtime.z).over,
    aimX: 0,
    aimZ: 0,
    named: landmarkPull(zone, runtime.x, runtime.z).mark?.id ?? "",
    /** How much further back, and how far up (radians), to fit its top. */
    back: 1,
    pitch: 0,
    /** The landmark the camera last framed, to ease away from. */
    mark: null as LandmarkDef | null,
  });

  useFrame((state, rawDt) => {
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
    // Near a landmark the camera eases out, and its aim leans towards the
    // landmark, so the whole of it fits the screen.
    const reach = cameraDistance(size.width / Math.max(1, size.height));
    // How far south of the hero the usual camera stands, in tiles.
    const behind = (CAMERA.z * reach - LOOK_AHEAD) / TILE;
    const near = landmarkPull(zone, runtime.x, runtime.z, behind);
    const view = sight.current;
    const ease = Math.min(1, dt * LANDMARK_EASE);
    view.zoom += (near.zoom - view.zoom) * ease;
    view.tilt += (near.pull - view.tilt) * ease;
    view.over += (near.over - view.over) * Math.min(1, dt * 3);
    const lean = near.mark ? near.pull * 0.45 : 0;
    const toX = near.mark ? (near.mark.x - runtime.x) * TILE * lean : 0;
    const toZ = near.mark ? (near.mark.z - runtime.z) * TILE * lean : 0;
    view.aimX += (toX - view.aimX) * ease;
    view.aimZ += (toZ - view.aimZ) * ease;
    if (near.mark && near.pull > 0.5 && view.named !== near.mark.id) {
      view.named = near.mark.id;
      actions.toast("landmark", "toast.zone", { name: near.mark.name });
    }
    if (near.mark) view.mark = near.mark;
    const mark = view.mark;
    const dir = CAMERA_DIR.lerpVectors(CAMERA, CAMERA_LOW, view.tilt)
      .lerp(CAMERA_TOP, view.over)
      .normalize();
    const aimX = runtime.x * TILE + view.aimX;
    const aimZ = runtime.z * TILE - LOOK_AHEAD + view.aimZ;
    const aimY = 0.8 + LOOK_UP * view.tilt;
    const place = (far: number) => {
      camera.position.set(
        aimX + dir.x * far,
        aimY + dir.y * far,
        aimZ + dir.z * far,
      );
      camera.lookAt(aimX, aimY, aimZ);
      camera.updateMatrixWorld();
    };
    const base = reach * runtime.cameraZoom * view.zoom;
    // In front of a tall landmark, stand back and tip up until its top
    // (and any far sight over it) fits above the hero's feet.
    const fit = near.mark ? frameTops(camera, near.mark, place, base) : null;
    const fitEase = Math.min(1, dt * 2);
    const backTo = fit ? 1 + (fit.back - 1) * near.pull : 1;
    const pitchTo = fit ? fit.pitch * near.pull : 0;
    view.back += (backTo - view.back) * fitEase;
    view.pitch += (pitchTo - view.pitch) * fitEase;
    const far = base * view.back;
    place(far);
    if (view.pitch > 0.001) {
      camera.rotateX(view.pitch);
      camera.updateMatrixWorld();
    }
    // The fog keeps its distance from the hero as the camera pulls out,
    // and stands back past a far sight while it's framed.
    const fog = state.scene.fog;
    if (fog instanceof THREE.Fog) {
      const extra = far - reach;
      let fogNear = reach + 6 + extra;
      let fogFar = reach + 38 + extra * 1.3;
      if (mark?.vistas?.length && view.tilt > 0.01) {
        let depth = 0;
        for (const v of mark.vistas)
          depth = Math.max(
            depth,
            -SCRATCH.set(v.x * TILE, v.top / 2, v.z * TILE).applyMatrix4(
              camera.matrixWorldInverse,
            ).z,
          );
        const w = smooth(view.tilt);
        fogNear += (Math.max(fogNear, depth - 25) - fogNear) * w;
        fogFar += (Math.max(fogFar, depth + 30) - fogFar) * w;
      }
      fog.near = fogNear;
      fog.far = fogFar;
    }
    // Tell the trees where the hero's chest is on screen, to fade for him.
    const chest = SCRATCH.set(runtime.x * TILE, 1.3, runtime.z * TILE);
    chest.project(camera);
    const buffer = gl.getDrawingBufferSize(BUFFER);
    heroOnScreen.uHero.value.set(
      (chest.x * 0.5 + 0.5) * buffer.x,
      (chest.y * 0.5 + 0.5) * buffer.y,
      chest.z * 0.5 + 0.5,
    );
    heroOnScreen.uFadeRadius.value = buffer.y * 0.09;

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
    <group ref={ref} scale={ACTOR_SCALE}>
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
      scale={ACTOR_SCALE}
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
      // Below the sunken riverbed, so it never covers the water.
      position={[((width - 1) * TILE) / 2, -0.6, ((height - 1) * TILE) / 2]}
      // Drawn after the faceted ground and everything else solid, so the
      // depth test skips it wherever they already cover the screen: only
      // the margin past the map's edge is shaded, not the whole screen twice.
      renderOrder={1}
    >
      <planeGeometry args={[width * TILE + 40, height * TILE + 40]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/**
 * Buildings dissolve around the hero where they stand in front of him, as
 * trees do: the landmarks are tall enough to hide him for many steps.
 * Patches the materials once the buildings are built and batched.
 */
function SeeThrough({
  map,
  children,
}: {
  map: readonly string[];
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      mesh.material.onBeforeCompile = fadeAroundHero;
      mesh.material.needsUpdate = true;
    });
  }, [map]);
  return <group ref={ref}>{children}</group>;
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

/**
 * One zone. Its land, trees and buildings are built once per zone; the
 * people, foes and hero (under `version`) start afresh after each battle.
 */
function Scene({ save, version }: { save: SaveData; version: number }) {
  const zone = getZone(save.world.zoneId);
  const size = useThree((s) => s.size);
  const reach = cameraDistance(size.width / Math.max(1, size.height));
  const width = zone.map[0]?.length ?? 0;
  const height = zone.map.length;
  return (
    <>
      <color attach="background" args={[zone.palette.sky]} />
      {/* Fog thickens past the hero, darkening the screen's far edge. */}
      <fog attach="fog" args={[zone.palette.fog, reach + 6, reach + 38]} />
      {/* A warm low sun from the south-west and a cool sky fill. */}
      <ambientLight intensity={0.35} color={0xffe8c8} />
      <hemisphereLight args={[0xbcd2ff, 0x3a3020, 1.2]} />
      <directionalLight
        position={[-20, 30, 10]}
        intensity={2.4}
        color={0xffd9a0}
      />
      <Ground width={width} height={height} color={zone.palette.ground} />
      <Nature map={zone.map} grass={zone.palette.ground} town={!!zone.town} />
      <SeeThrough map={zone.map}>
        <Tiles map={zone.map} town={!!zone.town} ground={zone.palette.ground} />
      </SeeThrough>
      {zone.town ? <Walls map={zone.map} ground={zone.palette.ground} /> : null}
      {/* Where the road leaves for a town, that town's wall and gate. */}
      {zone.exits.map((exit) =>
        getZone(exit.to).town ? (
          <TownEdge
            key={`${exit.x},${exit.z}`}
            exit={exit}
            width={width}
            height={height}
            ground={zone.palette.ground}
          />
        ) : null,
      )}
      <Fragment key={version}>
        <Actors save={save} />
      </Fragment>
      <SceneHandle />
    </>
  );
}

/** The zone's NPCs, quest objects, exits, packs and the hero. */
function Actors({ save }: { save: SaveData }) {
  const zone = getZone(save.world.zoneId);
  const packs = zone.packs.filter(
    (p) => !p.quest && !(p.id in save.world.cleared),
  );
  return (
    <>
      {zone.npcs.map((n) => {
        const npc = getNpc(n.npcId);
        const ready = readyFor(save.quests, npc.id).length > 0;
        const offer = offeredBy(save.quests, npc.id).length > 0;
        return (
          <group
            key={n.npcId}
            position={[n.x * TILE, 0, n.z * TILE]}
            scale={ACTOR_SCALE}
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
    </>
  );
}

export function startPackAttack(packId: string, x: number, z: number) {
  walkThen(x, z, () => actions.startBattle(packId));
}

export default function WorldScene({ save, version, paused }: Props) {
  // One canvas (one WebGL context, its shaders compiled once) serves every
  // zone; a new zone remounts the scene inside it.
  const { ready, frameloop, warmup } = useShaderWarmup();
  return (
    <View style={styles.fill}>
      <FloatingStick
        claims={(at, frame) => !hitsInteractive(at, frame.width, frame.height)}
        onTap={(at, frame) => walkToTap(at, frame.width, frame.height)}
      >
        <GLFrame>
          <WarmFade ready={ready}>
            <Canvas
              frameloop={paused ? "never" : frameloop}
              camera={{
                fov: FOV,
                near: 0.5,
                far: 180,
                position: [runtime.x * TILE, 15.5, runtime.z * TILE + 8.5],
              }}
              dpr={sceneDpr()}
              gl={{ antialias: ANTIALIAS, powerPreference: "high-performance" }}
              onCreated={paceFrames}
            >
              <Scene key={save.world.zoneId} save={save} version={version} />
              <AdaptiveDpr />
              {warmup}
            </Canvas>
          </WarmFade>
        </GLFrame>
      </FloatingStick>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

export { walkable };
