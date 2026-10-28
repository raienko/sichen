/**
 * Seconds as a clock, the way every player writes them: `m:ss`, growing to
 * `h:mm:ss` only once there's an hour to show — a two-minute track reading
 * "0:00:42" looks like a bug.
 *
 * Anything unusable (a negative, a `NaN`, the `0` a player reports before
 * it knows the duration) comes back as `0:00` rather than propagating.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  const padded = String(remainder).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${padded}`
    : `${minutes}:${padded}`;
}
