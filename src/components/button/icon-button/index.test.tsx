import { StyleSheet, Text as RNText, type ViewStyle } from "react-native";

import Icon from "@/components/icon";
import Button from "..";
import { useTheme } from "@/features/theme";
import { fireEvent, render, screen, testId } from "@/root/testing";

import Component from ".";

/** The style prop is an array of layers; only the flattened result is real. */
function boxStyle(name: string): ViewStyle {
  return StyleSheet.flatten(
    screen.getByRole("button", { name }).props.style,
  ) as ViewStyle;
}

function themeColor(
  pick: (colors: ReturnType<typeof useTheme>["colors"]) => string,
) {
  let found = "";
  function Reader() {
    found = pick(useTheme().colors);
    return null;
  }
  return { Reader, read: () => found };
}

describe(`${Component.name} smoke test`, () => {
  it("renders its icon", async () => {
    await render(
      <Component label="Close">
        <RNText>x</RNText>
      </Component>,
    );

    expect(screen.getByText("x")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <Component label="Close" onPress={onPress}>
        <Icon name="x" />
      </Component>,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Close" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  /**
   * The whole reason `label` is required here and optional on `Button`:
   * there is no text child to derive a name from, so an unlabelled icon
   * button announces as nothing at all.
   */
  it("announces as a button under its label", async () => {
    await render(
      <Component label="Close">
        <Icon name="x" />
      </Component>,
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button.props.accessibilityLabel).toBe("Close");
  });

  it("exposes selected state", async () => {
    await render(
      <Component label="Favourite" selected>
        <Icon name="star" />
      </Component>,
    );

    expect(
      screen.getByRole("button", { name: "Favourite" }).props
        .accessibilityState,
    ).toEqual({ disabled: false, selected: true });
  });

  it("exposes disabled state and blocks onPress", async () => {
    const onPress = jest.fn();
    await render(
      <Component label="Close" disabled onPress={onPress}>
        <Icon name="x" />
      </Component>,
    );
    const button = screen.getByRole("button", { name: "Close" });

    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it("inherits Button's loading state", async () => {
    const onPress = jest.fn();
    await render(
      <Component label="Saving" loading onPress={onPress}>
        <Icon name="check" />
      </Component>,
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.getByTestId(testId("button", "loading"))).toBeOnTheScreen();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  /**
   * The headline behaviour: the icon takes the button's foreground without
   * the call site restating it, which is what a hand-rolled Pressable + Icon
   * always got wrong.
   */
  it("colours its icon from the palette, unprompted", async () => {
    const onPrimary = themeColor((colors) => colors.onPrimary);
    const { toJSON } = await render(
      <>
        <onPrimary.Reader />
        <Component label="Close" type="primary">
          <Icon name="x" />
        </Component>
      </>,
    );

    expect(JSON.stringify(toJSON())).toContain(onPrimary.read());
  });

  it("lets an icon that has a reason to differ keep its own colour", async () => {
    const { toJSON } = await render(
      <Component label="Close" type="primary">
        <Icon name="x" color="rebeccapurple" />
      </Component>,
    );

    expect(JSON.stringify(toJSON())).toContain("rebeccapurple");
  });

  it("defaults to tertiary, so a bare icon paints no background", async () => {
    await render(
      <Component label="Close">
        <Icon name="x" />
      </Component>,
    );

    expect(boxStyle("Close").backgroundColor).toBe("transparent");
  });

  it("outlines a secondary button, for the case that wants an edge", async () => {
    const border = themeColor((colors) => colors.border);
    await render(
      <>
        <border.Reader />
        <Component label="Close" type="secondary">
          <Icon name="x" />
        </Component>
      </>,
    );

    expect(boxStyle("Close").borderColor).toBe(border.read());
  });

  // Square, so it sits level with a Button of the same name in a row.
  it.each(["small", "medium", "large"] as const)(
    "is square at size %s",
    async (size) => {
      await render(
        <Component label="Close" size={size}>
          <Icon name="x" />
        </Component>,
      );

      const style = boxStyle("Close");

      expect(style.width).toBeGreaterThan(0);
      expect(style.width).toBe(style.height);
    },
  );

  it("orders small < medium < large", async () => {
    // Queried through each render's own helpers rather than `screen`, which
    // follows only the most recent one.
    const heights: number[] = [];
    for (const size of ["small", "medium", "large"] as const) {
      const view = await render(
        <Component label="Close" size={size}>
          <Icon name="x" />
        </Component>,
      );
      const style = StyleSheet.flatten(
        view.getByRole("button", { name: "Close" }).props.style,
      ) as ViewStyle;
      heights.push(style.height as number);
    }

    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });
});

/**
 * IconButton renders *through* Button rather than reimplementing it, and
 * these are the properties that buys. They would start failing the moment
 * someone copied the palette or the heights back out into a second place.
 */
describe("IconButton shares Button's surface", () => {
  it.each(["primary", "secondary", "tertiary"] as const)(
    "paints %s the same as Button does",
    async (type) => {
      const icon = await render(
        <Component label="Star" type={type}>
          <Icon name="star" />
        </Component>,
      );
      const text = await render(<Button value="Star" type={type} />);

      const iconStyle = StyleSheet.flatten(
        icon.getByRole("button", { name: "Star" }).props.style,
      ) as ViewStyle;
      const textStyle = StyleSheet.flatten(
        text.getByRole("button", { name: "Star" }).props.style,
      ) as ViewStyle;

      expect(iconStyle.backgroundColor).toBe(textStyle.backgroundColor);
      expect(iconStyle.borderColor).toBe(textStyle.borderColor);
    },
  );

  it.each(["small", "medium", "large"] as const)(
    "is exactly as tall as a %s Button, so the two sit level",
    async (size) => {
      const icon = await render(
        <Component label="Star" size={size}>
          <Icon name="star" />
        </Component>,
      );
      const text = await render(<Button value="Star" size={size} />);

      const iconStyle = StyleSheet.flatten(
        icon.getByRole("button", { name: "Star" }).props.style,
      ) as ViewStyle;
      const textStyle = StyleSheet.flatten(
        text.getByRole("button", { name: "Star" }).props.style,
      ) as ViewStyle;

      expect(iconStyle.height).toBe(textStyle.minHeight);
    },
  );
});
