import { useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component, { type ShareOutcome } from "./index";

const meta = {
  title: "components/Share",
  component: Component,
};

export default meta;

const LINK = "https://example.com/order/12";

export const Default = () => (
  <Component content={{ url: LINK, title: "Order #12" }} />
);

export const CopyOnly = () => (
  <Component content={{ url: LINK }} mode="copy" value="Copy link" />
);

export const Types = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component content={{ url: LINK }} type="primary" />
      <Component content={{ url: LINK }} type="secondary" />
      <Component content={{ url: LINK }} type="tertiary" />
    </View>
  );
};

/** Nothing to share is a disabled button, not an empty sheet. */
export const Empty = () => <Component content={{ url: "" }} />;

export const Outcome = () => {
  const styles = useStyles();
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  return (
    <View style={styles.stack}>
      <Component
        content={{ message: "Check this out", url: LINK }}
        onResult={setOutcome}
      />
      <Text value={outcome ?? "not pressed yet"} type="footnote" />
    </View>
  );
};

const useStyles = createStyles(({ isRTL, spacing }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x12,
  },
  stack: {
    alignSelf: "flex-start",
    gap: spacing.x12,
  },
}));
