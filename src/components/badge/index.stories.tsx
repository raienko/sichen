import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Badge",
  component: Component,
};

export default meta;

export const Labels = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component value="New" />
      <Component value="Beta" type="info" />
      <Component value="Live" type="success" />
      <Component value="Sold out" type="error" />
    </View>
  );
};

export const Counts = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component count={1} type="error" />
      <Component count={12} type="error" />
      <Component count={99} type="error" />
      <Component count={412} type="error" />
      <Component count={1200} max={999} type="error" />
    </View>
  );
};

/** Zero renders nothing at all — "no unread" isn't a badge. */
export const Zero = () => {
  const styles = useStyles();
  const [count, setCount] = useState(3);

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Text value="Unread" />
        <Component count={count} type="error" label={`${count} unread`} />
      </View>
      <View style={styles.row}>
        <Button
          value="−"
          size="small"
          label="Fewer"
          onPress={() => setCount((current) => current - 1)}
        />
        <Button
          value="+"
          size="small"
          label="More"
          onPress={() => setCount((current) => current + 1)}
        />
      </View>
    </View>
  );
};

export const Types = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component value="neutral" />
      <Component value="success" type="success" />
      <Component value="warning" type="warning" />
      <Component value="error" type="error" />
      <Component value="info" type="info" />
    </View>
  );
};

/** No content: the "there's something here" marker. */
export const Dots = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component dot />
      <Component dot type="success" label="Online" />
      <Component dot type="warning" label="Away" />
      <Component dot type="error" label="Do not disturb" />
    </View>
  );
};

/** A badge doesn't position itself — its container does. */
export const InPlace = () => {
  const { spacing } = useSizes();
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <ListItem
        title="Inbox"
        subtitle="ada@example.com"
        left={<Icon name="inbox" />}
        right={<Component count={12} type="error" label="12 unread" />}
      />
      <View style={styles.row}>
        <Text value="Passkeys" type="headline" />
        <Component value="Beta" type="info" />
      </View>
      <View style={styles.pinned}>
        <Icon name="bell" size={spacing.x24} />
        <View style={styles.corner}>
          <Component dot type="error" label="Unread notifications" />
        </View>
      </View>
    </View>
  );
};

const useStyles = createStyles(({ isRTL, spacing }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x8,
  },
  stack: {
    alignSelf: "stretch",
    gap: spacing.x16,
  },
  pinned: {
    alignSelf: "flex-start",
  },
  corner: {
    position: "absolute",
    top: -spacing.x2,
    end: -spacing.x2,
  },
}));
