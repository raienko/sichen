import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { hours, minutes } from "@/utils";

import Component from "./index";

const meta = {
  title: "components/Timer",
  component: Component,
};

export default meta;

export const Countdown = () => {
  const [until] = useState(() => Date.now() + minutes(2));

  return <Component label="Time remaining" until={until} />;
};

/** The ring is the animated half, and it never re-renders React. */
export const WithRing = () => {
  const [until] = useState(() => Date.now() + minutes(2));

  return <Component label="Time remaining" until={until} ring size={160} />;
};

export const Stopwatch = () => {
  const [since] = useState(() => Date.now());

  return <Component label="Session length" since={since} type="title2" />;
};

/** `auto` grows with the magnitude; the digits are tabular either way. */
export const Formats = () => {
  const styles = useStyles();
  const [now] = useState(() => Date.now());

  return (
    <View style={styles.row}>
      <Component label="Under a minute" until={now + 45_000} type="body" />
      <Component label="Over an hour" until={now + hours(3)} type="body" />
      <Component label="Over a day" until={now + hours(50)} type="body" />
    </View>
  );
};

export const Paused = () => {
  const [until] = useState(() => Date.now() + minutes(2));

  return <Component label="Time remaining" until={until} ring paused />;
};

export const Completing = () => {
  const [until, setUntil] = useState(() => Date.now() + 5_000);
  const [done, setDone] = useState(false);
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Component
        label="Time remaining"
        until={until}
        ring
        onComplete={() => setDone(true)}
      />
      <Text value={done ? "onComplete fired." : "Counting…"} type="footnote" />
      <Button
        value="Restart"
        size="small"
        onPress={() => {
          setDone(false);
          setUntil(Date.now() + 5_000);
        }}
      />
    </View>
  );
};

const useStyles = createStyles(({ isRTL, spacing }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x16,
  },
  stack: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: spacing.x12,
  },
}));
