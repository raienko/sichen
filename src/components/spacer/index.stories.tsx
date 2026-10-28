import { useState } from "react";
import { ScrollView, View } from "react-native";

import Button from "@/components/button";
import Input from "@/components/input";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./index";

const meta = {
  title: "components/Spacer",
  component: Component,
};

export default meta;

/**
 * A spacer is a gap — invisible by definition — so every story here puts
 * tinted blocks either side of it. The blocks are the only thing you can
 * see; the space between them is the component.
 */
function Block({ label }: { label: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.block,
        { backgroundColor: theme.colors.backgroundElementSelected },
      ]}
    >
      <Text value={label} type="caption2" />
    </View>
  );
}

export const Vertical = () => (
  <View>
    <Block label="above" />
    <Component />
    <Block label="below" />
  </View>
);

export const Horizontal = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Block label="left" />
      <Component direction="horizontal" size="x24" />
      <Block label="right" />
    </View>
  );
};

/** Both axes at once — the diagonal step a single-axis gap can't make. */
export const Both = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Block label="first" />
      <Component direction="both" size="x40" />
      <Block label="second" />
    </View>
  );
};

/** Every step of the spacing scale, drawn as the gap it actually produces. */
export const Scale = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      {(["x4", "x8", "x16", "x24", "x40"] as const).map((size) => (
        <View key={size} style={styles.row}>
          <Block label={size} />
          <Component direction="horizontal" size={size} />
        </View>
      ))}
    </View>
  );
};

/**
 * A size can name room something else takes up, measured live. Each tinted
 * band is one spacer; on web and in Storybook's default viewport the safe
 * areas are usually 0.
 */
export const Edges = () => (
  <View>
    <Block label="safe-area-top" />
    <Component size="safe-area-top" />
    <Block label="tab-bar" />
    <Component size="tab-bar" />
    <Block label={'["x8", "safe-area-bottom"] — the tallest'} />
    <Component size={["x8", "safe-area-bottom"]} />
    <Block label="end" />
  </View>
);

/**
 * A form tall enough for the keyboard to cover its button. Focus the last
 * field on a phone: the spacer at the bottom grows with the keyboard, so
 * the content scrolls clear of it. (On web it stays at its 16pt floor.)
 */
export const Keyboard = () => {
  const [values, setValues] = useState(["", "", "", ""]);

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      {values.map((value, index) => (
        <Input
          key={index}
          label={`Field ${index + 1}`}
          value={value}
          onChange={(next) =>
            setValues((current) =>
              current.map((item, at) => (at === index ? next : item)),
            )
          }
        />
      ))}
      <Component size="x16" />
      <Button value="Send" type="primary" onPress={() => {}} />
      <Component size={["x16", "keyboard"]} />
    </ScrollView>
  );
};

const useStyles = createStyles(({ isRTL, spacing, radius }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
  },
  block: {
    borderRadius: radius.surface,
    paddingHorizontal: spacing.x8,
    paddingVertical: spacing.x4,
  },
}));
