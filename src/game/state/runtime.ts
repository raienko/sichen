/**
 * What changes every frame in the world, kept out of the store so React
 * doesn't re-render 60 times a second. The scene writes it; the HUD, the
 * minimap and saves read it.
 */
export type MobRuntime = { x: number; z: number; homeX: number; homeZ: number };

export const runtime = {
  x: 0,
  z: 0,
  /** Facing, radians. */
  heading: 0,
  /** No encounters until this time (after a battle or a flee). */
  safeUntil: 0,
  /** Where a tap or click asked the hero to walk, in tiles. */
  moveTarget: null as { x: number; z: number; then?: () => void } | null,
  mobs: new Map<string, MobRuntime>(),
  /** Input: a direction from keys, a gamepad or the joystick, each -1..1. */
  input: { x: 0, z: 0 },
};

export function resetRuntime(x: number, z: number) {
  runtime.x = x;
  runtime.z = z;
  runtime.moveTarget = null;
  runtime.mobs.clear();
  runtime.input = { x: 0, z: 0 };
}
