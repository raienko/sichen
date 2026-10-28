import { Pressable } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type Props = {
  index: number;
  /** The character here, or "" while this position is still empty. */
  character: string;
  /** Where the next character will land, with the field focused. */
  active: boolean;
  invalid: boolean;
  /** Puts the caret on this box. Absent while the field is disabled. */
  onPress?: () => void;
  testID?: string;
};

/**
 * One box in the code row — a `Pressable`, not a `TextInput`. iOS fills a
 * one-time code into a *single* field, so a row of inputs would take the
 * whole code into the first box; the real input is the invisible one in
 * ./index and these only draw what it holds, and say which box was tapped.
 */
export default function CodeCell({
  index,
  character,
  active,
  invalid,
  onPress,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={onPress === undefined}
      accessible={false}
      // Otherwise a screen reader gets six unlabelled single-character stops
      // competing with the field that carries the actual announcement.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.cell,
        {
          backgroundColor: active ? theme.colors.selected : "transparent",
          // Outlined like every other field: with no resting fill, the
          // border is what marks the box, and the semantic token clears 3:1
          // against every app surface.
          borderColor: invalid
            ? theme.colors.error
            : active
              ? theme.colors.focus
              : theme.colors.border,
        },
      ]}
    >
      <Text
        value={character}
        type="title3"
        style={{ color: theme.colors.text }}
      />
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  cell: {
    borderRadius: radius.control,
    flex: 1,
    height: sizes.elementHeightLg,
    alignItems: "center",
    justifyContent: "center",
    // Always present so a box doesn't resize when it becomes active.
    borderWidth: spacing.x1,
  },
}));
