import type { ReactNode } from "react";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";

/** Props every input variation shares. */

/**
 * Shared across every input variation. Type-specific props (value/onChange's
 * exact shape, plus whatever extras that type needs) live in that type's own
 * props type below, and that type's UI/logic lives in its own folder
 * (./base, ./text, ./numeric, ...).
 */
export type CommonInputProps = {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Off by default for every variation — override per field when wanted. */
  autoCapitalize?: TextInputProps["autoCapitalize"];
  /** Off by default for every variation — override per field when wanted. */
  autoCorrect?: boolean;
  /** Shown under the field and switches it to its invalid styling; takes priority over helperText. */
  error?: string;
  /** Shown under the field when there's no error. */
  helperText?: string;
  /**
   * Marks the field "Required" beside its label, and says so to a screen
   * reader as part of the field's name. Not required means optional.
   */
  required?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** The field's id; variations with parts of their own derive theirs from it. */
  testID?: string;
};
