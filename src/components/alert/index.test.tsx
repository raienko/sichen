import { StyleSheet } from "react-native";

import { colors } from "@/features/theme/colors";
import { fireEvent, render, screen, testId } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("shows its title and message", async () => {
    await render(<Component title="Couldn't save" message="Try again." />);

    expect(screen.getByText("Couldn't save")).toBeTruthy();
    expect(screen.getByText("Try again.")).toBeTruthy();
  });

  // The type is read first so it survives without the colour (WCAG 1.4.1).
  it("announces the type before the message", async () => {
    await render(<Component type="warning" message="You're offline." />);

    const status = screen.getByLabelText("Warning, You're offline.");

    expect(status.props.role).toBe("status");
  });

  it("interrupts only for an error", async () => {
    const { rerender } = await render(
      <Component type="info" message="Heads up" />,
    );
    expect(
      screen.getByLabelText("Information, Heads up").props
        .accessibilityLiveRegion,
    ).toBe("polite");

    await rerender(<Component type="error" message="Failed" />);
    const alert = screen.getByLabelText("Error, Failed");
    expect(alert.props.accessibilityLiveRegion).toBe("assertive");
    expect(alert.props.role).toBe("alert");
  });

  it("offers its action", async () => {
    const onPress = jest.fn();
    await render(
      <Component message="Offline" action={{ label: "Retry", onPress }} />,
    );

    await fireEvent.press(screen.getByTestId(testId("alert", "action")));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows a close control only when it can be dismissed", async () => {
    const { rerender } = await render(<Component message="Stays" />);
    expect(screen.queryByTestId(testId("alert", "dismiss"))).toBeNull();

    const onDismiss = jest.fn();
    await rerender(<Component message="Goes" onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByTestId(testId("alert", "dismiss")));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("draws on the raised surface, not a status-coloured fill", async () => {
    await render(<Component testID="alert" type="error" message="Failed" />);

    expect(
      StyleSheet.flatten(screen.getByTestId("alert").props.style)
        .backgroundColor,
    ).toBe(colors.light.backgroundElement);
  });

  // An `undefined` colour would still override Text's and fall back to black.
  it("colours the message from the theme with or without a title", async () => {
    const { rerender } = await render(<Component message="Alone" />);
    expect(
      StyleSheet.flatten(screen.getByText("Alone").props.style).color,
    ).toBe(colors.light.text);

    await rerender(<Component title="Title" message="Under" />);
    expect(
      StyleSheet.flatten(screen.getByText("Under").props.style).color,
    ).toBe(colors.light.textSecondary);
  });
});
