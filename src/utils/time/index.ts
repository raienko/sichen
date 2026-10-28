/**
 * Time spans in milliseconds — what `setTimeout`, `Date` arithmetic, query
 * cache times and animations all take — so `minutes(5)` is written instead
 * of `5 * 60 * 1000`.
 *
 * Months and years are fixed lengths (30 and 365 days): right for "about
 * how long ago" and cache lifetimes, wrong for calendar maths — add to a
 * `Date`'s month or year for that.
 *
 * @example
 * setTimeout(close, seconds(17));
 * const expiresAt = Date.now() + days(30);
 * if (age > hours(1)) refresh();
 * await wait(seconds(2));
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

export const seconds = (count: number): number => count * SECOND;
export const minutes = (count: number): number => count * MINUTE;
export const hours = (count: number): number => count * HOUR;
export const days = (count: number): number => count * DAY;
export const weeks = (count: number): number => count * WEEK;
export const months = (count: number): number => count * MONTH;
export const years = (count: number): number => count * YEAR;

export type TimeUnit =
  "year" | "month" | "week" | "day" | "hour" | "minute" | "second";

/** Every unit with its length, largest first — for "pick the biggest unit that fits". */
export const TIME_UNITS: readonly (readonly [TimeUnit, number])[] = [
  ["year", YEAR],
  ["month", MONTH],
  ["week", WEEK],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
  ["second", SECOND],
];

type Span = Partial<
  Record<
    "years" | "months" | "weeks" | "days" | "hours" | "minutes" | "seconds",
    number
  >
>;

/**
 * Several units at once.
 *
 * @example
 * duration({ hours: 1, minutes: 30 }); // 5_400_000
 */
export function duration({
  years: y = 0,
  months: mo = 0,
  weeks: w = 0,
  days: d = 0,
  hours: h = 0,
  minutes: m = 0,
  seconds: s = 0,
}: Span): number {
  return (
    years(y) +
    months(mo) +
    weeks(w) +
    days(d) +
    hours(h) +
    minutes(m) +
    seconds(s)
  );
}

/**
 * A span of milliseconds in another unit, with the fraction kept —
 * round it yourself: `Math.floor(toUnit(elapsed, "minute"))`.
 */
export function toUnit(milliseconds: number, unit: TimeUnit): number {
  const size = TIME_UNITS.find(([name]) => name === unit)?.[1] ?? SECOND;
  return milliseconds / size;
}

/** Resolves after the requested number of milliseconds: `await wait(seconds(2))`. */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
