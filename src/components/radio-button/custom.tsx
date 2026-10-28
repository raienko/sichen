import { View } from "react-native";

import If from "@/components/if";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import RadioButtonRow from "./row";
import type {
  RadioButtonImplementationProps,
  RadioIndicatorProps,
} from "./types";

function CustomIndicator({ selected }: RadioIndicatorProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { borderColor: selected ? theme.colors.primary : theme.colors.border },
      ]}
    >
      <If condition={selected}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
      </If>
    </View>
  );
}

/** The app-owned radio button rendered with React Native primitives. */
export default function CustomRadioButton(
  props: RadioButtonImplementationProps,
) {
  return <RadioButtonRow {...props} Indicator={CustomIndicator} />;
}

const useStyles = createStyles(({ spacing, radius }) => ({
  circle: {
    width: spacing.x24,
    height: spacing.x24,
    borderRadius: radius.full,
    borderWidth: spacing.x2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: spacing.x12,
    height: spacing.x12,
    borderRadius: radius.full,
  },
}));
