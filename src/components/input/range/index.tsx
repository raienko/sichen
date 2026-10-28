import { forwardRef } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import Slider from "@/components/slider";

import FormField from "@/components/form-field";
import type { CommonInputProps, RangeInputTypeProps } from "../types";

type WithoutType<Props> = Props extends unknown ? Omit<Props, "type"> : never;
type Props = WithoutType<RangeInputTypeProps> & CommonInputProps;

/** Numeric range field backed by the shared single- or multi-thumb Slider. */
const RangeInput = forwardRef<RNTextInputInstance, Props>(
  function RangeInput(props, _ref) {
    const {
      value,
      onChange,
      min,
      max,
      step,
      sliderType,
      thumbLabels,
      formatValue,
      label,
      disabled,
      error,
      helperText,
      required,
      style,
      onFocus,
      onBlur,
    } = props;

    const common = {
      type: sliderType,
      label,
      min,
      max,
      step,
      thumbLabels,
      formatValue,
      disabled,
      accessibilityHint: error,
      onFocus,
      onBlur,
    } as const;

    return (
      <FormField
        error={error}
        helperText={helperText}
        required={required}
        style={style}
      >
        {Array.isArray(value) ? (
          <Slider
            {...common}
            value={value}
            onChange={onChange as (value: number[]) => void}
          />
        ) : (
          <Slider
            {...common}
            value={value}
            onChange={onChange as (value: number) => void}
          />
        )}
      </FormField>
    );
  },
);

RangeInput.displayName = "RangeInput";

export default RangeInput;
