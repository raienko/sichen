import { forwardRef } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import BaseInput from "../base";
import type { CommonInputProps, TextInputTypeProps } from "../types";

type Props = Omit<TextInputTypeProps, "type"> & CommonInputProps;

/**
 * Plain string in, string out — the default variation, and the one that adds
 * nothing at all. Everything (label, slots, focus/disabled styling, the
 * autoCapitalize/autoCorrect-off defaults) comes from BaseInput; this exists
 * so `type` has a default case rather than because a plain text field needs
 * behaviour of its own.
 *
 * Masking deliberately isn't here. It used to be, as a `secureTextEntry`
 * prop, which gave you a field you could hide but never unhide and that no
 * password manager could recognise — see ./password, which is the whole
 * feature rather than one third of it.
 */
const TextInput = forwardRef<RNTextInputInstance, Props>(function TextInput(
  { value, onChange, ...props },
  ref,
) {
  return (
    <BaseInput ref={ref} {...props} value={value} onChangeText={onChange} />
  );
});

// forwardRef components have no .name (unlike a plain function component) —
// set explicitly so `describe(\`${Component.displayName} smoke test\`, ...)`
// still works the same way it does for every non-forwardRef component here.
TextInput.displayName = "TextInput";

export default TextInput;
