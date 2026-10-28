import { createRef } from "react";
import type { TextInput } from "react-native";

import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

const OPTIONS = [
  { value: "product", label: "Product updates", testID: "product" },
  { value: "security", label: "Security alerts" },
  { value: "locked", label: "Managed", disabled: true },
];

describe(`${Component.displayName} smoke test`, () => {
  it("renders every option with its current state", async () => {
    await render(
      <Component
        label="Notifications"
        value={["security"]}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(
      screen.getByRole("switch", {
        name: "Product updates",
        checked: false,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("switch", {
        name: "Security alerts",
        checked: true,
      }),
    ).toBeOnTheScreen();
    expect(screen.getByRole("switch", { name: "Managed" })).toBeDisabled();
  });

  it("reports individual option changes immutably", async () => {
    const user = userEvent.setup();
    const value = ["security"];
    const onChange = jest.fn();
    await render(
      <Component value={value} onChange={onChange} options={OPTIONS} />,
    );

    await user.press(screen.getByRole("switch", { name: "Product updates" }));

    expect(onChange).toHaveBeenCalledWith(["security", "product"]);
    expect(value).toEqual(["security"]);
  });

  it("can turn every enabled option on", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component
        label="Notifications"
        value={["locked"]}
        onChange={onChange}
        options={OPTIONS}
        groupSwitch
      />,
    );

    await user.press(screen.getByRole("switch", { name: "Notifications" }));

    expect(onChange).toHaveBeenCalledWith(["locked", "product", "security"]);
  });

  it("can turn every enabled option off without changing disabled or unknown values", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(
      <Component
        label="Notifications"
        value={["product", "security", "locked", "unknown"]}
        onChange={onChange}
        options={OPTIONS}
        groupSwitch
      />,
    );

    const all = screen.getByRole("switch", {
      name: "Notifications",
      checked: true,
    });
    await user.press(all);

    expect(onChange).toHaveBeenCalledWith(["locked", "unknown"]);
  });

  it("disables all controls with the whole input", async () => {
    await render(
      <Component
        label="Notifications"
        value={[]}
        onChange={() => {}}
        options={OPTIONS}
        groupSwitch
        disabled
      />,
    );

    for (const control of screen.getAllByRole("switch")) {
      expect(control).toBeDisabled();
    }
  });

  it("disables the group switch when there are no enabled options", async () => {
    await render(
      <Component
        label="Notifications"
        value={[]}
        onChange={() => {}}
        options={[{ value: "locked", label: "Managed", disabled: true }]}
        groupSwitch
      />,
    );

    expect(
      screen.getByRole("switch", { name: "Notifications" }),
    ).toBeDisabled();
  });

  it("uses the group label for the master switch without an extra all row", async () => {
    await render(
      <Component
        label="Notifications"
        value={[]}
        onChange={() => {}}
        options={OPTIONS}
        groupSwitch
      />,
    );

    expect(
      screen.getByRole("switch", { name: "Notifications" }),
    ).toBeOnTheScreen();
    expect(screen.getAllByText("Notifications")).toHaveLength(1);
    expect(screen.queryByText("All notifications")).not.toBeOnTheScreen();
  });

  it("accepts the Expo switch implementation", async () => {
    await render(
      <Component
        value={[]}
        onChange={() => {}}
        options={OPTIONS}
        switchType="expo"
      />,
    );

    expect(screen.getByTestId("product")).toBeOnTheScreen();
  });

  it("accepts a ref without attaching it to a text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component ref={ref} value={[]} onChange={() => {}} options={OPTIONS} />,
    );

    expect(ref.current).toBeNull();
  });
});
