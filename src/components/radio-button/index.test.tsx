import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders an unselected custom radio button by default", async () => {
    await render(
      <Component label="Monthly" value={false} onChange={() => {}} />,
    );

    expect(
      screen.getByRole("radio", { name: "Monthly", checked: false }),
    ).toBeEnabled();
  });

  it("reports true when an unselected radio is pressed", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Monthly" value={false} onChange={onChange} />,
    );

    await user.press(screen.getByRole("radio", { name: "Monthly" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle a selected radio off", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<Component label="Monthly" value onChange={onChange} />);

    await user.press(screen.getByRole("radio", { name: "Monthly" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not change while disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component label="Legacy" value={false} onChange={onChange} disabled />,
    );

    const radio = screen.getByRole("radio", { name: "Legacy" });
    expect(radio).toBeDisabled();
    await user.press(radio);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the Expo-style variation through the same API", async () => {
    await render(
      <Component
        type="expo"
        label="Yearly"
        value
        onChange={() => {}}
        testID="expo-radio"
      />,
    );

    expect(
      screen.getByRole("radio", { name: "Yearly", checked: true }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("expo-radio")).toBeOnTheScreen();
  });
});
