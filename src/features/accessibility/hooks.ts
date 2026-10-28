import { useContext } from "react";

import AccessibilityContext from "./context";
import type { Accessibility } from "./types";

export function useAccessibility(): Accessibility {
  const accessibility = useContext(AccessibilityContext);
  if (!accessibility) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return accessibility;
}

/**
 * Just the reduce-motion-aware duration helper, for animated components
 * that don't need the rest of the accessibility state.
 *
 * @example
 * const duration = useAnimationDuration();
 * progress.value = withTiming(1, { duration: duration(250) });
 */
export function useAnimationDuration(): Accessibility["duration"] {
  return useAccessibility().duration;
}

/** `true` when VoiceOver/TalkBack is running. */
export function useIsScreenReaderEnabled(): boolean {
  return useAccessibility().isScreenReaderEnabled;
}

/** The OS text-size multiplier (`1` = default, `> 1` = user increased it). */
export function useFontScale(): number {
  return useAccessibility().fontScale;
}
