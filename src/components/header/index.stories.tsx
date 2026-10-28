import { useState } from "react";
import { View } from "react-native";

import BackButton from "@/components/back-button";
import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import Input from "@/components/input";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Header",
  component: Component,
};

export default meta;

export const TitleOnly = () => <Component title="Orders" />;

export const WithSubtitle = () => (
  <Component title="Orders" subtitle="12 open" />
);

/** The case it exists for: back on the left, actions on the right. */
export const WithSlots = () => (
  <Component
    title="Order #12"
    subtitle="Delivered on Tuesday"
    left={<BackButton onPress={() => {}} />}
    right={
      <IconButton label="Share" onPress={() => {}}>
        <Icon name="share" />
      </IconButton>
    }
  />
);

/** A slot takes several elements, not just one. */
export const MultipleActions = () => (
  <Component
    title="Orders"
    left={<BackButton onPress={() => {}} />}
    right={[
      <IconButton key="filter" label="Filter" onPress={() => {}}>
        <Icon name="filter" />
      </IconButton>,
      <IconButton key="add" label="Add order" onPress={() => {}}>
        <Icon name="plus" />
      </IconButton>,
    ]}
  />
);

/**
 * A lone back button doesn't drag the title off-centre: both sides get an
 * equal share of the width whether or not they hold anything.
 */
export const CentredAgainstUnevenSlots = () => (
  <Component
    title="Centred"
    left={<BackButton onPress={() => {}} />}
    right={[
      <IconButton key="a" label="Filter" onPress={() => {}}>
        <Icon name="filter" />
      </IconButton>,
      <IconButton key="b" label="Add" onPress={() => {}}>
        <Icon name="plus" />
      </IconButton>,
    ]}
  />
);

/** Anything can go in the middle instead of a title. */
export const CustomMiddle = () => {
  const [query, setQuery] = useState("");
  const styles = useStyles();

  return (
    <Component left={<BackButton onPress={() => {}} />}>
      <View style={styles.field}>
        <Input
          type="text"
          value={query}
          onChange={setQuery}
          placeholder="Search orders"
        />
      </View>
    </Component>
  );
};

export const SegmentedMiddle = () => {
  const [view, setView] = useState("all");

  return (
    <Component left={<BackButton onPress={() => {}} />}>
      <SegmentedControl
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
        ]}
      />
    </Component>
  );
};

/** Clears the notch — only for a header pinned to the top of the screen. */
export const AvoidingTheNotch = () => (
  <Component
    title="Orders"
    left={<BackButton onPress={() => {}} />}
    avoidNotch
  />
);

/** Truncates rather than pushing the buttons out of shape. */
export const LongTitle = () => (
  <Component
    title="A title long enough that something has to give"
    left={<BackButton onPress={() => {}} />}
    right={
      <IconButton label="Share" onPress={() => {}}>
        <Icon name="share" />
      </IconButton>
    }
  />
);

/** Nothing in the middle at all is a legitimate header too. */
export const SlotsOnly = () => (
  <Component
    left={<BackButton onPress={() => {}} />}
    right={
      <IconButton label="Close" onPress={() => {}}>
        <Icon name="x" />
      </IconButton>
    }
  />
);

export const InAScreen = () => {
  const styles = useStyles();

  return (
    <View style={styles.screen}>
      <Component title="Orders" left={<BackButton onPress={() => {}} />} />
      <View style={styles.body}>
        <Text value="Screen content sits under it." />
      </View>
    </View>
  );
};

const useStyles = createStyles(({ spacing, sizes }) => ({
  field: {
    width: sizes.elementWidthLg / 2,
  },
  screen: {
    alignSelf: "stretch",
  },
  body: {
    padding: spacing.x16,
  },
}));
