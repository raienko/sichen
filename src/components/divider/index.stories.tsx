import { View } from "react-native";

import Card from "@/components/card";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Divider",
  component: Component,
};

export default meta;

export const Horizontal = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Text value="Above" />
      <Component />
      <Text value="Below" />
    </View>
  );
};

export const Vertical = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Text value="Left" />
      <Component orientation="vertical" />
      <Text value="Right" />
    </View>
  );
};

/** The "or continue with" rule an auth screen wants. */
export const Labelled = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Text value="Sign in with email" />
      <Component label="or" />
      <Text value="Continue with a passkey" />
    </View>
  );
};

export const LongLabel = () => <Component label="3 more from this week" />;

/** Inset so the rule lines up with the text rather than the avatars. */
export const InsetInAList = () => {
  const styles = useStyles();

  return (
    <Card padded={false}>
      <View style={styles.list}>
        <ListItem title="Ada Lovelace" subtitle="ada@example.com" />
        <Component inset="x16" />
        <ListItem title="Grace Hopper" subtitle="grace@example.com" />
        <Component inset="x16" />
        <ListItem title="Alan Turing" subtitle="alan@example.com" />
      </View>
    </Card>
  );
};

const useStyles = createStyles(({ sizes, spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: sizes.elementHeightMd,
    gap: spacing.x12,
  },
  list: {
    paddingVertical: spacing.x4,
  },
}));
