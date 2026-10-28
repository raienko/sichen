import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";
import type { SegmentedControlProps } from "./types";

const OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

async function renderControl(props: Partial<SegmentedControlProps> = {}) {
  const onChange = jest.fn();
  const view = await render(
    <Component
      label="View"
      value="day"
      onChange={onChange}
      options={OPTIONS}
      testID="segmented"
      {...props}
    />,
  );
  return { onChange, ...view };
}

function segments() {
  return screen.getAllByRole("radio");
}

describe(`${Component.name} smoke test`, () => {
  it("renders one segment per option", async () => {
    await renderControl();

    expect(segments()).toHaveLength(OPTIONS.length);
    expect(screen.getByText("Week")).toBeTruthy();
  });

  it("reports the picked option's value", async () => {
    const { onChange } = await renderControl();

    await fireEvent.press(screen.getByText("Week"));

    expect(onChange).toHaveBeenCalledWith("week");
  });

  // Reporting it would fire onChange for a value the caller already holds,
  // turning an idle tap into a state update — and, for a call site that
  // persists on change, into a write.
  it("stays quiet when the current segment is pressed again", async () => {
    const { onChange } = await renderControl({ value: "week" });

    await fireEvent.press(screen.getByText("Week"));

    expect(onChange).not.toHaveBeenCalled();
  });

  // The same degrade-don't-crash rule Select's placeholder follows, for a
  // stale value arriving out of storage.
  it("leaves everything unselected for a value matching no option", async () => {
    await renderControl({ value: "year" });

    for (const segment of segments()) {
      expect(segment.props.accessibilityState.checked).toBe(false);
    }
  });

  describe("accessibility", () => {
    // Without the group, a screen reader reads "Day, selected, radio
    // button" and never says what the choice decides.
    it("names the whole choice as a radio group", async () => {
      await renderControl();
      const { props } = screen.getByTestId("segmented");

      expect(props.accessibilityRole).toBe("radiogroup");
      expect(props.role).toBe("radiogroup");
      expect(props.accessibilityLabel).toBe("View");
    });

    // Queried through role + state rather than by reading props, so this
    // asserts what assistive technology actually resolves.
    it("announces each option as a radio, and which one is checked", async () => {
      await renderControl({ value: "week" });

      expect(
        screen.getByRole("radio", { name: "Week", checked: true }),
      ).toBeTruthy();
      expect(
        screen.getByRole("radio", { name: "Day", checked: false }),
      ).toBeTruthy();
    });

    it("marks the group and every segment disabled", async () => {
      await renderControl({ disabled: true });

      expect(screen.getByTestId("segmented").props.accessibilityState).toEqual({
        disabled: true,
      });
      for (const segment of segments()) {
        expect(segment.props.accessibilityState.disabled).toBe(true);
      }
    });
  });

  describe("disabled", () => {
    it("ignores presses while the whole control is disabled", async () => {
      const { onChange } = await renderControl({ disabled: true });

      await fireEvent.press(screen.getByText("Week"));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("ignores presses on a single disabled option", async () => {
      const { onChange } = await renderControl({
        options: [OPTIONS[0], { ...OPTIONS[1], disabled: true }],
      });

      await fireEvent.press(screen.getByText("Week"));

      expect(onChange).not.toHaveBeenCalled();
      expect(segments()[1].props.accessibilityState.disabled).toBe(true);
      // And it has to *look* unavailable — one dimmed choice among
      // available ones, not something you discover by tapping it.
      expect(
        [segments()[1].props.style].flat(2).some((s) => s?.opacity === 0.5),
      ).toBe(true);
    });
  });

  it("renders the Expo UI implementation when asked for it", async () => {
    await renderControl({ type: "expo" });

    // The native control owns its own segment semantics; what this layer
    // adds is the group's name, which it can't know. So there are no radios
    // of ours to find — just the named group around the native view.
    const group = screen.getByLabelText("View");
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
