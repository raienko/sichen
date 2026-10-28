import { View } from "react-native";

import Icon from "@/components/icon";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Avatar",
  component: Component,
};

export default meta;

const PHOTO = "https://picsum.photos/id/1027/200/200";
const OTHER = "https://picsum.photos/id/1025/200/200";
const BROKEN = "https://example.invalid/missing.png";

export const WithPicture = () => (
  <Component name="Ada Lovelace" source={PHOTO} />
);

/** No source, a failing source and an unnamed avatar all land here. */
export const Fallbacks = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component name="Ada Lovelace" />
      <Component name="Ada Lovelace" source={BROKEN} />
      <Component name="Grace" />
      <Component name="" />
      <Component name="Design team" icon={<Icon name="users" />} />
    </View>
  );
};

export const Sizes = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component name="Ada Lovelace" source={PHOTO} size="small" />
      <Component name="Ada Lovelace" source={PHOTO} size="medium" />
      <Component name="Ada Lovelace" source={PHOTO} size="large" />
    </View>
  );
};

export const Status = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component
        name="Ada Lovelace"
        source={PHOTO}
        status="success"
        statusLabel="Online"
      />
      <Component
        name="Grace Hopper"
        source={OTHER}
        status="warning"
        statusLabel="Away"
      />
      <Component name="Alan Turing" status="error" statusLabel="Offline" />
      <Component
        name="Ada Lovelace"
        source={PHOTO}
        size="large"
        status="info"
        statusLabel="Syncing"
      />
    </View>
  );
};

/** The slot it was built for. */
export const InAList = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <ListItem
        title="Ada Lovelace"
        subtitle="ada@example.com"
        left={
          <Component
            name="Ada Lovelace"
            source={PHOTO}
            size="small"
            status="success"
            statusLabel="Online"
          />
        }
      />
      <ListItem
        title="Grace Hopper"
        subtitle="grace@example.com"
        left={<Component name="Grace Hopper" size="small" />}
      />
      <ListItem
        title="Design team"
        subtitle="4 members"
        left={
          <Component
            name="Design team"
            icon={<Icon name="users" />}
            size="small"
          />
        }
      />
    </View>
  );
};

/** Long, single-word and non-Latin names all resolve to something. */
export const Names = () => {
  const styles = useStyles();
  const names = ["Ada Augusta Byron Lovelace", "Grace", "山田太郎", "🙂 Smith"];

  return (
    <View style={styles.row}>
      {names.map((name) => (
        <View key={name} style={styles.named}>
          <Component name={name} />
          <Text value={name} type="caption2" />
        </View>
      ))}
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
    alignSelf: "stretch",
    gap: spacing.x4,
  },
  named: {
    alignItems: "center",
    gap: spacing.x4,
  },
}));

/** Overlapping avatars; the last slot counts whoever didn't fit. */
export const Group = () => (
  <Component.Group
    people={[
      { name: "Ada Lovelace", source: PHOTO },
      { name: "Grace Hopper", source: OTHER },
      { name: "Alan Turing" },
      { name: "Edsger Dijkstra" },
      { name: "Barbara Liskov" },
    ]}
    max={4}
    size="medium"
  />
);
