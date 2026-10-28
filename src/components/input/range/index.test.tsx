import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("renders a labelled multi-thumb range with helper text", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Budget"
        value={[20, 80]}
        onChange={onChange}
        min={0}
        max={100}
        step={10}
        thumbLabels={["Minimum budget", "Maximum budget"]}
        helperText="Choose an acceptable interval"
      />,
    );

    expect(screen.getByText("Budget")).toBeOnTheScreen();
    expect(screen.getByText("Choose an acceptable interval")).toBeOnTheScreen();

    const minimum = screen.getByRole("slider", { name: "Minimum budget" });
    await fireEvent(minimum, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });

  it("uses its validation error as every thumb's accessibility hint", async () => {
    await render(
      <Component
        label="Budget"
        value={[40, 40]}
        onChange={() => {}}
        error="Select a wider range"
      />,
    );

    expect(screen.getAllByRole("slider")[0].props.accessibilityHint).toBe(
      "Select a wider range",
    );
  });
});
