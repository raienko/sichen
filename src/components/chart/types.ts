import type { StyleProp, ViewStyle } from "react-native";

/**
 * The three forms this wraps. Each answers a different question, which is
 * the only reason to have more than one:
 *
 * - `line` — how a value moved over an ordered axis. The default.
 * - `area` — the same, when the *volume under* the line is the point
 *   (cumulative totals, capacity used).
 * - `bar` — magnitude compared across discrete categories, not over time.
 *
 * Deliberately no pie or donut. Victory can draw them; they are the form
 * people read worst, because judging angle is harder than judging length,
 * and a bar chart answers the same question better. Add one when a real
 * screen needs it and the trade has been made deliberately.
 */
export type ChartType = "line" | "area" | "bar";

/** A row of the caller's own data — whatever shape it already has. */
export type ChartRow = Record<string, unknown>;

export type ChartProps<Row extends ChartRow> = {
  /**
   * What the chart shows — "Revenue by month". Required, and doing double
   * duty: it names the chart for a screen reader and is the sentence its
   * data readout starts with.
   *
   * A chart drawn on a Skia canvas is a *picture* to assistive technology,
   * with nothing inside it to read. The name and the readout are the only
   * things a screen-reader user gets, which is why neither is optional.
   */
  label: string;
  /** Defaults to `"line"`. */
  type?: ChartType;
  data: Row[];
  /** The field along the horizontal axis. */
  xKey: keyof Row & string;
  /**
   * The numeric fields to draw, in order — the first takes series colour 1,
   * the second colour 2, and so on. Colour follows the entity, never its
   * rank, so keep the order stable when a filter removes one: dropping a
   * series must not repaint the survivors.
   */
  yKeys: (keyof Row & string)[];
  /**
   * Human names per series, for the legend and the readout. Falls back to
   * the key itself, which is fine for `revenue` and poor for `rev_usd_c`.
   */
  seriesLabels?: Partial<Record<keyof Row & string, string>>;
  /** How a y value reads. Defaults to the active locale's number format. */
  formatValue?: (value: number) => string;
  /** How an x value reads. Defaults to `String`. */
  formatX?: (value: unknown) => string;
  /**
   * How tall the plot is. A chart has no intrinsic height — it fills what
   * it is given — so this is the one measurement it cannot infer.
   */
  height?: number;
  /**
   * Draws the axes and grid. On by default; turn it off for a sparkline,
   * where the shape is the whole message and the furniture is noise.
   */
  axes?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
