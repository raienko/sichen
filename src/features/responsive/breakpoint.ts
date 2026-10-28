import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { BREAKPOINTS } from "./config";

export type Breakpoint = "phone" | "foldable" | "tablet" | "desktop";

/**
 * Every breakpoint from narrowest to widest — derived by sorting
 * `BREAKPOINTS` by its own thresholds rather than repeating the order by
 * hand, so a breakpoint added to `config.ts` slots in at the right place
 * automatically (`"phone"` leads because it's the implicit "below the
 * first threshold" case and has no entry of its own).
 *
 * The order is what makes a responsive value cascade upward — see
 * `resolveResponsive`.
 */
export const BREAKPOINT_ORDER: Breakpoint[] = [
  "phone",
  ...(Object.entries(BREAKPOINTS) as [Breakpoint, number][])
    .sort(([, a], [, b]) => a - b)
    .map(([name]) => name),
];

/** Pure — exported mainly for testing. See useBreakpoint below. */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) {
    return "desktop";
  }
  if (width >= BREAKPOINTS.tablet) {
    return "tablet";
  }
  if (width >= BREAKPOINTS.foldable) {
    return "foldable";
  }
  return "phone";
}

/** Reactive current device category — updates on resize/rotate/fold. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return useMemo(() => getBreakpoint(width), [width]);
}
