import { DEFAULT_DURATION } from "./constants";
import type { ToastEntry, ToastOptions } from "./types";

/**
 * How a toast's options become the entry the store holds, and when its
 * clock starts. Pure, so lifetimes can be tested without timers; the store
 * owns the timers and the list.
 */

/** Store-only timing state; callers and rendered items don't need it. */
export type StoredToastEntry = ToastEntry & {
  /** Relative lifetime waiting to start on first visibility. */
  pendingDuration: number | null;
};

let nextId = 0;

/** Options normalized into an entry, with defaults and an id. */
export function createEntry({
  id,
  type = "info",
  dismissible = true,
  duration,
  expiresAt,
  ...content
}: ToastOptions): StoredToastEntry {
  nextId += 1;

  return {
    ...content,
    id: id ?? `toast-${nextId}`,
    type,
    dismissible,
    ...resolveExpiry(duration, expiresAt),
    leaving: false,
  };
}

/**
 * Relative durations remain pending until the toast becomes visible;
 * `expiresAt` is an absolute moment and wins when both are given. `null`
 * duration means "until something hides it", which is distinct from "not
 * specified" — hence the explicit `undefined` check rather than `??`.
 */
export function resolveExpiry(
  duration: number | null | undefined,
  expiresAt: Date | number | undefined,
): Pick<StoredToastEntry, "expiresAt" | "pendingDuration"> {
  if (expiresAt !== undefined) {
    return { expiresAt: Number(expiresAt), pendingDuration: null };
  }

  return {
    expiresAt: null,
    pendingDuration: duration === null ? null : (duration ?? DEFAULT_DURATION),
  };
}

/**
 * Turns a pending relative duration into an absolute deadline the first
 * time its toast is within the first `visibleCount`, so a queued toast gets
 * its full requested time on screen. Entries that already have a deadline,
 * or are still queued, come back unchanged.
 */
export function startVisibleClocks(
  entries: readonly StoredToastEntry[],
  visibleCount: number,
  now: number,
): StoredToastEntry[] {
  return entries.map((entry, index) =>
    index < visibleCount && entry.pendingDuration !== null
      ? {
          ...entry,
          expiresAt: now + entry.pendingDuration,
          pendingDuration: null,
        }
      : entry,
  );
}
