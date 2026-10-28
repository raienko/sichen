import { ANIMATION_DURATION, MAX_VISIBLE } from "./constants";
import toasts from "./store";

/**
 * The store's own behaviour — the queue, expiry, and the delay that keeps a
 * toast mounted while it animates out — with no component rendered.
 *
 * Kept apart from index.test.tsx on purpose: everything here runs on fake
 * timers, and installing those around a React render leaves work parked on
 * a timer that never fires once real ones come back, which then breaks
 * whatever renders next. Splitting by "does this need a tree?" is also how
 * `deep-links` is tested.
 */
beforeEach(() => {
  jest.useFakeTimers();
  toasts.reset();
});

afterEach(() => {
  toasts.reset();
  jest.useRealTimers();
});

describe("toast store", () => {
  it("expires a toast on its own after `duration`", () => {
    toasts.show({ message: "hello", duration: 1000 });
    expect(toasts.list()).toHaveLength(1);

    jest.advanceTimersByTime(1000);
    // Still mounted, but on its way out — that gap is the exit animation.
    expect(toasts.list()[0].leaving).toBe(true);

    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(toasts.list()).toHaveLength(0);
  });

  it("treats `expiresAt` as an absolute moment, ahead of `duration`", () => {
    toasts.show({
      message: "hello",
      duration: 10_000,
      expiresAt: new Date(Date.now() + 500),
    });

    jest.advanceTimersByTime(500 + ANIMATION_DURATION);
    expect(toasts.list()).toHaveLength(0);
  });

  it("never shows a toast whose expiry has already passed", () => {
    toasts.show({ message: "stale", expiresAt: Date.now() - 1 });

    expect(toasts.list()).toHaveLength(0);
  });

  it("keeps a toast up indefinitely when `duration` is null", () => {
    const id = toasts.show({ message: "sticky", duration: null });

    jest.advanceTimersByTime(60_000);
    expect(toasts.list()).toHaveLength(1);

    toasts.hide(id);
    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(toasts.list()).toHaveLength(0);
  });

  it("queues past MAX_VISIBLE and promotes as slots free up", () => {
    const ids = Array.from({ length: MAX_VISIBLE + 1 }, (unused, index) =>
      toasts.show({ message: `toast ${index}`, duration: null }),
    );

    expect(toasts.list()).toHaveLength(MAX_VISIBLE);
    expect(toasts.queued()).toHaveLength(1);

    toasts.hide(ids[0]);
    jest.advanceTimersByTime(ANIMATION_DURATION);

    expect(toasts.list()).toHaveLength(MAX_VISIBLE);
    expect(toasts.list().at(-1)?.id).toBe(ids.at(-1));
    expect(toasts.queued()).toHaveLength(0);
  });

  it("only starts a queued toast's countdown once it reaches the screen", () => {
    const ids = Array.from({ length: MAX_VISIBLE + 1 }, (unused, index) =>
      toasts.show({
        message: `toast ${index}`,
        duration: index === MAX_VISIBLE ? 1000 : null,
      }),
    );

    // Long past its duration, but it hasn't been on screen for any of it.
    jest.advanceTimersByTime(5000);
    expect(toasts.queued().map((entry) => entry.id)).toEqual([ids.at(-1)]);

    toasts.hide(ids[0]);
    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(toasts.list().at(-1)?.id).toBe(ids.at(-1));

    jest.advanceTimersByTime(999);
    expect(toasts.list().at(-1)).toMatchObject({
      id: ids.at(-1),
      leaving: false,
    });

    jest.advanceTimersByTime(1);
    expect(toasts.list().at(-1)).toMatchObject({
      id: ids.at(-1),
      leaving: true,
    });

    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(toasts.list().map((entry) => entry.id)).not.toContain(ids.at(-1));
  });

  it("removes an absolute expiry while the toast is still queued", () => {
    const onHide = jest.fn();

    for (let index = 0; index < MAX_VISIBLE; index += 1) {
      toasts.show({ message: `sticky ${index}`, duration: null });
    }

    const id = toasts.show({
      message: "deadline",
      expiresAt: Date.now() + 1000,
      onHide,
    });

    expect(toasts.queued().map((entry) => entry.id)).toContain(id);
    jest.advanceTimersByTime(1000);

    expect(toasts.queued().map((entry) => entry.id)).not.toContain(id);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("replaces a toast raised again under the same id instead of stacking one", () => {
    toasts.show({ id: "sync", message: "syncing", duration: null });
    toasts.show({ id: "sync", message: "synced", type: "success" });

    expect(toasts.list()).toHaveLength(1);
    expect(toasts.list()[0]).toMatchObject({
      message: "synced",
      type: "success",
    });
  });

  it("does not let a replaced toast's pending removal take the new one down", () => {
    toasts.show({ id: "sync", message: "syncing", duration: null });
    toasts.hide("sync");
    toasts.show({ id: "sync", message: "synced", duration: null });

    jest.advanceTimersByTime(ANIMATION_DURATION);

    expect(toasts.list()).toHaveLength(1);
    expect(toasts.list()[0].leaving).toBe(false);
  });

  it("hides every toast at once, queued ones included", () => {
    for (let index = 0; index <= MAX_VISIBLE; index += 1) {
      toasts.show({ message: `toast ${index}`, duration: null });
    }

    toasts.hideAll();
    jest.advanceTimersByTime(ANIMATION_DURATION);

    expect(toasts.list()).toHaveLength(0);
    expect(toasts.queued()).toHaveLength(0);
  });

  it("calls onHide once the toast has actually left", () => {
    const onHide = jest.fn();
    const id = toasts.show({ message: "hello", duration: null, onHide });

    toasts.hide(id);
    expect(onHide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("hiding an id that is already gone is a no-op, not an error", () => {
    expect(() => toasts.hide("never-existed")).not.toThrow();
  });

  it("stops expiring toasts while a screen reader is running", () => {
    toasts.show({ message: "hello", duration: 1000 });
    toasts.setAutoHide(false);

    jest.advanceTimersByTime(60_000);
    expect(toasts.list()).toHaveLength(1);

    // Back on, and the expiry it was given — long past by now — applies again.
    toasts.setAutoHide(true);
    jest.advanceTimersByTime(ANIMATION_DURATION);
    expect(toasts.list()).toHaveLength(0);
  });

  it("warns about a toast nothing on screen could ever dismiss", () => {
    const warn = jest.spyOn(console, "log").mockImplementation(() => {});

    toasts.show({
      id: "stuck",
      message: "hello",
      duration: null,
      dismissible: false,
    });

    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining('Toast "stuck"'),
    );
    warn.mockRestore();
  });

  it("keeps the snapshot's identity stable so a subscriber doesn't loop", () => {
    const before = toasts.list();

    expect(toasts.list()).toBe(before);

    toasts.show({ message: "hello", duration: null });
    expect(toasts.list()).not.toBe(before);
  });
});
