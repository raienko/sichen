import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { msUntilNextSecond, toSeconds } from "./duration";

type Options = {
  /** The moment being counted to, or from. */
  target: number;
  /** `-1` counts down to `target`, `1` counts up from it. */
  direction: -1 | 1;
  paused: boolean;
  onComplete?: () => void;
};

/**
 * Remaining (counting down) or elapsed (counting up), from one place.
 *
 * One function rather than the same arithmetic written where each is
 * needed: the first version had it twice with the sign inverted in the
 * copy the scheduler used, so every countdown reported itself complete on
 * the first tick and never redrew again.
 */
function valueAt(now: number, target: number, direction: -1 | 1): number {
  return (now - target) * direction;
}

/**
 * The elapsed or remaining milliseconds, redrawn once per second.
 *
 * **Derived from a timestamp, never accumulated.** Every read is
 * `Date.now()` against the target, so the value cannot drift, cannot be
 * wrong after the app was backgrounded (where JS timers are throttled or
 * stopped outright), and cannot be wrong after the device slept. A timer
 * that counted its own ticks would be visibly behind after any of those,
 * and the error would never be recovered.
 *
 * **One re-render per second, landing on the second.** The wait is to the
 * next boundary rather than a flat 1000ms — see `msUntilNextSecond` — so a
 * redraw happens exactly when the digits change, once each, instead of
 * drifting through the second and occasionally firing twice within one.
 *
 * The smooth part of the component is not here at all: the ring animates on
 * the UI thread through Reanimated and never touches React. This hook is
 * only what the *text* needs, and text that changes once a second is one
 * cheap re-render a second.
 */
export function useTimer({ target, direction, paused, onComplete }: Options) {
  const [now, setNow] = useState(() => Date.now());
  const completed = useRef(false);

  // Held in a ref so a caller's inline arrow doesn't restart the schedule
  // on every render — the effect below would otherwise tear down and
  // rebuild its timeout each time the parent drew. Assigned in an effect
  // rather than during render, which React's own lint rule forbids.
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completed.current = false;
  }, [target, direction]);

  useEffect(() => {
    if (paused) return;

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = Date.now();
      setNow(current);

      const value = valueAt(current, target, direction);
      if (direction === -1 && value <= 0) {
        if (!completed.current) {
          completed.current = true;
          complete.current?.();
        }
        // Nothing left to redraw: the deadline has passed and the value is
        // pinned at zero until the props change.
        return;
      }

      timeout = setTimeout(tick, msUntilNextSecond(value));
    };

    tick();

    // Coming back from the background is the one moment the value on
    // screen is guaranteed stale — the timeout that would have redrawn it
    // was throttled away while the app was gone.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      clearTimeout(timeout);
      tick();
    });

    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [target, direction, paused]);

  const value = valueAt(now, target, direction);
  return {
    /** Milliseconds remaining (counting down) or elapsed (counting up). */
    value: Math.max(0, value),
    /** Whole seconds, which is what the digits actually show. */
    seconds: toSeconds(Math.max(0, value)),
    finished: direction === -1 && value <= 0,
  };
}
