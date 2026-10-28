/** Shared by the store, the animated item, and the awaited static API. */
export const ANIMATION_DURATION = 250;

/**
 * How long a toast stays up when it doesn't say otherwise. Long enough to
 * read a short sentence twice; anything with more to read should pass its
 * own `duration`, or `null` and a close control.
 */
export const DEFAULT_DURATION = 4000;

/**
 * How many toasts are on screen at once. The rest queue and are promoted as
 * the ones above them leave, so a burst — a failed sync retrying five times
 * — doesn't paper over the screen it's reporting on.
 */
export const MAX_VISIBLE = 3;

/** How far a toast travels while fading in and out, in Figma px. */
export const TRAVEL_DISTANCE = 16;

/** The overlay every toast is drawn in — one per app, so a fixed id. */
export const TOASTS_TEST_ID = "toasts";
