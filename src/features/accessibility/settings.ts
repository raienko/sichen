import { AccessibilityInfo } from "react-native";

import readScreenReaderEnabled from "./screen-reader";

/**
 * Every OS accessibility flag this app reacts to, as data: which
 * `AccessibilityInfo` query reads it, and which event fires when the user
 * changes it in system settings. The provider iterates this map rather than
 * hand-wiring each flag, so adding one is a single entry here — same
 * "derive from one table" shape as `MODAL_TYPE_CONFIG` and `ICON_SETS`.
 *
 * Several flags are iOS-only (RN's own typings mark them so). Rather than
 * branching per platform at every call site, each query is wrapped so an
 * unsupported platform resolves `false` — "the user has not turned this on"
 * is the right answer for a setting the OS doesn't have.
 */
export const ACCESSIBILITY_FLAGS = {
  /** VoiceOver (iOS) / TalkBack (Android) is running. */
  isScreenReaderEnabled: {
    query: readScreenReaderEnabled,
    event: "screenReaderChanged",
  },
  /** "Reduce Motion" — animations should be shortened or skipped. */
  isReduceMotionEnabled: {
    query: () => AccessibilityInfo.isReduceMotionEnabled(),
    event: "reduceMotionChanged",
  },
  /** iOS "Bold Text". */
  isBoldTextEnabled: {
    query: () => AccessibilityInfo.isBoldTextEnabled(),
    event: "boldTextChanged",
  },
  /** iOS "Reduce Transparency" — blur/translucency should fall back to opaque. */
  isReduceTransparencyEnabled: {
    query: () => AccessibilityInfo.isReduceTransparencyEnabled(),
    event: "reduceTransparencyChanged",
  },
  /** iOS "Invert Colors". */
  isInvertColorsEnabled: {
    query: () => AccessibilityInfo.isInvertColorsEnabled(),
    event: "invertColorsChanged",
  },
  /** iOS "Grayscale". */
  isGrayscaleEnabled: {
    query: () => AccessibilityInfo.isGrayscaleEnabled(),
    event: "grayscaleChanged",
  },
} as const;

export type AccessibilityFlag = keyof typeof ACCESSIBILITY_FLAGS;

export type AccessibilityFlags = { [K in AccessibilityFlag]: boolean };

export const DEFAULT_FLAGS: AccessibilityFlags = Object.fromEntries(
  Object.keys(ACCESSIBILITY_FLAGS).map((flag) => [flag, false]),
) as AccessibilityFlags;

/**
 * Reads every flag once. A rejected query (an iOS-only flag on Android, or
 * an OS that doesn't answer) resolves `false` instead of failing the whole
 * batch — see the note above.
 */
export async function readAllFlags(): Promise<AccessibilityFlags> {
  const entries = await Promise.all(
    (Object.keys(ACCESSIBILITY_FLAGS) as AccessibilityFlag[]).map(
      async (flag) => {
        try {
          return [flag, await ACCESSIBILITY_FLAGS[flag].query()] as const;
        } catch {
          return [flag, false] as const;
        }
      },
    ),
  );
  return Object.fromEntries(entries) as AccessibilityFlags;
}
