import { useRef } from "react";

/** The longest gap between two taps that still counts as a double tap. */
const DOUBLE_TAP_MS = 300;

/**
 * One press handler for a single and a double tap. The first tap acts at
 * once, so selection never waits; a second tap inside the window runs
 * `onDouble` instead of another single tap.
 */
export function useDoubleTap(
  onSingle?: () => void,
  onDouble?: () => void,
): (() => void) | undefined {
  const last = useRef(0);
  if (!onSingle) return undefined;
  return () => {
    const now = Date.now();
    if (onDouble && now - last.current < DOUBLE_TAP_MS) {
      last.current = 0;
      onDouble();
      return;
    }
    last.current = now;
    onSingle();
  };
}
