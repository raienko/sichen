import type { AccessibilityFlags } from "./settings";

export type { AccessibilityFlag, AccessibilityFlags } from "./settings";

export type Accessibility = AccessibilityFlags & {
  /**
   * The OS text-size multiplier (iOS Dynamic Type / Android font size).
   * `1` is the default; `> 1` means the user asked for larger text.
   * Always `1` on web, which has no equivalent OS setting.
   */
  fontScale: number;
  /** `fontScale > 1` — the user has increased text size. */
  isLargeTextEnabled: boolean;
  /**
   * An animation duration that honours "Reduce Motion": returns `0` when
   * it's on, so a `withTiming(..., { duration })` lands instantly instead
   * of animating, and the passed value otherwise.
   *
   * Centralizing it here means an animated component never has to read the
   * reduce-motion flag (or remember that it should) — it just asks for its
   * duration. See `Modal` and `Accordion`.
   */
  duration: (ms: number) => number;
};
