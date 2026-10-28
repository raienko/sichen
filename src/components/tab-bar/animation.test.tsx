import { AccessibilityInfo } from "react-native";
import { withTiming } from "react-native-reanimated";

import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testId,
  testIdPattern,
  waitFor,
} from "@/root/testing";

import Component from "./index";
import { SLIDE_DURATION } from "./indicator";
import { FADE_DURATION, SELECTED_SCALE } from "./tab";

/**
 * The Jest mock lands every `withTiming` on its target at once and rebuilds
 * shared values each render, so an animation can't be watched frame by
 * frame. What can be checked is what each one was asked to do: where to,
 * and over how long. `withTiming` is wrapped to record exactly that.
 */
jest.mock("react-native-reanimated", () => {
  const mock = jest.requireActual("react-native-reanimated/mock");
  return { ...mock, withTiming: jest.fn(mock.withTiming) };
});

const timing = withTiming as jest.Mock;

/** Flipped by a test to stand in for switching to a right-to-left locale. */
let mockRtl = false;
jest.mock("@/features/localization", () => ({
  ...jest.requireActual("@/features/localization"),
  useIsRtl: () => mockRtl,
}));

/** Deliberately unequal, so nothing can pass by assuming equal shares. */
const LAYOUTS = {
  home: { x: 0, y: 0, width: 80, height: 56 },
  search: { x: 80, y: 0, width: 120, height: 56 },
  profile: { x: 200, y: 0, width: 100, height: 56 },
};

const ITEMS = (Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]).map((key) => ({
  key,
  label: key,
  testID: `tab-${key}`,
}));

function flat(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...[style].flat(4).filter(Boolean));
}

function indicator() {
  return screen.getByTestId(testId("tab-bar", "indicator"), {
    includeHiddenElements: true,
  });
}

async function measure() {
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    await fireEvent(screen.getByTestId(`tab-${key}`), "layout", {
      nativeEvent: { layout },
    });
  }
}

/** The slides the indicator was asked for: timings that aren't a tab's fade. */
function slides() {
  return timing.mock.calls.filter(
    ([, config]) => config?.duration !== FADE_DURATION,
  );
}

function bar(value: string) {
  return <Component items={ITEMS} value={value} onChange={jest.fn()} />;
}

function scaleOf(index: number) {
  const content = screen.getAllByTestId(testIdPattern(ANY, "content"))[index];
  const [{ scale }] = flat(content.props.style).transform as {
    scale: number;
  }[];
  return scale;
}

beforeEach(() => {
  timing.mockClear();
  mockRtl = false;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("TabBar animation", () => {
  it("draws one indicator, hidden until the selected tab is measured", async () => {
    await render(bar("home"));

    expect(flat(indicator().props.style).opacity).toBe(0);

    await measure();

    expect(flat(indicator().props.style).opacity).toBe(1);
  });

  it("is decoration: hidden from assistive technology", async () => {
    await render(bar("home"));

    expect(indicator().props.accessibilityElementsHidden).toBe(true);
    expect(indicator().props["aria-hidden"]).toBe(true);
  });

  // Measured `x` is physical, so the layer it moves in must not be mirrored
  // again by Yoga under native RTL.
  it("moves in a left-to-right layer whatever the locale", async () => {
    await render(bar("home"));

    const layer = screen.getByTestId(testId("tab-bar", "indicator-layer"), {
      includeHiddenElements: true,
    });
    expect(flat(layer.props.style).direction).toBe("ltr");
    expect(layer.props.pointerEvents).toBe("none");
  });

  // The tabs swap sides without changing size, and react-native-web only
  // reports layout on a resize — so the old measurements can't be trusted
  // and nothing would arrive to replace them unless the row is remounted.
  it("measures afresh when the direction flips, and places without sliding", async () => {
    const { rerender } = await render(bar("home"));
    await measure();
    expect(flat(indicator().props.style).opacity).toBe(1);

    mockRtl = true;
    await act(async () => {
      await rerender(bar("home"));
    });
    expect(flat(indicator().props.style).opacity).toBe(0);

    timing.mockClear();
    await fireEvent(screen.getByTestId("tab-home"), "layout", {
      nativeEvent: { layout: { ...LAYOUTS.profile } },
    });

    expect(flat(indicator().props.style).opacity).toBe(1);
    expect(slides()).toEqual([]);
  });

  it("places the first selection without sliding", async () => {
    await render(bar("search"));
    await measure();

    expect(slides()).toEqual([]);
  });

  it("slides to the newly selected tab's measured position and width", async () => {
    const { rerender } = await render(bar("home"));
    await measure();

    await act(async () => {
      await rerender(bar("search"));
    });

    const targets = slides().map(([value]) => value);
    expect(targets).toContain(LAYOUTS.search.x);
    expect(targets).toContain(LAYOUTS.search.width);
    for (const [, config] of slides()) {
      expect(config.duration).toBe(SLIDE_DURATION);
    }
  });

  it("crossfades and grows the selected tab's icon and label", async () => {
    const { rerender } = await render(bar("home"));

    expect(scaleOf(0)).toBe(SELECTED_SCALE);
    expect(scaleOf(1)).toBe(1);

    await act(async () => {
      await rerender(bar("search"));
    });

    expect(timing).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ duration: FADE_DURATION }),
    );
    expect(timing).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ duration: FADE_DURATION }),
    );
    expect(scaleOf(0)).toBe(1);
    expect(scaleOf(1)).toBe(SELECTED_SCALE);
  });

  it("hides the crossfade's second copy from assistive technology", async () => {
    await render(bar("home"));

    const [copy] = screen.getAllByTestId(testIdPattern(ANY, "current"), {
      includeHiddenElements: true,
    });
    expect(copy.props.accessibilityElementsHidden).toBe(true);
    // Only the visible copy of each label is found.
    expect(screen.getAllByText("home")).toHaveLength(1);
  });

  describe("with Reduce Motion on", () => {
    beforeEach(() => {
      jest
        .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
        .mockResolvedValue(true);
    });

    it("moves the indicator instantly", async () => {
      const { rerender } = await render(bar("home"));
      await waitFor(() => expect(scaleOf(0)).toBe(1));
      await measure();

      await act(async () => {
        await rerender(bar("profile"));
      });

      expect(slides().map(([value]) => value)).toContain(LAYOUTS.profile.x);
      for (const [, config] of slides()) {
        expect(config.duration).toBe(0);
      }
    });

    // A fade isn't movement, so it stays; the growth is, so it goes.
    it("keeps the crossfade but drops the growth", async () => {
      const { rerender } = await render(bar("home"));
      await waitFor(() => expect(scaleOf(0)).toBe(1));

      await act(async () => {
        await rerender(bar("search"));
      });

      expect(scaleOf(1)).toBe(1);
      expect(timing).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ duration: FADE_DURATION }),
      );
    });
  });
});
