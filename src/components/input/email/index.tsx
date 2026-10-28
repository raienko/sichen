import { forwardRef } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import BaseInput from "../base";
import type { CommonInputProps, EmailInputTypeProps } from "../types";

type Props = Omit<EmailInputTypeProps, "type"> & CommonInputProps;

/**
 * Plain string in, string out, like TextInput — only forces the
 * email-address keyboard and autofill hint on top of BaseInput.
 * autoCapitalize/autoCorrect still default off via BaseInput, which is what
 * you want for an email anyway.
 *
 * The hint is what keeps iOS from guessing. React Native turns `email` into
 * `textContentType="emailAddress"`; without it, a field above a password is
 * taken for a login and gets the Passwords bar.
 *
 * @example <Input type="email" value={email} onChange={setEmail} />
 */
const EmailInput = forwardRef<RNTextInputInstance, Props>(function EmailInput(
  { value, onChange, ...props },
  ref,
) {
  return (
    <BaseInput
      ref={ref}
      {...props}
      value={value}
      onChangeText={onChange}
      keyboardType="email-address"
      autoComplete="email"
    />
  );
});

EmailInput.displayName = "EmailInput";

export default EmailInput;
