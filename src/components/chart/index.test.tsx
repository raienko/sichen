import logger from "@/features/logger";
import { colors } from "@/features/theme/colors";
import { render } from "@/root/testing";

import Component from "./index";
import { MAX_SERIES } from "./series";

const hidden = { includeHiddenElements: true } as const;

const MONTHS = [
  { month: "Jan", revenue: 10, costs: 12 },
  { month: "Feb", revenue: 30, costs: 9 },
  { month: "Mar", revenue: 24, costs: 6 },
];

/** The colour each mark was drawn in — the mock records it. */
function markColors(view: Awaited<ReturnType<typeof render>>, kind: string) {
  return view
    .queryAllByTestId(`chart-${kind}`, hidden)
    .map((mark) => mark.props.accessibilityValue.text);
}

describe(`${Component.name} smoke test`, () => {
  it("draws a line by default", async () => {
    const view = await render(
      <Component
        label="Revenue"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(markColors(view, "line")).toHaveLength(1);
    expect(markColors(view, "bar")).toHaveLength(0);
  });

  it.each([
    ["bar", "bar"],
    ["area", "area"],
  ] as const)("draws a %s when asked", async (type, kind) => {
    const view = await render(
      <Component
        label="Revenue"
        type={type}
        data={MONTHS}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(markColors(view, kind)).toHaveLength(1);
  });

  // Drawn one series at a time, bars at the same x overlap and a taller
  // later series hides an earlier one entirely. Grouped, they sit side by
  // side — one group, one bar per series.
  it("groups several bar series side by side instead of overlapping them", async () => {
    const view = await render(
      <Component
        label="Revenue and costs"
        type="bar"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue", "costs"]}
      />,
    );

    const groups = view.getAllByTestId("chart-bar-group", {
      includeHiddenElements: true,
    });
    expect(groups).toHaveLength(1);
    expect(markColors(view, "bar")).toHaveLength(2);
  });

  // An area is a line with a fill under it, not a fill on its own — the
  // line is what the eye reads the value off.
  it("draws the line on top of an area's fill", async () => {
    const view = await render(
      <Component
        label="Revenue"
        type="area"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(markColors(view, "area")).toHaveLength(1);
    expect(markColors(view, "line")).toHaveLength(1);
  });

  it("colours each series from the theme, in order", async () => {
    const view = await render(
      <Component
        label="Revenue"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue", "costs"]}
      />,
    );

    expect(markColors(view, "line")).toEqual([
      colors.light.chart1,
      colors.light.chart2,
    ]);
  });

  describe("the legend", () => {
    // With one series the chart's own title names it, and a legend box just
    // repeats it.
    it("is absent for a single series", async () => {
      const view = await render(
        <Component
          label="Revenue"
          data={MONTHS}
          xKey="month"
          yKeys={["revenue"]}
          seriesLabels={{ revenue: "Revenue" }}
        />,
      );

      expect(view.queryByText("Revenue", hidden)).toBeNull();
    });

    // With two, colour is carrying identity and something has to say what
    // it means — three light series colours also sit under 3:1 on white,
    // which obliges a visible label.
    it("names every series once there are two", async () => {
      const view = await render(
        <Component
          label="Money"
          data={MONTHS}
          xKey="month"
          yKeys={["revenue", "costs"]}
          seriesLabels={{ revenue: "Revenue", costs: "Costs" }}
        />,
      );

      expect(view.getByText("Revenue", hidden)).toBeTruthy();
      expect(view.getByText("Costs", hidden)).toBeTruthy();
    });

    it("falls back to the key when a series has no label", async () => {
      const view = await render(
        <Component
          label="Money"
          data={MONTHS}
          xKey="month"
          yKeys={["revenue", "costs"]}
        />,
      );

      expect(view.getByText("costs", hidden)).toBeTruthy();
    });
  });

  /**
   * The canvas is one opaque picture, so the container's own label is the
   * whole experience for a screen-reader user.
   */
  describe("accessibility", () => {
    it("carries the data as a sentence", async () => {
      const view = await render(
        <Component
          testID="chart"
          label="Revenue"
          data={MONTHS}
          xKey="month"
          yKeys={["revenue"]}
          seriesLabels={{ revenue: "Revenue" }}
        />,
      );
      const { props } = view.getByTestId("chart");

      expect(props.accessibilityRole).toBe("image");
      expect(props.accessibilityLabel).toContain("Revenue. Line chart");
      expect(props.accessibilityLabel).toContain("3 points from Jan to Mar");
      expect(props.accessibilityLabel).toContain("up from 10 to 24");
    });

    it("hides the canvas, which has nothing inside it to read", async () => {
      const view = await render(
        <Component
          label="Revenue"
          data={MONTHS}
          xKey="month"
          yKeys={["revenue"]}
        />,
      );

      expect(view.queryByTestId("cartesian-chart")).toBeNull();
      expect(view.getByTestId("cartesian-chart", hidden)).toBeTruthy();
    });
  });

  describe("more series than the palette can tell apart", () => {
    const many = Array.from({ length: MAX_SERIES + 1 }, (_, i) => `s${i}`);
    const rows: Record<string, number>[] = [
      { x: 1, ...Object.fromEntries(many.map((key, i) => [key, i])) },
    ];

    it("draws only what it can tell apart", async () => {
      const view = await render(
        <Component label="Many" data={rows} xKey="x" yKeys={many} />,
      );

      expect(markColors(view, "line")).toHaveLength(MAX_SERIES);
    });

    it("says so, and says what to do about it", async () => {
      const failed = jest.spyOn(logger, "failed").mockImplementation(() => {});

      await render(
        <Component label="Many" data={rows} xKey="x" yKeys={many} />,
      );

      expect(failed).toHaveBeenCalledWith(
        expect.stringContaining(`Dropped: s${MAX_SERIES}`),
      );
      expect(failed).toHaveBeenCalledWith(expect.stringContaining("Other"));

      failed.mockRestore();
    });
  });

  it("renders with no data at all", async () => {
    const view = await render(
      <Component
        testID="chart"
        label="Revenue"
        data={[]}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(view.getByTestId("chart").props.accessibilityLabel).toBe(
      "Revenue. Line chart, no data.",
    );
  });
});
