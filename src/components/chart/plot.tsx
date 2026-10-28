import { Fragment, useMemo, useState } from "react";
import { View } from "react-native";
import { matchFont } from "@shopify/react-native-skia";
import {
  Area,
  BarGroup,
  CartesianChart,
  Line,
  type CartesianChartRenderArg,
} from "victory-native";

import Match from "@/components/match";
import { disabledA11yProps } from "@/features/accessibility";
import { createStyles, useResponsive } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { Series } from "./series";
import type { ChartRow, ChartType } from "./types";

/** Thin marks: a 2px line reads as data, a 6px one reads as decoration. */
const LINE_WIDTH = 2;
/** Space between one x value's group of bars and the next, as a share of the slot. */
const BAR_GROUP_PADDING = 0.3;
/** Space between the bars inside one group, as a share of the group. */
const BAR_WITHIN_GROUP_PADDING = 0.1;
/** The fill under an `area`, faint enough that the line stays the subject. */
const AREA_OPACITY = 0.2;

type Props = {
  type: ChartType;
  data: ChartRow[];
  xKey: string;
  series: Series[];
  height: number;
  axes: boolean;
};

/**
 * The native plot: Victory Native XL on a Skia canvas. The web draws the
 * same marks as SVG instead (./svg-plot.tsx), so this module must never be
 * reachable from `index.web.tsx` — it would pull Skia and CanvasKit into
 * the web bundle. `web.test.tsx` enforces that.
 */
export default function ChartPlot({
  type,
  data,
  xKey,
  series,
  height,
  axes,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { typography, radius, spacing } = useResponsive();

  /**
   * Skia draws text with a font *object*, not a family name, so an axis
   * with no font renders its ticks and no labels at all — a grid, which is
   * not the same thing. `matchFont` asks the platform's own font manager
   * rather than making us bundle a `.ttf` for the sake of six numbers.
   *
   * If it ever throws, the font is `null`, and Victory reads that as "draw
   * the axes without labels". The grid, the marks and the accessible readout
   * stay. (CanvasKit, Skia's web build, has no system font manager at all.
   * That is one reason the web draws SVG instead.)
   */
  const font = useMemo(() => {
    try {
      // The rule exists to stop ad-hoc type styles being invented in
      // components; this is the opposite — Skia's font API takes a number,
      // and the number is the type scale's own `caption2` step, so the axis
      // labels scale with the device like every other size in the app.
      // eslint-disable-next-line no-restricted-syntax -- see above
      return matchFont({ fontSize: typography.caption2.fontSize });
    } catch {
      return null;
    }
  }, [typography.caption2.fontSize]);

  const yKeys = series.map((entry) => entry.key);

  // Bars are drawn centred on their x value, so the first and last group
  // hang half a group past it. A fixed inset clips them whenever a group is
  // wider than that inset — which is most bar charts. Half of one x slot is
  // always at least half a group (the group is 70% of its slot), so it's
  // measured from the plot's own width rather than guessed.
  const [plotWidth, setPlotWidth] = useState(0);
  const edgeInset =
    type === "bar" && data.length > 0
      ? Math.max(spacing.x16, plotWidth / data.length / 2)
      : spacing.x16;

  return (
    // The canvas is a picture with nothing inside it to read — the readout
    // on the container above is what a screen reader gets instead.
    <View
      {...disabledA11yProps()}
      onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}
      style={[styles.plot, { height }]}
    >
      <CartesianChart
        data={data as never}
        xKey={xKey as never}
        yKeys={yKeys as never}
        domainPadding={{
          left: edgeInset,
          right: edgeInset,
          top: spacing.x12,
        }}
        axisOptions={
          axes
            ? {
                font,
                // Recessive on purpose. `border` is the token for an edge
                // that has to be *seen* — a control's boundary — and a grid
                // is not that: it is a reference the eye should be able to
                // ignore while reading the marks. This step is the faintest
                // the palette has that still resolves against both
                // schemes' backgrounds.
                lineColor: theme.colors.backgroundElementSelected,
                labelColor: theme.colors.textSecondary,
                lineWidth: 1,
              }
            : { font: null, lineWidth: 0, labelColor: "transparent" }
        }
      >
        {({ points, chartBounds }: CartesianChartRenderArg<never, never>) => {
          const pointsOf = (key: string) =>
            (points as Record<string, never>)[key];

          // Bars are grouped rather than drawn one series at a time: each
          // series' bars sit at the same x, so drawn separately the second
          // series covers the first wherever it's taller — a multi-series
          // bar chart that silently hides data. `BarGroup` places them side
          // by side within each x instead, and a single series is simply a
          // group of one.
          if (type === "bar") {
            return (
              <BarGroup
                chartBounds={chartBounds}
                betweenGroupPadding={BAR_GROUP_PADDING}
                withinGroupPadding={BAR_WITHIN_GROUP_PADDING}
                // Anchored to the baseline: rounding all four corners
                // detaches a bar from the axis it is measured against.
                roundedCorners={{
                  topLeft: radius.indicator,
                  topRight: radius.indicator,
                }}
              >
                {series
                  .filter((entry) => pointsOf(entry.key))
                  .map((entry) => (
                    <BarGroup.Bar
                      key={entry.key}
                      points={pointsOf(entry.key)}
                      color={entry.color}
                    />
                  ))}
              </BarGroup>
            );
          }

          return series.map((entry) => {
            const seriesPoints = pointsOf(entry.key);
            if (!seriesPoints) return null;

            // The two line-based types in one place. `Match` resolves to
            // the matched branch's children and adds no element of its own,
            // so what reaches the canvas is still nothing but Skia nodes —
            // see the Fragment note below for why that matters here.
            return (
              <Match<ChartType> key={entry.key} value={type}>
                <Match.Case when="area">
                  {/* A Fragment, not a View: everything inside the canvas is
                      a Skia node, and a react-native View dropped in there is
                      handed to Skia's reconciler as if it were one. It
                      renders nothing and throws out of a ResizeObserver on
                      the web — which is exactly how this was found, as an
                      empty plot with a console full of "unobserve: parameter
                      1 is not of type Element". */}
                  <Fragment>
                    <Area
                      points={seriesPoints}
                      y0={chartBounds.bottom}
                      color={entry.color}
                      opacity={AREA_OPACITY}
                    />
                    <Line
                      points={seriesPoints}
                      color={entry.color}
                      strokeWidth={LINE_WIDTH}
                    />
                  </Fragment>
                </Match.Case>
                <Match.Default>
                  <Line
                    points={seriesPoints}
                    color={entry.color}
                    strokeWidth={LINE_WIDTH}
                  />
                </Match.Default>
              </Match>
            );
          });
        }}
      </CartesianChart>
    </View>
  );
}

const useStyles = createStyles(() => ({
  plot: {
    alignSelf: "stretch",
  },
}));
