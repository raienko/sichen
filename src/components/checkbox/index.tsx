import { DEFAULT_COMPONENT_TYPE } from "@/components/types";

import CustomCheckbox from "./custom";
import ExpoUICheckbox from "./expo";
import type { CheckboxProps } from "./types";

/**
 * A controlled checkbox with an app-owned default and an Expo UI-backed
 * alternative selected with `type="expo"`.
 *
 * Both implementations use `value` / `onChange`, expose a visible label,
 * and support disabled state across Android, iOS, and web.
 */
export default function Checkbox({
  type = DEFAULT_COMPONENT_TYPE,
  ...props
}: CheckboxProps) {
  return type === "expo" ? (
    <ExpoUICheckbox {...props} />
  ) : (
    <CustomCheckbox {...props} />
  );
}

export type { CheckboxProps } from "./types";
