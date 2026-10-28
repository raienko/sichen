import { forwardRef } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import BaseInput from "../base";
import type { CommonInputProps, NumericInputTypeProps } from "../types";
import useNumericText from "./use-numeric-text";

type Props = Omit<NumericInputTypeProps, "type"> & CommonInputProps;

/**
 * `value`/`onChange` are `number | null` instead of `string` — the actual
 * text buffering, digit filtering, and min/max clamping live in
 * useNumericText, kept in this folder since it's numeric-only logic no other
 * variation needs.
 */
const NumericInput = forwardRef<RNTextInputInstance, Props>(
  function NumericInput({ value, onChange, min, max, ...props }, ref) {
    const { text, onChangeText } = useNumericText(value, onChange, min, max);

    return (
      <BaseInput
        ref={ref}
        {...props}
        value={text}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
      />
    );
  },
);

NumericInput.displayName = "NumericInput";

export default NumericInput;
