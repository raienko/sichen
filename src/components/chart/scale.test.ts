import {
  areaPath,
  barPath,
  labelStride,
  linePath,
  niceStep,
  xPositions,
  yScale,
} from "./scale";

describe("niceStep", () => {
  it.each([
    [46, 4, 20],
    [10, 4, 2.5],
    [1, 4, 0.25],
    [900, 5, 200],
  ])("span %d over %d ticks → %d", (span, count, step) => {
    expect(niceStep(span, count)).toBe(step);
  });

  it("falls back to 1 for an empty span", () => {
    expect(niceStep(0, 4)).toBe(1);
  });
});

describe("yScale", () => {
  it("starts bars and areas at zero and rounds the top up to a tick", () => {
    expect(yScale([18, 46], { includeZero: true })).toEqual({
      min: 0,
      max: 60,
      ticks: [0, 20, 40, 60],
    });
  });

  it("fits a line to its own range", () => {
    const scale = yScale([18, 46], { includeZero: false });
    expect(scale.min).toBeGreaterThan(0);
    expect(scale.min).toBeLessThanOrEqual(18);
    expect(scale.max).toBeGreaterThanOrEqual(46);
  });

  it("spans negative values below the baseline", () => {
    const scale = yScale([-5, 12], { includeZero: true });
    expect(scale.min).toBeLessThanOrEqual(-5);
    expect(scale.ticks).toContain(0);
  });

  it("gives a flat or empty series a band instead of a zero span", () => {
    expect(yScale([7, 7], { includeZero: false }).max).toBeGreaterThan(
      yScale([7, 7], { includeZero: false }).min,
    );
    expect(yScale([], { includeZero: true })).toMatchObject({ min: 0 });
  });

  it("ignores missing values", () => {
    expect(yScale([Number.NaN, 4], { includeZero: true }).max).toBe(4);
  });

  it("prints decimal ticks without float noise", () => {
    expect(yScale([0, 0.3], { includeZero: true }).ticks).toEqual([
      0, 0.1, 0.2, 0.3,
    ]);
  });
});

describe("xPositions", () => {
  it("centres bars in equal slots", () => {
    expect(xPositions(4, 400, { band: true, inset: 16 })).toEqual([
      50, 150, 250, 350,
    ]);
  });

  it("runs points edge to edge inside the inset", () => {
    expect(xPositions(3, 232, { band: false, inset: 16 })).toEqual([
      16, 116, 216,
    ]);
  });

  it("puts a single point in the middle", () => {
    expect(xPositions(1, 200, { band: false, inset: 16 })).toEqual([100]);
  });
});

describe("labelStride", () => {
  it("shows every label when there is room", () => {
    expect(labelStride(6, 600, 50)).toBe(1);
  });

  it("skips labels that would collide", () => {
    expect(labelStride(30, 300, 50)).toBe(5);
  });
});

describe("paths", () => {
  it("breaks a line at a gap", () => {
    expect(
      linePath([{ x: 0, y: 0 }, null, { x: 2, y: 2 }, { x: 3, y: 1 }]),
    ).toBe("M0,0M2,2L3,1");
  });

  it("closes each run of an area down to the baseline", () => {
    expect(
      areaPath(
        [
          { x: 0, y: 5 },
          { x: 10, y: 2 },
        ],
        20,
      ),
    ).toBe("M0,5L10,2L10,20L0,20Z");
  });

  it("draws a square bar when the radius is zero", () => {
    expect(barPath(10, 20, 30, 100, 0)).toBe("M10,30H30V100H10Z");
  });

  it("rounds only the end away from the baseline", () => {
    const up = barPath(0, 20, 0, 100, 4);
    expect(up.startsWith("M0,100")).toBe(true);
    expect(up).toContain("Q0,0 4,0");

    const down = barPath(0, 20, 100, 50, 4);
    expect(down.startsWith("M0,50")).toBe(true);
    expect(down).toContain("Q0,100 4,100");
  });
});
