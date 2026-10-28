import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";
import type { StatusBarProps } from "./index";

const meta = {
  title: "components/StatusBar",
  component: Component,
  args: { style: "auto", hidden: false, animated: true },
  argTypes: {
    style: {
      control: "select",
      options: ["auto", "inverted", "light", "dark"],
    },
  },
};

export default meta;

/** Native only: change `style` and watch the clock and battery at the top. */
export const Default = (args: StatusBarProps) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Component {...args} />
      <Text
        value={`style: ${args.style ?? "auto"}${args.hidden ? " · hidden" : ""}`}
      />
      <Text
        value="There is no status bar on web — this renders nothing there."
        type="footnote"
      />
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
