import type { AccessibilityProps } from "react-native";

/** Props for feedback that updates on its own: progress and live status. */

type ProgressOptions = {
  /** What is progressing — "Uploading photos", "Downloading update". */
  label: string;
  /**
   * How far along, 0–1. Omit for an indeterminate bar: ARIA reads a missing
   * `aria-valuenow` as "the total isn't known", which is exactly the case,
   * and is why this is optional rather than defaulting to 0 — a bar sitting
   * at a reported 0% is a different claim from one that can't say.
   */
  value?: number;
  /** What that fraction is read as — "42%", "3 of 7". */
  valueText?: string;
};

/**
 * The accessibility props for a progress indicator.
 *
 * `accessibilityRole="progressbar"` is what native announces and
 * `role="progressbar"` is what react-native-web renders — the same
 * two-spelling split as the rest of this file. The range is reported on a
 * 0–100 scale rather than 0–1 because that is what both platforms read out
 * as a percentage; a `now` of `0.42` is announced as "0.42", not "42%".
 *
 * An indeterminate bar additionally reports `busy`, so a screen reader says
 * something is happening even though there is no figure to give.
 */
export function progressA11yProps({
  label,
  value,
  valueText,
}: ProgressOptions): AccessibilityProps {
  const indeterminate = value === undefined;
  const now = indeterminate ? undefined : Math.round(value * 100);

  return {
    accessibilityRole: "progressbar",
    role: "progressbar",
    accessibilityLabel: label,
    accessibilityValue: {
      min: 0,
      max: 100,
      ...(now === undefined ? null : { now }),
      ...(valueText === undefined ? null : { text: valueText }),
    },
    ...(indeterminate
      ? { accessibilityState: { busy: true }, "aria-busy": true }
      : null),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    ...(now === undefined ? null : { "aria-valuenow": now }),
    ...(valueText === undefined ? null : { "aria-valuetext": valueText }),
  };
}

type StatusOptions = {
  /**
   * How urgently the message should reach a screen reader. `"polite"` waits
   * for a pause in whatever is being read; `"assertive"` interrupts it.
   * Reserve assertive for something the user has to act on now — an error —
   * since interrupting is exactly as rude as it sounds.
   */
  urgency?: "polite" | "assertive";
  /**
   * What a screen reader announces instead of the region's own text. Useful
   * when the visible copy isn't the whole message — a `Toast` prefixes its
   * type ("Error, ...") because the colour and icon that convey it visually
   * say nothing out loud.
   */
  label?: string;
};

/**
 * The accessibility props for a region that appears (or changes) on its own
 * and should be announced without the user having to go find it — a toast,
 * an inline validation summary, a "saved" confirmation.
 *
 * Three spellings again, and again none of them covers everything:
 * `accessibilityLiveRegion` is Android's, `aria-live` is what
 * react-native-web turns into a real live region, and `role`
 * (`"status"`/`"alert"`) is what iOS VoiceOver and the DOM both understand.
 * iOS has no live-region concept at all, so a caller that must be heard
 * there announces explicitly on top of this — see `Toast`.
 */
export function statusA11yProps({
  urgency = "polite",
  label,
}: StatusOptions = {}): AccessibilityProps {
  return {
    accessibilityLiveRegion: urgency,
    "aria-live": urgency,
    role: urgency === "assertive" ? "alert" : "status",
    ...(label === undefined ? null : { accessibilityLabel: label }),
  };
}
