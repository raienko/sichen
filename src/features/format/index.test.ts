import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  initials,
  toDate,
  toIsoDate,
  toIsoDateTime,
} from "./index";

// A fixed moment, shown in UTC so the assertions don't depend on the
// machine running them.
const MOMENT = "2026-10-16T14:30:05Z";
const utc = { timeZone: "utc" } as const;

describe("dates", () => {
  it("formats a day in the locale's own order and words", () => {
    expect(formatDate(MOMENT, "en-US", utc)).toBe("Oct 16, 2026");
    expect(formatDate(MOMENT, "en-GB", utc)).toBe("16 Oct 2026");
  });

  it("follows the locale's 12- or 24-hour clock", () => {
    expect(formatTime(MOMENT, "en-US", utc)).toBe("2:30 PM");
    expect(formatTime(MOMENT, "en-GB", utc)).toBe("14:30");
    expect(formatTime(MOMENT, "en-GB", { ...utc, seconds: true })).toBe(
      "14:30:05",
    );
  });

  it("shows a moment on whichever clock is asked for", () => {
    expect(formatTime(MOMENT, "en-GB", { timeZone: "Asia/Tokyo" })).toBe(
      "23:30",
    );
  });

  it("combines date and time", () => {
    expect(formatDateTime(MOMENT, "en-GB", utc)).toBe("16 Oct 2026, 14:30");
  });

  it("describes a moment relative to now", () => {
    const now = new Date(MOMENT).getTime();
    expect(formatRelative(now - 5 * 60_000, "en", now)).toBe("5 minutes ago");
    expect(formatRelative(now + 2 * 86_400_000, "en", now)).toBe("in 2 days");
    expect(formatRelative(now - 86_400_000, "en", now)).toBe("yesterday");
  });

  it("returns an empty string for something that isn't a date", () => {
    expect(toDate("not a date")).toBeNull();
    expect(formatDate("not a date", "en")).toBe("");
  });

  it("gives an API a local calendar day, or an exact UTC moment", () => {
    expect(toIsoDate(new Date(2026, 9, 6))).toBe("2026-10-06");
    expect(toIsoDateTime(MOMENT)).toBe("2026-10-16T14:30:05.000Z");
  });
});

describe("numbers", () => {
  it("groups and separates digits the locale's way", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    // Ukrainian groups with a non-breaking space, so a number never wraps.
    expect(formatNumber(1234.5, "uk")).toBe("1\u00a0234,5");
    expect(formatNumber(2, "en", { decimals: 2 })).toBe("2.00");
  });

  it("formats money, percentages and compact counts", () => {
    expect(formatCurrency(1234.5, "EUR", "en-US")).toBe("€1,234.50");
    expect(formatPercent(0.42, "en")).toBe("42%");
    expect(formatCompact(1_250, "en")).toBe("1.3K");
  });

  it("formats file sizes in powers of 1024", () => {
    expect(formatFileSize(0, "en")).toBe("0 B");
    expect(formatFileSize(1_536, "en")).toBe("1.5 KB");
    expect(formatFileSize(1_258_291, "en")).toBe("1.2 MB");
  });

  it("formats lengths of time like a media player", () => {
    expect(formatDuration(249_000)).toBe("4:09");
    expect(formatDuration(3_909_000)).toBe("1:05:09");
  });
});

describe("initials", () => {
  it("takes the first and last word", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("  grace  brewster hopper ")).toBe("GH");
    expect(initials("Ada")).toBe("A");
    expect(initials("")).toBe("");
  });
});
