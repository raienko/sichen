import { DEFAULT_COMPONENT_TYPE } from "@/components/types";

import CustomSegmentedControl from "./custom";
import ExpoUISegmentedControl from "./expo";
import type { SegmentedControlProps } from "./types";

/**
 * A row of mutually exclusive options, one of which is always chosen — the
 * control for switching between a handful of views or modes, where a
 * `Select` would hide the alternatives behind a tap and a radio list would
 * spend a whole column on them.
 *
 * App-owned by default, with Expo UI's platform control behind
 * `type="expo"` (see ./expo.tsx for the two things that one can't express).
 * Both announce as a `radiogroup` of radios, so a screen reader says what
 * the choice is for, which option this is, and whether it's checked.
 *
 * @example
 * <SegmentedControl
 *   label="View"
 *   value={view}
 *   onChange={setView}
 *   options={[
 *     { value: "day", label: "Day" },
 *     { value: "week", label: "Week" },
 *   ]}
 * />
 * @example <SegmentedControl type="expo" label="View" value={view} onChange={setView} options={options} />
 */
export default function SegmentedControl({
  type = DEFAULT_COMPONENT_TYPE,
  ...props
}: SegmentedControlProps) {
  return type === "expo" ? (
    <ExpoUISegmentedControl {...props} />
  ) : (
    <CustomSegmentedControl {...props} />
  );
}

export type { SegmentedControlOption, SegmentedControlProps } from "./types";
