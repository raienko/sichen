import { CHART_SERIES_KEYS, type ThemeColors } from "@/features/theme";

/** How many series the palette can tell apart. See CHART_SERIES_KEYS. */
export const MAX_SERIES = CHART_SERIES_KEYS.length;

export type Series = {
  /** The data field this draws. */
  key: string;
  /** What the legend and the readout call it. */
  label: string;
  color: string;
};

/**
 * The series a chart will actually draw, each with its colour.
 *
 * **Colour is assigned by position in `yKeys`, and never cycled.** Slot 1
 * is always the first series, slot 2 always the second. That is what makes
 * colour follow the entity rather than its rank: a filter that removes one
 * series must not repaint the others, so a caller keeps `yKeys` in a stable
 * order and each series keeps its colour whatever else is on screen.
 *
 * **Past six, the extra series are dropped rather than recoloured.** The
 * palette has six hues that a colour-blind reader can tell apart; a seventh
 * would have to reuse one, and two different things in the same colour is a
 * worse outcome than a chart that says it is missing something. Folding the
 * tail into an "Other" series, or splitting into small multiples, is a
 * decision about the *data* — so it belongs to the caller, and `overflow`
 * is what lets the component say so out loud.
 */
export function resolveSeries(
  yKeys: readonly string[],
  colors: ThemeColors,
  labels: Partial<Record<string, string>> = {},
): { series: Series[]; overflow: string[] } {
  const drawn = yKeys.slice(0, MAX_SERIES);

  return {
    series: drawn.map((key, index) => ({
      key,
      label: labels[key] ?? key,
      color: colors[CHART_SERIES_KEYS[index]!],
    })),
    overflow: yKeys.slice(MAX_SERIES),
  };
}
