import {
  DAY,
  days,
  duration,
  hours,
  minutes,
  months,
  seconds,
  TIME_UNITS,
  toUnit,
  wait,
  weeks,
  years,
} from ".";

describe("time", () => {
  it("turns each unit into milliseconds", () => {
    expect(seconds(17)).toBe(17_000);
    expect(minutes(5)).toBe(300_000);
    expect(hours(1)).toBe(3_600_000);
    expect(days(1)).toBe(86_400_000);
    expect(weeks(1)).toBe(7 * DAY);
    expect(months(1)).toBe(30 * DAY);
    expect(years(1)).toBe(365 * DAY);
    expect(seconds(0.5)).toBe(500);
  });

  it("adds several units together", () => {
    expect(duration({ hours: 1, minutes: 30 })).toBe(5_400_000);
    expect(duration({})).toBe(0);
  });

  it("converts back, keeping the fraction", () => {
    expect(toUnit(minutes(90), "hour")).toBe(1.5);
    expect(toUnit(seconds(45), "minute")).toBe(0.75);
  });

  it("lists the units largest first", () => {
    const lengths = TIME_UNITS.map(([, length]) => length);
    expect([...lengths].sort((a, b) => b - a)).toEqual(lengths);
  });

  it("resolves after the requested delay", async () => {
    jest.useFakeTimers();
    const resolved = jest.fn();

    void wait(seconds(2)).then(resolved);
    await jest.advanceTimersByTimeAsync(seconds(2) - 1);
    expect(resolved).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
