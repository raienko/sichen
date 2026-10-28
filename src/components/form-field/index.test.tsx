import { StyleSheet, View } from "react-native";

import { colors } from "@/features/theme/colors";
import { render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("frames any control with its label and helper text", async () => {
    await render(
      <Component label="Volume" helperText="Applies to all devices">
        <View testID="control" />
      </Component>,
    );

    expect(screen.getByText("Volume")).toBeTruthy();
    expect(screen.getByText("Applies to all devices")).toBeTruthy();
    expect(screen.getByTestId("control")).toBeTruthy();
  });

  it("shows the error in place of the helper, in the error colour", async () => {
    await render(
      <Component label="Email" helperText="Work address" error="Required">
        <View />
      </Component>,
    );

    expect(screen.queryByText("Work address")).toBeNull();
    const error = screen.getByText("Required");
    expect(StyleSheet.flatten(error.props.style).color).toBe(
      colors.light.error,
    );
  });

  // A field turning invalid is the one change a screen-reader user can't
  // see; the helper text changing is not worth interrupting for.
  it("announces an error, and only an error", async () => {
    const { rerender } = await render(
      <Component label="Email" helperText="Work address">
        <View />
      </Component>,
    );
    expect(
      screen.getByText("Work address").props.accessibilityLiveRegion,
    ).toBeUndefined();

    await rerender(
      <Component label="Email" error="Enter a valid email">
        <View />
      </Component>,
    );
    expect(
      screen.getByText("Enter a valid email").props.accessibilityLiveRegion,
    ).toBe("assertive");
  });

  it("marks a required field beside its label", async () => {
    await render(
      <Component label="Phone" required>
        <View />
      </Component>,
    );

    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("marks nothing on a field that isn't required", async () => {
    await render(
      <Component label="Phone">
        <View />
      </Component>,
    );

    expect(screen.queryByText("Required")).toBeNull();
    expect(screen.queryByText("Optional")).toBeNull();
  });

  it("hands a render-function child the ids its label and description carry", async () => {
    let ids: { labelId: string; descriptionId: string } | undefined;
    await render(
      <Component label="Guests" helperText="Up to eight">
        {(received) => {
          ids = received;
          return <View />;
        }}
      </Component>,
    );

    expect(screen.getByText("Guests").props.nativeID).toBe(ids?.labelId);
    expect(screen.getByText("Up to eight").props.nativeID).toBe(
      ids?.descriptionId,
    );
    expect(ids?.labelId).not.toBe(ids?.descriptionId);
  });

  it("shows a counter, and names it in words for a screen reader", async () => {
    await render(
      <Component counter="12/200" counterLabel="12 of 200 characters">
        <View />
      </Component>,
    );

    expect(screen.getByText("12/200").props.accessibilityLabel).toBe(
      "12 of 200 characters",
    );
  });
});
