import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";

import { runtime } from "../state/runtime";

import { palette } from "./palette";

const KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

/** WASD and arrow keys, on the web (and on a tablet with a keyboard). */
export function useKeyboardMovement(onKey?: (code: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) return;
    const held = new Set<string>();
    const apply = () => {
      let x = 0;
      let z = 0;
      for (const code of held) {
        const dir = KEYS[code];
        if (dir) {
          x += dir[0];
          z += dir[1];
        }
      }
      runtime.input = { x: Math.sign(x), z: Math.sign(z) };
    };
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (KEYS[e.code]) {
        held.add(e.code);
        apply();
        e.preventDefault();
      } else {
        onKey?.(e.code);
      }
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.code);
      apply();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      runtime.input = { x: 0, z: 0 };
    };
  }, [onKey]);
}

const SIZE = 120;
const KNOB = 48;
/** How far the knob travels from the centre, in points. */
const REACH = SIZE / 2 - KNOB / 4;
/** A touch that moves less than this and lifts quickly is a tap. */
const TAP_SLOP = 8;
const TAP_MS = 300;
/** A finger held still this long shows the stick without a drag. */
const SHOW_MS = 150;

type Point = { x: number; y: number };
type Frame = Point & { width: number; height: number };
type Stick = { at: Point; knob: Point; shown: boolean };

type StickProps = {
  claims: (at: Point, frame: Frame) => boolean;
  onTap: (at: Point, frame: Frame) => void;
};

/** The stick's touch handling, kept outside React's render. */
function stickGesture(
  setStick: (update: (s: Stick | null) => Stick | null) => void,
) {
  let props: StickProps = { claims: () => false, onTap: () => {} };
  let frame: Frame = { x: 0, y: 0, width: 0, height: 0 };
  let start: Point = { x: 0, y: 0 };
  let startedAt = 0;
  let moved = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const local = (e: GestureResponderEvent): Point => ({
    x: e.nativeEvent.pageX - frame.x,
    y: e.nativeEvent.pageY - frame.y,
  });
  const reset = () => {
    clearTimeout(timer);
    setStick(() => null);
    runtime.input = { x: 0, z: 0 };
  };
  const responder = PanResponder.create({
    onStartShouldSetPanResponderCapture: (e) => props.claims(local(e), frame),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      start = local(e);
      startedAt = e.nativeEvent.timestamp;
      moved = false;
      setStick(() => ({ at: start, knob: { x: 0, y: 0 }, shown: false }));
      timer = setTimeout(
        () => setStick((s) => (s ? { ...s, shown: true } : s)),
        SHOW_MS,
      );
    },
    onPanResponderMove: (_, g) => {
      let dx = g.dx;
      let dy = g.dy;
      const len = Math.hypot(dx, dy);
      if (len > TAP_SLOP) moved = true;
      if (len > REACH) {
        dx = (dx / len) * REACH;
        dy = (dy / len) * REACH;
      }
      runtime.input = { x: dx / REACH, z: dy / REACH };
      setStick(() => ({ at: start, knob: { x: dx, y: dy }, shown: true }));
    },
    onPanResponderRelease: (e) => {
      // Event times, not handler times: a busy JS thread can run the two
      // handlers far apart.
      const tap = !moved && e.nativeEvent.timestamp - startedAt < TAP_MS;
      reset();
      if (tap) props.onTap(start, frame);
    },
    onPanResponderTerminate: reset,
  });
  return {
    handlers: responder.panHandlers,
    setProps: (next: StickProps) => {
      props = next;
    },
    setFrame: (next: Frame) => {
      frame = next;
    },
  };
}

/**
 * A stick that appears wherever a finger lands on `children` (the world) and
 * follows the drag, so any finger and grip works; release to stop. A short
 * tap goes to `onTap` instead. `claims` sees each touch first: false leaves
 * it to what is under the finger (an NPC or a foe in the 3D scene). Menus
 * drawn above `children` keep their own touches.
 */
export function FloatingStick({
  children,
  claims,
  onTap,
}: StickProps & { children: ReactNode }) {
  const [stick, setStick] = useState<Stick | null>(null);
  const view = useRef<View>(null);
  const [gesture] = useState(() => stickGesture(setStick));
  useEffect(
    () => gesture.setProps({ claims, onTap }),
    [gesture, claims, onTap],
  );
  const onLayout = () =>
    view.current?.measureInWindow((x, y, width, height) =>
      gesture.setFrame({ x, y, width, height }),
    );

  return (
    <View
      ref={view}
      style={styles.fill}
      onLayout={onLayout}
      {...gesture.handlers}
    >
      {children}
      {stick?.shown ? (
        <View
          pointerEvents="none"
          style={[
            styles.pad,
            styles.floating,
            { left: stick.at.x - SIZE / 2, top: stick.at.y - SIZE / 2 },
          ]}
        >
          <View
            style={[
              styles.knob,
              {
                transform: [
                  { translateX: stick.knob.x },
                  { translateY: stick.knob.y },
                ],
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  floating: { position: "absolute" },
  pad: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "rgba(20, 16, 12, 0.45)",
    borderWidth: 2,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: palette.panelHi,
    borderWidth: 2,
    borderColor: palette.gold,
  },
});
