import { useEffect, useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/ProgressBar",
  component: Component,
};

export default meta;

export const Determinate = () => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {[0, 0.25, 0.5, 0.75, 1].map((value) => (
        <View key={value} style={styles.row}>
          <Component value={value} label={`Example at ${value * 100}%`} />
          <Text value={`${value * 100}%`} type="caption2" />
        </View>
      ))}
    </View>
  );
};

/** No total to measure against — the movement is the whole signal. */
export const Indeterminate = () => <Component label="Checking for updates" />;

export const Small = () => (
  <Component value={0.6} label="Uploading" size="small" />
);

/** A caller's own wording, for progress that isn't naturally a percentage. */
export const CustomValueText = () => (
  <Component
    value={3 / 6}
    label="Setup"
    formatValue={(value) => `Step ${Math.round(value * 6)} of 6`}
  />
);

/** Runs, so the fill can be seen easing to each new value. */
export const Live = () => {
  const styles = useStyles();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setValue((current) => (current >= 1 ? 0 : current + 0.1)),
      600,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Component value={value} label="Uploading photos" />
      <Text value={`${Math.round(value * 100)}%`} type="footnote" />
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
    alignSelf: "stretch",
  },
  row: {
    gap: spacing.x4,
  },
}));
