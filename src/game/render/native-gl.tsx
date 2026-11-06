import {
  invalidate,
  useFrame,
  useThree,
  type RootState,
} from "@react-three/fiber";
import * as Device from "expo-device";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
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

/**
 * On the web the canvas starts at most this sharp. A retina screen's full
 * 2x is four times a 1x canvas' pixels, and the scenes' cost goes with the
 * pixels drawn more than with anything else.
 */
const WEB_MAX_DPR = 1.5;

/** The ratio the last scene settled on, so the next starts there. */
let settledDpr: number | null = null;

const screenDpr = () =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

/** The pixel ratio a scene's Canvas starts at (expo-gl ignores it). */
export function sceneDpr(): number {
  return settledDpr ?? Math.min(WEB_MAX_DPR, screenDpr());
}

/** Frames to let pass after a start or a change, before measuring. */
const SETTLE_FRAMES = 30;
/** Frames measured per decision. */
const WINDOW_FRAMES = 60;
/** The slowest frame time that still counts as smooth: about 58 fps. */
const SMOOTH_MS = 1000 / 58;

/**
 * Lowers the canvas' pixel ratio on the web while frames come too slowly:
 * slower than about 58 fps, or, on a fast (120 Hz) screen, a third slower
 * than its quickest frames. The cost goes with the pixel count, the square
 * of the ratio, so it steps straight to the ratio that should fit, never
 * below 1. It never raises it again within a session: a scene that just
 * fit would otherwise flicker between two sharpnesses.
 */
export function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const state = useRef({ last: 0, skip: SETTLE_FRAMES, times: [] as number[] });
  useFrame(() => {
    if (native) return;
    const s = state.current;
    const now = performance.now();
    const dt = now - s.last;
    s.last = now;
    if (s.skip > 0) {
      s.skip -= 1;
      return;
    }
    // A hidden tab or a long pause is not the scene's cost.
    if (dt > 250) return;
    s.times.push(dt);
    if (s.times.length < WINDOW_FRAMES) return;
    const sorted = s.times.sort((a, b) => a - b);
    s.times = [];
    const quick = sorted[Math.floor(sorted.length * 0.1)]!;
    const typical = sorted[sorted.length >> 1]!;
    // Under 10 ms the screen runs faster than 60 Hz: aim for its rate.
    const target = quick < 10 ? quick * 1.1 : SMOOTH_MS;
    const floor = Math.min(1, screenDpr());
    if (typical <= target * 1.2 || dpr <= floor + 0.01) return;
    const next = Math.max(
      floor,
      Math.floor(dpr * Math.sqrt(target / typical) * 20) / 20,
    );
    if (next >= dpr) return;
    settledDpr = next;
    s.skip = SETTLE_FRAMES;
    setDpr(next);
  });
  return null;
}

/**
 * Holds a new canvas' first frame until its shaders are compiled, on the
 * web. A WebGL context compiles each shader the first time it draws with
 * it, and the browser waits for every one: a new scene stalled for a few
 * hundred milliseconds on its first frame. `compileAsync` has the browser
 * compile them all off the main thread instead (KHR_parallel_shader_compile)
 * while the canvas draws nothing; the scene then fades in. Put `warmup`
 * inside the Canvas, after everything else, pass `frameloop` to it, and wrap
 * it in `WarmFade` with `ready`. expo-gl has no parallel compiling, so on
 * iOS and Android it draws at once as before.
 */
export function useShaderWarmup(loop: "always" | "demand" = "always") {
  const [ready, setReady] = useState(native);
  const done = useCallback(() => setReady(true), []);
  // A canvas drawing on demand needs a nudge for its first frame.
  useEffect(() => {
    if (ready && loop === "demand" && !native) invalidate();
  }, [ready, loop]);
  return {
    ready,
    frameloop: ready ? loop : ("never" as const),
    warmup: ready ? null : <Warmup onReady={done} />,
  };
}

function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  // A passive effect: the models' layout effects (see Baked) have run.
  useEffect(() => {
    let live = true;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (live) onReady();
      });
    return () => {
      live = false;
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

/** How long a warmed-up canvas takes to fade in. */
const FADE_MS = 180;

/** Shows its canvas once `ready`, fading in (see useShaderWarmup). */
export function WarmFade({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  const [opacity] = useState(() => new Animated.Value(ready ? 1 : 0));
  useEffect(() => {
    if (!ready) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: native,
    }).start();
  }, [ready, opacity]);
  return (
    <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  clip: { flex: 1, overflow: "hidden" },
});
