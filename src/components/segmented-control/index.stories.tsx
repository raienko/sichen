import { useState } from "react";
import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/SegmentedControl",
  component: Component,
};

export default meta;

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function Demo({
  type,
  ...props
}: Partial<React.ComponentProps<typeof Component>>) {
  const styles = useStyles();
  const [value, setValue] = useState("week");

  return (
    <View style={styles.container}>
      <Component
        type={type}
        label="View"
        value={value}
        onChange={setValue}
        options={VIEWS}
        {...props}
      />
      <Text value={`value: ${value}`} type="footnote" />
    </View>
  );
}

export const Default = () => <Demo />;

/** Expo UI's platform control — UISegmentedControl / Material segments. */
export const Expo = () => <Demo type="expo" />;

/** Two options is the narrowest a segmented control is worth using. */
export const TwoOptions = () => (
  <Demo
    options={[
      { value: "day", label: "Day" },
      { value: "week", label: "Week" },
    ]}
  />
);

/** Long labels shrink and ellipsize rather than widening the track. */
export const LongLabels = () => (
  <Demo
    options={[
      { value: "day", label: "By day" },
      { value: "week", label: "By calendar week" },
      { value: "month", label: "By month" },
    ]}
  />
);

/** One choice unavailable — custom implementation only. */
export const OptionDisabled = () => (
  <Demo
    options={[
      { value: "day", label: "Day" },
      { value: "week", label: "Week" },
      { value: "month", label: "Month", disabled: true },
    ]}
  />
);

export const Disabled = () => <Demo disabled />;

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
    alignSelf: "stretch",
  },
}));
