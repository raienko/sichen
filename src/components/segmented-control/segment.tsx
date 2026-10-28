import { Pressable, type LayoutRectangle } from "react-native";

import Text from "@/components/text";
import { radioA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { SegmentedControlOption } from "./types";

type Props = {
  option: SegmentedControlOption;
  /** Draws the hairline that separates this segment from the one before it. */
  separated: boolean;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  /** Reports this segment's box, which the sliding indicator moves to. */
  onLayout: (layout: LayoutRectangle) => void;
  testID?: string;
};

/**
 * One segment: the touch target and its label. The tint and bar that mark
 * the current choice are the parent's sliding indicator, drawn behind.
 *
 * Announced as a radio rather than a button, because that's what it is —
 * one of a set of mutually exclusive options, inside the `radiogroup` its
 * parent declares. A screen reader then reads the group's name, the
 * option's own, and whether it's checked; announcing each as an unrelated
 * "button, selected" would lose the fact that picking one unpicks the rest.
 */
export default function Segment({
  testID,
  option,
  separated,
  selected,
  disabled,
  onPress,
  onLayout,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      {...radioA11yProps({ label: option.label, checked: selected, disabled })}
      testID={testID}
      disabled={disabled}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      // A press on the current segment is not a change — reporting it would
      // fire `onChange` for a value the caller already holds, which turns
      // an idle tap into a state update (and, for a call site that persists
      // on change, into a write).
      onPress={() => {
        if (!selected) onPress();
      }}
      style={({ pressed }) => [
        styles.segment,
        separated
          ? [styles.separated, { borderStartColor: theme.colors.border }]
          : null,
        // Dimmed per segment, not only when the whole control is disabled:
        // one unavailable choice among available ones is otherwise
        // indistinguishable until you tap it and nothing happens.
        disabled ? styles.disabled : null,
        pressed && !selected && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        value={option.label}
        type="footnote"
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: selected ? theme.colors.text : theme.colors.textSecondary,
          },
        ]}
      />
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, sizes }) => ({
  segment: {
    // Equal widths regardless of label length, so the control doesn't
    // reflow as the selection moves. `minWidth: 0` lets a long label
    // shrink and ellipsize instead of forcing the track wider.
    flex: 1,
    minWidth: 0,
    minHeight: sizes.elementHeightSm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.x8,
    // Reserved on every segment, so the label sits clear of the
    // indicator's bar, centred in what's left above it.
    borderBottomWidth: spacing.x2,
    borderBottomColor: "transparent",
  },
  separated: {
    borderStartWidth: spacing.x1,
  },
  label: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
}));
