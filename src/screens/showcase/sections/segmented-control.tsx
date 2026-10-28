import { useState } from "react";
import { View } from "react-native";

import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import type { ComponentType } from "@/components/types";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const IMPLEMENTATIONS: { value: ComponentType; label: string }[] = [
  { value: "custom", label: "custom" },
  { value: "expo", label: "expo" },
];

/**
 * The control demonstrates itself: the picker choosing which
 * implementation to show below is a `SegmentedControl` too.
 */
export default function SegmentedControlSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [implementation, setImplementation] = useState<ComponentType>("custom");
  const [view, setView] = useState("week");
  const [sort, setSort] = useState("newest");

  return (
    <View style={styles.container}>
      <Text
        value="One of a handful of options, always exactly one chosen. Announced as a radio group, so a screen reader says what the choice is for before reading the options."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <SegmentedControl
        label="Implementation"
        value={implementation}
        onChange={(next) => setImplementation(next as ComponentType)}
        options={IMPLEMENTATIONS}
      />

      <SegmentedControl
        type={implementation}
        label="View"
        value={view}
        onChange={setView}
        options={VIEWS}
      />
      <Readout label="value" value={view} />

      <Text value="One option unavailable" type="headline" />
      <Text
        value="Per-option disabling is custom-only — Expo UI's control enables or disables the whole thing."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <SegmentedControl
        label="Sort by"
        value={sort}
        onChange={setSort}
        options={[
          { value: "newest", label: "Newest" },
          { value: "oldest", label: "Oldest" },
          { value: "popular", label: "Popular", disabled: true },
        ]}
      />
      <Readout label="value" value={sort} />

      <Text value="Disabled" type="headline" />
      <SegmentedControl
        label="Density"
        value="cosy"
        onChange={() => {}}
        disabled
        options={[
          { value: "compact", label: "Compact" },
          { value: "cosy", label: "Cosy" },
        ]}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));
