/**
 * The geometry of zooming one image, as plain functions — worklets, so the
 * gesture callbacks can call them on the UI thread, and plain enough to
 * unit-test without a device.
 *
 * The page is scaled about its centre and then translated, so every point
 * here is relative to the centre of the page, not its top-left corner.
 */

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
/** Where a double-tap zooms to. */
export const DOUBLE_TAP_SCALE = 2.5;

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };

export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export function clampScale(scale: number): number {
  "worklet";
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

/**
 * The size the picture actually occupies on the page at scale 1, fitted
 * inside it (`contentFit="contain"`). Before the image has loaded, and so
 * before its aspect ratio is known, the whole page stands in for it.
 */
export function fittedSize(page: Size, aspectRatio?: number): Size {
  "worklet";
  if (!aspectRatio || aspectRatio <= 0) return page;
  const width = Math.min(page.width, page.height * aspectRatio);
  return { width, height: width / aspectRatio };
}

/**
 * How far the picture may move at `scale` before an edge of it comes away
 * from the edge of the page — zero on an axis where it still fits.
 */
export function panLimits(page: Size, content: Size, scale: number): Point {
  "worklet";
  return {
    x: Math.max(0, (content.width * scale - page.width) / 2),
    y: Math.max(0, (content.height * scale - page.height) / 2),
  };
}

/** A translation pulled back inside `panLimits`. */
export function clampTranslation(
  translation: Point,
  page: Size,
  content: Size,
  scale: number,
): Point {
  "worklet";
  const limits = panLimits(page, content, scale);
  return {
    x: clamp(translation.x, -limits.x, limits.x),
    y: clamp(translation.y, -limits.y, limits.y),
  };
}

/**
 * The translation that keeps `focal` — a point between the fingers, or the
 * one double-tapped — over the same spot of the picture while the scale
 * goes from `fromScale` to `toScale`. Without it zoom always heads for the
 * centre, wherever you pinched.
 */
export function zoomAbout(
  focal: Point,
  translation: Point,
  fromScale: number,
  toScale: number,
): Point {
  "worklet";
  const ratio = toScale / fromScale;
  return {
    x: focal.x - (focal.x - translation.x) * ratio,
    y: focal.y - (focal.y - translation.y) * ratio,
  };
}

/** Which horizontal edges of a zoomed picture are against the page's. */
export function atEdges(
  translationX: number,
  page: Size,
  content: Size,
  scale: number,
): { start: boolean; end: boolean } {
  "worklet";
  const limit = panLimits(page, content, scale).x;
  // Half a point of slack: a pan that springs to its limit rarely lands on
  // it exactly.
  return {
    start: translationX >= limit - 0.5,
    end: translationX <= -limit + 0.5,
  };
}
