import { fireEvent, render, screen } from "@/root/testing";

import Chart from "./index.web";

/**
 * The web entry, imported directly: Jest resolves the native one. Nothing
 * here may reach Skia or Victory — the whole point of the SVG plot — so
 * both are made to throw if anything tries.
 */
jest.mock("victory-native", () => {
  throw new Error("the web chart must not import victory-native");
});
jest.mock("@shopify/react-native-skia", () => {
  throw new Error("the web chart must not import Skia");
});

const MONTHS = [
  { month: "Jan", revenue: 18, costs: 12 },
  { month: "Feb", revenue: 24, costs: 13 },
  { month: "Mar", revenue: 46, costs: 19 },
];

type JsonNode = {
  props?: Record<string, unknown>;
  children?: (JsonNode | string)[] | null;
};

/** Every string react-native-svg was asked to draw — TSpans carry it as a prop. */
function drawnText(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(drawnText);
  const { props, children } = node as JsonNode;
  const own = typeof props?.content === "string" ? [props.content] : [];
  return [...own, ...(children ?? []).flatMap(drawnText)];
}

async function renderLaidOut(ui: React.ReactElement) {
  await render(ui);
  // The plot draws once it knows its width, as it does in the browser.
  const plot = screen.getByTestId("chart").children[0] as Parameters<
    typeof fireEvent
  >[0];
  await fireEvent(plot, "layout", {
    nativeEvent: { layout: { width: 320, height: 220 } },
  });
}

describe("Chart on web", () => {
  it("keeps the frame's readout as the accessible name", async () => {
    await renderLaidOut(
      <Chart
        testID="chart"
        label="Revenue"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(screen.getByRole("image").props.accessibilityLabel).toMatch(
      /^Revenue/,
    );
  });

  it("labels both axes, which CanvasKit could not", async () => {
    await renderLaidOut(
      <Chart
        testID="chart"
        label="Revenue"
        type="bar"
        data={MONTHS}
        xKey="month"
        yKeys={["revenue", "costs"]}
        formatValue={(value) => `£${value}k`}
      />,
    );

    const text = drawnText(screen.toJSON());
    expect(text).toEqual(expect.arrayContaining(["Jan", "Feb", "Mar"]));
    expect(text).toEqual(expect.arrayContaining(["£0k", "£60k"]));
  });

  it("draws no axis labels as a sparkline", async () => {
    await renderLaidOut(
      <Chart
        testID="chart"
        label="Revenue"
        type="area"
        axes={false}
        data={MONTHS}
        xKey="month"
        yKeys={["revenue"]}
      />,
    );

    expect(drawnText(screen.toJSON())).toEqual([]);
  });
});
