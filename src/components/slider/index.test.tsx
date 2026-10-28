import { fireEvent, render, screen, testId } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("exposes a single thumb as an adjustable control", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Volume"
        value={40}
        min={0}
        max={100}
        step={10}
        onChange={onChange}
      />,
    );

    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb.props.accessibilityRole).toBe("adjustable");
    expect(thumb.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 40,
      text: "40",
    });

    await fireEvent(thumb, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it("makes every multi-thumb value independently adjustable", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Price"
        thumbLabels={["Minimum price", "Maximum price"]}
        value={[20, 80]}
        min={0}
        max={100}
        step={5}
        onChange={onChange}
      />,
    );

    const minimum = screen.getByRole("slider", { name: "Minimum price" });
    const maximum = screen.getByRole("slider", { name: "Maximum price" });
    expect(minimum.props.accessibilityValue.now).toBe(20);
    expect(maximum.props.accessibilityValue.now).toBe(80);

    await fireEvent(maximum, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).toHaveBeenCalledWith([20, 75]);
  });

  it("changes the nearest value when the custom track becomes responder", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Volume"
        value={20}
        min={0}
        max={100}
        step={10}
        onChange={onChange}
        testID="custom-slider"
      />,
    );

    await fireEvent(
      screen.getByTestId(testId("custom-slider", "control")),
      "layout",
      {
        nativeEvent: { layout: { width: 244, height: 44, x: 0, y: 0 } },
      },
    );
    await fireEvent(
      screen.getByTestId(testId("custom-slider", "track")),
      "responderGrant",
      {
        nativeEvent: { locationX: 142 },
      },
    );

    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("drags the custom thumb without a competing press responder", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Volume"
        value={20}
        min={0}
        max={100}
        step={10}
        onChange={onChange}
        testID="custom-slider"
      />,
    );

    await fireEvent(
      screen.getByTestId(testId("custom-slider", "control")),
      "layout",
      {
        nativeEvent: { layout: { width: 244, height: 44, x: 0, y: 0 } },
      },
    );
    const thumb = screen.getByTestId("custom-slider");
    await fireEvent(thumb, "responderGrant", {
      nativeEvent: { pageX: 100 },
    });
    await fireEvent(thumb, "responderMove", {
      nativeEvent: { pageX: 140 },
    });

    expect(onChange).toHaveBeenCalledWith(40);
  });

  it("prevents thumbs from crossing", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Range"
        value={[20, 30]}
        min={0}
        max={100}
        step={10}
        onChange={onChange}
      />,
    );

    const minimum = screen.getByRole("slider", { name: "Range 1" });
    await fireEvent(minimum, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    await fireEvent(minimum, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(onChange).toHaveBeenLastCalledWith([30, 30]);
  });

  it("uses Expo UI for a single value with the same accessibility API", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        type="expo"
        label="Brightness"
        value={60}
        max={100}
        onChange={onChange}
        testID="expo-slider"
      />,
    );
    const slider = screen.getByTestId("expo-slider");
    expect(slider).toHaveAccessibilityValue({ min: 0, max: 100, now: 60 });
    expect(slider).toHaveAccessibleName("Brightness");
  });

  it("does not change while disabled", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Locked"
        value={10}
        max={100}
        onChange={onChange}
        disabled
      />,
    );

    const slider = screen.getByRole("slider", { name: "Locked" });
    expect(slider).toBeDisabled();
    await fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  // Keeps the accessible name while dropping the visible text, for a
  // slider whose surroundings already say what it is — MediaPlayer's
  // scrubber sits between a play button and a clock.
  it("hides the visible label without losing the accessible name", async () => {
    await render(
      <Component label="Volume" value={5} onChange={jest.fn()} hideLabel />,
    );

    expect(screen.queryByText("Volume")).toBeNull();
    expect(screen.getByRole("slider", { name: "Volume" })).toBeTruthy();
  });

  it("draws the label by default", async () => {
    await render(<Component label="Volume" value={5} onChange={jest.fn()} />);

    expect(screen.getByText("Volume")).toBeTruthy();
  });
});
