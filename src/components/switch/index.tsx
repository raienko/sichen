import { DEFAULT_COMPONENT_TYPE } from "@/components/types";

import CustomSwitch from "./custom";
import ExpoUISwitch from "./expo";
import type { SwitchProps } from "./types";

/**
 * A controlled switch with an app-owned default and an Expo UI-backed
 * alternative selected with `type="expo"`.
 */
export default function Switch({
  type = DEFAULT_COMPONENT_TYPE,
  ...props
}: SwitchProps) {
  return type === "expo" ? (
    <ExpoUISwitch {...props} />
  ) : (
    <CustomSwitch {...props} />
  );
}

export type { SwitchProps } from "./types";
