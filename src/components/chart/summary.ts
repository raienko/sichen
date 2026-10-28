import type { ChartRow, ChartType } from "./types";
import type { Series } from "./series";

/** What each form is called when the chart describes itself. */
const TYPE_NAME: Record<ChartType, string> = {
  line: "Line chart",
  area: "Area chart",
  bar: "Bar chart",
};

type Options = {
  label: string;
  type: ChartType;
  data: ChartRow[];
  xKey: string;
  series: Series[];
  formatValue: (value: number) => string;
  formatX: (value: unknown) => string;
};

/**
 * The chart as a sentence, for the people who cannot see it.
 *
 * A chart drawn on a Skia canvas is one opaque picture to assistive
 * technology — there are no bars or points inside it to land on, because
 * there are no elements, only pixels. So unlike most components here, an
 * accessible name is not enough: the *data* has to be said out loud too, or
 * a screen-reader user gets "Revenue by month, image" and nothing else.
 *
 * What it says is the shape of the data rather than every value: the range
 * each series covers, its first and last, and how many points there are.
 * Reading out forty numbers is not an alternative to seeing a chart, it is
 * a different and worse experience; the trend and the extremes are what the
 * picture actually communicates.
 *
 * Pure and separate from the component so the wording can be tested without
 * a canvas — which is just as well, since a canvas renders nothing a test
 * could read.
 */
export function describeChart({
  label,
  type,
  data,
  xKey,
  series,
  formatValue,
  formatX,
}: Options): string {
  const points = data.length;
  if (points === 0 || series.length === 0) {
    return `${label}. ${TYPE_NAME[type]}, no data.`;
  }

  const span = `${points} ${points === 1 ? "point" : "points"} from ${formatX(
    data[0]?.[xKey],
  )} to ${formatX(data[points - 1]?.[xKey])}`;

  const described = series.map((entry) => {
    const values = data
      .map((row) => row[entry.key])
      .filter((value): value is number => typeof value === "number");

    if (values.length === 0) return `${entry.label}, no values`;

    const first = values[0]!;
    const last = values[values.length - 1]!;
    const direction =
      last > first ? "up from" : last < first ? "down from" : "unchanged at";

    return last === first
      ? `${entry.label}, ${direction} ${formatValue(first)}, low ${formatValue(
          Math.min(...values),
        )}, high ${formatValue(Math.max(...values))}`
      : `${entry.label}, ${direction} ${formatValue(first)} to ${formatValue(
          last,
        )}, low ${formatValue(Math.min(...values))}, high ${formatValue(
          Math.max(...values),
        )}`;
  });

  return `${label}. ${TYPE_NAME[type]}, ${span}. ${described.join(". ")}.`;
}
