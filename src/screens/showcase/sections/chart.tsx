import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import Chart, { type ChartType } from "@/components/chart";
import SegmentedControl from "@/components/segmented-control";
import Section from "@/components/section";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

const TYPES: { value: ChartType; label: string }[] = [
  { value: "line", label: "line" },
  { value: "area", label: "area" },
  { value: "bar", label: "bar" },
];

const MONTHS = [
  { month: "Jan", revenue: 18, costs: 12, refunds: 3 },
  { month: "Feb", revenue: 24, costs: 13, refunds: 4 },
  { month: "Mar", revenue: 21, costs: 15, refunds: 2 },
  { month: "Apr", revenue: 33, costs: 16, refunds: 5 },
  { month: "May", revenue: 38, costs: 18, refunds: 4 },
  { month: "Jun", revenue: 46, costs: 19, refunds: 6 },
];

const SESSIONS = MONTHS.map((row, index) => ({
  day: `D${index + 1}`,
  sessions: 40 + index * 9,
}));

/** The three forms, the theme palette, and the sentence it reads out. */
export default function ChartSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [type, setType] = useState<ChartType>("line");

  return (
    <View style={styles.container}>
      <Text
        value="Victory Native XL on a Skia canvas on iOS and Android, and SVG in the browser. Series colours come from the theme and were validated for colour-blind separation against this app's own light and dark surfaces."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="Form">
        <SegmentedControl
          label="Chart type"
          value={type}
          onChange={(next) => setType(next as ChartType)}
          options={TYPES}
        />
        <Card>
          <Chart
            label="Money by month"
            type={type}
            data={MONTHS}
            xKey="month"
            yKeys={["revenue", "costs", "refunds"]}
            seriesLabels={{
              revenue: "Revenue",
              costs: "Costs",
              refunds: "Refunds",
            }}
            formatValue={(value) => `£${value}k`}
          />
        </Card>
        <Text
          value="Three series, so a legend is present and colour is never the only thing carrying identity. With one series there is no legend — the title already names it."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="One series, no furniture">
        <Card>
          <Chart
            label="Sessions"
            type="area"
            data={SESSIONS}
            xKey="day"
            yKeys={["sessions"]}
            axes={false}
            height={120}
          />
        </Card>
        <Text
          value="axes={false} for a sparkline, where the shape is the message and the grid is noise."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="What a screen reader gets">
        <Text
          value="A drawn chart is one opaque picture — no bars, no points, nothing to land on. So the chart carries its data as a sentence instead: the form, how many points, and each series' first, last, low and high."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
        <Card type="outlined">
          <Text
            value={`Sessions. Area chart, ${SESSIONS.length} points from D1 to D${SESSIONS.length}. Sessions, up from ${SESSIONS[0]!.sessions} to ${SESSIONS[SESSIONS.length - 1]!.sessions}, low ${SESSIONS[0]!.sessions}, high ${SESSIONS[SESSIONS.length - 1]!.sessions}.`}
            type="caption1"
          />
        </Card>
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x24,
  },
}));
