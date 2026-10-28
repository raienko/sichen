import { createRef, useState } from "react";
import { StyleSheet, type TextInput } from "react-native";

import type { LocalePreference } from "@/features/localization";
import { LocalValue } from "@/features/storage";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

const storedLocale = new LocalValue<LocalePreference>("locale-preference");

afterEach(() => {
  storedLocale.reset();
});

// Fixed so the assertions don't drift with the calendar. August 2026 starts
// on a Saturday, so the six-week grid runs 26 July – 5 September: day
// numbers 6–25 appear exactly once in it, which is what makes them safe to
// query by label.
const VALUE = new Date(2026, 7, 27, 14, 30);

/**
 * Only a selected day is given a background — `today` is drawn as a ring,
 * and every other day has no fill at all (see ./picker-styles). So the
 * presence of one is what "this day is picked" looks like, both on screen
 * and here.
 */
function isSelected(label: string): boolean {
  const style = StyleSheet.flatten(screen.getByLabelText(label).props.style);
  return style?.backgroundColor !== undefined;
}

/**
 * Presses the field and waits for the picker sheet to finish presenting.
 * Waits on the picker's own testID rather than the "Done" button, so the
 * helper still works in a locale that doesn't spell it that way.
 */
async function openPicker(label = "Starts") {
  await fireEvent.press(screen.getByLabelText(label));
  await waitFor(() => {
    expect(screen.getByTestId("calendar")).toBeTruthy();
  });
}

/**
 * Presses a day and waits for the draft to carry it. React 19 flushes state
 * asynchronously, so pressing Done straight after the tap would still
 * commit the previous draft.
 */
async function pickDay(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
  await waitFor(() => {
    expect(isSelected(label)).toBe(true);
  });
}

async function done() {
  await fireEvent.press(screen.getByRole("button", { name: "Done" }));
}

function ControlledDateTimeInput({ initialValue }: { initialValue: Date }) {
  const [value, setValue] = useState(initialValue);

  return <Component label="Starts" value={value} onChange={setValue} />;
}

/**
 * The wheels carry no testID, so they're found by the one prop only they
 * have. Typed structurally rather than against a renderer's instance type,
 * which differs between @testing-library/react-native and react-test-renderer.
 */
type TreeNode = {
  type: unknown;
  props: Record<string, unknown>;
  children: (TreeNode | string)[];
};

function hostNodes(node: TreeNode, out: TreeNode[] = []) {
  if (typeof node.type === "string") out.push(node);
  node.children.forEach((child) => {
    if (typeof child !== "string") hostNodes(child, out);
  });
  return out;
}

function tree() {
  return screen.root as unknown as TreeNode;
}

function wheels() {
  return hostNodes(tree()).filter(
    (node) => node.props?.snapToOffsets !== undefined,
  );
}

/** The header's time button, which shows the draft as HH:mm. */
function draftTime(): string | undefined {
  return hostNodes(tree())
    .map((node) => node.props?.accessibilityLabel)
    .find(
      (label): label is string =>
        typeof label === "string" && /^\d{2}:\d{2}$/.test(label),
    );
}

/**
 * Settles a wheel on one of its rows. The wheels are FlatLists snapped to a
 * fixed 44pt row, so a row is picked by scrolling to its offset — which is
 * the only way in: they expose no press target.
 */
const WHEEL_ROW_HEIGHT = 44;

async function spinWheel(wheel: number, toRow: number) {
  const event = {
    nativeEvent: { contentOffset: { y: toRow * WHEEL_ROW_HEIGHT } },
  };
  await fireEvent(wheels()[wheel] as never, "scrollEndDrag", event);
}

async function openTimeView(
  start: Date,
  {
    onChange = () => {},
    min,
    max,
  }: {
    onChange?: (value: Date) => void;
    min?: Date;
    max?: Date;
  } = {},
) {
  await render(
    <Component
      label="Starts"
      value={start}
      onChange={onChange}
      min={min}
      max={max}
    />,
  );
  await fireEvent.press(screen.getByLabelText("Starts"));
  await waitFor(() => {
    expect(screen.getByTestId("calendar")).toBeTruthy();
  });
  await fireEvent.press(screen.getByLabelText(draftTime()!));
  await waitFor(() => {
    expect(screen.getByTestId("time-selector")).toBeTruthy();
  });
}

describe(`${Component.displayName} smoke test`, () => {
  it("shows the placeholder until a value is picked", async () => {
    await render(
      <Component
        label="Starts"
        placeholder="Pick a moment"
        value={null}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Pick a moment")).toBeTruthy();
  });

  it("formats the value with the date and the time by default", async () => {
    await render(
      <Component label="Starts" value={VALUE} onChange={() => {}} />,
    );

    expect(screen.getByLabelText("Starts").props.accessibilityValue).toEqual({
      text: "Aug 27, 2026 14:30",
    });
  });

  it("formats date-only and time-only modes without the other half", async () => {
    const dateOnly = await render(
      <Component label="Day" mode="date" value={VALUE} onChange={() => {}} />,
    );
    expect(dateOnly.getByLabelText("Day").props.accessibilityValue).toEqual({
      text: "Aug 27, 2026",
    });

    const timeOnly = await render(
      <Component label="At" mode="time" value={VALUE} onChange={() => {}} />,
    );
    expect(timeOnly.getByLabelText("At").props.accessibilityValue).toEqual({
      text: "14:30",
    });
  });

  it("keeps the picker closed until the field is pressed", async () => {
    await render(
      <Component label="Starts" value={VALUE} onChange={() => {}} />,
    );

    expect(screen.queryByTestId("calendar")).toBeNull();

    await openPicker();

    expect(screen.getByTestId("calendar")).toBeTruthy();
    expect(screen.getByLabelText("August")).toBeTruthy();
  });

  it("reports nothing until Done is pressed", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Starts" value={VALUE} onChange={onChange} />,
    );

    await openPicker();
    await pickDay("15");

    // The tap landed in the draft, not on the caller.
    expect(onChange).not.toHaveBeenCalled();

    await done();

    expect(onChange).toHaveBeenCalledTimes(1);
    // The day moved and the time came along with it — picking a day in
    // datetime mode must not silently reset the clock.
    expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 7, 15, 14, 30));
  });

  it("discards the draft when cancelled, and starts over on reopen", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Starts" value={VALUE} onChange={onChange} />,
    );

    await openPicker();
    await pickDay("15");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    });
    await openPicker();
    await done();

    // Reopening reset the draft to `value`, so a straight Done round-trips
    // the original rather than the abandoned edit.
    expect(onChange.mock.calls[0][0]).toEqual(VALUE);
  });

  it("drops the time in date-only mode", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Starts"
        mode="date"
        value={VALUE}
        onChange={onChange}
      />,
    );

    await openPicker();
    await pickDay("15");
    await done();

    expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 7, 15));
  });

  it("pages between months without touching the value", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Starts" value={VALUE} onChange={onChange} />,
    );

    await openPicker();
    await fireEvent.press(screen.getByTestId("btn-next"));
    await waitFor(() => {
      expect(screen.getByLabelText("September")).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId("btn-prev"));
    await waitFor(() => {
      expect(screen.getByLabelText("August")).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId("btn-prev"));
    await waitFor(() => {
      expect(screen.getByLabelText("July")).toBeTruthy();
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("refuses a day outside min/max", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Starts"
        value={new Date(2026, 7, 15, 12, 0)}
        onChange={onChange}
        min={new Date(2026, 7, 10)}
        max={new Date(2026, 7, 20)}
      />,
    );

    await openPicker();
    // 8 August is before the minimum, so the tap is a no-op...
    await fireEvent.press(screen.getByLabelText("8"));
    await waitFor(() => {
      expect(isSelected("15")).toBe(true);
    });
    expect(isSelected("8")).toBe(false);

    // ...and an in-range day still works.
    await pickDay("18");
    await done();

    expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 7, 18, 12, 0));
  });

  // The header is what switches between the day and the time view, so each
  // mode has to offer exactly the halves it owns.
  it("offers the time view only when the mode includes a time", async () => {
    const both = await render(
      <Component label="Starts" value={VALUE} onChange={() => {}} />,
    );
    await openPicker();
    expect(both.getByLabelText("14:30")).toBeTruthy();
    expect(both.getByTestId("day-selector")).toBeTruthy();

    const dateOnly = await render(
      <Component label="Day" mode="date" value={VALUE} onChange={() => {}} />,
    );
    await openPicker("Day");
    expect(dateOnly.queryByLabelText("14:30")).toBeNull();
    expect(dateOnly.getByTestId("day-selector")).toBeTruthy();
  });

  it("shows only the time wheels in time-only mode", async () => {
    await render(
      <Component label="At" mode="time" value={VALUE} onChange={() => {}} />,
    );

    await openPicker("At");

    expect(screen.getByTestId("time-selector")).toBeTruthy();
    // No calendar to come back to, so the header that would switch views is
    // hidden rather than offering a dead end.
    expect(screen.queryByTestId("day-selector")).toBeNull();
    expect(screen.queryByTestId("btn-next")).toBeNull();
  });

  it("opens on today when there is no value yet", async () => {
    const onChange = jest.fn();
    await render(<Component label="Starts" value={null} onChange={onChange} />);

    await openPicker();
    await done();

    const today = new Date();
    const reported: Date = onChange.mock.calls[0][0];
    expect(reported.getFullYear()).toBe(today.getFullYear());
    expect(reported.getMonth()).toBe(today.getMonth());
    expect(reported.getDate()).toBe(today.getDate());
  });

  /**
   * Regression: opening the time view in Arabic used to crash outright with
   * `Selected index -1 is out of bounds [0, 1]`, thrown from the picker's
   * AM/PM wheel — its options are the literal strings "AM"/"PM" but the
   * value matched against them is the locale's own day period ("م"). The
   * fix is in ./format's uses12HourClock; this is the path that broke.
   */
  it("opens the time view in a right-to-left locale without throwing", async () => {
    storedLocale.setValue("ar");
    await render(
      <Component label="Starts" value={VALUE} onChange={() => {}} />,
    );

    await openPicker();
    await fireEvent.press(screen.getByLabelText("14:30"));

    await waitFor(() => {
      expect(screen.getByTestId("time-selector")).toBeTruthy();
    });
  });

  /**
   * Regression: on a device, changing the hour sent both wheels somewhere
   * unrelated. The picker's 12-hour mode maps a picked "12" to 0 when the
   * period is PM and leaves it at 12 when it's AM — both twelve hours
   * wrong — and the resulting wrong hour flips the AM/PM wheel too, so
   * every later pick lands in the wrong half of the day.
   *
   * The fix is TWELVE_HOUR_UNSUPPORTED in ./index: 24-hour wheels
   * everywhere, where a row maps straight onto the hour it shows. Noon and
   * midnight are the rows that used to break.
   */
  describe("hour wheel", () => {
    it.each([
      ["noon", 12, "12:30"],
      ["midnight", 0, "00:30"],
      ["an ordinary hour", 9, "09:30"],
    ])("lands on %s", async (_name, row, expected) => {
      await openTimeView(new Date(2026, 7, 27, 14, 30));

      await spinWheel(0, row);

      await waitFor(() => {
        expect(draftTime()).toBe(expected);
      });
    });

    it("leaves the minutes alone", async () => {
      await openTimeView(new Date(2026, 7, 27, 14, 30));

      await spinWheel(0, 9);

      await waitFor(() => {
        expect(draftTime()).toBe("09:30");
      });
    });

    it("leaves the hour alone when the minutes change", async () => {
      await openTimeView(new Date(2026, 7, 27, 14, 30));

      await spinWheel(1, 45);

      await waitFor(() => {
        expect(draftTime()).toBe("14:45");
      });
    });

    // The AM/PM wheel is the one that crashed in Arabic and mis-mapped
    // noon; with 24-hour wheels it should not exist at all.
    it("has no period wheel to get wrong", async () => {
      await openTimeView(new Date(2026, 7, 27, 14, 30));

      expect(wheels()).toHaveLength(2);
    });

    it("ignores a mount-time minute-wheel event at offset zero", async () => {
      await openTimeView(new Date(2026, 7, 27, 17, 9));

      // Native FlatList can emit momentumScrollEnd at offset zero while it
      // is still applying initialScrollIndex. No drag preceded this event,
      // so it must not be interpreted as the user selecting minute 00.
      await fireEvent(wheels()[1] as never, "momentumScrollEnd", {
        nativeEvent: { contentOffset: { y: 0 } },
      });

      await waitFor(() => {
        expect(draftTime()).toBe("17:09");
      });
    });

    it("still allows the user to select minute zero", async () => {
      await openTimeView(new Date(2026, 7, 27, 17, 9));

      await spinWheel(1, 0);

      await waitFor(() => {
        expect(draftTime()).toBe("17:00");
      });
    });

    it("commits a wheel change when Done is pressed immediately", async () => {
      const onChange = jest.fn();
      await openTimeView(new Date(2026, 7, 27, 17, 9), { onChange });

      await spinWheel(1, 15);
      await done();

      expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 27, 17, 15));
    });

    it.each([
      ["minimum", 8, new Date(2026, 7, 27, 9, 30)],
      ["maximum", 18, new Date(2026, 7, 27, 17, 15)],
    ])("keeps the time wheels inside the %s", async (_name, row, expected) => {
      const onChange = jest.fn();
      await openTimeView(new Date(2026, 7, 27, 12), {
        onChange,
        min: new Date(2026, 7, 27, 9, 30),
        max: new Date(2026, 7, 27, 17, 15),
      });

      await spinWheel(0, row);
      await waitFor(() => {
        expect(draftTime()).toBe(
          `${expected.getHours().toString().padStart(2, "0")}:${expected
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
        );
      });
      await done();

      expect(onChange).toHaveBeenCalledWith(expected);
    });

    it("exposes the hour and minute as adjustable controls", async () => {
      await openTimeView(new Date(2026, 7, 27, 17, 9));

      const [hour, minute] = screen.getAllByRole("adjustable");
      expect(hour.props.accessibilityValue).toEqual({
        min: 0,
        max: 23,
        now: 17,
        text: "17",
      });
      expect(minute.props.accessibilityValue).toEqual({
        min: 0,
        max: 59,
        now: 9,
        text: "09",
      });

      await fireEvent(minute, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });

      await waitFor(() => {
        expect(draftTime()).toBe("17:10");
      });
    });

    it("reopens both wheels on the time that was previously confirmed", async () => {
      await render(
        <ControlledDateTimeInput initialValue={new Date(2026, 7, 27, 9, 30)} />,
      );

      await openPicker();
      await fireEvent.press(screen.getByLabelText("09:30"));
      await waitFor(() => {
        expect(screen.getByTestId("time-selector")).toBeTruthy();
      });

      await spinWheel(0, 17);
      await waitFor(() => {
        expect(draftTime()).toBe("17:30");
      });
      await spinWheel(1, 15);
      await waitFor(() => {
        expect(draftTime()).toBe("17:15");
      });
      await done();

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
      });
      await openPicker();
      await fireEvent.press(screen.getByLabelText("17:15"));

      await waitFor(() => {
        expect(screen.getByTestId("time-selector")).toBeTruthy();
        expect(draftTime()).toBe("17:15");
        expect(wheels().map((wheel) => wheel.props.initialScrollIndex)).toEqual(
          [17, 15],
        );
      });
    });
  });

  it("accepts a ref without attaching it to a text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component ref={ref} label="Starts" value={null} onChange={() => {}} />,
    );

    expect(ref.current).toBeNull();
  });
});
