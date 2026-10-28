import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("parses typed digits into a number", async () => {
    const onChange = jest.fn();
    await render(
      <Component value={null} onChange={onChange} placeholder="Age" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Age"), "42");

    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("does not commit an in-progress decimal like '1.' but keeps it on screen", async () => {
    const onChange = jest.fn();
    await render(
      <Component value={null} onChange={onChange} placeholder="Amount" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Amount"), "1.");

    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByDisplayValue("1.")).toBeTruthy();
    });
  });

  it("clamps values to min/max", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        value={null}
        onChange={onChange}
        min={0}
        max={10}
        placeholder="Clamped"
      />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Clamped"), "99");

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("strips non-numeric characters", async () => {
    const onChange = jest.fn();
    await render(
      <Component value={null} onChange={onChange} placeholder="Digits" />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText("Digits"), "12abc3");

    expect(onChange).toHaveBeenCalledWith(123);
  });

  it("uses the decimal-pad keyboard", async () => {
    await render(
      <Component value={null} onChange={() => {}} placeholder="Age" />,
    );

    expect(screen.getByPlaceholderText("Age").props.keyboardType).toBe(
      "decimal-pad",
    );
  });
});
