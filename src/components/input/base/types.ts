import type { TextInputProps as RNTextInputProps } from "react-native";

import type { CommonInputProps } from "../types";

export type BaseInputProps = CommonInputProps & {
  value: string;
  /**
   * Omitted only by a press-mode field (see `onPress`), which is never
   * editable and so can never fire it.
   */
  onChangeText?: (value: string) => void;
  keyboardType?: RNTextInputProps["keyboardType"];
  /**
   * Masks the field. Set by the `password` variation, which pairs it with a
   * toggle and an `autoComplete` hint — it is deliberately not on any
   * variation's own props, because masking on its own is the least useful
   * third of a password field.
   */
  secureTextEntry?: boolean;
  /**
   * What the OS and any password manager should offer to fill in. Off unless
   * a variation asks for it — an unlabelled field is better than one
   * labelled wrongly, which is how a password ends up autofilled into a
   * nickname box.
   */
  autoComplete?: RNTextInputProps["autoComplete"];
  /** Explicitly include fields such as phone in Android's autofill structure. */
  importantForAutofill?: RNTextInputProps["importantForAutofill"];
  /**
   * Turns the field into a button: it stops being typed into and instead
   * displays `value` (or `placeholder`, when empty) as read-only text,
   * calling this on tap. For a variation whose value is picked from
   * somewhere else — `select` picks it in a Modal — rather than typed.
   */
  onPress?: () => void;
  /** Only meaningful alongside `onPress`: whether what it opens is showing. */
  expanded?: boolean;
  /**
   * Several lines instead of one: the field starts `minLines` tall, grows
   * with its text up to `maxLines`, then scrolls. Set by the `textarea`
   * variation.
   */
  multiline?: { minLines: number; maxLines: number };
  /** A hard character limit, enforced by the OS keyboard as well as here. */
  maxLength?: number;
  /** A reading at the end of the helper row — see FormField's `counter`. */
  counter?: string;
  counterLabel?: string;
};
