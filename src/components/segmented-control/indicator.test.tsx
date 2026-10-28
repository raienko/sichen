import { withTiming } from "react-native-reanimated";

import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";
import { SLIDE_DURATION } from "./indicator";

/**
 * The Jest mock lands every `withTiming` on its target at once, so the
 * slide can't be watched frame by frame — only what it was asked to do:
 * where to, and over how long. `withTiming` is wrapped to record that.
 */
jest.mock("react-native-reanimated", () => {
  const mock = jest.requireActual("react-native-reanimated/mock");
  return { ...mock, withTiming: jest.fn(mock.withTiming) };
});

const timing = withTiming as jest.Mock;

/** Deliberately unequal, so nothing can pass by assuming equal shares. */
const LAYOUTS = {
  day: { x: 0, y: 0, width: 90, height: 40 },
  week: { x: 90, y: 0, width: 110, height: 40 },
  month: { x: 200, y: 0, width: 100, height: 40 },
};

const OPTIONS = (Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]).map(
  (value) => ({ value, label: value, testID: `segment-${value}` }),
);

function control(value: string) {
  return (
    <Component
      label="View"
      value={value}
      onChange={jest.fn()}
      options={OPTIONS}
    />
  );
}

async function measure() {
  for (const [value, layout] of Object.entries(LAYOUTS)) {
    await fireEvent(screen.getByTestId(`segment-${value}`), "layout", {
      nativeEvent: { layout },
    });
  }
}

/** The x positions the indicator was asked to slide to. */
function slidesTo() {
  return timing.mock.calls
    .filter(([, config]) => config?.duration === SLIDE_DURATION)
    .map(([target]) => target);
}

beforeEach(() => timing.mockClear());

describe("segmented control indicator", () => {
  it("is placed under the first choice without sliding in", async () => {
    await render(control("week"));
    await measure();

    expect(slidesTo()).toEqual([]);
  });

  it("slides to the new choice's own box, not an equal share", async () => {
    const { rerender } = await render(control("day"));
    await measure();

    await rerender(control("month"));

    // x, width and height, each towards the measured segment.
    expect(slidesTo()).toEqual([200, 100, 40]);
  });
});
