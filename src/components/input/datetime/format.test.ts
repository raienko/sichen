import { formatValue, numeralsFor } from "./format";

const VALUE = new Date(2026, 7, 27, 14, 30);

describe("formatValue", () => {
  it("includes only the parts the mode asks for", () => {
    expect(formatValue(VALUE, "en", "date")).toBe("Aug 27, 2026");
    expect(formatValue(VALUE, "en", "time")).toBe("14:30");
    expect(formatValue(VALUE, "en", "datetime")).toBe("Aug 27, 2026 14:30");
  });

  it("follows the locale for the date", () => {
    expect(formatValue(VALUE, "uk", "date")).toBe("27 серп 2026 р.");
    expect(formatValue(VALUE, "es", "date")).toBe("27 de ago. de 2026");
    expect(formatValue(VALUE, "fr", "date")).toBe("27 août 2026");
    expect(formatValue(VALUE, "pt", "date")).toBe("27 de ago de 2026");
    expect(formatValue(VALUE, "de", "date")).toBe("27. Aug. 2026");
    expect(formatValue(VALUE, "it", "date")).toBe("27 ago 2026");
    expect(formatValue(VALUE, "ja", "datetime")).toBe("2026年8月27日 14:30");
  });

  // Chinese is the one that needs naming a region: Day.js ships no plain
  // `zh`, so an unmapped code would silently fall back to English.
  it("maps Chinese onto a locale Day.js actually has", () => {
    expect(formatValue(VALUE, "zh", "date")).toBe("2026年8月27日");
  });

  /**
   * The picker can only be trusted with 24-hour wheels (see
   * TWELVE_HOUR_UNSUPPORTED in ./index), so the field is pinned to the same
   * clock even where the locale itself prefers AM/PM — via a literal
   * `HH:mm` rather than a localized clock token.
   */
  it.each([
    ["en", "14:30"],
    ["uk", "14:30"],
    ["es", "14:30"],
    ["fr", "14:30"],
    ["pt", "14:30"],
    ["de", "14:30"],
    ["it", "14:30"],
    ["zh", "14:30"],
    ["ja", "14:30"],
    ["ar", "١٤:٣٠"],
  ] as const)("writes a 24-hour time in %s", (locale, expected) => {
    expect(formatValue(VALUE, locale, "time")).toBe(expected);
  });

  it("does not leak a locale set on one call into the next", () => {
    formatValue(VALUE, "ja", "date");

    expect(formatValue(VALUE, "en", "date")).toBe("Aug 27, 2026");
  });
});

describe("numeralsFor", () => {
  /**
   * Our Day.js formatter writes Arabic in Arabic-Indic digits while the
   * picker defaults to Latin, so the two would sit in one sheet disagreeing
   * about what a number looks like. This is what keeps them in step.
   */
  it("tells the picker which digits the field is using", () => {
    expect(formatValue(VALUE, "ar", "date")).toBe("٢٧ أغسطس ٢٠٢٦");
    expect(numeralsFor("ar")).toBe("arab");

    expect(numeralsFor("en")).toBe("latn");
    expect(numeralsFor("uk")).toBe("latn");
  });
});
