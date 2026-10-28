import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";

import { clamp01 } from "./color";

/**
 * Press-and-drag over a field, reported as fractions of its size (0–1 on
 * each axis, kept in range as a drag runs past an edge).
 *
 * A gesture-handler pan rather than RN's responder system, unlike the
 * custom Slider. The picker lives in a sheet whose content scrolls, and on
 * Android a native ScrollView takes over a vertical drag partway through —
 * a JS responder can't refuse that, so the square's thumb stopped short of
 * the finger. A gesture-handler pan claims the touch natively, so the
 * scroll view never gets it. `minDistance(0)` makes a plain press pick the
 * point too, the same as the first frame of a drag.
 *
 * Runs its callbacks on the JS thread: the picker's colour is React state,
 * and a drag here re-renders a handful of views, not a list.
 */
export function useDrag(
  onPoint: (fraction: { x: number; y: number }) => void,
  disabled = false,
  testID?: string,
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  function report(x: number, y: number) {
    if (size.width === 0 || size.height === 0) return;
    onPoint({ x: clamp01(x / size.width), y: clamp01(y / size.height) });
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .enabled(!disabled)
    .runOnJS(true)
    .onBegin((event) => report(event.x, event.y))
    // The frame the pan activates on has a position too.
    .onStart((event) => report(event.x, event.y))
    .onUpdate((event) => report(event.x, event.y));
  if (testID !== undefined) pan.withTestId(testID);

  return {
    size,
    gesture: pan,
    onLayout: (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setSize({ width, height });
    },
  };
}
