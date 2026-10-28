import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import SegmentedControl from "@/components/segmented-control";
import { createStyles } from "@/features/responsive";

import Component from "./index";
import type { ChartType } from "./types";

const meta = {
  title: "components/Chart",
  component: Component,
};

export default meta;

const MONTHS = [
  { month: "Jan", revenue: 18, costs: 12, refunds: 3 },
  { month: "Feb", revenue: 24, costs: 13, refunds: 4 },
  { month: "Mar", revenue: 21, costs: 15, refunds: 2 },
  { month: "Apr", revenue: 33, costs: 16, refunds: 5 },
  { month: "May", revenue: 38, costs: 18, refunds: 4 },
  { month: "Jun", revenue: 46, costs: 19, refunds: 6 },
];

export const Line = () => (
  <Card>
    <Component
      label="Revenue by month"
      data={MONTHS}
      xKey="month"
      yKeys={["revenue"]}
    />
  </Card>
);

export const Bar = () => (
  <Card>
    <Component
      label="Revenue by month"
      type="bar"
      data={MONTHS}
      xKey="month"
      yKeys={["revenue"]}
    />
  </Card>
);

export const Area = () => (
  <Card>
    <Component
      label="Revenue by month"
      type="area"
      data={MONTHS}
      xKey="month"
      yKeys={["revenue"]}
    />
  </Card>
);

/** Three series, so a legend is present and colour is never alone. */
export const MultipleSeries = () => (
  <Card>
    <Component
      label="Money by month"
      data={MONTHS}
      xKey="month"
      yKeys={["revenue", "costs", "refunds"]}
      seriesLabels={{ revenue: "Revenue", costs: "Costs", refunds: "Refunds" }}
      formatValue={(value) => `£${value}k`}
    />
  </Card>
);

/** No axes: the shape is the message and the grid is noise. */
export const Sparkline = () => (
  <Card>
    <Component
      label="Sessions"
      type="area"
      data={MONTHS}
      xKey="month"
      yKeys={["revenue"]}
      axes={false}
      height={100}
    />
  </Card>
);

export const Empty = () => (
  <Card>
    <Component label="Revenue" data={[]} xKey="month" yKeys={["revenue"]} />
  </Card>
);

export const Switchable = () => {
  const styles = useStyles();
  const [type, setType] = useState<ChartType>("line");

  return (
    <View style={styles.stack}>
      <SegmentedControl
        label="Chart type"
        value={type}
        onChange={(next) => setType(next as ChartType)}
        options={[
          { value: "line", label: "line" },
          { value: "area", label: "area" },
          { value: "bar", label: "bar" },
        ]}
      />
      <Card>
        <Component
          label="Money by month"
          type={type}
          data={MONTHS}
          xKey="month"
          yKeys={["revenue", "costs"]}
          seriesLabels={{ revenue: "Revenue", costs: "Costs" }}
        />
      </Card>
    </View>
  );
};

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x12,
  },
}));
