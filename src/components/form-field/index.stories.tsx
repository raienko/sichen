import { useState } from "react";
import { View } from "react-native";

import Slider from "@/components/slider";
import Stepper from "@/components/stepper";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/FormField",
  component: Component,
};

export default meta;

/** A control that isn't an `Input`, framed the same way one is. */
export function AroundASlider() {
  const [volume, setVolume] = useState(40);

  return (
    <Component label="Volume" helperText="Applies to every device">
      <Slider
        label="Volume"
        hideLabel
        value={volume}
        onChange={setVolume}
        max={100}
      />
    </Component>
  );
}

export function Required() {
  const [guests, setGuests] = useState(2);

  return (
    <Component label="Guests" required>
      <Stepper
        label="Guests"
        hideLabel
        value={guests}
        onChange={setGuests}
        min={1}
      />
    </Component>
  );
}

export function WithError() {
  const [guests, setGuests] = useState(12);

  return (
    <Component
      label="Guests"
      error={guests > 8 ? "Tables seat eight at most" : undefined}
      helperText="Up to eight"
    >
      <Stepper
        label="Guests"
        hideLabel
        value={guests}
        onChange={setGuests}
        min={1}
      />
    </Component>
  );
}

export function WithCounter() {
  const styles = useStyles();

  return (
    <Component
      label="Selected"
      helperText="Pick the topics you follow"
      counter="3/5"
      counterLabel="3 of 5 selected"
    >
      <View style={styles.placeholder} />
    </Component>
  );
}

const useStyles = createStyles(({ sizes }) => ({
  placeholder: {
    height: sizes.elementHeightMd,
  },
}));
