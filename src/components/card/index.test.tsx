import { Text as RNText } from "react-native";

import { fireEvent, render, screen } from "@/root/testing";

import Component, { type CardType } from "./index";

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function cardStyle(testID = "card") {
  return Object.assign(
    {},
    ...flatten(screen.getByTestId(testID).props.style),
  ) as Record<string, unknown>;
}

describe(`${Component.name} smoke test`, () => {
  it("renders its children", async () => {
    await render(
      <Component testID="card">
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.getByText("content")).toBeTruthy();
  });

  describe("types", () => {
    // A bordered and an unbordered card have to be the same size, so the
    // border is always present and merely transparent.
    it.each(["elevated", "outlined", "filled"] as CardType[])(
      "keeps %s the same size by always drawing a border",
      async (type) => {
        await render(
          <Component testID="card" type={type}>
            <RNText>content</RNText>
          </Component>,
        );

        expect(cardStyle().borderWidth).toBeGreaterThan(0);
      },
    );

    // The other two fill with `backgroundElement`, which is invisible
    // against any other raised surface. `outlined` reads on one by taking
    // whatever is behind it and drawing only an edge — filling with the
    // page colour instead would make it *darker* than a raised surface on a
    // dark scheme, reading as a well rather than a card.
    it("gives outlined an edge and no fill of its own", async () => {
      await render(
        <Component testID="card" type="outlined">
          <RNText>content</RNText>
        </Component>,
      );
      const style = cardStyle();

      expect(style.backgroundColor).toBe("transparent");
      expect(style.borderColor).not.toBe("transparent");
    });

    it.each(["outlined", "filled"] as CardType[])(
      "leaves %s flat",
      async (type) => {
        await render(
          <Component testID="card" type={type}>
            <RNText>content</RNText>
          </Component>,
        );

        expect(cardStyle().elevation).toBeUndefined();
      },
    );

    // Both spellings: iOS and web read shadow*, Android only elevation.
    it("raises elevated on every platform", async () => {
      await render(
        <Component testID="card">
          <RNText>content</RNText>
        </Component>,
      );
      const style = cardStyle();

      expect(style.elevation).toBeGreaterThan(0);
      expect(style.shadowOpacity).toBeGreaterThan(0);
    });
  });

  describe("padding", () => {
    it("pads its content by default", async () => {
      await render(
        <Component testID="card">
          <RNText>content</RNText>
        </Component>,
      );

      expect(cardStyle().padding).toBeGreaterThan(0);
    });

    // For content that goes edge to edge — an image filling the top — which
    // then owns its own spacing.
    it("drops the padding when asked", async () => {
      await render(
        <Component testID="card" padded={false}>
          <RNText>content</RNText>
        </Component>,
      );

      expect(cardStyle().padding).toBeUndefined();
    });

    // Otherwise a `padded={false}` image paints over the card's border.
    it("clips content to the card's edge", async () => {
      await render(
        <Component testID="card" padded={false}>
          <RNText>content</RNText>
        </Component>,
      );

      expect(cardStyle().overflow).toBe("hidden");
    });
  });

  describe("pressable", () => {
    // A plain View, so its children stay individually reachable rather than
    // being grouped into one announcement.
    it("is not a control without onPress", async () => {
      await render(
        <Component testID="card">
          <RNText>content</RNText>
        </Component>,
      );

      expect(screen.queryByRole("button")).toBeNull();
    });

    it("announces as a button and reports presses", async () => {
      const onPress = jest.fn();
      await render(
        <Component testID="card" onPress={onPress}>
          <RNText>Order #12</RNText>
        </Component>,
      );

      // Named from its own text, the way a labelled Button is.
      const card = screen.getByRole("button", { name: "Order #12" });
      await fireEvent.press(card);

      expect(onPress).toHaveBeenCalled();
    });

    it("takes an explicit label over its text", async () => {
      await render(
        <Component testID="card" onPress={() => {}} label="Open order 12">
          <RNText>Order #12</RNText>
        </Component>,
      );

      expect(
        screen.getByRole("button", { name: "Open order 12" }),
      ).toBeTruthy();
    });

    it("ignores presses and announces the state when disabled", async () => {
      const onPress = jest.fn();
      await render(
        <Component testID="card" onPress={onPress} disabled>
          <RNText>Order #12</RNText>
        </Component>,
      );

      await fireEvent.press(screen.getByRole("button"));

      expect(onPress).not.toHaveBeenCalled();
      expect(screen.getByRole("button").props.accessibilityState.disabled).toBe(
        true,
      );
      expect(cardStyle().opacity).toBe(0.5);
    });
  });

  it("merges a caller's style over its own", async () => {
    await render(
      <Component testID="card" style={{ borderRadius: 999 }}>
        <RNText>content</RNText>
      </Component>,
    );

    expect(cardStyle().borderRadius).toBe(999);
  });
});
