import { StyleSheet, Text as RNText, View, type ViewStyle } from "react-native";

import { render, screen } from "@/root/testing";

import { Cell, Column, Row } from "./index";

function cellStyle(text: string): ViewStyle {
  // The cell is the View wrapping the labelled child.
  return StyleSheet.flatten(
    screen.getByText(text).parent?.props.style,
  ) as ViewStyle;
}

describe("Row + Cell smoke test", () => {
  it("renders its cells", async () => {
    await render(
      <Row>
        <Cell>
          <RNText>a</RNText>
        </Cell>
        <Cell>
          <RNText>b</RNText>
        </Cell>
      </Row>,
    );

    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
  });

  it("sizes a cell to its share of the row's columns", async () => {
    await render(
      <Row columns={12}>
        <Cell columns={6}>
          <RNText>half</RNText>
        </Cell>
        <Cell columns={4}>
          <RNText>third</RNText>
        </Cell>
        <Cell columns={12}>
          <RNText>full</RNText>
        </Cell>
      </Row>,
    );

    expect(cellStyle("half").width).toBe("50%");
    expect(cellStyle("third").width).toBe(`${(4 / 12) * 100}%`);
    expect(cellStyle("full").width).toBe("100%");
  });

  it("defaults a cell to one column, so columns alone makes a tile grid", async () => {
    await render(
      <Row columns={4}>
        <Cell>
          <RNText>tile</RNText>
        </Cell>
      </Row>,
    );

    expect(cellStyle("tile").width).toBe("25%");
  });

  it("clamps a cell wider than the row to a full line", async () => {
    await render(
      <Row columns={4}>
        <Cell columns={99}>
          <RNText>wide</RNText>
        </Cell>
      </Row>,
    );

    expect(cellStyle("wide").width).toBe("100%");
  });

  /**
   * The core of the layout trick: cells carry half the gap each so two
   * adjacent ones sit a full gap apart, and the row pulls back the
   * half-gap that would otherwise pad its own outer edge. Widths stay
   * percentages that sum to exactly 100%, so wrapping is exact.
   */
  it("splits the gap between the cells and cancels it at the edges", async () => {
    await render(
      <Row gap={16}>
        <Cell>
          <RNText>cell</RNText>
        </Cell>
      </Row>,
    );

    expect(cellStyle("cell").padding).toBe(8);

    const row = screen.getByText("cell").parent?.parent;
    expect(StyleSheet.flatten(row?.props.style).margin).toBe(-8);
  });

  it("refuses to render a cell outside a row", async () => {
    // Silence React's own error logging for the expected throw.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      render(
        <Cell>
          <View />
        </Cell>,
      ),
    ).rejects.toThrow(/within a Row/);

    spy.mockRestore();
  });
});

describe("Column smoke test", () => {
  it("stacks its children", async () => {
    await render(
      <Column>
        <RNText>first</RNText>
        <RNText>second</RNText>
      </Column>,
    );

    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.getByText("second")).toBeTruthy();
  });

  // Unlike Row, Column has no percentage widths to break, so a plain gap is
  // the right tool for its spacing.
  it("spaces children with a real gap", async () => {
    await render(
      <Column gap={24}>
        <RNText>only</RNText>
      </Column>,
    );

    const column = screen.getByText("only").parent;
    const style = StyleSheet.flatten(column?.props.style) as ViewStyle;

    expect(style.gap).toBe(24);
    expect(style.flexDirection).toBe("column");
  });
});
