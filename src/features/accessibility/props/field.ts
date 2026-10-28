import type { AccessibilityProps } from "react-native";

/** Props for text fields. */

type FieldOptions = {
  /** A field's visible label, or its placeholder when it has no label. */
  label?: string;
  disabled?: boolean;
  /** The validation message, when the field is invalid. */
  error?: string;
};

/**
 * The accessibility props for a text field. A sibling `<Text>` label isn't
 * automatically associated with an input the way HTML's `<label for>` is,
 * so the label has to be passed explicitly.
 *
 * An `error` becomes the field's `accessibilityHint`, which VoiceOver and
 * TalkBack read out after its label. RN has no "invalid" accessibility
 * state to set — that's an ARIA concept with no React Native equivalent —
 * so a hint is the portable way to make a screen reader announce *why* a
 * field is wrong rather than leaving the red border as the only signal.
 */
export function fieldA11yProps({
  label,
  disabled,
  error,
}: FieldOptions = {}): AccessibilityProps {
  return {
    ...(label === undefined ? null : { accessibilityLabel: label }),
    accessibilityState: { disabled: disabled ?? false },
    // See the note in controlA11yProps on why both spellings are emitted.
    "aria-disabled": disabled ?? false,
    ...(error === undefined ? null : { accessibilityHint: error }),
  };
}
