import ChartFrame from "./frame";
import SvgPlot from "./svg-plot";
import type { ChartProps, ChartRow } from "./types";

export type { ChartProps, ChartRow, ChartType } from "./types";
export { MAX_SERIES } from "./series";

/**
 * The browser's `Chart`. Same props, same frame, same readout; the plot is
 * SVG rather than Skia — see ./svg-plot.tsx for why. Nothing in this
 * file's graph may import ./plot, which would pull Skia and CanvasKit back
 * into the web bundle.
 *
 * See ./index.tsx for the component's own documentation.
 */
export default function Chart<Row extends ChartRow>(props: ChartProps<Row>) {
  return (
    <ChartFrame {...props}>
      {({ series, height, data }) => (
        <SvgPlot
          type={props.type ?? "line"}
          data={data}
          xKey={props.xKey}
          series={series}
          height={height}
          axes={props.axes ?? true}
          formatValue={props.formatValue}
          formatX={props.formatX}
        />
      )}
    </ChartFrame>
  );
}
