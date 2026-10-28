import { useState } from "react";
import { View } from "react-native";

import Input from "@/components/input";
import ListItem from "@/components/list-item";
import Stepper, { type StepperSize } from "@/components/stepper";
import Text from "@/components/text";
import SegmentedControl from "@/components/segmented-control";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const SIZES: { value: StepperSize; label: string }[] = [
  { value: "small", label: "small" },
  { value: "medium", label: "medium" },
  { value: "large", label: "large" },
];

/** The limits, the fractional step, the sizes, and the typing alternative. */
export default function StepperSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [size, setSize] = useState<StepperSize>("medium");
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState(1);
  const [rate, setRate] = useState(1);
  const [coffees, setCoffees] = useState(2);
  const [typed, setTyped] = useState(12);

  return (
    <View style={styles.container}>
      <Text
        value="A number with a button either side of it. The whole control is one adjustable element — a screen reader swipes it up and down, and the two buttons are hidden rather than announced as a third and fourth stop."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Size" type="headline" />
      <SegmentedControl
        label="Size"
        value={size}
        onChange={(next) => setSize(next as StepperSize)}
        options={SIZES}
      />
      <Stepper
        label="Quantity"
        size={size}
        value={quantity}
        onChange={setQuantity}
      />
      <Readout label="value" value={String(quantity)} />

      <Text value="Limits" type="headline" />
      <Text
        value="The button that would cross a bound is disabled rather than pressable-and-ignored, so the control looks the way it behaves."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Stepper
        label="Guests"
        value={guests}
        onChange={setGuests}
        min={1}
        max={4}
      />
      <Readout label="guests (1–4)" value={String(guests)} />

      <Text value="Step and format" type="headline" />
      <Stepper
        label="Playback rate"
        value={rate}
        onChange={setRate}
        min={0.5}
        max={2}
        step={0.25}
        formatValue={(value) => `${value}×`}
      />
      <Readout label="rate" value={`${rate}`} />
      <Text
        value="A quarter-step never lands on 0.30000000000000004: the arithmetic rounds to as many places as its inputs actually have."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Disabled" type="headline" />
      <Stepper label="Quantity" value={3} onChange={() => {}} disabled />

      <Text value="In a row" type="headline" />
      <ListItem
        title="Flat white"
        subtitle="£3.20"
        right={
          <Stepper
            label="Quantity"
            hideLabel
            size="small"
            value={coffees}
            onChange={setCoffees}
            min={0}
            max={9}
          />
        }
      />
      <Text
        value="hideLabel keeps “Quantity” as the accessible name while the row says it visually."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Typing instead" type="headline" />
      <Text
        value="The value is deliberately not editable: a middle you can type into is an adjustable element and a text field at once. A range wide enough to want typing wants the numeric input, which already owns the digit filtering and the keyboard."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Stepper label="Quantity" value={typed} onChange={setTyped} max={999} />
      <Input
        type="numeric"
        label="Or type it"
        value={typed}
        onChange={(next) => setTyped(next ?? 0)}
        min={0}
        max={999}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
