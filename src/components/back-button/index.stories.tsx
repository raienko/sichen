import { useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";
import type { ButtonType } from "@/components/button";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/BackButton",
  component: Component,
};

export default meta;

const TYPES: ButtonType[] = ["tertiary", "secondary", "primary"];

/** No `onPress`: pressing it pops the stack, or replaces with the fallback. */
export const Default = () => <Component />;

/** A header row, which is what it's for. */
export const InAHeader = () => {
  const styles = useStyles();

  return (
    <View style={styles.header}>
      <Component />
      <Text value="Order #12" type="headline" />
    </View>
  );
};

/** Taking over entirely — the navigation default doesn't also run. */
export const CustomOnPress = () => {
  const styles = useStyles();
  const [presses, setPresses] = useState(0);

  return (
    <View style={styles.column}>
      <Component onPress={() => setPresses((count) => count + 1)} />
      <Text value={`presses: ${presses}`} type="footnote" />
    </View>
  );
};

export const Types = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      {TYPES.map((type) => (
        <Component key={type} type={type} onPress={() => {}} />
      ))}
    </View>
  );
};

export const Sizes = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      {(["small", "medium", "large"] as const).map((size) => (
        <Component key={size} size={size} type="secondary" onPress={() => {}} />
      ))}
    </View>
  );
};

export const Disabled = () => <Component type="secondary" disabled />;

const useStyles = createStyles(({ isRTL, spacing }) => ({
  header: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.x8,
  },
  column: {
    gap: spacing.x8,
    alignItems: "flex-start",
  },
}));
