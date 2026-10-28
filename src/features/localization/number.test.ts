import { formatNumber } from "./number";

describe("formatNumber", () => {
  it("renders a plain number", () => {
    expect(formatNumber(42, "en")).toBe("42");
  });

  // The reason this goes through Intl at all rather than String(value).
  it("groups the way the locale does", () => {
    expect(formatNumber(1200, "en")).toBe("1,200");
    expect(formatNumber(1200, "de")).toBe("1.200");
  });

  it("renders a locale's own numbering system", () => {
    expect(formatNumber(3, "ar-EG")).toBe("٣");
  });

  it("keeps a fractional value's own separator", () => {
    expect(formatNumber(1.5, "en")).toBe("1.5");
    expect(formatNumber(1.5, "de")).toBe("1,5");
  });

  it("keeps the sign on a negative number", () => {
    expect(formatNumber(-5, "en")).toBe("-5");
  });

  // An unknown tag throws out of the Intl constructor; a control that
  // can't format a number should still show one.
  it("falls back to plain digits when the runtime has no such locale", () => {
    expect(formatNumber(42, "not-a-locale")).toBe("42");
  });
});
