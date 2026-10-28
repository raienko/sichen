import { Pressable, View } from "react-native";

import { controlA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

type PinProps = {
  title: string;
  selected: boolean;
  onPress?: () => void;
  testID?: string;
};

/**
 * A marker, drawn by the app rather than the map engine so it takes the
 * theme like everything else: a `primary` square, edged in the page
 * background so it stays legible over roads and water.
 *
 * **Selected, it grows and gets a ring**: an `accent` outline separated
 * from the pin by a band of page background. The band is what makes it
 * read in the light scheme, where `accent` and `primary` are the same
 * colour — a ring touching the pin would just look like a bigger pin.
 * Graphite's rule holds: an edge marks the selection, nothing inverts.
 *
 * It's a real button: a map is otherwise opaque to a screen reader, and
 * the pins are the only things on it worth reaching.
 */
export function MapPin({ title, selected, onPress, testID }: PinProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      testID={testID}
      {...controlA11yProps({ label: title, selected, disabled: false })}
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.ring,
        selected
          ? {
              borderColor: theme.colors.accent,
              backgroundColor: theme.colors.background,
            }
          : null,
      ]}
    >
      <View
        testID={testId(testID, "mark")}
        style={[
          styles.pin,
          selected ? styles.selected : null,
          {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.background,
          },
        ]}
      />
    </Pressable>
  );
}

/** The user's position: the one round shape on the map, by convention. */
export function UserDot({ label, testID }: { label: string; testID?: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={label}
      style={[
        styles.dot,
        {
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.background,
        },
      ]}
    />
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  // Always there, transparent until selected, so selecting doesn't shift
  // the pin off its coordinate as the ring appears.
  ring: {
    padding: spacing.x2,
    borderWidth: spacing.x2,
    borderColor: "transparent",
    borderRadius: radius.indicator,
  },
  pin: {
    width: spacing.x20,
    height: spacing.x20,
    borderRadius: radius.indicator,
    borderWidth: spacing.x2,
  },
  selected: {
    width: spacing.x24,
    height: spacing.x24,
  },
  dot: {
    width: spacing.x16,
    height: spacing.x16,
    borderRadius: radius.full,
    borderWidth: spacing.x2,
  },
}));
