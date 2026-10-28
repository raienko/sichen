import { AccessibilityInfo } from "react-native";

import { progressA11yProps } from "@/features/accessibility";
import { act, render, screen, testId, waitFor } from "@/root/testing";

import Component from "./index";

function bar() {
  return screen.getByTestId("bar");
}

function fill() {
  return screen.getByTestId(testId("bar", "fill"), {
    includeHiddenElements: true,
  });
}

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function fillStyle() {
  return Object.assign({}, ...flatten(fill().props.style)) as Record<
    string,
    unknown
  >;
}

/** The track has to be measured before the indeterminate sweep can run. */
async function layout(width = 300) {
  await act(() =>
    bar().props.onLayout({ nativeEvent: { layout: { width, height: 8 } } }),
  );
}

describe(`${Component.name} smoke test`, () => {
  describe("determinate", () => {
    it("fills to the reported fraction", async () => {
      await render(<Component testID="bar" value={0.42} label="Uploading" />);

      expect(fillStyle().width).toBe("42%");
    });

    // A caller dividing by a total that turns out to be 0 gets an empty bar
    // rather than a fill running off the end.
    it.each([
      [-1, "0%"],
      [2, "100%"],
      [Number.NaN, "0%"],
      [Number.POSITIVE_INFINITY, "100%"],
    ])("clamps %p", async (value, expected) => {
      await render(
        <Component testID="bar" value={value as number} label="Uploading" />,
      );

      expect(fillStyle().width).toBe(expected);
    });

    it("announces the fraction as a percentage on a 0–100 scale", async () => {
      await render(<Component testID="bar" value={0.42} label="Uploading" />);
      const { props } = bar();

      expect(props.accessibilityRole).toBe("progressbar");
      expect(props.role).toBe("progressbar");
      expect(props.accessibilityLabel).toBe("Uploading");
      // 0.42 would be read out as "0.42", not "42%".
      expect(props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 42,
        text: "42%",
      });
      expect(props["aria-valuenow"]).toBe(42);
    });

    it("takes a caller's own wording for the value", async () => {
      await render(
        <Component
          testID="bar"
          value={0.5}
          label="Setup"
          formatValue={(value) => `Step ${value * 6} of 6`}
        />,
      );

      expect(bar().props.accessibilityValue.text).toBe("Step 3 of 6");
      expect(bar().props["aria-valuetext"]).toBe("Step 3 of 6");
    });

    it("is not busy — it has a figure to give", async () => {
      await render(<Component testID="bar" value={0.42} label="Uploading" />);

      expect(bar().props.accessibilityState).toBeUndefined();
      expect(bar().props["aria-busy"]).toBeUndefined();
    });
  });

  describe("indeterminate", () => {
    // ARIA reads a missing valuenow as "the total isn't known", which is a
    // different claim from a bar reporting 0%.
    it("reports no value at all rather than zero", async () => {
      await render(<Component testID="bar" label="Checking for updates" />);
      const { props } = bar();

      expect(props.accessibilityValue.now).toBeUndefined();
      expect(props["aria-valuenow"]).toBeUndefined();
      expect(props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        text: "Loading",
      });
    });

    it("says something is happening instead", async () => {
      await render(<Component testID="bar" label="Checking for updates" />);

      expect(bar().props.accessibilityState).toEqual({ busy: true });
      expect(bar().props["aria-busy"]).toBe(true);
    });

    it("sweeps a segment across the measured track", async () => {
      await render(<Component testID="bar" label="Checking for updates" />);
      await layout(300);

      // 35% of the track, travelling — not a full-width fill.
      expect(fillStyle().width).toBe(105);
      expect(fillStyle().transform).toEqual([{ translateX: -105 }]);
    });
  });

  // The sweep can't simply stop — the movement *is* the signal that
  // something is happening — so it becomes a cross-fade in place, the
  // substitution Apple's own Reduce Motion guidance names.
  describe("with Reduce Motion on", () => {
    beforeEach(() => {
      jest
        .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
        .mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("fades the indeterminate bar in place instead of sweeping it", async () => {
      await render(<Component testID="bar" label="Checking for updates" />);
      await layout(300);

      await waitFor(() => {
        expect(fillStyle().width).toBe("100%");
      });
      expect(fillStyle().transform).toEqual([]);
    });

    it("still reports itself as busy", async () => {
      await render(<Component testID="bar" label="Checking for updates" />);

      expect(bar().props["aria-busy"]).toBe(true);
    });
  });

  it("thins down for the small size", async () => {
    await render(
      <Component testID="bar" value={0.5} label="Uploading" size="small" />,
    );
    const style = Object.assign({}, ...flatten(bar().props.style));
    await render(
      <Component testID="bar" value={0.5} label="Uploading" size="medium" />,
    );
    const medium = Object.assign({}, ...flatten(bar().props.style));

    expect(style.height).toBeLessThan(medium.height);
  });

  it("merges a caller's style over its own", async () => {
    await render(
      <Component
        testID="bar"
        value={0.5}
        label="Uploading"
        style={{ borderRadius: 99 }}
      />,
    );

    expect(Object.assign({}, ...flatten(bar().props.style)).borderRadius).toBe(
      99,
    );
  });
});

describe("progressA11yProps", () => {
  it("omits the value entirely when there isn't one", () => {
    const props = progressA11yProps({ label: "Loading" });

    expect(props).not.toHaveProperty("aria-valuenow");
    expect(props.accessibilityValue).toEqual({ min: 0, max: 100 });
    expect(props["aria-busy"]).toBe(true);
  });

  it("rounds to a whole percentage", () => {
    expect(
      progressA11yProps({ label: "x", value: 0.426 })["aria-valuenow"],
    ).toBe(43);
  });
});
