/**
 * How a badge turns a number into the two or three characters it has room
 * for. Split from the component and pure, for the same reason
 * `stepper/step.ts` is: the rounding and overflow rules are where the
 * mistakes live, and they're worth testing without rendering anything.
 */
import { formatNumber } from "@/features/localization";

/**
 * The count as digits in the active locale, capped at `max` and handed to
 * `overflow` when it goes over.
 *
 * `overflow` is a function rather than a `"+"` appended here because the
 * suffix is copy — a locale is free to put it somewhere else — so it comes
 * from a translation key at the call site.
 */
export function formatCount(
  count: number,
  max: number,
  locale: string,
  overflow: (value: string) => string,
): string {
  const capped = Math.min(count, max);
  const value = formatNumber(capped, locale);
  return count > max ? overflow(value) : value;
}
