import { clamp01, hexToHsv, hsvToHex, normalizeHex } from "./color";

describe("normalizeHex", () => {
  it("reads six and three digits, with or without the #", () => {
    expect(normalizeHex("#3f5bd9")).toBe("#3F5BD9");
    expect(normalizeHex("3F5BD9")).toBe("#3F5BD9");
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex(" fff ")).toBe("#FFFFFF");
  });

  // #RRGGBBAA on the web is #AARRGGBB on Android — one string, two colours.
  it("refuses eight digits and anything that isn't hex", () => {
    expect(normalizeHex("#3F5BD9FF")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("blue")).toBeNull();
    expect(normalizeHex("")).toBeNull();
  });
});

describe("HSV", () => {
  it("places the primaries where the hue bar shows them", () => {
    expect(hexToHsv("#FF0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv("#00FF00")).toEqual({ h: 120, s: 1, v: 1 });
    expect(hexToHsv("#0000FF")).toEqual({ h: 240, s: 1, v: 1 });
  });

  it("gives greys no saturation, and black no brightness", () => {
    expect(hexToHsv("#808080")).toMatchObject({ s: 0 });
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
  });

  it("round-trips any colour through HSV", () => {
    for (const hex of ["#3F5BD9", "#E4002B", "#00A86B", "#FFD400", "#1B1C1F"]) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it("wraps hue past either end of the bar", () => {
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#FF0000");
    expect(hsvToHex({ h: -120, s: 1, v: 1 })).toBe("#0000FF");
  });
});

describe("clamp01", () => {
  it("keeps a drag past either edge on the edge", () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });
});
