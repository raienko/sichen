import { act, render } from "@/root/testing";

import { HOUR, MINUTE, SECOND } from "./duration";
import Component from "./index";

const hidden = { includeHiddenElements: true } as const;
const NOW = 1_700_000_000_000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * Moves the clock and lets the scheduled redraw run.
 *
 * `advanceTimersByTime` moves the mocked `Date.now()` too, so setting the
 * system time alongside it advances everything twice — which is exactly
 * what the first version of this helper did, and why a three-second
 * advance produced a six-second jump.
 */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** Moves the clock *without* running timers — what backgrounding looks like. */
async function passWithoutTimers(ms: number) {
  await act(async () => {
    jest.setSystemTime(Date.now() + ms);
  });
}

describe(`${Component.name} smoke test`, () => {
  it("counts down to a deadline", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 4 * MINUTE + 7 * SECOND} />,
    );

    expect(view.getByText("4:07", hidden)).toBeTruthy();
  });

  it("counts up from a start", async () => {
    const view = await render(
      <Component label="Elapsed" since={NOW - (2 * MINUTE + 5 * SECOND)} />,
    );

    expect(view.getByText("2:05", hidden)).toBeTruthy();
  });

  it("redraws as the seconds pass", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 10 * SECOND} />,
    );

    expect(view.getByText("0:10", hidden)).toBeTruthy();

    await advance(3 * SECOND);

    expect(view.getByText("0:07", hidden)).toBeTruthy();
  });

  it("takes an explicit format", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 7 * SECOND} format="clock" />,
    );

    expect(view.getByText("0:00:07", hidden)).toBeTruthy();
  });

  /**
   * Every value is `Date.now()` against the target rather than a count of
   * ticks, so a stalled or throttled timer cannot leave it behind — which
   * is what happens whenever the app is backgrounded.
   */
  it("is still right after time passed with no timers running", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 5 * MINUTE} />,
    );

    // The clock moves but nothing fires — the app was in the background.
    await passWithoutTimers(3 * MINUTE);
    await advance(SECOND);

    expect(view.getByText("1:59", hidden)).toBeTruthy();
  });

  it("stops at zero rather than going negative", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 2 * SECOND} />,
    );

    await advance(10 * SECOND);

    expect(view.getByText("0:00", hidden)).toBeTruthy();
  });

  describe("onComplete", () => {
    it("fires when the deadline passes", async () => {
      const onComplete = jest.fn();
      await render(
        <Component
          label="Remaining"
          until={NOW + 3 * SECOND}
          onComplete={onComplete}
        />,
      );

      expect(onComplete).not.toHaveBeenCalled();

      await advance(3 * SECOND);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("fires once, not once per redraw after the deadline", async () => {
      const onComplete = jest.fn();
      await render(
        <Component
          label="Remaining"
          until={NOW + SECOND}
          onComplete={onComplete}
        />,
      );

      await advance(10 * SECOND);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not fire for a stopwatch, which has no end", async () => {
      const view = await render(<Component label="Elapsed" since={NOW} />);

      await advance(5 * SECOND);

      expect(view.getByText("0:05", hidden)).toBeTruthy();
    });
  });

  it("freezes where it is when paused", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 30 * SECOND} paused />,
    );

    await advance(5 * SECOND);

    expect(view.getByText("0:30", hidden)).toBeTruthy();
  });

  describe("accessibility", () => {
    /**
     * `4:07` is announced as "four oh seven", a time of day rather than a
     * length of one — and a timer that announced itself every second would
     * talk over the whole screen, so it is a value read on demand rather
     * than a live region.
     */
    it("names itself and offers its value in words", async () => {
      const view = await render(
        <Component
          testID="timer"
          label="Time remaining"
          until={NOW + HOUR + 4 * MINUTE}
        />,
      );
      const { props } = view.getByTestId("timer");

      expect(props.accessibilityLabel).toBe("Time remaining");
      expect(props.accessibilityValue.text).toBe("1 hour 4 minutes");
      expect(props.accessibilityLiveRegion).toBeUndefined();
    });

    it("keeps the spoken value in step with the digits", async () => {
      const view = await render(
        <Component
          testID="timer"
          label="Remaining"
          until={NOW + 10 * SECOND}
        />,
      );

      await advance(4 * SECOND);

      expect(view.getByText("0:06", hidden)).toBeTruthy();
      expect(view.getByTestId("timer").props.accessibilityValue.text).toBe(
        "6 seconds",
      );
    });
  });

  // In a proportional font `11:11` is narrower than `00:00`, so a timer
  // without this jiggles every second and shoves its neighbours.
  it("fixes the digit width so it cannot jiggle", async () => {
    const view = await render(
      <Component label="Remaining" until={NOW + 10 * SECOND} />,
    );
    const style = Object.assign(
      {},
      ...[view.getByText("0:10", hidden).props.style].flat(3).filter(Boolean),
    );

    expect(style.fontVariant).toEqual(["tabular-nums"]);
  });

  it("draws the ring only when asked", async () => {
    const without = await render(
      <Component testID="timer" label="Remaining" until={NOW + MINUTE} />,
    );
    expect(JSON.stringify(without.toJSON())).not.toContain("RNSVGCircle");

    const withRing = await render(
      <Component testID="timer" label="Remaining" until={NOW + MINUTE} ring />,
    );
    expect(JSON.stringify(withRing.toJSON())).toContain("RNSVGCircle");
  });
});
