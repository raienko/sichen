import { useEffect, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

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

/** The on-screen stick: drag anywhere inside it, release to stop. */
export function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  // Made once; the handlers only touch their own closure and setKnob.
  const [responder] = useState(() => {
    let start = { x: SIZE / 2, y: SIZE / 2 };
    const move = (px: number, py: number) => {
      let dx = px - SIZE / 2;
      let dy = py - SIZE / 2;
      const max = SIZE / 2 - KNOB / 4;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      setKnob({ x: dx, y: dy });
      runtime.input = { x: dx / max, z: dy / max };
    };
    const reset = () => {
      setKnob({ x: 0, y: 0 });
      runtime.input = { x: 0, z: 0 };
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        start = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        move(start.x, start.y);
      },
      onPanResponderMove: (_, g) => move(start.x + g.dx, start.y + g.dy),
      onPanResponderRelease: reset,
      onPanResponderTerminate: reset,
    });
  });

  return (
    <View
      style={styles.pad}
      {...responder.panHandlers}
      accessibilityLabel="Joystick"
    >
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          { transform: [{ translateX: knob.x }, { translateY: knob.y }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
