import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("calls onChange with the typed text, new lines included", async () => {
    const onChange = jest.fn();
    await render(
      <Component value="" onChange={onChange} placeholder="Notes" />,
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Notes"),
      "line one\nline two",
    );

    expect(onChange).toHaveBeenCalledWith("line one\nline two");
  });

  it("is multiline, and reads from the top", async () => {
    await render(
      <Component value="" onChange={jest.fn()} placeholder="Notes" />,
    );
    const input = screen.getByPlaceholderText("Notes");

    expect(input).toHaveProp("multiline", true);
    expect(input).toHaveProp("textAlignVertical", "top");
  });

  // Prose, unlike a name or a code: both help here.
  it("turns capitalisation and correction back on", async () => {
    await render(
      <Component value="" onChange={jest.fn()} placeholder="Notes" />,
    );
    const input = screen.getByPlaceholderText("Notes");

    expect(input).toHaveProp("autoCapitalize", "sentences");
    expect(input).toHaveProp("autoCorrect", true);
  });

  it("counts against a limit, and enforces it", async () => {
    await render(
      <Component
        value="hello"
        onChange={jest.fn()}
        placeholder="Notes"
        maxLength={200}
      />,
    );

    expect(screen.getByPlaceholderText("Notes")).toHaveProp("maxLength", 200);
    expect(screen.getByText("5/200")).toHaveProp(
      "accessibilityLabel",
      "5 of 200 characters",
    );
  });

  it("shows no count without a limit", async () => {
    await render(
      <Component value="hello" onChange={jest.fn()} placeholder="Notes" />,
    );

    expect(screen.queryByText(/\/\d+$/)).toBeNull();
  });

  it("grows between its minimum and maximum height", async () => {
    await render(
      <Component
        value=""
        onChange={jest.fn()}
        placeholder="Notes"
        minLines={2}
        maxLines={4}
      />,
    );
    const style = Object.assign(
      {},
      ...[screen.getByPlaceholderText("Notes").props.style].flat(3),
    ) as { minHeight: number; maxHeight: number };

    expect(style.maxHeight).toBe(style.minHeight * 2);
  });

  it("says the field is required as part of its name", async () => {
    await render(
      <Component value="" onChange={jest.fn()} label="Notes" required />,
    );

    expect(screen.getByLabelText("Notes, Required")).toBeTruthy();
  });
});
