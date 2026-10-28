/**
 * Every visual variation a toast comes in. Declared as a list rather than a
 * free-form string so a typo is a `tsc` error and so the set is
 * discoverable — the same reason LOCALES, THEME_PREFERENCES and
 * DEEP_LINK_GATES are enumerated rather than inferred.
 *
 * Adding one is an entry here plus an entry in ./config.ts (icon, accent,
 * urgency) and a `toast.<type>` translation key; nothing else changes.
 */
export const TOAST_TYPES = ["success", "error", "warning", "info"] as const;

export type ToastType = (typeof TOAST_TYPES)[number];

/** What a toast looks like, independent of how long it stays up. */
export type ToastContent = {
  /** Chooses the icon, accent colour and screen-reader urgency — see ./config.ts. Defaults to `"info"`. */
  type?: ToastType;
  /** An optional bold first line, for when the message alone needs a headline. */
  title?: string;
  message: string;
  /**
   * Where pressing the toast takes the user, dispatched through
   * `deepLinks.open()` — the same pipeline an OS link, a universal link or
   * a tapped push notification goes through, so a toast's action is
   * declared in `features/deep-links/routes.ts` next to every other link
   * rather than as a callback only this call site can see.
   *
   * Any URL that pipeline takes works: a bare path (`/orders/12`), this
   * app's scheme (`app://orders/12`), a universal link, or an external URL
   * (handed to the OS). Pressing also dismisses the toast.
   *
   * There is deliberately no `onPress` alternative. A route's `handle` can
   * do anything a callback could — show a modal, refetch, apply a code —
   * without navigating, so a second, untyped press channel would only split
   * "what does this link do?" across two places.
   */
  link?: string;
  /**
   * Text for the press affordance shown alongside the message ("View",
   * "Retry"). Only rendered when there's a `link` to press. Without one the
   * whole toast is still pressable; this just makes the action visible.
   */
  actionLabel?: string;
  /** Whether a close control is rendered. Defaults to `true` — see ./store.ts. */
  dismissible?: boolean;
};

/** Everything `Toast.show()` accepts: what to render, plus how long for. */
export type ToastOptions = ToastContent & {
  /**
   * Reuses an existing toast when one with this id is already up: its
   * content is replaced in place and its expiry restarts, instead of a
   * near-duplicate stacking below it. Auto-generated when omitted.
   */
  id?: string;
  /**
   * How long the toast stays up, in milliseconds from the moment it becomes
   * visible. `null` keeps it up until something hides it. Defaults to
   * DEFAULT_DURATION (./constants.ts).
   *
   * Ignored when `expiresAt` is given.
   */
  duration?: number | null;
  /**
   * When the toast expires, as an absolute moment rather than a countdown —
   * for a deadline the app didn't start (an offer that ends at a time the
   * server chose, a code that stops being valid). Wins over `duration`.
   *
   * A moment already in the past means the toast is never shown at all,
   * which is also what happens to one that expires while queued behind
   * MAX_VISIBLE others.
   */
  expiresAt?: Date | number;
  /** Fires once the toast has fully left the screen, however it was hidden. */
  onHide?: () => void;
};

/** One toast as the store holds it: options normalized and given an identity. */
export type ToastEntry = Required<Pick<ToastContent, "type" | "dismissible">> &
  Omit<ToastContent, "type" | "dismissible"> & {
    id: string;
    /**
     * Absolute expiry once the toast is visible, or `null` while a relative
     * lifetime is queued / when the toast waits to be hidden.
     */
    expiresAt: number | null;
    /** True once hiding has started — it's still mounted, animating out. */
    leaving: boolean;
    onHide?: () => void;
  };
