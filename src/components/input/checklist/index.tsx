import { forwardRef } from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";

import Checkbox from "@/components/checkbox";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import FormField from "@/components/form-field";
import type { ChecklistInputTypeProps, CommonInputProps } from "../types";

type Props = Omit<ChecklistInputTypeProps, "type"> & CommonInputProps;

/**
 * A multi-value input composed from Checkbox. Each option stays its own
 * accessible checkbox; on web the surrounding list is additionally named
 * as a group, while native avoids an accessible wrapper that would collapse
 * all of the options into one screen-reader stop.
 */
const ChecklistInput = forwardRef<RNTextInputInstance, Props>(
  function ChecklistInput(
    {
      value,
      onChange,
      options,
      checkboxType,
      label,
      disabled = false,
      error,
      helperText,
      required,
      style,
    },
    _ref,
  ) {
    const styles = useStyles();

    function change(optionValue: string, checked: boolean) {
      if (checked) {
        if (!value.includes(optionValue)) {
          onChange([...value, optionValue]);
        }
        return;
      }

      onChange(value.filter((item) => item !== optionValue));
    }

    const webGroupProps =
      isWeb && label ? ({ role: "group", "aria-label": label } as const) : null;

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
            <Checkbox
              key={option.value}
              type={checkboxType}
              label={option.label}
              value={value.includes(option.value)}
              disabled={disabled || option.disabled}
              testID={option.testID}
              onChange={(checked) => change(option.value, checked)}
            />
          ))}
        </View>
      </FormField>
    );
  },
);

ChecklistInput.displayName = "ChecklistInput";

export default ChecklistInput;

const useStyles = createStyles(({ spacing }) => ({
  options: {
    gap: spacing.x4,
    alignItems: "flex-start",
  },
}));
