import { View } from "react-native";

import Text from "@/components/text";
import {
  ACCESSIBILITY_FLAGS,
  useAccessibility,
} from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * A live readout of what the OS has turned on. Unlike the other sections
 * there's nothing to press — the demo *is* that these values change while
 * the app is running: toggle VoiceOver, Reduce Motion, or a larger text
 * size in system settings and the rows update without a reload.
 *
 * Flag names come from `ACCESSIBILITY_FLAGS` rather than being listed
 * here, so a flag added to that table appears in this section for free.
 */
export default function AccessibilitySection() {
  const accessibility = useAccessibility();
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {Object.keys(ACCESSIBILITY_FLAGS).map((flag) => (
        <Readout
          key={flag}
          label={flag}
          value={String(
            accessibility[flag as keyof typeof ACCESSIBILITY_FLAGS],
          )}
        />
      ))}

      <Readout label="fontScale" value={accessibility.fontScale.toFixed(2)} />
      <Readout
        label="isLargeTextEnabled"
        value={String(accessibility.isLargeTextEnabled)}
      />
      <Readout
        label="duration(250)"
        value={`${accessibility.duration(250)}ms`}
      />

      <Text
        value={
          accessibility.isReduceMotionEnabled
            ? "Reduce Motion is on — modal and accordion animations are skipped."
            : "Reduce Motion is off — animations run at their full duration."
        }
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
