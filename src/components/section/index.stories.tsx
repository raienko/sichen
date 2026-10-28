import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Card from "@/components/card";
import Divider from "@/components/divider";
import Input from "@/components/input";
import ListItem from "@/components/list-item";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Section",
  component: Component,
};

export default meta;

export const Titled = () => {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);

  return (
    <Component title="Notifications" description="Choose what reaches you.">
      <Switch value={push} onChange={setPush} label="Push" />
      <Switch value={email} onChange={setEmail} label="Email" />
    </Component>
  );
};

/** A control on the title's line. */
export const WithAction = () => (
  <Component
    title="Recent orders"
    action={<Button value="See all" size="small" onPress={() => {}} />}
  >
    <ListItem title="Order #12" subtitle="Delivered" />
    <ListItem title="Order #11" subtitle="Refunded" />
  </Component>
);

/** A form group, where the footer is the hint. */
export const WithFooter = () => {
  const [street, setStreet] = useState("");

  return (
    <Component title="Address" footer="Used for delivery only.">
      <Input
        type="text"
        label="Street"
        value={street}
        onChange={setStreet}
        placeholder="221B Baker Street"
      />
    </Component>
  );
};

/** No title: spacing and nesting, without a heading. */
export const Untitled = () => (
  <Component>
    <Text value="A group that needs the gaps but not a heading." />
    <Divider />
    <Text value="Still a level of nesting for anything inside it." />
  </Component>
);

/** The levels are counted, not passed. */
export const Nested = () => (
  <Component title="Settings">
    <Text value="Level 2." type="footnote" />
    <Component title="Notifications">
      <Text value="Level 3." type="footnote" />
      <Component title="Email">
        <Text value="Level 4." type="footnote" />
      </Component>
    </Component>
  </Component>
);

/** It draws no surface, so `Card` supplies one and neither knows about the other. */
export const InsideACard = () => (
  <Card>
    <Component title="Payment" description="Charged monthly.">
      <ListItem title="Visa ending 4242" />
    </Component>
  </Card>
);

/** A long title gives way; the action never shrinks. */
export const LongTitle = () => {
  const styles = useStyles();

  return (
    <View style={styles.narrow}>
      <Component
        title="A section title considerably longer than the space it has"
        description="And a description that also runs on for a while."
        action={<Button value="Edit" size="small" onPress={() => {}} />}
      >
        <Text value="Content" />
      </Component>
    </View>
  );
};

const useStyles = createStyles(({ units }) => ({
  narrow: {
    width: units(320),
  },
}));
