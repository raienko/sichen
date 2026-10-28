import ChartFrame from "./frame";
import ChartPlot from "./plot";
import type { ChartProps, ChartRow } from "./types";

export type { ChartProps, ChartRow, ChartType } from "./types";
export { MAX_SERIES } from "./series";

/**
 * A chart, over Victory Native XL.
 *
 * ```tsx
 * <Chart
 *   label="Revenue by month"
 *   type="bar"
 *   data={months}
 *   xKey="month"
 *   yKeys={["revenue", "costs"]}
 *   seriesLabels={{ revenue: "Revenue", costs: "Costs" }}
 * />
 * ```
 *
 * **It says its data out loud.** A chart drawn on a Skia canvas is one
 * opaque picture to assistive technology — no bars, no points, no elements
 * at all, just pixels — so an accessible *name* is not enough on its own.
 * The container carries a generated sentence instead: the form, how many
 * points, and each series' first, last, low and high. That is the shape the
 * picture communicates; reading forty numbers aloud would not be an
 * alternative to seeing it.
 *
 * **Colour comes from the theme and is assigned by position.** Six series
 * hues, validated for colour-blind separation against this app's own light
 * and dark surfaces rather than eyeballed (see `CHART_SERIES_KEYS`). Slot 1
 * is always the first of `yKeys`, so a filter that removes a series does
 * not repaint the ones that remain. A seventh series is dropped with a log
 * naming the fix rather than given a repeated colour: two different things
 * in one colour is worse than a chart that admits it is incomplete.
 *
 * **A legend appears for two or more series and never for one.** With one,
 * the title already names it. With two, colour is carrying identity and
 * something has to say what it means — and three of the light series
 * colours sit under 3:1 against white, which obliges a visible label.
 *
 * **No dual axes, and no pie.** Two measures on two y-scales is the single
 * most misread chart there is; use two charts or index them to a common
 * base. Pie is left out because angle is harder to judge than length and a
 * bar answers the same question better.
 *
 * @example <Chart label="Sessions" data={days} xKey="day" yKeys={["sessions"]} />
 * @example <Chart label="Storage used" type="area" data={days} xKey="day" yKeys={["gb"]} axes={false} />
 */
export default function Chart<Row extends ChartRow>(props: ChartProps<Row>) {
  return (
    <ChartFrame {...props}>
      {({ series, height, data }) => (
        <ChartPlot
          type={props.type ?? "line"}
          data={data}
          xKey={props.xKey}
          series={series}
          height={height}
          axes={props.axes ?? true}
        />
      )}
    </ChartFrame>
  );
}
