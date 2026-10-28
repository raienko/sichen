import { createRef } from "react";
import type { TextInput } from "react-native";

import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

const OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "legacy", label: "Legacy", disabled: true },
];

describe(`${Component.displayName} smoke test`, () => {
  it("renders every option with its selected state", async () => {
    await render(
      <Component value="pro" onChange={() => {}} options={OPTIONS} />,
    );

    expect(
      screen.getByRole("radio", { name: "Free", checked: false }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("radio", { name: "Pro", checked: true }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Legacy" })).toBeDisabled();
  });

  it("reports a single selected value", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component value={null} onChange={onChange} options={OPTIONS} />,
    );

    await user.press(screen.getByRole("radio", { name: "Pro" }));

    expect(onChange).toHaveBeenCalledWith("pro");
  });

  it("does not report a change for the selected option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component value="free" onChange={onChange} options={OPTIONS} />,
    );

    await user.press(screen.getByRole("radio", { name: "Free" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every option with the whole input", async () => {
    await render(
      <Component value="free" onChange={() => {}} options={OPTIONS} disabled />,
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  it("shows error text instead of helper text", async () => {
    await render(
      <Component
        label="Plan"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
        helperText="Choose one"
        error="Choose a plan"
      />,
    );

    expect(screen.getByText("Choose a plan")).toBeOnTheScreen();
    expect(screen.queryByText("Choose one")).not.toBeOnTheScreen();
  });

  it("accepts the Expo radio implementation", async () => {
    await render(
      <Component
        value="free"
        onChange={() => {}}
        options={OPTIONS}
        radioType="expo"
      />,
    );

    expect(
      screen.getByRole("radio", { name: "Free", checked: true }),
    ).toBeOnTheScreen();
  });

  it("accepts a ref without attaching it to a text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component
        ref={ref}
        value={null}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(ref.current).toBeNull();
  });
});
