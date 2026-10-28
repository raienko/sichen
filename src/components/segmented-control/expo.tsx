import { SegmentedControl as ExpoSegmentedControl } from "@expo/ui/community/segmented-control";
import { View } from "react-native";

import { radioGroupA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { SegmentedControlImplementationProps } from "./types";

/**
 * Expo UI's platform segmented control — UISegmentedControl on iOS,
 * Material's segmented buttons on Android — behind the same `value`/
 * `onChange`/`options` API the custom implementation has.
 *
 * Two things the native control can't express, both by its own design
 * rather than an oversight here:
 *
 * - **It addresses segments by index**, taking a flat `values: string[]`.
 *   So `value` is resolved to an index on the way in and the reported index
 *   back to an option on the way out. Going through the index (rather than
 *   its `onValueChange`, which reports the visible *label*) is deliberate:
 *   two options that happen to share a label would otherwise be
 *   indistinguishable, and the label is the one field a caller is free to
 *   translate.
 * - **A single segment can't be disabled** — `enabled` is whole-control
 *   only. `disabled` on the control works; `disabled` on one option is
 *   silently ignored here, so use the custom implementation when a single
 *   choice needs to be unavailable.
 *
 * The group's accessible name goes on a wrapper rather than the control
 * itself: the native view owns its own segment semantics, and this only
 * adds what it has no way to know — what the whole choice is for.
 */
export default function ExpoUISegmentedControl({
  value,
  onChange,
  options,
  label,
  disabled = false,
  style,
  testID = "segmented-control",
}: SegmentedControlImplementationProps) {
  const theme = useTheme();
  const styles = useStyles();
  const selectedIndex = options.findIndex((option) => option.value === value);

  return (
    <View
      {...radioGroupA11yProps({ label, disabled })}
      style={[styles.wrapper, style]}
    >
      <ExpoSegmentedControl
        testID={testID}
        values={options.map((option) => option.label)}
        // -1 (no option matches) would be read as a real index by the
        // native side; undefined is how "nothing selected" is spelled.
        selectedIndex={selectedIndex === -1 ? undefined : selectedIndex}
        enabled={!disabled}
        tintColor={theme.colors.selected}
        appearance={theme.scheme}
        onChange={({ nativeEvent }) => {
          const next = options[nativeEvent.selectedSegmentIndex];
          if (next && next.value !== value) onChange(next.value);
        }}
        style={styles.control}
      />
    </View>
  );
}

const useStyles = createStyles(({ sizes }) => ({
  wrapper: {
    alignSelf: "stretch",
  },
  control: {
    minHeight: sizes.elementHeightSm,
  },
}));
