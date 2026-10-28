import { View, type StyleProp, type ViewStyle } from "react-native";

import Icon from "@/components/icon";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type Props = {
  style?: StyleProp<ViewStyle>;
  /** Kept identical to the image's own — see the note in ./index.tsx. */
  a11yProps: object;
  testID?: string;
};

/**
 * What renders in an `Image`'s place when there's nothing to show — no
 * source, or one that failed to load.
 *
 * Drawn from the theme rather than shipped as a bundled PNG on purpose. A
 * fixed placeholder asset is a single set of greys, so whichever scheme it
 * wasn't drawn for gets a light patch in a dark UI (or the reverse) exactly
 * where something already went wrong. This picks up `backgroundElement` and
 * `textSecondary` like every other surface, so it's correct in both schemes
 * and after a rebrand, with no asset to re-export.
 *
 * A call site that wants a *specific* picture instead — a default avatar, a
 * branded product placeholder — passes it as `Image`'s `fallback` and never
 * reaches this.
 */
export default function ImageFallback({ style, a11yProps, testID }: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();

  return (
    <View
      testID={testID}
      {...a11yProps}
      style={[
        styles.fallback,
        {
          backgroundColor: theme.colors.backgroundElement,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Icon
        name="image"
        size={spacing.x24}
        color={theme.colors.textSecondary}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  fallback: {
    borderRadius: radius.surface,
    alignItems: "center",
    justifyContent: "center",
    // Same reason Button's `secondary` carries one: the fill is
    // `backgroundElement`, which is invisible against any other raised
    // surface it might sit on.
    borderWidth: spacing.x1,
    overflow: "hidden",
  },
}));
