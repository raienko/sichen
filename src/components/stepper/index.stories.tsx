import { useState } from "react";
import { View } from "react-native";

import Input from "@/components/input";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Stepper",
  component: Component,
};

export default meta;

export const Default = () => {
  const [quantity, setQuantity] = useState(1);

  return <Component label="Quantity" value={quantity} onChange={setQuantity} />;
};

export const Sizes = () => {
  const styles = useStyles();
  const [value, setValue] = useState(3);

  return (
    <View style={styles.stack}>
      <Component label="Small" size="small" value={value} onChange={setValue} />
      <Component label="Medium" value={value} onChange={setValue} />
      <Component label="Large" size="large" value={value} onChange={setValue} />
    </View>
  );
};

/** The button that would cross a bound is disabled, not merely ignored. */
export const Limits = () => {
  const styles = useStyles();
  const [guests, setGuests] = useState(1);

  return (
    <View style={styles.stack}>
      <Component
        label="Guests"
        value={guests}
        onChange={setGuests}
        min={1}
        max={4}
      />
      <Text value={`min 1, max 4 — currently ${guests}`} type="footnote" />
    </View>
  );
};

export const FractionalStep = () => {
  const [rate, setRate] = useState(1);

  return (
    <Component
      label="Playback rate"
      value={rate}
      onChange={setRate}
      min={0.5}
      max={2}
      step={0.25}
      formatValue={(value) => `${value}×`}
    />
  );
};

export const Disabled = () => (
  <Component label="Quantity" value={3} onChange={() => {}} disabled />
);

/** `hideLabel` for a row that already says what the number is. */
export const InAList = () => {
  const [quantity, setQuantity] = useState(2);

  return (
    <ListItem
      title="Flat white"
      subtitle="£3.20"
      right={
        <Component
          label="Quantity"
          hideLabel
          size="small"
          value={quantity}
          onChange={setQuantity}
          min={0}
          max={9}
        />
      }
    />
  );
};

/** Small adjustments here; typing belongs to the numeric input. */
export const BesideAnInput = () => {
  const styles = useStyles();
  const [value, setValue] = useState(12);

  return (
    <View style={styles.stack}>
      <Component label="Quantity" value={value} onChange={setValue} max={999} />
      <Input
        type="numeric"
        label="Or type it"
        value={value}
        onChange={(next) => setValue(next ?? 0)}
        min={0}
        max={999}
      />
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x16,
  },
}));
