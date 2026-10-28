export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(value: number): number {
  const text = String(value).toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.split(".")[1]?.length ?? 0;
}

/** Clamps and, when supplied, snaps a value to a step relative to min. */
export function normalizeSliderValue(
  value: number,
  min: number,
  max: number,
  step?: number,
): number {
  const clamped = clamp(Number.isFinite(value) ? value : min, min, max);
  if (step === undefined || step <= 0) return clamped;

  const stepped = min + Math.round((clamped - min) / step) * step;
  const precision = Math.max(
    decimalPlaces(min),
    decimalPlaces(max),
    decimalPlaces(step),
  );
  return clamp(Number(stepped.toFixed(precision)), min, max);
}

export function normalizeSliderValues(
  values: number[],
  min: number,
  max: number,
  step?: number,
): number[] {
  return values
    .map((value) => normalizeSliderValue(value, min, max, step))
    .sort((a, b) => a - b);
}

export function sliderPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}
