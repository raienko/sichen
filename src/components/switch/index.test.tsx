import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders the custom variation as an off switch by default", async () => {
    await render(
      <Component label="Notifications" value={false} onChange={() => {}} />,
    );

    expect(
      screen.getByRole("switch", {
        name: "Notifications",
        checked: false,
      }),
    ).toBeEnabled();
  });

  it("reports the next value when pressed", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Notifications" value={false} onChange={onChange} />,
    );

    await user.press(screen.getByRole("switch", { name: "Notifications" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not change while disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Locked" value onChange={onChange} disabled />,
    );

    const control = screen.getByRole("switch", { name: "Locked" });
    expect(control).toBeChecked();
    expect(control).toBeDisabled();

    await user.press(control);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders and changes the Expo variation through the same public API", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component
        type="expo"
        label="Expo option"
        value
        onChange={onChange}
        testID="expo-switch"
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Expo option",
      checked: true,
    });
    expect(control).toBe(screen.getByTestId("expo-switch"));

    await user.press(control);

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
