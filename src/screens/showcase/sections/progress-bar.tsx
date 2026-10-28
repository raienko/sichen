import { useEffect, useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import ProgressBar from "@/components/progress-bar";
import Text from "@/components/text";
import { useAccessibility } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const STEPS = 6;

/** Both states, and what Reduce Motion does to each of them. */
export default function ProgressBarSection() {
  const theme = useTheme();
  const styles = useStyles();
  const { isReduceMotionEnabled } = useAccessibility();
  const [value, setValue] = useState(0.35);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setValue((current) => {
        if (current >= 1) {
          setRunning(false);
          return 1;
        }
        return Math.min(1, current + 0.08);
      });
    }, 400);

    return () => clearInterval(timer);
  }, [running]);

  return (
    <View style={styles.container}>
      <Text
        value="A bar earns its space by answering “how much longer” — reach for Spinner when the wait is short and shapeless."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <ProgressBar value={value} label="Uploading photos" />
      <Readout label="value" value={`${Math.round(value * 100)}%`} />
      <View style={styles.actions}>
        <Button
          value={running ? "pause" : "run"}
          size="small"
          selected={running}
          onPress={() => setRunning((current) => !current)}
        />
        <Button
          value="reset"
          size="small"
          onPress={() => {
            setRunning(false);
            setValue(0);
          }}
        />
      </View>

      <Text value="Custom value text" type="headline" />
      <ProgressBar
        value={value}
        label="Setup"
        size="small"
        formatValue={(fraction) =>
          `Step ${Math.max(1, Math.round(fraction * STEPS))} of ${STEPS}`
        }
      />
      <Readout
        label="announced"
        value={`Step ${Math.max(1, Math.round(value * STEPS))} of ${STEPS}`}
      />

      <Text value="Indeterminate" type="headline" />
      <Text
        value="No total to measure against. It reports no value at all rather than 0% — a missing figure is a different claim from a figure of zero — and says it's busy instead."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <ProgressBar label="Checking for updates" />
      <Readout
        label="reduce motion"
        value={isReduceMotionEnabled ? "on — cross-fade" : "off — sweep"}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));
