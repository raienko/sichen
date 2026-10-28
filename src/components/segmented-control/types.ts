import type { StyleProp, ViewStyle } from "react-native";

import type { ComponentTypeProps } from "@/components/types";

/**
 * One choice in a segmented control. Same split as `SelectOption`: `value`
 * is what `onChange` reports and what `value` is matched against, `label`
 * is the only thing ever shown — so the stored value stays a stable code
 * (`"day"`) while the visible text is free to be translated or reworded.
 */
export type SegmentedControlOption = {
  value: string;
  label: string;
  /** Custom implementation only — see the note in ./expo.tsx. */
  disabled?: boolean;
  testID?: string;
};

export type SegmentedControlProps = ComponentTypeProps & {
  /**
   * The selected option's `value`. A value matching no option leaves every
   * segment unselected rather than throwing — the same way `Select` falls
   * back to its placeholder — so a stale value out of storage degrades
   * instead of crashing the screen.
   */
  value: string;
  /** Only ever called with an option's `value`, and never for the current one. */
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  /**
   * What the whole choice is for — "View", "Sort by". Required, and not
   * shown: it's the group's accessible name, and without it a screen
   * reader announces the options with nothing saying what they decide.
   */
  label: string;
  /** Disables every segment at once. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type SegmentedControlImplementationProps = Omit<
  SegmentedControlProps,
  "type"
>;
