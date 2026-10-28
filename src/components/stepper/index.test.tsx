import { fireEvent, render, testId } from "@/root/testing";

import Component from "./index";

const hidden = { includeHiddenElements: true } as const;

describe(`${Component.name} smoke test`, () => {
  it("shows its label and its value", async () => {
    const view = await render(
      <Component label="Quantity" value={3} onChange={jest.fn()} />,
    );

    expect(view.getByText("Quantity")).toBeTruthy();
    expect(view.getByText("3", hidden)).toBeTruthy();
  });

  it("keeps the label as the name but stops drawing it", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={jest.fn()}
        hideLabel
      />,
    );

    expect(view.queryByText("Quantity")).toBeNull();
    expect(view.getByTestId("stepper").props.accessibilityLabel).toBe(
      "Quantity",
    );
  });

  describe("stepping", () => {
    it("reports one step up", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={3}
          onChange={onChange}
        />,
      );

      fireEvent.press(view.getByTestId(testId("stepper", "increase"), hidden));

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it("reports one step down", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={3}
          onChange={onChange}
        />,
      );

      fireEvent.press(view.getByTestId(testId("stepper", "decrease"), hidden));

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it("takes a step of its own", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="stepper"
          label="Rate"
          value={1}
          step={0.5}
          max={10}
          onChange={onChange}
        />,
      );

      fireEvent.press(view.getByTestId(testId("stepper", "increase"), hidden));

      expect(onChange).toHaveBeenCalledWith(1.5);
    });
  });

  describe("limits", () => {
    // Disabled rather than pressable-and-ignored, so the control looks the
    // way it behaves.
    it("disables the button that would cross a bound", async () => {
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={0}
          min={0}
          max={5}
          onChange={jest.fn()}
        />,
      );

      expect(
        view.getByTestId(testId("stepper", "decrease"), hidden).props
          .accessibilityState.disabled,
      ).toBe(true);
      expect(
        view.getByTestId(testId("stepper", "increase"), hidden).props
          .accessibilityState.disabled,
      ).toBe(false);
    });

    it("reports nothing when pressed at a bound", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={5}
          min={0}
          max={5}
          onChange={onChange}
        />,
      );

      fireEvent.press(view.getByTestId(testId("stepper", "increase"), hidden));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("clamps a value handed in from outside the range", async () => {
      const view = await render(
        <Component
          label="Quantity"
          value={99}
          min={0}
          max={5}
          onChange={jest.fn()}
        />,
      );

      expect(view.getByText("5", hidden)).toBeTruthy();
    });
  });

  describe("disabled", () => {
    it("disables both buttons", async () => {
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={3}
          onChange={jest.fn()}
          disabled
        />,
      );

      expect(
        view.getByTestId(testId("stepper", "decrease"), hidden).props
          .accessibilityState.disabled,
      ).toBe(true);
      expect(
        view.getByTestId(testId("stepper", "increase"), hidden).props
          .accessibilityState.disabled,
      ).toBe(true);
    });

    it("reports nothing when pressed", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={3}
          onChange={onChange}
          disabled
        />,
      );

      fireEvent.press(view.getByTestId(testId("stepper", "increase"), hidden));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("draws and announces a formatted value", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Rate"
        value={2}
        onChange={jest.fn()}
        formatValue={(rate) => `${rate}×`}
      />,
    );

    expect(view.getByText("2×", hidden)).toBeTruthy();
    expect(view.getByTestId("stepper").props.accessibilityValue.text).toBe(
      "2×",
    );
  });
});
