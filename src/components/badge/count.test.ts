import { formatCount } from "./count";

const plus = (value: string) => `${value}+`;

describe("formatCount", () => {
  it("renders a count below the cap as itself", () => {
    expect(formatCount(3, 99, "en", plus)).toBe("3");
  });

  it("renders the cap itself without an overflow marker", () => {
    expect(formatCount(99, 99, "en", plus)).toBe("99");
  });

  it("caps anything over it and marks the overflow", () => {
    expect(formatCount(100, 99, "en", plus)).toBe("99+");
    expect(formatCount(4821, 99, "en", plus)).toBe("99+");
  });

  it("takes a caller's own cap", () => {
    expect(formatCount(1200, 999, "en", plus)).toBe("999+");
    expect(formatCount(1200, 9, "en", plus)).toBe("9+");
  });

  // The suffix is copy, so where it goes is the locale's business — which
  // is why it arrives as a function rather than a "+" appended in here.
  it("leaves the overflow wording entirely to its caller", () => {
    expect(formatCount(100, 99, "en", (value) => `over ${value}`)).toBe(
      "over 99",
    );
  });

  // The reason this goes through Intl at all rather than String(count):
  // a thousands separator is not the same character everywhere.
  it("groups a large count the way the locale does", () => {
    expect(formatCount(1200, 9999, "en", plus)).toBe("1,200");
    expect(formatCount(1200, 9999, "de", plus)).toBe("1.200");
  });

  // The digits themselves aren't universal either, where a locale asks for
  // its own set. (Plain "ar" resolves to Western digits in current CLDR —
  // it's the regional tags that carry the Arabic-Indic ones.)
  it("renders a locale's own numbering system", () => {
    expect(formatCount(3, 99, "ar-EG", plus)).toBe("٣");
    expect(formatCount(100, 99, "ar-EG", plus)).toBe("٩٩+");
  });

  // An unknown locale tag throws out of the Intl constructor; a badge that
  // can't format a number should still show one.
  it("falls back to plain digits when the runtime has no such locale", () => {
    expect(formatCount(42, 99, "not-a-locale", plus)).toBe("42");
  });
});
