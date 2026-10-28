import type { SliderImplementationProps } from "./types";
import { normalizeSliderValue, normalizeSliderValues } from "./utils";
import { testId } from "@/utils";

export type SliderKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

export function getSliderBounds(props: SliderImplementationProps) {
  const min = props.min ?? 0;
  const requestedMax = props.max ?? 1;
  return { min, max: requestedMax > min ? requestedMax : min + 1 };
}

export function getSliderValues(props: SliderImplementationProps): number[] {
  const { min, max } = getSliderBounds(props);
  const values = Array.isArray(props.value) ? props.value : [props.value];
  const normalized = normalizeSliderValues(values, min, max, props.step);
  return normalized.length === 0 ? [min] : normalized;
}

export function getAccessibilityStep(
  min: number,
  max: number,
  step?: number,
): number {
  return step !== undefined && step > 0 ? step : (max - min) / 100;
}

export function getThumbLabel(
  props: SliderImplementationProps,
  index: number,
  count: number,
): string {
  return (
    props.thumbLabels?.[index] ??
    (count === 1 ? props.label : `${props.label} ${index + 1}`)
  );
}

export function getThumbTestID(
  testID: string | undefined,
  index: number,
  count: number,
): string | undefined {
  if (testID === undefined) return undefined;
  return count === 1 ? testID : testId(testID, "thumb", index);
}

export function changeSliderThumb(
  props: SliderImplementationProps,
  index: number,
  requestedValue: number,
): void {
  if (props.disabled) return;
  const { min, max } = getSliderBounds(props);
  const values = getSliderValues(props);
  const lowerBound = values[index - 1] ?? min;
  const upperBound = values[index + 1] ?? max;
  const nextValue = normalizeSliderValue(
    requestedValue,
    lowerBound,
    upperBound,
    props.step,
  );

  if (nextValue === values[index]) return;
  const next = values.map((value, valueIndex) =>
    valueIndex === index ? nextValue : value,
  );

  if (Array.isArray(props.value)) {
    (props.onChange as (value: number[]) => void)(next);
  } else {
    (props.onChange as (value: number) => void)(nextValue);
  }
}

export function handleSliderKey(
  event: SliderKeyEvent,
  props: SliderImplementationProps,
  index: number,
): void {
  if (props.disabled) return;
  const key = event.nativeEvent?.key ?? event.key;
  const { min, max } = getSliderBounds(props);
  const current = getSliderValues(props)[index];
  const amount = getAccessibilityStep(min, max, props.step);
  let next: number | undefined;

  if (key === "ArrowRight" || key === "ArrowUp") next = current + amount;
  if (key === "ArrowLeft" || key === "ArrowDown") next = current - amount;
  if (key === "Home") next = min;
  if (key === "End") next = max;
  if (next === undefined) return;

  event.preventDefault?.();
  changeSliderThumb(props, index, next);
}
