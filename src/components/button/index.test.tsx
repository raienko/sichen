import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { colors } from "@/features/theme/colors";
import { fireEvent, render, screen, testId } from "@/root/testing";

import Component, { type ButtonSize, type ButtonType } from "./index";

function boxOf(name: string): ViewStyle {
  return StyleSheet.flatten(
    screen.getByRole("button", { name }).props.style,
  ) as ViewStyle;
}

function labelOf(name: string): TextStyle {
  return StyleSheet.flatten(screen.getByText(name).props.style) as TextStyle;
}

// Jest reports no OS dark-mode preference, so the default "system" theme
// resolves to light here. Assertions compare against that palette rather
// than hard-coded hex, so a palette change updates them automatically.
const palette = colors.light;

describe(`${Component.name} smoke test`, () => {
  it("renders the given value", async () => {
    await render(<Component value="press me" onPress={() => {}} />);

    expect(screen.getByText("press me")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(<Component value="press me" onPress={onPress} />);

    await fireEvent.press(screen.getByText("press me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // A plain Pressable has no role of its own — without this every button in
  // the app announces as an anonymous group.
  it("announces as a button, labelled by its own text", async () => {
    await render(<Component value="press me" onPress={() => {}} />);

    expect(screen.getByRole("button", { name: "press me" })).toBeTruthy();
  });

  it("exposes selected state", async () => {
    await render(<Component value="picked" selected onPress={() => {}} />);

    expect(screen.getByRole("button").props.accessibilityState.selected).toBe(
      true,
    );
  });

  it("exposes disabled state and blocks onPress", async () => {
    const onPress = jest.fn();
    await render(<Component value="nope" disabled onPress={onPress} />);

    expect(screen.getByRole("button").props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.press(screen.getByText("nope"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows a loading indicator, reports busy, and blocks onPress", async () => {
    const onPress = jest.fn();
    await render(<Component value="saving" loading onPress={onPress} />);

    const button = screen.getByRole("button", { name: "saving" });

    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.getByTestId(testId("button", "loading"))).toBeOnTheScreen();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("removes the loading indicator and re-enables presses when loading ends", async () => {
    const onPress = jest.fn();
    const view = await render(
      <Component value="save" loading onPress={onPress} />,
    );

    await view.rerender(<Component value="save" onPress={onPress} />);

    const button = screen.getByRole("button", { name: "save" });
    expect(button).not.toBeBusy();
    expect(button).toBeEnabled();
    expect(
      screen.queryByTestId(testId("button", "loading")),
    ).not.toBeOnTheScreen();

    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("Button type", () => {
  it("defaults to secondary, so existing buttons keep their look", async () => {
    await render(<Component value="plain" onPress={() => {}} />);

    expect(boxOf("plain").backgroundColor).toBe("transparent");
    expect(boxOf("plain").borderColor).toBe(palette.border);
    expect(labelOf("plain").color).toBe(palette.text);
  });

  it("fills a primary button with the accent and its contrasting label", async () => {
    await render(<Component value="go" type="primary" onPress={() => {}} />);

    expect(boxOf("go").backgroundColor).toBe(palette.primary);
    expect(labelOf("go").color).toBe(palette.onPrimary);
  });

  it("leaves a tertiary button unfilled, labelled in the accent", async () => {
    await render(
      <Component value="ghost" type="tertiary" onPress={() => {}} />,
    );

    expect(boxOf("ghost").backgroundColor).toBe("transparent");
    expect(labelOf("ghost").color).toBe(palette.accent);
  });

  /**
   * The point of giving every type two backgrounds: a segmented control has
   * to read as picked whichever type it's built from, not only the one with
   * a darker token lying around.
   */
  it("changes background when selected, in every type", async () => {
    const types: ButtonType[] = ["primary", "secondary", "tertiary"];

    await render(
      <>
        {types.map((type) => (
          <Component
            key={type}
            value={`${type}-off`}
            type={type}
            onPress={() => {}}
          />
        ))}
        {types.map((type) => (
          <Component
            key={type}
            value={`${type}-on`}
            type={type}
            selected
            onPress={() => {}}
          />
        ))}
      </>,
    );

    for (const type of types) {
      const off = boxOf(`${type}-off`).backgroundColor;
      const on = boxOf(`${type}-on`).backgroundColor;
      // Primary is already at full emphasis, so it stays put and conveys
      // selection through aria-selected alone.
      if (type === "primary") {
        expect(on).toBe(off);
      } else {
        expect(on).not.toBe(off);
      }
    }
  });
});

/**
 * `testOnly_pressed` is React Native's own switch for rendering a Pressable
 * in its held state, so the pressed look can be asserted without timing a
 * real press-in.
 */
describe("Button pressed state", () => {
  it("darkens a primary button to its pressed fill", async () => {
    await render(
      <Component
        value="go"
        type="primary"
        testOnly_pressed
        onPress={() => {}}
      />,
    );

    expect(boxOf("go").backgroundColor).toBe(palette.primaryPressed);
    expect(
      screen.queryByTestId(testId("button", "pressed")),
    ).not.toBeOnTheScreen();
  });

  it.each(["secondary", "tertiary"] as const)(
    "lays the pressed overlay over an unfilled %s button",
    async (type) => {
      await render(
        <Component
          value="tap"
          type={type}
          testOnly_pressed
          onPress={() => {}}
        />,
      );

      const overlay = screen.getByTestId(testId("button", "pressed"));
      expect(StyleSheet.flatten(overlay.props.style).backgroundColor).toBe(
        palette.pressed,
      );
      // The resting fill is kept underneath rather than replaced.
      expect(boxOf("tap").backgroundColor).toBe("transparent");
    },
  );

  it("shows no press feedback at rest", async () => {
    await render(<Component value="idle" onPress={() => {}} />);

    expect(
      screen.queryByTestId(testId("button", "pressed")),
    ).not.toBeOnTheScreen();
  });
});

describe("Button size", () => {
  it("defaults to the 44pt touch-target height", async () => {
    await render(<Component value="std" onPress={() => {}} />);

    expect(boxOf("std").minHeight).toBeGreaterThan(0);
  });

  it("orders small < medium < large by height and padding", async () => {
    await render(
      <>
        <Component value="s" size="small" onPress={() => {}} />
        <Component value="m" size="medium" onPress={() => {}} />
        <Component value="l" size="large" onPress={() => {}} />
      </>,
    );

    const [s, m, l] = ["s", "m", "l"].map(boxOf);

    expect(s.minHeight!).toBeLessThan(m.minHeight as number);
    expect(m.minHeight!).toBeLessThan(l.minHeight as number);
    expect(s.paddingHorizontal!).toBeLessThan(m.paddingHorizontal as number);
    expect(m.paddingHorizontal!).toBeLessThan(l.paddingHorizontal as number);
  });

  it("gives each size its own step of the type scale", async () => {
    await render(
      <>
        <Component value="s" size="small" onPress={() => {}} />
        <Component value="l" size="large" onPress={() => {}} />
      </>,
    );

    expect(labelOf("s").fontSize!).toBeLessThan(
      labelOf("l").fontSize as number,
    );
  });

  // `auto` is the one size that hugs its label instead of reserving a
  // touch target — deliberate, and why it's unsuitable for primary actions.
  it("imposes no height for auto", async () => {
    await render(<Component value="hug" size="auto" onPress={() => {}} />);

    expect(boxOf("hug").minHeight).toBeUndefined();
  });

  it("stays pressable in every size", async () => {
    const sizes: ButtonSize[] = ["small", "medium", "large", "auto"];
    const onPress = jest.fn();

    await render(
      <>
        {sizes.map((size) => (
          <Component
            key={size}
            value={size}
            size={size}
            onPress={() => onPress(size)}
          />
        ))}
      </>,
    );

    for (const size of sizes) {
      await fireEvent.press(screen.getByText(size));
    }

    expect(onPress.mock.calls.flat()).toEqual(sizes);
  });
});
