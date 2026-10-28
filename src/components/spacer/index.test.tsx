import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarSpace } from "@/components/tab-bar";
import { useSizes, useUnits } from "@/features/responsive";
import { render, renderHook, screen } from "@/root/testing";

import Component, { points } from "./index";

// Reanimated's own Jest mock reports the keyboard height as a plain `0`;
// this hands the spacer a shared-value-like object the tests can move.
const mockKeyboardHeight = { value: 0 };
jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated/mock"),
  useAnimatedKeyboard: () => ({
    height: mockKeyboardHeight,
    state: { value: 0 },
  }),
}));

const INSETS = { top: 40, bottom: 30, left: 10, right: 20 };

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style))
    return Object.assign({}, ...style.map(flattenStyle));
  if (style && typeof style === "object")
    return style as Record<string, unknown>;
  return {};
}

/**
 * Every query here has to opt into hidden elements: the spacer is hidden
 * from assistive technology, and testing-library's default queries filter
 * exactly those out. That's the behaviour under test, not a workaround —
 * see the "not reachable" case below, which asserts the same thing from the
 * other side.
 */
function spacer() {
  return screen.getByTestId("spacer", { includeHiddenElements: true });
}

function spacerStyle() {
  return flattenStyle(spacer().props.style);
}

describe(`${Component.name} smoke test`, () => {
  it("takes only height by default — a vertical gap of 16pt", async () => {
    const { result } = await renderHook(() => useSizes());
    await render(<Component testID="spacer" />);

    expect(spacerStyle()).toEqual({
      width: undefined,
      height: result.current.spacing.x16,
    });
  });

  it("takes only width when horizontal", async () => {
    const { result } = await renderHook(() => useSizes());
    await render(
      <Component testID="spacer" direction="horizontal" size="x8" />,
    );

    expect(spacerStyle()).toEqual({
      width: result.current.spacing.x8,
      height: undefined,
    });
  });

  it("takes both axes when asked for both", async () => {
    const { result } = await renderHook(() => useSizes());
    await render(<Component testID="spacer" direction="both" size="x24" />);

    expect(spacerStyle()).toEqual({
      width: result.current.spacing.x24,
      height: result.current.spacing.x24,
    });
  });

  // The unused axis stays unset rather than 0, so a vertical spacer dropped
  // into a row container doesn't force a 0-sized box into the layout.
  it("leaves the unused axis unset rather than zeroed", async () => {
    await render(<Component testID="spacer" />);

    expect(spacerStyle().width).toBeUndefined();
  });

  it("scales a raw px size through units(), like every other size", async () => {
    const { result } = await renderHook(() => useUnits());
    await render(<Component testID="spacer" size={10} />);

    expect(spacerStyle().height).toBe(result.current(10));
  });

  it("is invisible to assistive technology on every platform", async () => {
    await render(<Component testID="spacer" />);
    const { props } = spacer();

    expect(props.accessible).toBe(false);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe("no-hide-descendants");
    expect(props["aria-hidden"]).toBe(true);
  });

  // The other side of the same fact: a query that respects accessibility —
  // which is what a screen reader does — doesn't see the spacer at all, so
  // it's never a stop between the two elements it separates.
  it("is not reachable as an accessibility element", async () => {
    await render(<Component testID="spacer" />);

    expect(screen.queryByTestId("spacer")).toBeNull();
  });

  it("merges a caller's style over its own", async () => {
    await render(
      <Component testID="spacer" style={{ backgroundColor: "red" }} />,
    );

    expect(spacerStyle().backgroundColor).toBe("red");
  });

  describe("sizes measured live", () => {
    // The safe-area mock is a jest.fn that reads its context; keep that to
    // put back, since every provider in the tree reads it too.
    const readInsets = jest.mocked(useSafeAreaInsets).getMockImplementation();

    beforeEach(() => {
      jest.mocked(useSafeAreaInsets).mockImplementation(() => INSETS);
    });
    afterEach(() => {
      jest.mocked(useSafeAreaInsets).mockImplementation(readInsets!);
      mockKeyboardHeight.value = 0;
    });

    it("takes a safe-area inset by name", async () => {
      await render(<Component testID="spacer" size="safe-area-top" />);
      expect(spacerStyle().height).toBe(40);
    });

    it("reads start and end by direction", async () => {
      await render(
        <Component
          testID="spacer"
          direction="horizontal"
          size="safe-area-start"
        />,
      );
      expect(spacerStyle().width).toBe(INSETS.left);
    });

    it("takes the tallest of a list", async () => {
      const { result } = await renderHook(() => useSizes());
      await render(
        <Component testID="spacer" size={["x8", "safe-area-bottom", 2]} />,
      );
      expect(spacerStyle().height).toBe(
        Math.max(result.current.spacing.x8, INSETS.bottom),
      );
    });

    it("measures the tab bar above the bottom inset", async () => {
      const { result } = await renderHook(() =>
        useTabBarSpace({ avoidChin: false }),
      );
      await render(<Component testID="spacer" size="tab-bar" />);
      expect(spacerStyle().height).toBe(result.current);
    });

    it("measures the tab bar from the screen's edge with the inset listed", async () => {
      const { result } = await renderHook(() =>
        useTabBarSpace({ avoidChin: true }),
      );
      await render(
        <Component testID="spacer" size={["tab-bar", "safe-area-bottom"]} />,
      );
      expect(spacerStyle().height).toBe(result.current);
    });

    it("doesn't scale a value marked as points", async () => {
      await render(<Component testID="spacer" size={points(55)} />);
      expect(spacerStyle().height).toBe(55);
    });

    it("takes no space while the keyboard is closed", async () => {
      await render(<Component testID="spacer" size="keyboard" />);
      expect(spacerStyle().height).toBe(0);
    });

    it("grows with the keyboard, above the bottom inset", async () => {
      mockKeyboardHeight.value = 300;
      await render(<Component testID="spacer" size="keyboard" />);
      expect(spacerStyle().height).toBe(300 - INSETS.bottom);
    });

    it("never drops below the rest of the list while the keyboard is closed", async () => {
      const { result } = await renderHook(() =>
        useTabBarSpace({ avoidChin: false }),
      );
      await render(
        <Component testID="spacer" size={["tab-bar", "keyboard"]} />,
      );
      expect(spacerStyle().height).toBe(result.current);
    });

    it("measures the keyboard from the screen's edge with the inset listed", async () => {
      mockKeyboardHeight.value = 300;
      await render(
        <Component testID="spacer" size={["safe-area-bottom", "keyboard"]} />,
      );
      expect(spacerStyle().height).toBe(300);
    });

    it("keeps a keyboard spacer hidden from assistive technology", async () => {
      await render(<Component testID="spacer" size="keyboard" />);
      expect(screen.queryByTestId("spacer")).toBeNull();
    });
  });
});
