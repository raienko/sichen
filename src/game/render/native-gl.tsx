import type { RootState } from "@react-three/fiber";
import * as Device from "expo-device";
import { useState, type ReactNode } from "react";
import {
  PixelRatio,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

const native = Platform.OS !== "web";

/**
 * The iOS simulator (and a software-GL emulator) draws expo-gl's OpenGL ES
 * on the CPU, about a second a frame at a phone's full resolution.
 */
const softwareGl = native && !Device.isDevice;

/**
 * How much GLFrame scales its canvas up: the canvas' own pixel sizes (and
 * points projected in it) times this are screen points.
 */
export const GL_SCALE = softwareGl ? PixelRatio.get() : 1;

/** MSAA on expo-gl; too slow for software GL. */
export const ANTIALIAS = !softwareGl;

/**
 * expo-gl queues GL calls for its own thread and returns at once, so when
 * that thread draws slower than requestAnimationFrame fires (software GL, a
 * weak phone) frames pile up without bound: the screen shows a frame from
 * seconds ago and input looks dead. A blocking call after each frame waits
 * for the queue to drain, so the loop runs at the speed the GL thread can
 * draw. On the web this does nothing.
 */
export function paceFrames(state: RootState) {
  if (!native) return;
  const gl = state.gl.getContext();
  const render = state.gl.render.bind(state.gl);
  state.gl.render = (scene, camera) => {
    render(scene, camera);
    gl.getError();
  };
}

/**
 * expo-gl always draws at the screen's pixel ratio and ignores the Canvas
 * `dpr`. With software GL the canvas is laid out at 1/ratio of its size and
 * scaled back up, one pixel per point, which is about nine times less work
 * on a 3x screen. Touches still land right: they arrive in the inner view's
 * own coordinates. Everywhere else this is a plain full-size view.
 */
export function GLFrame({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<{ width: number; height: number }>();
  if (!softwareGl) return <View style={styles.fill}>{children}</View>;
  const scale = PixelRatio.get();
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  return (
    <View style={styles.clip} onLayout={onLayout}>
      {size ? (
        <View
          style={{
            width: size.width / scale,
            height: size.height / scale,
            transformOrigin: "top left",
            transform: [{ scale }],
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  clip: { flex: 1, overflow: "hidden" },
});
