import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("calls onChange with the typed text", async () => {
    const onChange = jest.fn();
    await render(<Component value="" onChange={onChange} placeholder="Type" />);

    await fireEvent.changeText(screen.getByPlaceholderText("Type"), "hello");

    expect(onChange).toHaveBeenCalledWith("hello");
  });
});
