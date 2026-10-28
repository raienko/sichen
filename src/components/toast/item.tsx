import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAnimationDuration } from "@/features/accessibility";
import { useUnits } from "@/features/responsive";
import { testId } from "@/utils";

import {
  TOASTS_TEST_ID,
  ANIMATION_DURATION,
  TRAVEL_DISTANCE,
} from "./constants";

import toasts from "./store";
import Toast from "./toast";
import type { ToastEntry } from "./types";

type Props = {
  entry: ToastEntry;
  /** Which edge the stack is anchored to, so the toast enters from it. */
  position: "top" | "bottom";
};

/**
 * One toast's time on screen: it fades and slides in on mount, and back out
 * once the store marks it `leaving`.
 *
 * The store, not this component, decides when the toast is actually gone —
 * it flips `leaving` and removes the entry a matching `ANIMATION_DURATION`
 * later. Driving removal from the animation's completion callback instead
 * would tie a toast's lifetime to it having stayed mounted, and would leave
 * `Toast.hide()` with nothing dependable to await.
 *
 * Under "Reduce Motion" `duration()` is 0, so both transitions land
 * immediately — the toast still appears and disappears at the right
 * moments, it just doesn't travel to get there.
 */
export default function ToastItem({ entry, position }: Props) {
  const progress = useSharedValue(0);
  const duration = useAnimationDuration();
  const units = useUnits();

  useEffect(() => {
    progress.value = withTiming(entry.leaving ? 0 : 1, {
      duration: duration(ANIMATION_DURATION),
    });
  }, [entry.leaving, progress, duration]);

  const travel = units(TRAVEL_DISTANCE) * (position === "top" ? -1 : 1);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: travel * (1 - progress.value) }],
  }));

  return (
    <Animated.View
      style={style}
      // An outgoing toast is still on screen for the length of its exit.
      // Without this, a press landing in those last few frames would act on
      // something the user has already watched leave.
      pointerEvents={entry.leaving ? "none" : "auto"}
    >
      <Toast
        {...entry}
        // Each toast on screen by its own id: `toasts.<id>.close`.
        testID={testId(TOASTS_TEST_ID, entry.id)}
        onDismiss={() => toasts.hide(entry.id)}
        onPress={() => toasts.hide(entry.id)}
      />
    </Animated.View>
  );
}
