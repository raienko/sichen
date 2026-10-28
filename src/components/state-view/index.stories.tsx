import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./state-view";

const meta = {
  title: "components/StateView",
  component: Component,
};

export default meta;

export function Loading() {
  return <Component type="loading" message="Getting everything ready." />;
}

export function Empty() {
  return <Component type="empty" message="Create the first item to begin." />;
}

export function Error() {
  return (
    <Component
      type="error"
      message="We couldn't load this screen."
      actionLabel="Try again"
      onAction={() => {}}
    />
  );
}

export function CustomChildren() {
  const styles = useStyles();
  return (
    <Component type="success">
      <View style={styles.custom}>
        <Text value="Any domain-specific content can go here." />
      </View>
    </Component>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  custom: {
    padding: spacing.x8,
  },
}));
