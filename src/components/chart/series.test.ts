import { colors } from "@/features/theme/colors";

import { MAX_SERIES, resolveSeries } from "./series";

describe("resolveSeries", () => {
  it("assigns a colour per series, in order", () => {
    const { series } = resolveSeries(["a", "b"], colors.light);

    expect(series.map((entry) => entry.color)).toEqual([
      colors.light.chart1,
      colors.light.chart2,
    ]);
  });

  /**
   * Colour follows the entity, not its rank: a filter that removes a series
   * must not repaint the ones that remain, and that only holds if slot n is
   * always the nth key.
   */
  it("keeps a series' colour when one before it is unchanged", () => {
    const all = resolveSeries(["a", "b", "c"], colors.light).series;
    const fewer = resolveSeries(["a", "b"], colors.light).series;

    expect(fewer[1]!.color).toBe(all[1]!.color);
  });

  it("takes the dark scheme's own values, not the light ones flipped", () => {
    const { series } = resolveSeries(["a"], colors.dark);

    expect(series[0]!.color).toBe(colors.dark.chart1);
    expect(series[0]!.color).not.toBe(colors.light.chart1);
  });

  it("labels a series from the map, falling back to the key", () => {
    const { series } = resolveSeries(["revenue", "costs"], colors.light, {
      revenue: "Revenue",
    });

    expect(series.map((entry) => entry.label)).toEqual(["Revenue", "costs"]);
  });

  describe("past what the palette can tell apart", () => {
    const many = Array.from({ length: MAX_SERIES + 2 }, (_, i) => `s${i}`);

    it("draws what it can", () => {
      expect(resolveSeries(many, colors.light).series).toHaveLength(MAX_SERIES);
    });

    // Two different things in one colour is worse than a chart that admits
    // it is incomplete — and folding the tail into "Other" is a decision
    // about the data, so it belongs to the caller.
    it("reports the rest rather than repeating a colour", () => {
      const { series, overflow } = resolveSeries(many, colors.light);
      const used = series.map((entry) => entry.color);

      expect(new Set(used).size).toBe(used.length);
      expect(overflow).toEqual([`s${MAX_SERIES}`, `s${MAX_SERIES + 1}`]);
    });

    it("reports nothing when everything fits", () => {
      expect(resolveSeries(["a"], colors.light).overflow).toEqual([]);
    });
  });

  it("has nothing to draw for no keys", () => {
    expect(resolveSeries([], colors.light)).toEqual({
      series: [],
      overflow: [],
    });
  });
});
