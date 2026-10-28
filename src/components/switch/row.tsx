import type { ComponentType } from "react";

import BinaryControlRow from "@/components/binary-control-row";
import { switchA11yProps } from "@/features/accessibility";

import type { SwitchImplementationProps, SwitchIndicatorProps } from "./types";

type Props = SwitchImplementationProps & {
  Indicator: ComponentType<SwitchIndicatorProps>;
};

/** Shared, stable layout and behavior around either switch indicator. */
export default function SwitchRow({
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
      indicatorPosition="end"
      accessibilityProps={switchA11yProps({ label, value, disabled })}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={style}
      testID={testID}
    />
  );
}
