import { DEFAULT_COMPONENT_TYPE } from "@/components/types";

import CustomRadioButton from "./custom";
import ExpoUIRadioButton from "./expo";
import type { RadioButtonProps } from "./types";

/** A simple controlled radio button with custom and Expo-style variants. */
export default function RadioButton({
  type = DEFAULT_COMPONENT_TYPE,
  ...props
}: RadioButtonProps) {
  return type === "expo" ? (
    <ExpoUIRadioButton {...props} />
  ) : (
    <CustomRadioButton {...props} />
  );
}

export type { RadioButtonProps } from "./types";
