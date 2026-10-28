import { useState } from "react";
import { View } from "react-native";

import { IconButton } from "@/components/button";
import Card from "@/components/card";
import Icon from "@/components/icon";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./index";

const meta = {
  title: "components/ListItem",
  component: Component,
};

export default meta;

function Avatar({ initials }: { initials: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: theme.colors.backgroundElement },
      ]}
    >
      <Text value={initials} type="footnote" />
    </View>
  );
}

export const TitleOnly = () => <Component title="Ada Lovelace" />;

export const WithSubtitle = () => (
  <Component title="Ada Lovelace" subtitle="ada@example.com" />
);

export const WithSlots = () => (
  <Component
    title="Ada Lovelace"
    subtitle="ada@example.com"
    left={<Avatar initials="AL" />}
    right={<Icon name="chevron-right" />}
  />
);

/** The whole row is one button, named by the text inside it. */
export const Pressable = () => (
  <Component
    title="Account"
    subtitle="Name, email, password"
    left={<Icon name="user" />}
    right={<Icon name="chevron-right" />}
    onPress={() => {}}
  />
);

/**
 * The row that must *not* be pressable: making it one would group the
 * button into a single announcement and leave it unreachable.
 *
 * `Switch`, `Checkbox` and `RadioButton` are deliberately absent here —
 * each is already a full labelled row, so it replaces a `ListItem` rather
 * than sitting inside one.
 */
export const WithAControl = () => {
  const [removed, setRemoved] = useState(false);

  return removed ? (
    <Component title="Removed" />
  ) : (
    <Component
      title="Ada Lovelace"
      subtitle="ada@example.com"
      left={<Avatar initials="AL" />}
      right={
        <IconButton
          label="Remove Ada Lovelace"
          size="small"
          onPress={() => setRemoved(true)}
        >
          <Icon name="x" />
        </IconButton>
      }
    />
  );
};

export const Selected = () => (
  <Component title="Ada Lovelace" onPress={() => {}} selected />
);

export const Disabled = () => (
  <Component title="Ada Lovelace" onPress={() => {}} disabled />
);

/** Text truncates rather than pushing the slots out of shape. */
export const LongText = () => (
  <Component
    title="A title long enough that something has to give way somewhere"
    subtitle="And a subtitle that is also rather longer than the row is wide"
    left={<Avatar initials="AL" />}
    right={<Icon name="chevron-right" />}
    onPress={() => {}}
  />
);

/** What it's usually for: a stack of rows inside a card. */
export const InAList = () => {
  const styles = useStyles();

  return (
    <Card padded={false}>
      <View style={styles.list}>
        {[
          { name: "Ada Lovelace", email: "ada@example.com", initials: "AL" },
          { name: "Grace Hopper", email: "grace@example.com", initials: "GH" },
          { name: "Alan Turing", email: "alan@example.com", initials: "AT" },
        ].map((person) => (
          <Component
            key={person.email}
            title={person.name}
            subtitle={person.email}
            left={<Avatar initials={person.initials} />}
            right={<Icon name="chevron-right" />}
            onPress={() => {}}
          />
        ))}
      </View>
    </Card>
  );
};

const useStyles = createStyles(({ sizes, spacing, radius }) => ({
  avatar: {
    borderRadius: radius.surface,
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingVertical: spacing.x4,
  },
}));
