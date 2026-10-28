/** A gap in the run of page numbers, drawn as an ellipsis. */
export const GAP = "gap";

export type PaginationItem = number | typeof GAP;

/**
 * Which page numbers to show, and where the gaps fall.
 *
 * The first and last page are always present — they are the two a reader
 * navigates to by name ("go back to the start", "how many are there?") —
 * with `siblings` pages either side of the current one and an ellipsis
 * wherever the run jumps.
 *
 * **The number of slots is constant.** For a given `siblings` this always
 * returns the same length once there are enough pages to need gaps, so the
 * control does not change width as you page through it. A pagination bar
 * that reflows under the cursor moves the button you were about to press,
 * which is the same class of problem tabular figures solve for `Timer`.
 *
 * Pages are 1-based, because that is what a person reads and what almost
 * every paged API returns.
 */
export function paginationRange(
  value: number,
  total: number,
  siblings = 1,
): PaginationItem[] {
  // `count` rather than reusing `total`: the argument is whatever the
  // caller passed and this is the floored, non-negative version.
  const count = Math.max(0, Math.floor(total));
  if (count === 0) return [];

  const current = Math.min(Math.max(1, Math.floor(value)), count);
  const window = Math.max(0, Math.floor(siblings));

  // first + last + current + two gaps + the siblings either side.
  const slots = window * 2 + 5;
  if (count <= slots) {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  const left = Math.max(current - window, 1);
  const right = Math.min(current + window, count);

  // A gap is only worth drawing when it hides *two or more* pages: an
  // ellipsis standing in for a single number takes the same room and tells
  // the reader less. The left gap hides `left - 2` pages and the right one
  // hides `total - 1 - right`, so both need to be at least 2 — the bound
  // that is easy to get wrong by one, and was.
  const gapLeft = left - 2 >= 2;
  const gapRight = count - 1 - right >= 2;

  if (!gapLeft && gapRight) {
    // Near the start: run from 1, then one gap, then the last page.
    const run = slots - 2;
    return [
      ...Array.from({ length: run }, (_, index) => index + 1),
      GAP,
      count,
    ];
  }

  if (gapLeft && !gapRight) {
    // Near the end: the first page, one gap, then a run to the last.
    const run = slots - 2;
    return [
      1,
      GAP,
      ...Array.from({ length: run }, (_, index) => count - run + index + 1),
    ];
  }

  return [
    1,
    GAP,
    ...Array.from({ length: right - left + 1 }, (_, index) => left + index),
    GAP,
    count,
  ];
}

/** The page a step lands on, kept inside the range. */
export function clampPage(value: number, total: number): number {
  const count = Math.max(1, Math.floor(total));
  return Math.min(Math.max(1, Math.round(value)), count);
}
