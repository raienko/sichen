import type { ComponentType } from "react";

import BinaryControlRow from "@/components/binary-control-row";
import { checkboxA11yProps } from "@/features/accessibility";

import type {
  CheckboxImplementationProps,
  CheckboxIndicatorProps,
} from "./types";

type Props = CheckboxImplementationProps & {
  Indicator: ComponentType<CheckboxIndicatorProps>;
};

/** Shared checkbox semantics around either visual indicator. */
export default function CheckboxRow({
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
      indicator={<Indicator value={value} disabled={disabled} />}
      accessibilityProps={checkboxA11yProps({
        label,
        checked: value,
        disabled,
      })}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={style}
      testID={testID}
    />
  );
}
