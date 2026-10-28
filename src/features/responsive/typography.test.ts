import { createTypography } from "./typography";
import { createUnits } from "./units";

const units = createUnits(375); // base-width phone, scale = 1

describe("createTypography", () => {
  it("gives every token a complete style, not just a size", () => {
    const typography = createTypography(units, 1);

    for (const style of Object.values(typography)) {
      expect(typeof style.fontFamily).toBe("string");
      expect(typeof style.fontSize).toBe("number");
      expect(typeof style.lineHeight).toBe("number");
      expect(typeof style.fontWeight).toBe("string");
    }
  });

  it("follows Apple's scale, including headline's heavier weight at body's size", () => {
    const { body, headline, caption2, largeTitle } = createTypography(units, 1);

    expect(largeTitle.fontSize).toBeGreaterThan(body.fontSize);
    expect(body.fontSize).toBeGreaterThan(caption2.fontSize);
    expect(headline.fontSize).toBe(body.fontSize);
    expect(headline.fontWeight).toBe("600");
    expect(body.fontWeight).toBe("400");
  });

  /**
   * RN scales a Text's own fontSize by the OS text-size setting but leaves
   * lineHeight alone, so a fixed line box clips growing glyphs. Scaling
   * lineHeight here (and *only* lineHeight — scaling fontSize too would
   * double-apply the multiplier) is what keeps the two proportional.
   */
  describe("OS text-size scaling", () => {
    it("scales lineHeight with fontScale", () => {
      const base = createTypography(units, 1);
      const large = createTypography(units, 2);

      expect(large.body.lineHeight).toBe(base.body.lineHeight * 2);
    });

    it("leaves fontSize to RN, so the multiplier isn't applied twice", () => {
      const base = createTypography(units, 1);
      const large = createTypography(units, 2);

      expect(large.body.fontSize).toBe(base.body.fontSize);
    });
  });
});
