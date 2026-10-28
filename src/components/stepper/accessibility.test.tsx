import { render, testId } from "@/root/testing";

import Component from "./index";

/**
 * Split from ./index.test.tsx for the reason `Badge`, `Tag` and `Avatar`
 * split theirs: past a certain number of renders in one file this harness
 * stops resolving queries against freshly rendered trees, and Jest isolates
 * modules, so a second file starts clean.
 */
const hidden = { includeHiddenElements: true } as const;

describe("Stepper accessibility", () => {
  // The platform's own stepper is a single adjustable element; announcing
  // "decrease, button / 2 / increase, button" would turn one control into
  // three stops.
  it("is one adjustable element with the whole range on it", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        min={1}
        max={8}
        onChange={jest.fn()}
      />,
    );
    const { props } = view.getByTestId("stepper");

    expect(props.accessible).toBe(true);
    expect(props.accessibilityRole).toBe("adjustable");
    expect(props.accessibilityLabel).toBe("Quantity");
    expect(props.accessibilityValue).toEqual({
      min: 1,
      max: 8,
      now: 3,
      text: "3",
    });
    // react-native-web renders only the aria-* form of the range.
    expect(props["aria-valuemin"]).toBe(1);
    expect(props["aria-valuemax"]).toBe(8);
    expect(props["aria-valuenow"]).toBe(3);
  });

  it("offers both adjustable actions", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={jest.fn()}
      />,
    );

    expect(view.getByTestId("stepper").props.accessibilityActions).toEqual([
      { name: "increment" },
      { name: "decrement" },
    ]);
  });

  it.each([
    ["increment", 4],
    ["decrement", 2],
  ])("moves the value on %s", async (actionName, expected) => {
    const onChange = jest.fn();
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={onChange}
      />,
    );

    view.getByTestId("stepper").props.onAccessibilityAction({
      nativeEvent: { actionName },
    });

    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("ignores an adjustable action while disabled", async () => {
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

    view.getByTestId("stepper").props.onAccessibilityAction({
      nativeEvent: { actionName: "increment" },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  // Hidden affects the accessibility tree, not the hit area — the presses
  // themselves are covered in ./index.test.tsx.
  it.each(["decrease", "increase"])(
    "hides the %s button on every platform",
    async (which) => {
      const view = await render(
        <Component
          testID="stepper"
          label="Quantity"
          value={3}
          onChange={jest.fn()}
        />,
      );
      const { props } = view.getByTestId(testId("stepper", which), hidden);

      expect(props.accessible).toBe(false);
      expect(props.accessibilityElementsHidden).toBe(true);
      expect(props.importantForAccessibility).toBe("no-hide-descendants");
      expect(props["aria-hidden"]).toBe(true);
    },
  );

  it("leaves nothing but the adjustable element reachable", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={jest.fn()}
      />,
    );

    expect(view.queryByRole("button")).toBeNull();
    expect(view.queryByTestId(testId("stepper", "increase"))).toBeNull();
    expect(view.getByTestId("stepper")).toBeTruthy();
  });

  it("hides the value text too, since the element already announces it", async () => {
    const view = await render(
      <Component label="Quantity" value={3} onChange={jest.fn()} />,
    );

    expect(view.getByText("3", hidden).props["aria-hidden"]).toBe(true);
    expect(view.queryByText("3")).toBeNull();
  });

  it("announces disabled", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={jest.fn()}
        disabled
      />,
    );
    const { props } = view.getByTestId("stepper", hidden);

    expect(props.accessibilityState.disabled).toBe(true);
    expect(props["aria-disabled"]).toBe(true);
  });

  it("carries a hint when given one", async () => {
    const view = await render(
      <Component
        testID="stepper"
        label="Quantity"
        value={3}
        onChange={jest.fn()}
        accessibilityHint="Maximum eight per order"
      />,
    );

    expect(view.getByTestId("stepper").props.accessibilityHint).toBe(
      "Maximum eight per order",
    );
  });
});
