/**
 * The arithmetic a stepper does when a button is pressed. Split from the
 * component and pure, for the same reason `badge/count.ts` is: floating
 * point is where the mistakes live, and they're worth testing without
 * rendering anything.
 */

function decimalPlaces(value: number): number {
  const text = String(value).toLowerCase();
  // Small steps stringify in exponential form (1e-7), where the exponent is
  // the number of places rather than anything after a ".".
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.split(".")[1]?.length ?? 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The value one press away, clamped to the range.
 *
 * **It moves the value rather than snapping it.** A stepper is controlled,
 * so a `value` that isn't on the step grid is the caller's business and is
 * left alone — `2.5` with a step of `1` becomes `3.5`, not `3`. Rewriting
 * an incoming value would mean the component silently disagreeing with the
 * state it was handed. (`Slider` does snap, because there the value comes
 * from a continuous drag rather than from the caller.)
 *
 * The rounding is the whole reason this isn't written inline: `0.1 + 0.2`
 * is `0.30000000000000004`, and a stepper that displays that is broken. The
 * result is rounded to as many places as the widest of the inputs actually
 * has, which is exact for every step a caller can reasonably pass and does
 * nothing at all to whole numbers.
 */
export function nextValue(
  value: number,
  delta: number,
  min: number,
  max: number,
): number {
  const places = Math.max(
    decimalPlaces(value),
    decimalPlaces(delta),
    decimalPlaces(min),
  );
  const moved = Number((value + delta).toFixed(places));
  return clamp(moved, min, max);
}

/** Whether a press in that direction would do anything. */
export function canStep(
  value: number,
  delta: number,
  min: number,
  max: number,
): boolean {
  return nextValue(value, delta, min, max) !== clamp(value, min, max);
}
