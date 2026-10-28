import { encodeLinear } from "./linear";

describe("encodeLinear", () => {
  it("encodes a value into bars", () => {
    const encoded = encodeLinear("PKG-4821", "CODE128")!;

    expect(encoded.bars.length).toBeGreaterThan(0);
    expect(encoded.extent).toBeGreaterThan(0);
  });

  // The encoder returns a string of 1s and 0s; adjacent 1s are one bar, and
  // collapsing them is what makes a hundred modules a couple of dozen rects.
  it("collapses adjacent modules into one bar", () => {
    const encoded = encodeLinear("PKG-4821", "CODE128")!;
    const covered = encoded.bars.reduce((total, bar) => total + bar.width, 0);

    expect(encoded.bars.length).toBeLessThan(covered);
    expect(encoded.bars.every((bar) => bar.width > 0)).toBe(true);
  });

  it("keeps the bars inside the symbol, in order and never touching", () => {
    const encoded = encodeLinear("PKG-4821", "CODE128")!;

    encoded.bars.forEach((bar, index) => {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.x + bar.width).toBeLessThanOrEqual(encoded.extent);

      const previous = encoded.bars[index - 1];
      // A gap of at least one module, or they would have been one bar.
      if (previous) expect(bar.x).toBeGreaterThan(previous.x + previous.width);
    });
  });

  it("reports the human-readable line the encoder settled on", () => {
    expect(encodeLinear("PKG-4821", "CODE128")!.text).toBe("PKG-4821");
  });

  // EAN13 takes twelve digits and computes the thirteenth.
  it("adds a check digit where the symbology has one", () => {
    expect(encodeLinear("590123412345", "EAN13")!.text).toBe("5901234123457");
  });

  // EAN13 takes twelve digits and computes the thirteenth. This is also
  // what proves `flat` is being passed: without it the family encodes as
  // separate segments and the text never arrives at all.
  it("adds a check digit where the symbology has one", () => {
    expect(encodeLinear("590123412345", "EAN13")!.text).toBe("5901234123457");
    expect(encodeLinear("9638507", "EAN8")!.text).toBe("96385074");
  });

  // A segmented encoding's top-level data is three modules of guard bar;
  // a real symbol is dozens.
  it("encodes the whole symbol, not just its first segment", () => {
    expect(encodeLinear("590123412345", "EAN13")!.extent).toBe(95);
  });

  // CODE39 has no lower case, and the encoder normalises rather than
  // refusing — worth pinning down, since the printed line then differs
  // from what the caller passed.
  it("upper-cases what CODE39 cannot represent", () => {
    expect(encodeLinear("abc", "CODE39")!.text).toBe("ABC");
  });

  it.each([
    ["CODE128", "PKG-4821"],
    ["CODE39", "ABC123"],
    ["EAN13", "590123412345"],
    ["EAN8", "9638507"],
    ["ITF14", "1234567890123"],
    ["codabar", "A123456789B"],
  ] as const)("encodes %s", (format, value) => {
    expect(encodeLinear(value, format)).not.toBeNull();
  });

  /**
   * Drawing something anyway produces a barcode that scans as the wrong
   * thing, or as nothing, with nothing on screen to say so — so the
   * encoder is asked first and `null` means nothing is drawn.
   */
  describe("what it will not encode", () => {
    it("declines an empty string", () => {
      expect(encodeLinear("", "CODE128")).toBeNull();
    });

    it("declines an EAN13 of the wrong length", () => {
      expect(encodeLinear("123", "EAN13")).toBeNull();
    });

    it("declines a non-numeric EAN13", () => {
      expect(encodeLinear("abcdefghijkl", "EAN13")).toBeNull();
    });

    it("declines a format it does not implement", () => {
      expect(encodeLinear("123", "NOPE" as never)).toBeNull();
    });
  });
});
