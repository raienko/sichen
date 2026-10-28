import { forwardRef } from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";

import RadioButton from "@/components/radio-button";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import FormField from "@/components/form-field";
import type { CommonInputProps, RadioGroupInputTypeProps } from "../types";

type Props = Omit<RadioGroupInputTypeProps, "type"> & CommonInputProps;

/** A single-value input that composes one RadioButton for every option. */
const RadioGroupInput = forwardRef<RNTextInputInstance, Props>(
  function RadioGroupInput(
    {
      value,
      onChange,
      options,
      radioType,
      label,
      disabled,
      error,
      helperText,
      required,
      style,
    },
    _ref,
  ) {
    const styles = useStyles();
    const webGroupProps = isWeb
      ? ({ role: "radiogroup", "aria-label": label } as const)
      : null;

    return (
      <FormField
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        style={style}
      >
        <View {...webGroupProps} style={styles.options}>
          {options.map((option) => (
            <RadioButton
              key={option.value}
              type={radioType}
              label={option.label}
              value={value === option.value}
              disabled={disabled || option.disabled}
              testID={option.testID}
              onChange={(selected) => {
                if (selected) onChange(option.value);
              }}
            />
          ))}
        </View>
      </FormField>
    );
  },
);

RadioGroupInput.displayName = "RadioGroupInput";

export default RadioGroupInput;

const useStyles = createStyles(({ spacing }) => ({
  options: {
    alignSelf: "stretch",
    gap: spacing.x4,
  },
}));
