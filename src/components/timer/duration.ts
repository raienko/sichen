const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How a duration is written on screen. */
export type DurationFormat = "auto" | "clock" | "minutes";

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/**
 * A duration in whole seconds, rounded **up**.
 *
 * Up, not down, and it matters: rounding down shows `0` for the entire
 * final second, so a countdown reads "0" for a second before anything
 * happens. Rounding up shows `1` until the moment the deadline passes,
 * which is what a person watching a clock expects.
 */
export function toSeconds(ms: number): number {
  return Math.ceil(Math.max(0, ms) / SECOND);
}

/**
 * A duration as digits.
 *
 * - `"auto"` grows with the magnitude — `4:07` under an hour, `1:04:07`
 *   under a day, `2d 04:07` beyond one. A countdown to next week should not
 *   be written `10084:07`, and one to next minute should not be padded out
 *   to `0:00:04:07`.
 * - `"clock"` is always `h:mm:ss`, for a row of timers that would otherwise
 *   change width as each crosses an hour.
 * - `"minutes"` is always `m:ss`, for a short timer that must never grow.
 */
export function formatDuration(
  ms: number,
  format: DurationFormat = "auto",
): string {
  const total = toSeconds(ms);
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);

  if (format === "minutes") {
    return `${Math.floor(total / 60)}:${pad(seconds)}`;
  }

  if (format === "clock") {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  const days = Math.floor(total / 86400);
  if (days > 0) {
    return `${days}d ${pad(hours % 24)}:${pad(minutes)}`;
  }
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * The same duration in words, for a screen reader.
 *
 * `4:07` is read out as "four oh seven", which is a time of day rather than
 * a length of one — so the spoken form is built separately instead of
 * handing the digits to `accessibilityLabel` and hoping.
 *
 * Only the two largest units that carry information: "1 hour 4 minutes" is
 * the useful answer, and appending "7 seconds" to it is noise on something
 * a user may re-read every few seconds.
 */
export function describeDuration(ms: number): string {
  const total = toSeconds(ms);
  if (total === 0) return "0 seconds";

  const units: [number, string][] = [
    [Math.floor(total / 86400), "day"],
    [Math.floor(total / 3600) % 24, "hour"],
    [Math.floor(total / 60) % 60, "minute"],
    [total % 60, "second"],
  ];

  return units
    .filter(([value]) => value > 0)
    .slice(0, 2)
    .map(([value, unit]) => `${value} ${unit}${value === 1 ? "" : "s"}`)
    .join(" ");
}

/**
 * How long to wait before the digits next change.
 *
 * The reason this exists rather than a `setInterval(1000)`: an interval
 * drifts, so a timer started at `x.900` redraws at `.900`, `.900`, `.900`
 * — always 100ms after the second it is showing actually turned over, and
 * further out as the drift accumulates. Waiting for the *boundary* instead
 * means every redraw lands when the displayed number really changes, and
 * there is exactly one redraw per second rather than one that occasionally
 * lands twice in the same second.
 */
export function msUntilNextSecond(ms: number): number {
  const remainder = Math.max(0, ms) % SECOND;
  return remainder === 0 ? SECOND : remainder;
}

export { SECOND, MINUTE, HOUR, DAY };
