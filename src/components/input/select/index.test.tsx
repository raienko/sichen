import { createRef } from "react";
import type { TextInput } from "react-native";

import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

const OPTIONS = [
  { value: "uk", label: "United Kingdom" },
  { value: "ua", label: "Ukraine" },
  { value: "jp", label: "Japan" },
];

/** Presses the field and waits for the options Modal to finish presenting. */
async function openOptions(label = "Country") {
  await fireEvent.press(screen.getByLabelText(label));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Japan" })).toBeTruthy();
  });
}

describe(`${Component.displayName} smoke test`, () => {
  it("shows the placeholder until an option is picked", async () => {
    await render(
      <Component
        label="Country"
        placeholder="Pick one"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.getByText("Pick one")).toBeTruthy();
  });

  it("shows the picked option's label, not its value", async () => {
    await render(
      <Component
        label="Country"
        placeholder="Pick one"
        value="ua"
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.getByText("Ukraine")).toBeTruthy();
    expect(screen.queryByText("ua")).toBeNull();
  });

  // A value from storage can outlive the option it named; falling back to
  // the placeholder beats rendering a raw code the user never chose.
  it("falls back to the placeholder for a value no option matches", async () => {
    await render(
      <Component
        label="Country"
        placeholder="Pick one"
        value="atlantis"
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.getByText("Pick one")).toBeTruthy();
  });

  it("keeps the options hidden until the field is pressed", async () => {
    await render(
      <Component
        label="Country"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.queryByText("Japan")).toBeNull();

    await openOptions();

    expect(screen.getByText("Japan")).toBeTruthy();
  });

  it("reports the picked option's value and closes the sheet", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Country"
        value={null}
        onChange={onChange}
        options={OPTIONS}
      />,
    );

    await openOptions();
    await fireEvent.press(screen.getByRole("button", { name: "Japan" }));

    expect(onChange).toHaveBeenCalledWith("jp");
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Japan" })).toBeNull();
    });
  });

  it("marks only the picked option as selected", async () => {
    await render(
      <Component
        label="Country"
        value="ua"
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    await openOptions();

    expect(
      screen.getByRole("button", { name: "Ukraine" }).props.accessibilityState,
    ).toEqual({ selected: true });
    expect(
      screen.getByRole("button", { name: "Japan" }).props.accessibilityState,
    ).toEqual({ selected: false });
  });

  it("announces the field as a button carrying the picked option", async () => {
    await render(
      <Component
        label="Country"
        value="uk"
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    const field = screen.getByLabelText("Country");
    expect(field.props.accessibilityRole).toBe("button");
    expect(field.props.accessibilityValue).toEqual({ text: "United Kingdom" });
  });

  it("reflects the open sheet in the field's expanded state", async () => {
    await render(
      <Component
        label="Country"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(
      screen.getByLabelText("Country").props.accessibilityState.expanded,
    ).toBe(false);

    await openOptions();

    await waitFor(() => {
      expect(
        screen.getByLabelText("Country").props.accessibilityState.expanded,
      ).toBe(true);
    });
  });

  it("surfaces an error as the field's hint", async () => {
    await render(
      <Component
        label="Country"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
        error="Required"
      />,
    );

    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.getByLabelText("Country").props.accessibilityHint).toBe(
      "Required",
    );
  });

  it("does not open while disabled", async () => {
    await render(
      <Component
        label="Country"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
        disabled
      />,
    );

    await fireEvent.press(screen.getByLabelText("Country"));

    // `expanded` flips synchronously with the press, so it catches a sheet
    // that was asked to open — the Modal itself only appears a frame later,
    // which would make a queryByText assertion alone pass either way.
    expect(
      screen.getByLabelText("Country").props.accessibilityState.expanded,
    ).toBe(false);
    expect(screen.queryByText("Japan")).toBeNull();
  });

  // The field is a button, not a text field, so there's nothing to focus —
  // the ref is accepted for API parity with the other variations and stays
  // null rather than pointing at a host that can't be typed into.
  it("accepts a ref without attaching it to a text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component
        ref={ref}
        label="Country"
        value={null}
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(ref.current).toBeNull();
  });
});
