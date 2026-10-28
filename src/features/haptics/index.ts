import {
  ImpactFeedbackStyle,
  impactAsync,
  NotificationFeedbackType,
  notificationAsync,
  selectionAsync,
} from "expo-haptics";

import logger from "@/features/logger";
import { LocalValue } from "@/features/storage";
import { isWeb } from "@/utils";

export type ImpactStrength = "light" | "medium" | "heavy" | "soft" | "rigid";

const STRENGTHS: Record<ImpactStrength, ImpactFeedbackStyle> = {
  light: ImpactFeedbackStyle.Light,
  medium: ImpactFeedbackStyle.Medium,
  heavy: ImpactFeedbackStyle.Heavy,
  soft: ImpactFeedbackStyle.Soft,
  rigid: ImpactFeedbackStyle.Rigid,
};

/** The user's setting; unset means on. */
const enabledValue = new LocalValue<boolean>("haptics-enabled");

/**
 * Fire and forget: feedback is a nicety, so a call never throws, never
 * needs awaiting, and does nothing when it's turned off or on web — the
 * Vibration API is a buzz, not a tap, and desktops have nothing to buzz.
 */
function play(effect: () => Promise<void>): void {
  if (isWeb || enabledValue.getValue() === false) return;
  effect().catch((error: unknown) => logger.log("haptics failed", error));
}

/**
 * Haptic feedback in one call, named by what happened rather than by the
 * engine's vocabulary.
 *
 * @example
 * haptics.tap();       // a press landed
 * haptics.selection(); // a picker, slider or segment moved one step
 * haptics.success();   // saved, sent, done
 * haptics.error();     // refused
 */
export const haptics = {
  /** A light press — buttons, toggles. */
  tap: () => play(() => impactAsync(ImpactFeedbackStyle.Light)),
  /** A physical bump of a given strength — a drop, a snap into place. */
  impact: (strength: ImpactStrength = "medium") =>
    play(() => impactAsync(STRENGTHS[strength])),
  /** One step of a changing value — pickers, sliders, segments. */
  selection: () => play(selectionAsync),
  success: () =>
    play(() => notificationAsync(NotificationFeedbackType.Success)),
  warning: () =>
    play(() => notificationAsync(NotificationFeedbackType.Warning)),
  error: () => play(() => notificationAsync(NotificationFeedbackType.Error)),

  /** Whether feedback plays — for a settings switch. */
  isEnabled: (): boolean => enabledValue.getValue() !== false,
  setEnabled: (enabled: boolean) => enabledValue.setValue(enabled),
  /** `isEnabled`, re-rendering when it changes. */
  useEnabled: (): boolean => enabledValue.useValue() !== false,
};
