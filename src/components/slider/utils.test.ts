import { normalizeSliderValue, normalizeSliderValues } from "./utils";

describe("slider utils", () => {
  it("clamps and snaps relative to the minimum", () => {
    expect(normalizeSliderValue(0.34, 0.1, 1, 0.1)).toBe(0.3);
    expect(normalizeSliderValue(20, 30, 80, 5)).toBe(30);
  });

  it("normalizes multi-thumb values into ascending order", () => {
    expect(normalizeSliderValues([80, 21, 50], 0, 100, 10)).toEqual([
      20, 50, 80,
    ]);
  });
});
