import { forwardRef, useState } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import BaseInput from "../base";
import type { CommonInputProps, PasswordInputTypeProps } from "../types";
import VisibilityToggle from "./visibility-toggle";

type Props = Omit<PasswordInputTypeProps, "type"> & CommonInputProps;

/**
 * A masked field with an eye in its right slot to unmask it.
 *
 * Masking, the toggle and the `autoComplete` hint together — which is why
 * masking isn't offered separately anywhere else: on its own it gives you a
 * field you can hide but never unhide, and that no password manager can fill.
 *
 * Whether the password is showing is deliberately not a prop. It's momentary
 * display state, and hoisting it invites it being persisted.
 *
 * @example <Input type="password" value={password} onChange={setPassword} label="Password" />
 * @example <Input type="password" newPassword value={password} onChange={setPassword} />
 */
const PasswordInput = forwardRef<RNTextInputInstance, Props>(
  function PasswordInput(
    { value, onChange, newPassword = false, rightSlot, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <BaseInput
        ref={ref}
        {...props}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!visible}
        autoComplete={newPassword ? "new-password" : "current-password"}
        rightSlot={
          rightSlot ?? (
            <VisibilityToggle
              visible={visible}
              disabled={props.disabled}
              onPress={() => setVisible((showing) => !showing)}
            />
          )
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
