import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

describe(`${Component.displayName} smoke test`, () => {
  it("calls onChange with the typed text", async () => {
    const onChange = jest.fn();
    await render(
      <Component value="" onChange={onChange} placeholder="Email" />,
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "ada@example.com",
    );

    expect(onChange).toHaveBeenCalledWith("ada@example.com");
  });

  it("uses the email-address keyboard", async () => {
    await render(
      <Component value="" onChange={() => {}} placeholder="Email" />,
    );

    expect(screen.getByPlaceholderText("Email").props.keyboardType).toBe(
      "email-address",
    );
  });

  /**
   * Unlabelled, iOS guesses that a field above a password is a login's
   * username and covers the keyboard with its Passwords bar.
   */
  it("asks for an email address, not a login", async () => {
    await render(
      <Component value="" onChange={() => {}} placeholder="Email" />,
    );

    expect(screen.getByPlaceholderText("Email").props.autoComplete).toBe(
      "email",
    );
  });
});
