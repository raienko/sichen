import { View } from "react-native";

import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { Series } from "./series";

/**
 * The key to which colour is which series.
 *
 * **Always present for two or more series, never for one.** With one, the
 * chart's own title names it and a legend box repeats it; with two, colour
 * is carrying identity and something has to say what it means. Three of the
 * light-scheme series colours also sit under 3:1 against white — a
 * documented relief in the palette rather than a failure — and a visible
 * text label is exactly the relief it obliges.
 *
 * **The label wears a text token, never its series colour.** A legend
 * written in the series hue is unreadable for the pale slots and states the
 * same fact twice for the rest; the swatch beside it carries the identity.
 */
export default function ChartLegend({ series }: { series: Series[] }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    // Hidden as a unit: the chart's own accessible readout already names
    // every series, so a screen reader that walked this too would hear the
    // list twice.
    <View {...disabledA11yProps()} style={styles.legend}>
      {series.map((entry) => (
        <View key={entry.key} style={styles.entry}>
          <View style={[styles.swatch, { backgroundColor: entry.color }]} />
          <Text
            value={entry.label}
            type="caption1"
            style={{ color: theme.colors.textSecondary }}
          />
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles(({ isRTL, units, spacing, radius }) => ({
  legend: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x12,
  },
  entry: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x4,
  },
  swatch: {
    borderRadius: radius.indicator,
    width: units(10),
    height: units(10),
  },
}));
