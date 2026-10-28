import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders the custom variation as an unchecked checkbox by default", async () => {
    await render(
      <Component label="Accept terms" value={false} onChange={() => {}} />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Accept terms",
      checked: false,
    });
    expect(checkbox).toBeEnabled();
  });

  it("reports the next value when pressed", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Accept terms" value={false} onChange={onChange} />,
    );

    await user.press(screen.getByRole("checkbox", { name: "Accept terms" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not change while disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Locked" value onChange={onChange} disabled />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Locked" });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();

    await user.press(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the Expo UI variation through the same public API", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component
        type="expo"
        label="Expo option"
        value
        onChange={onChange}
        testID="expo-checkbox"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Expo option",
      checked: true,
    });
    expect(checkbox).toBe(screen.getByTestId("expo-checkbox"));

    await user.press(checkbox);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
