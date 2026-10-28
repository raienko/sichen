import { createGridMetrics, DEFAULT_COLUMNS } from "./grid";

describe("createGridMetrics", () => {
  it("splits the gap into a cell's padding and the container's offset", () => {
    const metrics = createGridMetrics(12, 16);

    // Half the gap each side means two adjacent cells sit a full gap
    // apart, and the container pulls back the half that would pad its edge.
    expect(metrics.cellPadding).toBe(8);
    expect(metrics.edgeOffset).toBe(-8);
    expect(metrics.gap).toBe(16);
  });

  it("returns percentage widths that divide the grid exactly", () => {
    const { widthFor } = createGridMetrics(12, 8);

    expect(widthFor(12)).toBe("100%");
    expect(widthFor(6)).toBe("50%");
    expect(widthFor(3)).toBe("25%");
    expect(widthFor(1)).toBe(`${(1 / 12) * 100}%`);
  });

  it("makes a full line's worth of cells sum to exactly 100%", () => {
    const { widthFor } = createGridMetrics(3, 8);
    const each = Number.parseFloat(widthFor(1));

    // The reason widths are percentages rather than measured pixels: three
    // of them land on 100% with nothing left over, so wrapping is exact.
    expect(each * 3).toBeCloseTo(100, 10);
  });

  it("clamps a request wider than the grid to a full line", () => {
    expect(createGridMetrics(4, 8).widthFor(99)).toBe("100%");
  });

  it("clamps a zero or negative request to a single column", () => {
    const { widthFor } = createGridMetrics(4, 8);

    expect(widthFor(0)).toBe("25%");
    expect(widthFor(-3)).toBe("25%");
  });

  it("refuses to divide by fewer than one column", () => {
    expect(createGridMetrics(0, 8).columns).toBe(1);
    expect(createGridMetrics(0, 8).widthFor(1)).toBe("100%");
  });

  it("rounds a fractional column count rather than producing odd widths", () => {
    expect(createGridMetrics(3.4, 8).columns).toBe(3);
  });

  it("defaults to a twelve-column grid", () => {
    expect(DEFAULT_COLUMNS).toBe(12);
    expect(createGridMetrics(DEFAULT_COLUMNS, 8).widthFor(6)).toBe("50%");
  });
});
