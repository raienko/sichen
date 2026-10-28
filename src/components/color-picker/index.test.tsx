import { useState } from "react";

import { State, type PanGesture } from "react-native-gesture-handler";
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils";

import { act, fireEvent, render, screen, testId } from "@/root/testing";

import Component from "./index";

const PRESETS = ["#3F5BD9", "#E4002B"];

/** Lays the field out at a known size, then drags to (x, y) inside it. */
async function dragTo(field: "area" | "hue", x: number, y: number) {
  await act(async () => {
    screen.getByTestId(testId("color-picker", field)).props.onLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 100 } },
    });
  });
  await act(async () => {
    fireGestureHandler<PanGesture>(
      getByGestureTestId(`color-picker-${field}-gesture`),
      [
        { state: State.BEGAN, x: 0, y: 0 },
        { state: State.ACTIVE, x, y },
        { state: State.END, x, y },
      ],
    );
  });
}

describe(`${Component.name}`, () => {
  it("reports a preset as #RRGGBB when it is tapped", async () => {
    const onChange = jest.fn();
    await render(
      <Component value="#00A86B" onChange={onChange} presets={PRESETS} />,
    );

    await fireEvent.press(
      screen.getByTestId(testId("color-picker", "preset", "#E4002B")),
    );

    expect(onChange).toHaveBeenCalledWith("#E4002B");
  });

  it("marks the preset that matches the value", async () => {
    await render(
      <Component value="#3f5bd9" onChange={jest.fn()} presets={PRESETS} />,
    );

    expect(
      screen.getByTestId(testId("color-picker", "preset", "#3F5BD9")).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
  });

  // Right edge, top: full saturation, full brightness, of the current hue.
  it("picks saturation and brightness from where the square is dragged", async () => {
    const onChange = jest.fn();
    await render(<Component value="#808080" onChange={onChange} />);

    await dragTo("area", 200, 0);

    expect(onChange).toHaveBeenLastCalledWith("#FF0000");
  });

  it("picks the hue from where the bar is dragged", async () => {
    const onChange = jest.fn();
    await render(<Component value="#FF0000" onChange={onChange} />);

    // A third of the way along is 120°, green.
    await dragTo("hue", 200 / 3, 0);

    expect(onChange).toHaveBeenLastCalledWith("#00FF00");
  });

  it("turns the hue from a screen reader's increment", async () => {
    const onChange = jest.fn();
    await render(<Component value="#FF0000" onChange={onChange} />);

    await act(async () => {
      screen
        .getByTestId(testId("color-picker", "hue"))
        .props.onAccessibilityAction({
          nativeEvent: { actionName: "increment" },
        });
    });

    expect(onChange).toHaveBeenCalledWith("#FF1500");
  });

  // Hex has no hue for black, so a picker that re-read it from `value`
  // would snap the bar back to red once the square hit the bottom.
  it("keeps its hue through black", async () => {
    const seen: string[] = [];
    function Harness() {
      const [value, setValue] = useState("#0000FF");
      return (
        <Component
          value={value}
          onChange={(next) => {
            seen.push(next);
            setValue(next);
          }}
        />
      );
    }
    await render(<Harness />);

    await dragTo("area", 200, 100);
    expect(seen.at(-1)).toBe("#000000");

    await dragTo("area", 200, 0);
    expect(seen.at(-1)).toBe("#0000FF");
  });

  it("adopts a value changed from outside", async () => {
    const { rerender } = await render(
      <Component value="#FF0000" onChange={jest.fn()} />,
    );

    await rerender(<Component value="#00a86b" onChange={jest.fn()} />);

    expect(screen.getByText("#00A86B")).toBeTruthy();
  });

  it("ignores drags while disabled", async () => {
    const onChange = jest.fn();
    await render(<Component value="#808080" onChange={onChange} disabled />);

    await dragTo("area", 200, 0);

    expect(onChange).not.toHaveBeenCalled();
  });
});
