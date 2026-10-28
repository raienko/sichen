import { Dimensions } from "react-native";

import { BASE_WIDTH } from "./config";
import { createUnits, scaleFactorForWidth, unitsSnapshot } from "./units";

describe("scaleFactorForWidth", () => {
  it("returns 1 at the base (Figma) width", () => {
    expect(scaleFactorForWidth(BASE_WIDTH)).toBe(1);
  });

  it("scales up moderately for a wider phone", () => {
    // 430 (iPhone Pro Max-ish) vs base 375: raw scale ~1.147, moderated by 0.5
    expect(scaleFactorForWidth(430)).toBeCloseTo(1.073, 3);
  });

  it("clamps growth on very wide desktop screens", () => {
    expect(scaleFactorForWidth(2560)).toBeLessThanOrEqual(1.6);
  });

  it("clamps shrinkage on very narrow screens", () => {
    expect(scaleFactorForWidth(50)).toBeGreaterThanOrEqual(0.85);
  });
});

describe("createUnits", () => {
  it("returns the input value unchanged at the base width", () => {
    const units = createUnits(BASE_WIDTH);

    expect(units(12)).toBe(12);
    expect(units(24)).toBe(24);
  });

  it("scales values up for a tablet-sized width", () => {
    const units = createUnits(900);

    expect(units(12)).toBeGreaterThan(12);
  });

  it("rounds to the nearest whole pixel", () => {
    const units = createUnits(400);

    expect(Number.isInteger(units(13))).toBe(true);
  });
});

describe("unitsSnapshot (module-scope, no hook required)", () => {
  it("reads the current window size imperatively via Dimensions.get", () => {
    const spy = jest.spyOn(Dimensions, "get").mockReturnValue({
      width: BASE_WIDTH,
      height: 800,
      scale: 1,
      fontScale: 1,
    });

    expect(unitsSnapshot(12)).toBe(12);
    expect(spy).toHaveBeenCalledWith("window");

    spy.mockRestore();
  });

  it("reflects a later Dimensions change on the next call (snapshot, not reactive)", () => {
    const spy = jest.spyOn(Dimensions, "get").mockReturnValue({
      width: BASE_WIDTH,
      height: 800,
      scale: 1,
      fontScale: 1,
    });
    expect(unitsSnapshot(12)).toBe(12);

    spy.mockReturnValue({ width: 900, height: 1200, scale: 1, fontScale: 1 });
    expect(unitsSnapshot(12)).toBeGreaterThan(12);

    spy.mockRestore();
  });

  it("scales off the shorter edge, so landscape doesn't inflate values", () => {
    // Same physical phone, portrait vs landscape — the short edge (375) is
    // unchanged, so the scale should be identical either way.
    const spy = jest.spyOn(Dimensions, "get");

    spy.mockReturnValue({ width: 375, height: 812, scale: 1, fontScale: 1 });
    const portrait = unitsSnapshot(12);

    spy.mockReturnValue({ width: 812, height: 375, scale: 1, fontScale: 1 });
    const landscape = unitsSnapshot(12);

    expect(landscape).toBe(portrait);

    spy.mockRestore();
  });
});
