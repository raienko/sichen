import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Section from "@/components/section";
import Switch from "@/components/switch";
import Text from "@/components/text";
import Timer from "@/components/timer";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { hours, minutes } from "@/utils";

import Readout from "./readout";

/** Both directions, the ring, and what the two rates actually cost. */
export default function TimerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [deadline, setDeadline] = useState(() => Date.now() + minutes(2));
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);

  // Fixed at mount: `Date.now()` during render is impure, and these three
  // only exist to show the format changing with the magnitude.
  const [formats] = useState(() => ({
    minutes: Date.now() + 45_000,
    hours: Date.now() + hours(3),
    days: Date.now() + hours(50),
  }));

  return (
    <View style={styles.container}>
      <Text
        value="A countdown or a stopwatch. The digits change once a second and cost one React render; the ring changes every frame and runs entirely on the UI thread, where React never sees it."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="Countdown, with the ring">
        <View style={styles.row}>
          <Timer
            label="Time remaining"
            until={deadline}
            ring
            size={160}
            paused={paused}
            onComplete={() => setFinishedAt(new Date().toLocaleTimeString())}
          />
        </View>
        <Switch value={paused} onChange={setPaused} label="Paused" />
        <View style={styles.row}>
          <Button
            value="Restart (2 min)"
            size="small"
            onPress={() => {
              setFinishedAt(null);
              setDeadline(Date.now() + minutes(2));
            }}
          />
          <Button
            value="5 seconds"
            size="small"
            onPress={() => {
              setFinishedAt(null);
              setDeadline(Date.now() + 5_000);
            }}
          />
        </View>
        <Readout label="onComplete" value={finishedAt ?? "not yet"} />
        <Text
          value="The ring sweeps linearly so it never disagrees with the digits about how much is left, and starts at twelve o'clock rather than three."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="Stopwatch">
        <Timer label="Session length" since={startedAt} type="title2" />
        <Button
          value="Reset"
          size="small"
          onPress={() => setStartedAt(Date.now())}
        />
      </Section>

      <Section title="Formats">
        <View style={styles.row}>
          <Timer label="Under a minute" until={formats.minutes} type="body" />
          <Timer label="Over an hour" until={formats.hours} type="body" />
          <Timer label="Over a day" until={formats.days} type="body" />
        </View>
        <Text
          value="auto grows with the magnitude — m:ss, then h:mm:ss, then days. The digits are tabular, so nothing jiggles as they change."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="What it costs">
        <Text
          value="The ring redraws at the display's own rate and never re-renders React; the digits re-render once a second each. Driving both from one clock would mean either a ring that jumps in sixty steps, or sixty React renders a second for something React does not need to know about."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  container: {
    gap: spacing.x24,
  },
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x16,
  },
}));
