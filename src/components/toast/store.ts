import { useSyncExternalStore } from "react";

import logger from "@/features/logger";

import { ANIMATION_DURATION, MAX_VISIBLE } from "./constants";
import {
  createEntry,
  startVisibleClocks,
  type StoredToastEntry,
} from "./entry";
import type { ToastEntry, ToastOptions } from "./types";

/**
 * Every toast currently up, and every timer keeping one there.
 *
 * A single instance rather than React state or a context, for the same
 * reason `deepLinks` and `permissions` are: a toast is raised from wherever
 * the thing worth reporting happened — a catch block, an API client, a
 * deep-link handler — and none of those places is inside a component, let
 * alone inside a specific one. `ToastsProvider` subscribes to this and
 * renders it; nothing has to be inside the tree to *call* it.
 *
 * Expiry lives here rather than in the rendered item, so a toast's lifetime
 * doesn't depend on it having been mounted (or re-mounted) and can be
 * tested without rendering anything. A relative `duration` starts when the
 * toast becomes visible; an absolute `expiresAt` keeps counting while queued.
 */
class ToastStore {
  private entries: readonly StoredToastEntry[] = [];
  /** `entries` capped at MAX_VISIBLE, kept as its own stable array — see `list`. */
  private visible: readonly StoredToastEntry[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  /**
   * Whether toasts are allowed to expire on their own at all. Turned off
   * while a screen reader is running — see `ToastsProvider`, which is the
   * only thing that sets it.
   */
  private autoHide = true;

  /**
   * Every toast the UI should render, oldest first: the visible ones plus
   * any still animating out. Queued toasts are deliberately absent — they
   * aren't on screen yet.
   *
   * Held as a field rather than sliced per call: `useSyncExternalStore`
   * reads this as its snapshot and re-renders whenever the identity
   * changes, so a fresh array on every call would loop forever.
   */
  list(): readonly ToastEntry[] {
    return this.visible;
  }

  /** Toasts waiting for a slot above them to free up, oldest first. */
  queued(): readonly ToastEntry[] {
    return this.entries.slice(MAX_VISIBLE);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Puts a toast up (or, for an `id` that's already up, replaces it in
   * place and restarts its expiry). Returns the id to hide it by.
   *
   * Synchronous: `Toast.show()` is the awaitable wrapper around this, and
   * waits out the enter animation before resolving.
   */
  show(options: ToastOptions): string {
    const entry = createEntry(options);

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      // Already expired before it was ever raised — a stale push payload, a
      // deadline the app took too long to reach. Showing it for zero
      // milliseconds would be a flicker; not showing it is the same answer,
      // honestly.
      return entry.id;
    }

    if (
      !entry.dismissible &&
      entry.pendingDuration === null &&
      entry.expiresAt === null
    ) {
      logger.warn(
        `Toast "${entry.id}" is neither dismissible nor expiring — nothing but ` +
          `Toast.hide("${entry.id}")/Toast.hideAll() can ever take it off the screen.`,
      );
    }

    const existing = this.entries.findIndex(
      (candidate) => candidate.id === entry.id,
    );

    // Replacing includes replacing an *outgoing* toast: without this its
    // pending removal timer would fire a moment later and take the fresh
    // one down with it.
    if (existing !== -1) this.clearTimer(entry.id);

    this.commit(
      existing === -1
        ? [...this.entries, entry]
        : this.entries.map((candidate, index) =>
            index === existing ? entry : candidate,
          ),
    );

    return entry.id;
  }

  /**
   * Starts a toast leaving. It stays mounted (and stops taking presses)
   * while its exit animation plays, then is removed — `Toast.hide()` waits
   * out exactly that, so by the time it resolves the toast is gone.
   *
   * Hiding an unknown id is a silent no-op: a toast that already expired on
   * its own is the common way to get here, and warning about that would
   * make the honest `await Toast.hide(id)` cleanup noisy.
   */
  hide(id: string): void {
    const entry = this.entries.find((candidate) => candidate.id === id);
    if (!entry || entry.leaving) return;

    this.clearTimer(id);
    this.commit(
      this.entries.map((candidate) =>
        candidate.id === id ? { ...candidate, leaving: true } : candidate,
      ),
    );

    this.timers.set(
      id,
      setTimeout(() => this.remove(id), ANIMATION_DURATION),
    );
  }

  /** Starts every toast leaving at once, queued ones included. */
  hideAll(): void {
    for (const entry of this.entries) this.hide(entry.id);
  }

  /**
   * Whether toasts expire on their own. Off while a screen reader is
   * running: a countdown tuned to reading speed is the wrong clock for
   * someone listening to the screen one element at a time, and WCAG 2.2.1
   * asks for exactly this rather than a timing everyone has to keep up
   * with. Their close control is what takes them down instead — which is
   * why `dismissible` defaults to true.
   *
   * Turning it back on re-arms every visible toast against the expiry it
   * was given, so one whose moment passed while the screen reader was on
   * leaves as soon as it's off.
   */
  setAutoHide(enabled: boolean): void {
    if (enabled === this.autoHide) return;
    this.autoHide = enabled;

    if (!enabled) {
      for (const entry of this.entries) {
        if (!entry.leaving) this.clearTimer(entry.id);
      }
      return;
    }

    this.scheduleExpirations();
  }

  /** Drops every toast and timer immediately, with no exit animation. For tests. */
  reset(): void {
    for (const id of [...this.timers.keys()]) this.clearTimer(id);
    this.autoHide = true;
    this.commit([]);
  }

  private remove(id: string): void {
    const entry = this.entries.find((candidate) => candidate.id === id);
    if (!entry) return;

    this.clearTimer(id);
    this.commit(this.entries.filter((candidate) => candidate.id !== id));
    entry.onHide?.();
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.timers.delete(id);
  }

  /**
   * The one place `entries` is replaced. A relative duration becomes an
   * absolute deadline the first time its toast enters the visible slice.
   * This means a queued toast gets its full requested time on screen.
   */
  private commit(entries: readonly StoredToastEntry[]): void {
    this.entries = startVisibleClocks(entries, MAX_VISIBLE, Date.now());
    this.visible =
      this.entries.length <= MAX_VISIBLE
        ? this.entries
        : this.entries.slice(0, MAX_VISIBLE);
    this.scheduleExpirations();
    this.notify();
  }

  private scheduleExpirations(): void {
    if (!this.autoHide) return;

    for (const entry of this.entries) {
      if (entry.leaving || entry.expiresAt === null) continue;
      if (this.timers.has(entry.id)) continue;

      this.timers.set(
        entry.id,
        setTimeout(
          () => this.expire(entry.id),
          Math.max(0, entry.expiresAt - Date.now()),
        ),
      );
    }
  }

  private expire(id: string): void {
    const isVisible = this.visible.some((entry) => entry.id === id);

    // There is nothing to animate when an absolute deadline passes while a
    // toast is still queued. Removing it directly also prevents a stale
    // toast briefly appearing when a slot opens.
    if (!isVisible) {
      this.remove(id);
      return;
    }

    this.hide(id);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

const toasts = new ToastStore();

/**
 * The toasts to render, kept in sync with the store outside React.
 *
 * `useSyncExternalStore` rather than a context holding `useState`: the
 * store is the source of truth whether or not anything is mounted, and this
 * is React's own way of reading exactly that without a second copy of the
 * list to keep aligned.
 */
export function useToasts(): readonly ToastEntry[] {
  return useSyncExternalStore(
    (listener) => toasts.subscribe(listener),
    () => toasts.list(),
    () => toasts.list(),
  );
}

export default toasts;
