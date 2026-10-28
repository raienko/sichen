import type { ReactNode } from "react";
import {
  Pressable,
  type AccessibilityProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

type Props = {
  label: string;
  indicator: ReactNode;
  indicatorPosition?: "start" | "end";
  accessibilityProps: AccessibilityProps;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Shared labelled touch target for Checkbox, RadioButton and Switch. */
export default function BinaryControlRow({
  label,
  indicator,
  indicatorPosition = "start",
  accessibilityProps,
  onPress,
  disabled = false,
  style,
  testID,
}: Props) {
  const styles = useStyles();
  const labelNode = <Text value={label} style={styles.label} />;

  return (
    <Pressable
      {...accessibilityProps}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        indicatorPosition === "start" ? styles.startGap : styles.endGap,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {indicatorPosition === "start" ? indicator : labelNode}
      {indicatorPosition === "start" ? labelNode : indicator}
    </Pressable>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  row: {
    minHeight: sizes.elementHeightMd,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  startGap: {
    gap: spacing.x8,
  },
  endGap: {
    gap: spacing.x12,
  },
  label: {
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
}));
