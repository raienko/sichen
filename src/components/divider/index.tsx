import { View, type StyleProp, type ViewStyle } from "react-native";

import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import {
  createStyles,
  useSizes,
  type SpacingToken,
} from "@/features/responsive";
import { useTheme } from "@/features/theme";

export type DividerOrientation = "horizontal" | "vertical";

type LabelProps =
  | {
      /**
       * Text set into the middle of the rule — "or", "Today", "3 more".
       * Horizontal only: a vertical rule has no room for it, and turning
       * text sideways is a different component's problem.
       */
      label: string;
      orientation?: "horizontal";
    }
  | { label?: never; orientation?: DividerOrientation };

type Props = LabelProps & {
  /**
   * Space left clear at both ends, as a step of the spacing scale or a raw
   * px value. For a rule between list rows that shouldn't run under the
   * avatars — the inset lines it up with the text instead.
   */
  inset?: SpacingToken | number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A rule between things: between list rows, between sections of a form,
 * between two columns.
 *
 * **An unlabelled divider is invisible to assistive technology.** It's a
 * drawn boundary and nothing more — the grouping it suggests is already
 * carried by the content either side — so it's hidden on every platform
 * rather than left as an empty stop a screen-reader user swipes past. Same
 * treatment `Spacer` gets, and for the same reason.
 *
 * **A labelled one is not**, because then it does say something: "or",
 * "Today", "3 more" is content, and it's the rules either side of it that
 * become the decoration.
 *
 * @example <Divider />
 * @example <Divider label="or" />
 * @example <Divider inset="x16" />              // clears the leading edge
 * @example <Divider orientation="vertical" />   // between two columns
 */
export default function Divider({
  orientation = "horizontal",
  label,
  inset,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();

  const rule = [
    orientation === "vertical" ? styles.vertical : styles.horizontal,
    { backgroundColor: theme.colors.divider },
  ];
  const gap =
    inset === undefined
      ? 0
      : typeof inset === "number"
        ? inset
        : spacing[inset];

  if (label === undefined) {
    return (
      <View
        {...disabledA11yProps()}
        testID={testID}
        style={[
          ...rule,
          orientation === "vertical"
            ? { marginVertical: gap }
            : { marginHorizontal: gap },
          style,
        ]}
      />
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.labelled, { marginHorizontal: gap }, style]}
    >
      {/* The rules are the decoration now — the label is what's announced. */}
      <View {...disabledA11yProps()} style={[...rule, styles.grow]} />
      <Text
        value={label}
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <View {...disabledA11yProps()} style={[...rule, styles.grow]} />
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  horizontal: {
    // Fills whatever contains it rather than picking a width of its own —
    // the same reason `Card` and `ListItem` use alignSelf.
    alignSelf: "stretch",
    height: spacing.x1,
  },
  vertical: {
    alignSelf: "stretch",
    width: spacing.x1,
  },
  labelled: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing.x8,
  },
  // Each rule takes an equal half of what the label leaves, so the label
  // sits centred however long it is.
  grow: {
    flex: 1,
    alignSelf: "auto",
  },
}));
