import { forwardRef } from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";

import If from "@/components/if";
import Switch from "@/components/switch";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import FormField from "@/components/form-field";
import type { CommonInputProps, SwitchGroupInputTypeProps } from "../types";

type Props = Omit<SwitchGroupInputTypeProps, "type"> & CommonInputProps;

/**
 * A multi-value settings input composed from Switch. With `groupSwitch`, the
 * group's own labelled header controls every enabled option while leaving
 * disabled and unknown values untouched.
 */
const SwitchGroupInput = forwardRef<RNTextInputInstance, Props>(
  function SwitchGroupInput(
    {
      value,
      onChange,
      options,
      groupSwitch = false,
      groupSwitchTestID,
      switchType,
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
    const enabledOptions = options.filter((option) => !option.disabled);
    const enabledValues = new Set(enabledOptions.map((option) => option.value));
    const groupOn =
      enabledOptions.length > 0 &&
      enabledOptions.every((option) => value.includes(option.value));

    function change(optionValue: string, on: boolean) {
      if (on) {
        if (!value.includes(optionValue)) onChange([...value, optionValue]);
        return;
      }

      onChange(value.filter((item) => item !== optionValue));
    }

    function changeGroup(on: boolean) {
      if (on) {
        const next = [...value];
        for (const option of enabledOptions) {
          if (!next.includes(option.value)) next.push(option.value);
        }
        onChange(next);
        return;
      }

      onChange(value.filter((item) => !enabledValues.has(item)));
    }

    const webGroupProps =
      isWeb && label ? ({ role: "group", "aria-label": label } as const) : null;

    return (
      <FormField
        label={groupSwitch ? undefined : label}
        error={error}
        helperText={helperText}
        required={required}
        style={style}
      >
        <View {...webGroupProps} style={styles.options}>
          <If condition={groupSwitch}>
            <Switch
              type={switchType}
              label={label ?? ""}
              value={groupOn}
              disabled={disabled || enabledOptions.length === 0}
              testID={groupSwitchTestID}
              onChange={changeGroup}
            />
          </If>

          {options.map((option) => (
            <Switch
              key={option.value}
              type={switchType}
              label={option.label}
              value={value.includes(option.value)}
              disabled={disabled || option.disabled}
              testID={option.testID}
              onChange={(on) => change(option.value, on)}
            />
          ))}
        </View>
      </FormField>
    );
  },
);

SwitchGroupInput.displayName = "SwitchGroupInput";

export default SwitchGroupInput;

const useStyles = createStyles(({ spacing }) => ({
  options: {
    alignSelf: "stretch",
    gap: spacing.x4,
  },
}));
