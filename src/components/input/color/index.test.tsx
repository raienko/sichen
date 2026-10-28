import { fireEvent, render, screen, testId, waitFor } from "@/root/testing";

import Component from "./index";

/** Presses the field and waits for the sheet's picker to be up. */
async function openPicker(label = "Accent") {
  await fireEvent.press(screen.getByLabelText(label));
  await waitFor(() => {
    expect(
      screen.getByTestId(testId("color-input", "picker", "area")),
    ).toBeTruthy();
  });
}

/** Types into the sheet's hex field. */
async function typeHex(text: string) {
  await fireEvent.changeText(screen.getByLabelText("Hex"), text);
}

describe("ColorInput", () => {
  it("shows the colour as upper-case hex, with a swatch", async () => {
    await render(
      <Component label="Accent" value="#3f5bd9" onChange={jest.fn()} />,
    );

    expect(screen.getByText("#3F5BD9")).toBeTruthy();
    expect(screen.getByTestId(testId("color-input", "swatch"))).toBeTruthy();
  });

  it("shows the placeholder and no swatch while empty", async () => {
    await render(
      <Component
        label="Accent"
        value={null}
        placeholder="Pick a colour"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Pick a colour")).toBeTruthy();
    expect(screen.queryByTestId(testId("color-input", "swatch"))).toBeNull();
  });

  // A typed value only moves the draft once it's a whole colour; Done is
  // what commits it.
  it("commits a typed hex value on Done", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Accent" value="#FF0000" onChange={onChange} />,
    );
    await openPicker();

    // Half a value doesn't move anything; the whole one does.
    await typeHex("00a8");
    await typeHex("00a86b");
    await waitFor(() => {
      expect(screen.getByDisplayValue("00a86b")).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId(testId("color-input", "done")));

    expect(onChange).toHaveBeenCalledWith("#00A86B");
  });

  it("commits a preset on Done", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Accent"
        value="#FF0000"
        onChange={onChange}
        presets={["#3F5BD9"]}
      />,
    );
    await openPicker();

    await fireEvent.press(
      screen.getByTestId(testId("color-input", "picker", "preset", "#3F5BD9")),
    );
    await waitFor(() => {
      expect(screen.getByDisplayValue("#3F5BD9")).toBeTruthy();
    });
    await fireEvent.press(screen.getByTestId(testId("color-input", "done")));

    expect(onChange).toHaveBeenCalledWith("#3F5BD9");
  });

  it("leaves the value alone on Cancel", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Accent" value="#FF0000" onChange={onChange} />,
    );
    await openPicker();

    await typeHex("#00A86B");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
