import type { ReactNode } from "react";
import { View } from "react-native";

import If from "@/components/if";
import { imageA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import ChartLegend from "./legend";
import { MAX_SERIES, resolveSeries, type Series } from "./series";
import { describeChart } from "./summary";
import type { ChartProps, ChartRow } from "./types";

/** Tall enough to read a trend in, short enough to sit inside a card. */
const DEFAULT_HEIGHT = 220;

/**
 * Everything around the canvas: the palette, the legend, the accessible
 * readout, and the frame they sit in.
 *
 * None of it touches Skia, which is the point — the web has to render this
 * half while CanvasKit is still loading, and it is also the half worth
 * testing, since a canvas renders nothing a test can read.
 */
export default function ChartFrame<Row extends ChartRow>({
  label,
  type = "line",
  data,
  xKey,
  yKeys,
  seriesLabels,
  formatValue,
  formatX,
  height = DEFAULT_HEIGHT,
  style,
  testID,
  children,
}: ChartProps<Row> & {
  /** The plot, or whatever stands in for it while Skia loads. */
  children: (plot: {
    series: Series[];
    height: number;
    data: ChartRow[];
  }) => ReactNode;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { locale } = useLocale();

  const { series, overflow } = resolveSeries(
    yKeys,
    theme.colors,
    seriesLabels as Partial<Record<string, string>>,
  );

  if (overflow.length > 0) {
    // Loudly, and once per render rather than silently forever: the fix is
    // a decision about the data that only the caller can make.
    logger.failed(
      `Chart "${label}" was given ${yKeys.length} series and can tell ${MAX_SERIES} apart. Dropped: ${overflow.join(", ")}. Fold the tail into an "Other" series, or split the chart into small multiples — a seventh colour would repeat one of the six.`,
    );
  }

  const readValue =
    formatValue ?? ((value: number) => formatNumber(value, locale));
  const readX = formatX ?? ((value: unknown) => String(value));

  return (
    <View
      testID={testID}
      // One element carrying the whole chart as a sentence. `image` rather
      // than a group: it *is* a picture, and grouping would imply there is
      // something inside it to navigate.
      {...imageA11yProps({
        label: describeChart({
          label,
          type,
          data: data as ChartRow[],
          xKey,
          series,
          formatValue: readValue,
          formatX: readX,
        }),
      })}
      style={[styles.chart, { gap: spacing.x12 }, style]}
    >
      {children({ series, height, data: data as ChartRow[] })}
      {/* One series needs no key: the chart's own title names it. */}
      <If condition={series.length > 1}>
        <ChartLegend series={series} />
      </If>
    </View>
  );
}

const useStyles = createStyles(() => ({
  chart: {
    alignSelf: "stretch",
  },
}));
