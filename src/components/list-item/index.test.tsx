import { Text as RNText, View } from "react-native";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

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

describe(`${Component.name} smoke test`, () => {
  it("renders a title", async () => {
    await render(<Component testID="row" title="Ada Lovelace" />);

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  });

  it("renders a subtitle under it", async () => {
    await render(
      <Component
        testID="row"
        title="Ada Lovelace"
        subtitle="ada@example.com"
      />,
    );

    expect(screen.getByText("ada@example.com")).toBeTruthy();
  });

  it("renders custom middle content in place of the text", async () => {
    await render(
      <Component testID="row">
        <View>
          <RNText>anything</RNText>
        </View>
      </Component>,
    );

    expect(screen.getByText("anything")).toBeTruthy();
  });

  describe("slots", () => {
    it("renders one on each side", async () => {
      await render(
        <Component
          testID="row"
          title="Ada Lovelace"
          left={<RNText>avatar</RNText>}
          right={<RNText>chevron</RNText>}
        />,
      );

      expect(screen.getByText("avatar")).toBeTruthy();
      expect(screen.getByText("chevron")).toBeTruthy();
    });

    it("takes several elements in one slot", async () => {
      await render(
        <Component
          testID="row"
          title="Ada Lovelace"
          right={[<RNText key="a">3</RNText>, <RNText key="b">chevron</RNText>]}
        />,
      );

      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText("chevron")).toBeTruthy();
    });

    // A squashed avatar or control is unusable; a clipped line is merely
    // shorter — so the text is the part that gives way.
    it("shrinks the text before it shrinks a slot", async () => {
      await render(
        <Component
          testID="row"
          title="A title long enough that something has to give"
          left={<RNText>avatar</RNText>}
        />,
      );
      const center = screen.getByText(
        "A title long enough that something has to give",
      ).parent;

      // A flex item's default minimum size is its own content, so without
      // an explicit 0 the text refuses to shrink and pushes the slots out
      // of shape instead.
      expect(Object.assign({}, ...flatten(center?.props.style)).minWidth).toBe(
        0,
      );
    });
  });

  describe("not pressable", () => {
    // A plain View, so a control in the right slot stays individually
    // reachable rather than being swallowed into one announcement.
    it("is not a control without onPress", async () => {
      await render(<Component testID="row" title="Notifications" />);

      expect(screen.queryByRole("button")).toBeNull();
    });

    // The case the doc comment warns about: give the button the
    // interaction and leave the row inert, or it disappears into the row's
    // single announcement.
    it("leaves a control in the right slot reachable", async () => {
      const onRemove = jest.fn();
      await render(
        <Component
          testID="row"
          title="Ada Lovelace"
          right={
            <IconButton label="Remove Ada Lovelace" onPress={onRemove}>
              <Icon name="x" />
            </IconButton>
          }
        />,
      );

      await fireEvent.press(
        screen.getByRole("button", { name: "Remove Ada Lovelace" }),
      );

      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe("pressable", () => {
    it("announces as a button and reports presses", async () => {
      const onPress = jest.fn();
      await render(
        <Component testID="row" title="Account" onPress={onPress} />,
      );

      // Named from its own text, the way a labelled Button is.
      await fireEvent.press(screen.getByRole("button", { name: "Account" }));

      expect(onPress).toHaveBeenCalled();
    });

    it("takes an explicit label over its text", async () => {
      await render(
        <Component
          testID="row"
          title="Account"
          label="Open account settings"
          onPress={jest.fn()}
        />,
      );

      expect(
        screen.getByRole("button", { name: "Open account settings" }),
      ).toBeTruthy();
    });

    it("announces a selected row as selected", async () => {
      await render(
        <Component testID="row" title="Ada" onPress={jest.fn()} selected />,
      );

      expect(
        screen.getByRole("button", { name: "Ada", selected: true }),
      ).toBeTruthy();
    });

    it("ignores presses and announces the state when disabled", async () => {
      const onPress = jest.fn();
      await render(
        <Component testID="row" title="Account" onPress={onPress} disabled />,
      );

      await fireEvent.press(screen.getByRole("button"));

      expect(onPress).not.toHaveBeenCalled();
      expect(screen.getByRole("button").props.accessibilityState.disabled).toBe(
        true,
      );
      expect(styleOf("row").opacity).toBe(0.5);
    });
  });

  it("reserves a full touch target", async () => {
    await render(<Component testID="row" title="Ada" />);

    // The 44pt minimum every other control in the app reserves.
    expect(styleOf("row").minHeight).toBeGreaterThan(0);
  });

  it("merges a caller's style over its own", async () => {
    await render(
      <Component testID="row" title="Ada" style={{ paddingHorizontal: 0 }} />,
    );

    expect(styleOf("row").paddingHorizontal).toBe(0);
  });
});
