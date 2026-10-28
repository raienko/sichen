import { View } from "react-native";

import If from "@/components/if";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import RadioButtonRow from "./row";
import type {
  RadioButtonImplementationProps,
  RadioIndicatorProps,
} from "./types";

/** React Native rendering of the Material 3 radio used by Expo UI on Android. */
function ExpoStyleIndicator({ selected }: RadioIndicatorProps) {
  const theme = useTheme();
  const styles = useStyles();
  const color = selected ? theme.colors.accent : theme.colors.textSecondary;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.touchTarget}
    >
      <View style={[styles.circle, { borderColor: color }]}>
        <If condition={selected}>
          <View style={[styles.dot, { backgroundColor: color }]} />
        </If>
      </View>
    </View>
  );
}

export default function ExpoStyleRadioButton(
  props: RadioButtonImplementationProps,
) {
  return <RadioButtonRow {...props} Indicator={ExpoStyleIndicator} />;
}

const useStyles = createStyles(({ spacing, radius, sizes }) => ({
  touchTarget: {
    // Match the custom indicator's layout slot so labels start on the same
    // vertical line; the whole Pressable still owns the 44pt touch target.
    width: spacing.x24,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: spacing.x20,
    height: spacing.x20,
    borderRadius: radius.full,
    borderWidth: spacing.x2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: spacing.x20 / 2,
    height: spacing.x20 / 2,
    borderRadius: radius.full,
  },
}));
