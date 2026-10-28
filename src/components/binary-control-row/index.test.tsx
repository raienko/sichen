import { View } from "react-native";

import { checkboxA11yProps, switchA11yProps } from "@/features/accessibility";
import { render, screen, userEvent } from "@/root/testing";

import Component from "./index";

function Indicator() {
  return <View testID="indicator" />;
}

describe(`${Component.name} shared row`, () => {
  it("is one element carrying the semantics its control passes in", async () => {
    await render(
      <Component
        label="Accept terms"
        indicator={<Indicator />}
        accessibilityProps={checkboxA11yProps({
          label: "Accept terms",
          checked: true,
          disabled: false,
        })}
        onPress={() => {}}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Accept terms", checked: true }),
    ).toBeTruthy();
    expect(screen.getByText("Accept terms")).toBeTruthy();
  });

  it("reports a press anywhere on the row, label included", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <Component
        label="Wi-Fi"
        indicator={<Indicator />}
        accessibilityProps={switchA11yProps({
          label: "Wi-Fi",
          value: false,
          disabled: false,
        })}
        onPress={onPress}
      />,
    );

    await user.press(screen.getByText("Wi-Fi"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("ignores presses while disabled", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <Component
        label="Wi-Fi"
        indicator={<Indicator />}
        accessibilityProps={switchA11yProps({
          label: "Wi-Fi",
          value: false,
          disabled: true,
        })}
        onPress={onPress}
        disabled
      />,
    );

    await user.press(screen.getByRole("switch", { name: "Wi-Fi" }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("puts the indicator before the label at the start, after it at the end", async () => {
    const { rerender } = await render(
      <Component
        testID="row"
        label="Label"
        indicator={<Indicator />}
        accessibilityProps={{}}
        onPress={() => {}}
      />,
    );
    const order = () =>
      screen
        .getByTestId("row")
        .children.map((child) =>
          typeof child === "string" ? child : (child.props.testID ?? "label"),
        );

    expect(order()[0]).toBe("indicator");

    await rerender(
      <Component
        testID="row"
        label="Label"
        indicator={<Indicator />}
        indicatorPosition="end"
        accessibilityProps={{}}
        onPress={() => {}}
      />,
    );

    expect(order()[order().length - 1]).toBe("indicator");
  });
});
