import logger from "@/features/logger";

import type { DeepLink, DeepLinkGate, DeepLinkRoute } from "./types";

export type PendingLink = {
  link: DeepLink;
  route: DeepLinkRoute;
  /** Every gate this link is waiting on, including the built-in `ready`. */
  gates: DeepLinkGate[];
};

/**
 * How many links are held at once. A queue only drains when a gate opens,
 * so a gate that never opens (a user who never signs in) would otherwise
 * grow it for the lifetime of the process. Ten is far more than the one or
 * two links a session realistically defers, and the oldest goes first
 * because the newest tap is the one the user is waiting on.
 */
const MAX_PENDING = 10;

/**
 * Links that matched a route but can't run yet, because at least one of the
 * route's gates is closed.
 *
 * Deliberately in memory only: a link held here is a *this-launch* intent,
 * and persisting it would mean a link tapped last week reopening a screen
 * out of nowhere on some later launch. An app that does want that — an
 * invite that has to survive an install — should persist that one link
 * itself with `LocalValue` (@/features/storage) and its own expiry, and
 * hand it back through `deepLinks.open()`.
 */
export default class DeepLinkQueue {
  private pending: PendingLink[] = [];

  get size(): number {
    return this.pending.length;
  }

  /** Oldest first — the order they'll be dispatched in. */
  list(): readonly PendingLink[] {
    return this.pending;
  }

  add(entry: PendingLink): void {
    this.pending.push(entry);

    if (this.pending.length > MAX_PENDING) {
      const dropped = this.pending.shift();
      logger.warn(
        `Deep links: more than ${MAX_PENDING} links are waiting on a gate — ` +
          `dropped the oldest ("${dropped?.link.url}").`,
      );
    }
  }

  /** Removes and returns every link whose gates are all open, oldest first. */
  release(isOpen: (gate: DeepLinkGate) => boolean): PendingLink[] {
    const released: PendingLink[] = [];

    this.pending = this.pending.filter((entry) => {
      if (!entry.gates.every(isOpen)) return true;
      released.push(entry);
      return false;
    });

    return released;
  }

  clear(): void {
    this.pending = [];
  }
}
