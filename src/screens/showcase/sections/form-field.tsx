import { useState } from "react";
import { View } from "react-native";

import FormField from "@/components/form-field";
import Slider from "@/components/slider";
import Stepper from "@/components/stepper";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/** Controls that aren't an `Input`, framed exactly the way one is. */
export default function FormFieldSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [volume, setVolume] = useState(40);
  const [guests, setGuests] = useState(10);

  return (
    <View style={styles.container}>
      <Text
        value="The label, helper and error shell every Input variation draws in, for any other control. The error line is announced the moment it appears."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <FormField
        label="Volume"
        helperText="Applies to every device"
        counter={`${volume}%`}
        counterLabel={`${volume} percent`}
      >
        <Slider
          label="Volume"
          hideLabel
          value={volume}
          onChange={setVolume}
          max={100}
        />
      </FormField>

      <FormField
        label="Guests"
        required
        helperText="Up to eight"
        error={guests > 8 ? "Tables seat eight at most" : undefined}
      >
        <Stepper
          label="Guests"
          hideLabel
          value={guests}
          onChange={setGuests}
          min={1}
        />
      </FormField>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x24,
  },
}));
