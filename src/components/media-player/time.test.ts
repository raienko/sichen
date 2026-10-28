import { formatTime } from "./time";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [7, "0:07"],
    [42, "0:42"],
    [60, "1:00"],
    [95, "1:35"],
    [599, "9:59"],
  ])("writes %p seconds as %p", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  // A two-minute track reading "0:00:42" looks like a bug, so the hour
  // only appears once there is one.
  it.each([
    [3600, "1:00:00"],
    [3661, "1:01:01"],
    [7325, "2:02:05"],
  ])("grows to hours at %p seconds", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it("drops fractions of a second rather than rounding up", () => {
    expect(formatTime(59.9)).toBe("0:59");
  });

  // The `0` a player reports before it knows the duration, and the values
  // a broken source can produce — none of them should reach the screen.
  it.each([
    [-1, "0:00"],
    [Number.NaN, "0:00"],
    [Number.POSITIVE_INFINITY, "0:00"],
  ])("falls back to 0:00 for %p", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });
});
