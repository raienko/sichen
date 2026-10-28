import { describeChart } from "./summary";
import type { Series } from "./series";

const series = (key: string, label: string): Series => ({
  key,
  label,
  color: "#000000",
});

const MONTHS = [
  { month: "Jan", revenue: 10, costs: 12 },
  { month: "Feb", revenue: 30, costs: 9 },
  { month: "Mar", revenue: 24, costs: 6 },
];

function describe_(
  overrides: Partial<Parameters<typeof describeChart>[0]> = {},
) {
  return describeChart({
    label: "Revenue",
    type: "line",
    data: MONTHS,
    xKey: "month",
    series: [series("revenue", "Revenue")],
    formatValue: String,
    formatX: String,
    ...overrides,
  });
}

/**
 * A Skia canvas is one opaque picture to assistive technology, so this
 * sentence is the entire experience for a screen-reader user — which makes
 * it worth pinning down rather than eyeballing.
 */
describe("describeChart", () => {
  it("opens with the label and the form", () => {
    expect(describe_()).toMatch(/^Revenue\. Line chart, /);
  });

  it("names the form it actually is", () => {
    expect(describe_({ type: "bar" })).toContain("Bar chart");
    expect(describe_({ type: "area" })).toContain("Area chart");
  });

  it("gives the span in points and in x values", () => {
    expect(describe_()).toContain("3 points from Jan to Mar");
  });

  it("says a single point in the singular", () => {
    expect(describe_({ data: [MONTHS[0]!] })).toContain(
      "1 point from Jan to Jan",
    );
  });

  // The trend and the extremes are what the picture communicates; reading
  // forty numbers aloud is a different and worse experience.
  it("gives each series its direction, ends and extremes", () => {
    expect(describe_()).toContain("Revenue, up from 10 to 24, low 10, high 30");
  });

  it("reads a falling series as down", () => {
    expect(describe_({ series: [series("costs", "Costs")] })).toContain(
      "Costs, down from 12 to 6, low 6, high 12",
    );
  });

  it("reads a flat series as unchanged, without repeating the value", () => {
    const flat = [
      { month: "Jan", v: 5 },
      { month: "Feb", v: 5 },
    ];

    expect(describe_({ data: flat, series: [series("v", "Flat")] })).toContain(
      "Flat, unchanged at 5, low 5, high 5",
    );
  });

  it("describes every series", () => {
    const sentence = describe_({
      series: [series("revenue", "Revenue"), series("costs", "Costs")],
    });

    expect(sentence).toContain("Revenue,");
    expect(sentence).toContain("Costs,");
  });

  it("uses the caller's own formatting", () => {
    expect(describe_({ formatValue: (value) => `£${value}` })).toContain(
      "up from £10 to £24",
    );
  });

  describe("nothing to say", () => {
    it("says so for empty data", () => {
      expect(describe_({ data: [] })).toBe("Revenue. Line chart, no data.");
    });

    it("says so for no series", () => {
      expect(describe_({ series: [] })).toBe("Revenue. Line chart, no data.");
    });

    // A key that isn't in the rows, or rows with holes in them.
    it("says so for a series whose values are all missing", () => {
      expect(describe_({ series: [series("missing", "Missing")] })).toContain(
        "Missing, no values",
      );
    });
  });
});
