import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LocalValue } from "@/features/storage";

import { palette } from "./palette";

/**
 * The FPS meter's on/off switch, kept on the device rather than in a save:
 * it's about this phone or browser, not about a hero. Off until turned on
 * from the in-game menu.
 */
export const fpsMeterSetting = new LocalValue<boolean>("game-fps-meter");

/** How often the readout refreshes, so it re-renders twice a second, not every frame. */
const WINDOW_MS = 500;

type Sample = { fps: number; worstMs: number };

/**
 * Counts requestAnimationFrame ticks. On the web that's the browser's paint
 * loop; on iOS and Android it's the JS thread's frame loop, which is the
 * same loop react-three-fiber draws the 3D scene from (expo-gl), so either
 * way it's the rate the game actually draws at.
 */
function useFrameRate(enabled: boolean): Sample | null {
  const [sample, setSample] = useState<Sample | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let start = 0;
    let last = 0;
    let frames = 0;
    let worst = 0;
    const tick = (now: number) => {
      if (start === 0) {
        start = now;
        last = now;
      } else {
        frames += 1;
        worst = Math.max(worst, now - last);
        last = now;
        const elapsed = now - start;
        if (elapsed >= WINDOW_MS) {
          setSample({ fps: (frames * 1000) / elapsed, worstMs: worst });
          start = now;
          frames = 0;
          worst = 0;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // Turned off: the next time it's on, start from "--", not a stale reading.
      setSample(null);
    };
  }, [enabled]);
  return enabled ? sample : null;
}

function fpsColor(fps: number): string {
  if (fps >= 50) return palette.good;
  if (fps >= 28) return palette.gold;
  return palette.bad;
}

/**
 * A small frame-rate readout in the bottom-left corner, over every scene,
 * when the player has switched it on. It never takes touches.
 */
export function FpsMeter() {
  const enabled = fpsMeterSetting.useValue() === true;
  const sample = useFrameRate(enabled);
  const insets = useSafeAreaInsets();
  if (!enabled) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.meter,
        { bottom: insets.bottom + 4, start: insets.left + 4 },
      ]}
    >
      <Text
        style={[
          styles.fps,
          { color: sample ? fpsColor(sample.fps) : palette.muted },
        ]}
      >
        {sample ? Math.round(sample.fps) : "--"} FPS
      </Text>
      <Text style={styles.ms}>
        {sample ? `max ${Math.round(sample.worstMs)} ms` : " "}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meter: {
    position: "absolute",
    zIndex: 1000,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "rgba(12, 17, 19, 0.75)",
  },
  fps: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  ms: {
    fontSize: 10,
    color: palette.muted,
    fontVariant: ["tabular-nums"],
  },
});
