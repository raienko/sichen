import type { ComponentType } from "react";

import BinaryControlRow from "@/components/binary-control-row";
import { radioA11yProps } from "@/features/accessibility";

import type {
  RadioButtonImplementationProps,
  RadioIndicatorProps,
} from "./types";

type Props = RadioButtonImplementationProps & {
  Indicator: ComponentType<RadioIndicatorProps>;
};

/** Shared radio behavior and labelled touch target around either indicator. */
export default function RadioButtonRow({
  value,
  onChange,
  label,
  disabled = false,
  style,
  testID,
  Indicator,
}: Props) {
  return (
    <BinaryControlRow
      label={label}
      indicator={<Indicator selected={value} />}
      accessibilityProps={radioA11yProps({
        label,
        checked: value,
        disabled,
      })}
      disabled={disabled}
      onPress={() => {
        if (!value) onChange(true);
      }}
      style={style}
      testID={testID}
    />
  );
}
