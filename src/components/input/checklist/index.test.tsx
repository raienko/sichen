import { createRef } from "react";
import type { TextInput } from "react-native";

import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

const OPTIONS = [
  { value: "design", label: "Design", testID: "design" },
  { value: "engineering", label: "Engineering" },
  { value: "research", label: "Research", disabled: true },
];

describe(`${Component.displayName} smoke test`, () => {
  it("renders every option with its checked state", async () => {
    await render(
      <Component
        label="Interests"
        value={["design"]}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Design", checked: true }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("checkbox", {
        name: "Engineering",
        checked: false,
      }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("checkbox", { name: "Research" })).toBeDisabled();
  });

  it("adds a checked option without mutating the current array", async () => {
    const user = userEvent.setup();
    const value = ["design"];
    const onChange = jest.fn();
    await render(
      <Component value={value} onChange={onChange} options={OPTIONS} />,
    );

    await user.press(screen.getByRole("checkbox", { name: "Engineering" }));

    expect(onChange).toHaveBeenCalledWith(["design", "engineering"]);
    expect(value).toEqual(["design"]);
  });

  it("removes an unchecked option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component
        value={["design", "engineering"]}
        onChange={onChange}
        options={OPTIONS}
      />,
    );

    await user.press(screen.getByRole("checkbox", { name: "Design" }));

    expect(onChange).toHaveBeenCalledWith(["engineering"]);
  });

  it("disables every option when the whole input is disabled", async () => {
    await render(
      <Component
        value={["design"]}
        onChange={() => {}}
        options={OPTIONS}
        disabled
      />,
    );

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
  });

  it("shows helper and error text through the shared form field", async () => {
    await render(
      <Component
        label="Interests"
        value={[]}
        onChange={() => {}}
        options={OPTIONS}
        helperText="Choose any"
        error="Choose at least one"
      />,
    );

    expect(screen.getByText("Choose at least one")).toBeOnTheScreen();
    expect(screen.queryByText("Choose any")).not.toBeOnTheScreen();
  });

  it("accepts an Expo checkbox implementation", async () => {
    await render(
      <Component
        value={["design"]}
        onChange={() => {}}
        options={OPTIONS}
        checkboxType="expo"
      />,
    );

    // Expo UI's native label lives inside SwiftUI/Compose and is opaque to
    // the React test renderer, so this is the one case where its explicit
    // end-to-end identifier is the observable boundary.
    expect(screen.getByTestId("design")).toBeOnTheScreen();
  });

  it("accepts a ref without attaching it to a text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component ref={ref} value={[]} onChange={() => {}} options={OPTIONS} />,
    );

    expect(ref.current).toBeNull();
  });
});
