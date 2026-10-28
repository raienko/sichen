import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, useWindowDimensions } from "react-native";

import AccessibilityContext from "./context";
import {
  ACCESSIBILITY_FLAGS,
  DEFAULT_FLAGS,
  readAllFlags,
  type AccessibilityFlag,
  type AccessibilityFlags,
} from "./settings";
import type { Accessibility } from "./types";

type Props = {
  children: ReactNode;
};

/**
 * Reads every OS accessibility flag once on mount and then keeps them live
 * via `AccessibilityInfo`'s change events — the same "resolve once, then
 * track the OS" shape `ThemeProvider` has for colour scheme, so a user
 * toggling VoiceOver or Reduce Motion in Settings is reflected without an
 * app restart.
 *
 * `fontScale` comes from `useWindowDimensions()` rather than a flag, since
 * RN already re-renders on text-size changes through it — no extra
 * subscription needed.
 */
export default function AccessibilityProvider({ children }: Props) {
  const [flags, setFlags] = useState<AccessibilityFlags>(DEFAULT_FLAGS);
  const { fontScale } = useWindowDimensions();

  useEffect(() => {
    let active = true;

    readAllFlags().then((next) => {
      if (active) setFlags(next);
    });

    const subscriptions = (
      Object.keys(ACCESSIBILITY_FLAGS) as AccessibilityFlag[]
    ).map((flag) =>
      AccessibilityInfo.addEventListener(
        ACCESSIBILITY_FLAGS[flag].event,
        (enabled) => {
          setFlags((current) =>
            current[flag] === enabled
              ? current
              : { ...current, [flag]: enabled },
          );
        },
      ),
    );

    return () => {
      active = false;
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  const duration = useCallback(
    (ms: number) => (flags.isReduceMotionEnabled ? 0 : ms),
    [flags.isReduceMotionEnabled],
  );

  const value = useMemo<Accessibility>(
    () => ({
      ...flags,
      fontScale,
      isLargeTextEnabled: fontScale > 1,
      duration,
    }),
    [flags, fontScale, duration],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
