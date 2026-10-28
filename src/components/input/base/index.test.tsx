import { createRef } from "react";
import { Text as RNText, type TextInput } from "react-native";

import { colors } from "@/features/theme/colors";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("renders the label and value", async () => {
    await render(
      <Component label="Name" value="Ada" onChangeText={() => {}} />,
    );

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByDisplayValue("Ada")).toBeTruthy();
  });

  it("calls onChangeText as the underlying TextInput changes", async () => {
    const onChangeText = jest.fn();
    await render(
      <Component value="" onChangeText={onChangeText} placeholder="Type" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Type"), "hello");

    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  it("renders leftSlot and rightSlot", async () => {
    await render(
      <Component
        value=""
        onChangeText={() => {}}
        leftSlot={<RNText>left</RNText>}
        rightSlot={<RNText>right</RNText>}
      />,
    );

    expect(screen.getByText("left")).toBeTruthy();
    expect(screen.getByText("right")).toBeTruthy();
  });

  it("is not editable when disabled", async () => {
    await render(
      <Component
        value="locked"
        onChangeText={() => {}}
        disabled
        placeholder="Disabled"
      />,
    );

    expect(screen.getByDisplayValue("locked").props.editable).toBe(false);
  });

  it("defaults autoCapitalize to none and autoCorrect to false", async () => {
    await render(
      <Component value="" onChangeText={() => {}} placeholder="Type" />,
    );

    const input = screen.getByPlaceholderText("Type");
    expect(input.props.autoCapitalize).toBe("none");
    expect(input.props.autoCorrect).toBe(false);
  });

  it("keeps long values inside the field without a browser focus outline", async () => {
    await render(
      <Component
        value="123123123123123123123123"
        onChangeText={() => {}}
        label="Phone"
      />,
    );

    expect(screen.getByLabelText("Phone")).toHaveStyle({
      minWidth: 0,
      outlineColor: "transparent",
      outlineStyle: "solid",
      outlineWidth: 0,
    });
  });

  it("lets autoCapitalize and autoCorrect be overridden", async () => {
    await render(
      <Component
        value=""
        onChangeText={() => {}}
        placeholder="Type"
        autoCapitalize="words"
        autoCorrect
      />,
    );

    const input = screen.getByPlaceholderText("Type");
    expect(input.props.autoCapitalize).toBe("words");
    expect(input.props.autoCorrect).toBe(true);
  });

  it("sets accessibilityLabel from label, falling back to placeholder", async () => {
    const withLabel = await render(
      <Component
        value=""
        onChangeText={() => {}}
        label="Name"
        placeholder="Ada"
      />,
    );
    expect(withLabel.getByDisplayValue("").props.accessibilityLabel).toBe(
      "Name",
    );

    const withoutLabel = await render(
      <Component value="" onChangeText={() => {}} placeholder="Ada" />,
    );
    expect(withoutLabel.getByDisplayValue("").props.accessibilityLabel).toBe(
      "Ada",
    );
  });

  it("reflects disabled in accessibilityState", async () => {
    await render(
      <Component
        value="locked"
        onChangeText={() => {}}
        disabled
        placeholder="Disabled"
      />,
    );

    expect(screen.getByDisplayValue("locked").props.accessibilityState).toEqual(
      { disabled: true },
    );
  });

  it("shows helperText when there's no error", async () => {
    await render(
      <Component
        value=""
        onChangeText={() => {}}
        helperText="This is displayed publicly"
      />,
    );

    expect(screen.getByText("This is displayed publicly")).toBeTruthy();
  });

  it("shows error instead of helperText when both are given", async () => {
    await render(
      <Component
        value=""
        onChangeText={() => {}}
        helperText="This is displayed publicly"
        error="Required"
      />,
    );

    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.queryByText("This is displayed publicly")).toBeNull();
  });

  it("calls onFocus/onBlur in addition to tracking focus internally", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <Component
        value=""
        onChangeText={() => {}}
        placeholder="Type"
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const input = screen.getByPlaceholderText("Type");

    await fireEvent(input, "focus");
    await waitFor(() => {
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
    expect(input.parent).toHaveStyle({ borderColor: colors.light.focus });

    await fireEvent(input, "blur");
    await waitFor(() => {
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
    // Back to the resting outline, which is always drawn.
    expect(input.parent).toHaveStyle({ borderColor: colors.light.border });
  });

  describe("press mode (onPress)", () => {
    it("renders the value as text instead of an editable field", async () => {
      const onPress = jest.fn();
      await render(
        <Component
          label="Country"
          value="Ukraine"
          placeholder="Pick one"
          onPress={onPress}
        />,
      );

      // No TextInput at all — a non-editable one would still announce as an
      // edit box and take keyboard focus on web.
      expect(screen.queryByDisplayValue("Ukraine")).toBeNull();
      expect(screen.getByText("Ukraine")).toBeTruthy();
    });

    it("shows the placeholder when the value is empty", async () => {
      await render(
        <Component value="" placeholder="Pick one" onPress={() => {}} />,
      );

      expect(screen.getByText("Pick one")).toBeTruthy();
    });

    it("announces itself as a button carrying label, value, state and error", async () => {
      await render(
        <Component
          label="Country"
          value="Ukraine"
          error="Required"
          expanded
          onPress={() => {}}
        />,
      );

      const field = screen.getByLabelText("Country");
      expect(field.props.accessibilityRole).toBe("button");
      expect(field.props.accessibilityValue).toEqual({ text: "Ukraine" });
      expect(field.props.accessibilityHint).toBe("Required");
      expect(field.props.accessibilityState).toEqual({
        disabled: false,
        expanded: true,
      });
    });

    it("calls onPress on tap", async () => {
      const onPress = jest.fn();
      const enabled = await render(
        <Component label="Country" value="" onPress={onPress} />,
      );

      await fireEvent.press(enabled.getByLabelText("Country"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("does not call onPress while disabled", async () => {
      const onPress = jest.fn();
      const off = await render(
        <Component label="Country" value="" onPress={onPress} disabled />,
      );

      await fireEvent.press(off.getByLabelText("Country"));

      expect(onPress).not.toHaveBeenCalled();
    });

    it("still renders slots and helper text", async () => {
      await render(
        <Component
          value=""
          onPress={() => {}}
          leftSlot={<RNText>left</RNText>}
          rightSlot={<RNText>right</RNText>}
          helperText="Pick your country"
        />,
      );

      expect(screen.getByText("left")).toBeTruthy();
      expect(screen.getByText("right")).toBeTruthy();
      expect(screen.getByText("Pick your country")).toBeTruthy();
    });
  });

  it("forwards its ref to the underlying TextInput", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component
        ref={ref}
        value=""
        onChangeText={() => {}}
        placeholder="Type"
      />,
    );

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    expect(() => ref.current?.focus()).not.toThrow();
  });
});
