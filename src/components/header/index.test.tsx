import { Text as RNText, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { act, fireEvent, render, screen, testId } from "@/root/testing";

import Component from "./index";

const NOTCH = { top: 47, bottom: 34, left: 0, right: 0 };

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function styleOf(testID: string) {
  return Object.assign(
    {},
    ...flatten(screen.getByTestId(testID).props.style),
  ) as Record<string, unknown>;
}

/** The real hook reads this context, so a notch is expressible in a test. */
function withNotch(ui: React.ReactElement) {
  return (
    <SafeAreaInsetsContext.Provider value={NOTCH}>
      {ui}
    </SafeAreaInsetsContext.Provider>
  );
}

describe(`${Component.name} smoke test`, () => {
  it("renders a title", async () => {
    await render(<Component testID="header" title="Orders" />);

    expect(screen.getByText("Orders")).toBeTruthy();
  });

  it("renders a subtitle under it", async () => {
    await render(
      <Component testID="header" title="Orders" subtitle="12 open" />,
    );

    expect(screen.getByText("12 open")).toBeTruthy();
  });

  // Without this a screen reader's heading rotor has no entry for the
  // screen the user is on. `headline` maps to no heading level of its own,
  // so the semantics are declared rather than inherited from the type.
  it("announces the title as the screen's top-level heading", async () => {
    await render(<Component testID="header" title="Orders" />);
    const heading = screen.getByRole("heading");

    expect(heading.props.children).toBe("Orders");
    expect(heading.props["aria-level"]).toBe(1);
  });

  it("leaves the subtitle as plain text — it qualifies the heading", async () => {
    await render(
      <Component testID="header" title="Orders" subtitle="12 open" />,
    );

    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  describe("slots", () => {
    it("renders one element on each side", async () => {
      await render(
        <Component
          testID="header"
          title="Orders"
          left={<RNText>back</RNText>}
          right={<RNText>filter</RNText>}
        />,
      );

      expect(screen.getByText("back")).toBeTruthy();
      expect(screen.getByText("filter")).toBeTruthy();
    });

    it("takes several elements in one slot", async () => {
      await render(
        <Component
          testID="header"
          title="Orders"
          right={[
            <RNText key="a">filter</RNText>,
            <RNText key="b">add</RNText>,
          ]}
        />,
      );

      expect(screen.getByText("filter")).toBeTruthy();
      expect(screen.getByText("add")).toBeTruthy();
    });

    // Plain flexbox can't both centre the middle and notice when the row
    // has overflowed, so the slots are measured and the middle is offset by
    // the difference — which puts its midpoint on the header's whatever
    // each side holds. Asserted here as the arithmetic; the pixels are
    // checked in the browser.
    it("offsets the middle by the difference between the slots", async () => {
      await render(
        <Component
          testID="header"
          title="Orders"
          left={<RNText>back</RNText>}
        />,
      );

      await act(() => {
        fireEvent(screen.getByTestId(testId("header", "left")), "layout", {
          nativeEvent: { layout: { width: 40, height: 44 } },
        });
        fireEvent(screen.getByTestId(testId("header", "right")), "layout", {
          nativeEvent: { layout: { width: 100, height: 44 } },
        });
      });

      const center = screen.getByRole("heading").parent;
      const style = Object.assign({}, ...flatten(center?.props.style));
      // The wider side is trailing, so the middle is pushed the same
      // distance leading to land back on centre.
      expect(style.marginStart).toBe(60);
      expect(style.marginEnd).toBe(0);
    });

    it("needs no offset when the slots match", async () => {
      await render(<Component testID="header" title="Orders" />);

      await act(() => {
        for (const side of [
          testId("header", "left"),
          testId("header", "right"),
        ]) {
          fireEvent(screen.getByTestId(side), "layout", {
            nativeEvent: { layout: { width: 44, height: 44 } },
          });
        }
      });

      const style = Object.assign(
        {},
        ...flatten(screen.getByRole("heading").parent?.props.style),
      );
      expect(style.marginStart).toBe(0);
      expect(style.marginEnd).toBe(0);
    });

    // A squashed control is unusable; a clipped title is merely shorter.
    it("shrinks the title before it shrinks a control", async () => {
      await render(<Component testID="header" title="Orders" />);

      expect(styleOf(testId("header", "left")).flexShrink).toBe(0);
      expect(styleOf(testId("header", "right")).flexShrink).toBe(0);
    });

    // A flex item's default minimum size is its content, so without an
    // explicit 0 the title refuses to shrink and overlaps the slots
    // instead of truncating — seen on screen before this was set.
    it("lets the middle shrink below its content width", async () => {
      await render(<Component testID="header" title="Orders" />);
      const center = screen.getByRole("heading").parent;

      expect(Object.assign({}, ...flatten(center?.props.style)).minWidth).toBe(
        0,
      );
    });
  });

  describe("custom middle content", () => {
    it("renders children in place of a title", async () => {
      await render(
        <Component testID="header">
          <View>
            <RNText>search field</RNText>
          </View>
        </Component>,
      );

      expect(screen.getByText("search field")).toBeTruthy();
      expect(screen.queryByRole("heading")).toBeNull();
    });

    it("still lays out with nothing in the middle at all", async () => {
      await render(<Component testID="header" left={<RNText>back</RNText>} />);

      expect(screen.getByTestId("header")).toBeTruthy();
      expect(screen.queryByRole("heading")).toBeNull();
    });
  });

  describe("avoidNotch", () => {
    it("clears the inset when asked", async () => {
      await render(
        withNotch(<Component testID="header" title="Orders" avoidNotch />),
      );

      expect(styleOf("header").paddingTop).toBe(NOTCH.top);
    });

    // Only correct for a header pinned to the very top: inside a Modal or a
    // page that already inset itself, adding it again pads twice.
    it("adds nothing by default", async () => {
      await render(withNotch(<Component testID="header" title="Orders" />));

      expect(styleOf("header").paddingTop).toBeUndefined();
    });

    it("adds nothing on a device without one", async () => {
      await render(<Component testID="header" title="Orders" avoidNotch />);

      expect(styleOf("header").paddingTop).toBe(0);
    });
  });

  it("merges a caller's style over its own", async () => {
    await render(
      <Component
        testID="header"
        title="Orders"
        style={{ borderBottomWidth: 0 }}
      />,
    );

    expect(styleOf("header").borderBottomWidth).toBe(0);
  });
});
