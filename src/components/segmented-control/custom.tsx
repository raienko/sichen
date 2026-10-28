import { useState } from "react";
import { View, type LayoutRectangle } from "react-native";

import { radioGroupA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import SegmentIndicator from "./indicator";
import Segment from "./segment";
import type { SegmentedControlImplementationProps } from "./types";

/**
 * The app-owned segmented control: a square, outlined track split into
 * equal-width segments by hairlines, with the current one tinted.
 *
 * The current segment is marked three ways at once — the `selected` tint,
 * an `accent` bar along its bottom edge, and a `text` label where the rest
 * are `textSecondary` — rather than
 * by inverting it into a solid block. A solid `primary` or `text` fill was
 * the loudest thing on any screen it sat on, most of all in the dark
 * scheme; the bar alone clears the 3:1 WCAG 1.4.11 asks of the only thing
 * marking the choice, and as a shape it survives greyscale and a
 * colour-blindness filter where a hue change alone would not.
 *
 * The tint and bar are one indicator that slides between segments
 * (./indicator.tsx), the way TabBar's moves between tabs.
 */
export default function CustomSegmentedControl({
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
  // Each segment's box, by value, for the indicator to slide between.
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});

  return (
    <View
      {...radioGroupA11yProps({ label, disabled })}
      testID={testID}
      style={[
        styles.track,
        { borderColor: theme.colors.border },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {/* First, so it paints behind the segments and their hairlines. */}
      <SegmentIndicator target={layouts[value]} testID={testID} />
      {options.map((option, index) => (
        <Segment
          key={option.value}
          option={option}
          testID={option.testID ?? testId(testID, "option", option.value)}
          separated={index > 0}
          selected={option.value === value}
          disabled={disabled || (option.disabled ?? false)}
          onPress={() => onChange(option.value)}
          onLayout={(layout) =>
            setLayouts((known) =>
              sameLayout(known[option.value], layout)
                ? known
                : { ...known, [option.value]: layout },
            )
          }
        />
      ))}
    </View>
  );
}

function sameLayout(a: LayoutRectangle | undefined, b: LayoutRectangle) {
  return (
    a !== undefined &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  track: {
    borderRadius: radius.control,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    minHeight: sizes.elementHeightMd,
    // Same reason Button's `secondary` carries one: the track has no fill,
    // so the outline is what marks the control's extent on any surface.
    borderWidth: spacing.x1,
    // Clips the selected segment's tint to the track's corners, so
    // `radius.control` rounds the whole control from one place.
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.5,
  },
}));
