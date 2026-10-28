import { useState } from "react";
import { View } from "react-native";
import Svg, { G, Line, Path, Text as SvgText } from "react-native-svg";

import If from "@/components/if";
import { disabledA11yProps } from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, useResponsive } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import {
  areaPath,
  barPath,
  labelStride,
  linePath,
  xPositions,
  yScale,
} from "./scale";
import type { Series } from "./series";
import type { ChartRow, ChartType } from "./types";

/** Same marks as the native plot — see ./plot.tsx. */
const LINE_WIDTH = 2;
const BAR_GROUP_PADDING = 0.3;
const BAR_WITHIN_GROUP_PADDING = 0.1;
const AREA_OPACITY = 0.2;
/**
 * Rough advance width of one glyph as a share of the font size, for sizing
 * the y-label gutter before anything is measured. Tick labels are short
 * numbers, and numerals in the system UI fonts sit close to this.
 */
const GLYPH_WIDTH = 0.6;

type Props = {
  type: ChartType;
  data: ChartRow[];
  xKey: string;
  series: Series[];
  height: number;
  axes: boolean;
  formatValue?: (value: number) => string;
  formatX?: (value: unknown) => string;
};

/**
 * The web's plot: the same three forms as ./plot.tsx, drawn as SVG.
 *
 * Native draws with Victory Native on Skia. On the web that needs
 * CanvasKit, an ~8 MB WebAssembly download, for one component, and even
 * then it has no system fonts, so the axes have no labels. SVG is already
 * in the bundle for Icon and Barcode, draws text with the page's own fonts,
 * and renders on the first paint.
 *
 * The two renderers share everything that decides what the chart *says*:
 * the frame, the palette, the legend, the readout and the mark constants.
 * Only the geometry is computed twice, and that half lives in ./scale.ts.
 */
export default function SvgPlot({
  type,
  data,
  xKey,
  series,
  height,
  axes,
  formatValue,
  formatX,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { locale } = useLocale();
  const { typography, radius, spacing } = useResponsive();
  const [width, setWidth] = useState(0);

  const readValue =
    formatValue ?? ((value: number) => formatNumber(value, locale));
  const readX = formatX ?? ((value: unknown) => String(value));
  // The type scale's own caption2 step, family included: SVG text doesn't
  // inherit the page's font, and without one the browser falls back to serif.
  const caption = typography.caption2;
  const fontSize = caption.fontSize;

  const valueOf = (row: ChartRow, key: string): number | null => {
    const value = row[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  const scale = yScale(
    data.flatMap((row) =>
      series.map((entry) => valueOf(row, entry.key) ?? Number.NaN),
    ),
    { includeZero: type !== "line" },
  );
  const tickLabels = scale.ticks.map(readValue);

  // Gutters: room for the longest tick label on the start side, one line of
  // x labels underneath, and headroom so the top tick's label isn't clipped.
  const left = axes
    ? Math.ceil(
        Math.max(...tickLabels.map((label) => label.length)) *
          fontSize *
          GLYPH_WIDTH,
      ) + spacing.x8
    : 0;
  const bottom = axes ? fontSize + spacing.x8 : 0;
  const top = spacing.x12;
  const plotWidth = Math.max(0, width - left);
  const plotHeight = Math.max(0, height - top - bottom);

  const toY = (value: number) =>
    top + plotHeight * (1 - (value - scale.min) / (scale.max - scale.min || 1));
  const baseline = toY(Math.min(Math.max(0, scale.min), scale.max));

  const centres = xPositions(data.length, plotWidth, {
    band: type === "bar",
    inset: spacing.x16,
  }).map((x) => left + x);
  const stride = labelStride(data.length, plotWidth, fontSize * 5);

  const marks = () => {
    if (type === "bar") {
      const slot = data.length ? plotWidth / data.length : 0;
      const group = slot * (1 - BAR_GROUP_PADDING);
      const count = Math.max(series.length, 1);
      const gap =
        count > 1 ? (group * BAR_WITHIN_GROUP_PADDING) / (count - 1) : 0;
      const bar = (group - gap * (count - 1)) / count;

      return data.map((row, index) =>
        series.map((entry, seriesIndex) => {
          const value = valueOf(row, entry.key);
          if (value === null) return null;
          const x = centres[index]! - group / 2 + seriesIndex * (bar + gap);
          return (
            <Path
              key={`${entry.key}-${index}`}
              d={barPath(x, bar, toY(value), baseline, radius.indicator)}
              fill={entry.color}
            />
          );
        }),
      );
    }

    return series.map((entry) => {
      const points = data.map((row, index) => {
        const value = valueOf(row, entry.key);
        return value === null ? null : { x: centres[index]!, y: toY(value) };
      });
      return (
        <G key={entry.key}>
          <If condition={type === "area"}>
            <Path
              d={areaPath(points, baseline)}
              fill={entry.color}
              fillOpacity={AREA_OPACITY}
            />
          </If>
          <Path
            d={linePath(points)}
            stroke={entry.color}
            strokeWidth={LINE_WIDTH}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      );
    });
  };

  return (
    // Hidden like the native canvas: the frame's readout is what a screen
    // reader gets, and SVG text would otherwise be read as loose fragments.
    <View
      {...disabledA11yProps()}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.plot, { height }]}
    >
      <If condition={width > 0}>
        <Svg width={width} height={height}>
          <If condition={axes}>
            {scale.ticks.map((tick, index) => (
              <G key={`y-${tick}`}>
                {/* Recessive for the reason given in ./plot.tsx. */}
                <Line
                  x1={left}
                  x2={width}
                  y1={toY(tick)}
                  y2={toY(tick)}
                  stroke={theme.colors.backgroundElementSelected}
                  strokeWidth={1}
                />
                <SvgText
                  x={left - spacing.x8}
                  y={toY(tick)}
                  fontSize={fontSize}
                  fontFamily={caption.fontFamily}
                  fill={theme.colors.textSecondary}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {tickLabels[index]}
                </SvgText>
              </G>
            ))}
          </If>
          {marks()}
          <If condition={axes}>
            {data.map((row, index) => (
              <If key={`x-${index}`} condition={index % stride === 0}>
                <SvgText
                  x={centres[index]}
                  y={height - spacing.x4}
                  fontSize={fontSize}
                  fontFamily={caption.fontFamily}
                  fill={theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {readX(row[xKey])}
                </SvgText>
              </If>
            ))}
          </If>
        </Svg>
      </If>
    </View>
  );
}

const useStyles = createStyles(() => ({
  plot: {
    alignSelf: "stretch",
  },
}));
