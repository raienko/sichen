import {
  DAY,
  HOUR,
  MINUTE,
  SECOND,
  describeDuration,
  formatDuration,
  msUntilNextSecond,
  toSeconds,
} from "./duration";

describe("toSeconds", () => {
  /**
   * Up, not down. Rounding down shows `0` for the whole final second, so a
   * countdown reads zero for a second before anything happens.
   */
  it("rounds up, so the last second still shows one", () => {
    expect(toSeconds(1)).toBe(1);
    expect(toSeconds(999)).toBe(1);
    expect(toSeconds(1000)).toBe(1);
    expect(toSeconds(1001)).toBe(2);
  });

  it("is zero only at zero", () => {
    expect(toSeconds(0)).toBe(0);
  });

  it("clamps a negative duration to zero", () => {
    expect(toSeconds(-5000)).toBe(0);
  });
});

describe("formatDuration", () => {
  describe("auto", () => {
    it.each([
      [0, "0:00"],
      [SECOND, "0:01"],
      [9 * SECOND, "0:09"],
      [MINUTE, "1:00"],
      [4 * MINUTE + 7 * SECOND, "4:07"],
      [59 * MINUTE + 59 * SECOND, "59:59"],
    ])("writes %ims under an hour as m:ss", (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });

    it.each([
      [HOUR, "1:00:00"],
      [HOUR + 4 * MINUTE + 7 * SECOND, "1:04:07"],
      [23 * HOUR + 59 * MINUTE, "23:59:00"],
    ])("grows to h:mm:ss past an hour", (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });

    // A countdown to next week should not be written 10084:07.
    it.each([
      [DAY, "1d 00:00"],
      [2 * DAY + 4 * HOUR + 7 * MINUTE, "2d 04:07"],
    ])("grows to days past a day", (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });
  });

  // A row of timers that would otherwise change width as each crosses an
  // hour.
  it("keeps h:mm:ss at every magnitude in clock", () => {
    expect(formatDuration(7 * SECOND, "clock")).toBe("0:00:07");
    expect(formatDuration(HOUR, "clock")).toBe("1:00:00");
    expect(formatDuration(2 * DAY, "clock")).toBe("48:00:00");
  });

  // A short timer that must never grow.
  it("keeps m:ss at every magnitude in minutes", () => {
    expect(formatDuration(7 * SECOND, "minutes")).toBe("0:07");
    expect(formatDuration(90 * MINUTE, "minutes")).toBe("90:00");
  });

  it("shows zero rather than a negative", () => {
    expect(formatDuration(-5 * SECOND)).toBe("0:00");
  });
});

describe("describeDuration", () => {
  /**
   * `4:07` is announced as "four oh seven", which is a time of day rather
   * than a length of one — so the spoken form is built separately.
   */
  it("says the units out loud", () => {
    expect(describeDuration(4 * MINUTE + 7 * SECOND)).toBe(
      "4 minutes 7 seconds",
    );
  });

  it("gets the singular right", () => {
    expect(describeDuration(SECOND)).toBe("1 second");
    expect(describeDuration(HOUR + MINUTE)).toBe("1 hour 1 minute");
  });

  // "1 hour 4 minutes" is the useful answer; appending "7 seconds" is noise
  // on something a user may re-read every few seconds.
  it("stops at the two largest units that carry information", () => {
    expect(describeDuration(DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND)).toBe(
      "1 day 2 hours",
    );
    expect(describeDuration(HOUR + 4 * MINUTE + 7 * SECOND)).toBe(
      "1 hour 4 minutes",
    );
  });

  it("skips a unit that is zero rather than saying it", () => {
    expect(describeDuration(HOUR + 7 * SECOND)).toBe("1 hour 7 seconds");
  });

  it("says zero when there is nothing left", () => {
    expect(describeDuration(0)).toBe("0 seconds");
    expect(describeDuration(-1000)).toBe("0 seconds");
  });
});

describe("msUntilNextSecond", () => {
  /**
   * The reason this exists rather than setInterval(1000): an interval
   * started at x.900 redraws at .900 forever — always 100ms after the
   * second it is showing actually turned over.
   */
  it("waits only for the remainder, so a redraw lands on the boundary", () => {
    expect(msUntilNextSecond(4900)).toBe(900);
    expect(msUntilNextSecond(4100)).toBe(100);
    expect(msUntilNextSecond(1)).toBe(1);
  });

  // Exactly on a boundary there is a whole second until the next one, and
  // returning 0 would spin.
  it("waits a whole second when already on one", () => {
    expect(msUntilNextSecond(5000)).toBe(SECOND);
    expect(msUntilNextSecond(0)).toBe(SECOND);
  });

  it("never returns a negative wait", () => {
    expect(msUntilNextSecond(-500)).toBe(SECOND);
  });
});
