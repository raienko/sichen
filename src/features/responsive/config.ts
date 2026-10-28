/** Figma frame width the design values passed to units() are authored against. */
export const BASE_WIDTH = 375;

/**
 * Dampens how aggressively units() scales as width grows past BASE_WIDTH —
 * 1 = pure linear (values get huge on tablet/desktop), 0 = no scaling at all.
 */
export const SCALE_MODERATION = 0.5;

/** The scale factor is clamped to this range regardless of device width. */
export const MIN_SCALE = 0.85;
export const MAX_SCALE = 1.6;

/**
 * Width thresholds used to classify the current device — see breakpoint.ts.
 * 768 (iPad portrait / the common "md" breakpoint) must read as "tablet",
 * not "foldable" — that leaves a narrow 600–767 band for the width an
 * unfolded foldable phone typically lands at (Galaxy Fold ~717, Duo ~720)
 * before it reaches full tablet width.
 */
export const BREAKPOINTS = {
  foldable: 600,
  tablet: 768,
  desktop: 1280,
} as const;
