import { useEffect, useRef } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAnimationDuration } from "@/features/accessibility";
import { easeOutClamped } from "@/utils";

import type { PaginationItem } from "./range";

/** Same pace as the highlight, so the two read as one movement. */
const SHIFT_DURATION = 240;
/** Where the numbers fade up from as they slide in. */
const SHIFT_FROM_OPACITY = 0.35;

/**
 * The numbers' half of a page change.
 *
 * With more pages than slots, the current page sits still in the middle of
 * the window and the *numbers* move: going from 25 to 26, "23 24 [25] 26
 * 27" becomes "24 25 [26] 27 28". The highlight has nowhere to slide, so
 * without this the change is an instant relabel. Instead the row starts
 * one slot over in the direction of travel and eases back while fading
 * up — a ticker, with the highlight holding still over it.
 *
 * Only when the visible pages actually changed; a change the highlight can
 * show by moving (1 → 2 on five pages) leaves the row alone. Driven by the
 * settled page, like everything else in Pagination. Instant under Reduce
 * Motion.
 */
export default function useWindowShift(
  current: number,
  items: readonly PaginationItem[],
  slot: number,
  /** Right-to-left: later pages are to the left, so the row travels the other way. */
  mirrored: boolean,
) {
  const duration = useAnimationDuration();
  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);
  const previous = useRef({ current, key: items.join(",") });

  useEffect(() => {
    const key = items.join(",");
    const last = previous.current;
    previous.current = { current, key };
    if (key === last.key || current === last.current) return;

    const forward = current > last.current;
    const direction = forward !== mirrored ? 1 : -1;
    const timing = {
      duration: duration(SHIFT_DURATION),
      easing: easeOutClamped,
    };
    offset.value = direction * slot;
    offset.value = withTiming(0, timing);
    opacity.value = SHIFT_FROM_OPACITY;
    opacity.value = withTiming(1, timing);
  }, [current, items, slot, mirrored, duration, offset, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offset.value }],
  }));
}
