import { createRef } from "react";
import { Text as RNText, type TextInput } from "react-native";

import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

/** The masked field, which has no display value to query by. */
const field = () => screen.getByLabelText("Password");
const toggle = (name: "Show password" | "Hide password") =>
  screen.getByRole("button", { name });

describe(`${Component.displayName} smoke test`, () => {
  it("calls onChange with the typed text", async () => {
    const onChange = jest.fn();
    await render(<Component label="Password" value="" onChange={onChange} />);

    await fireEvent.changeText(field(), "hunter2");

    expect(onChange).toHaveBeenCalledWith("hunter2");
  });

  it("masks the value until the toggle is pressed", async () => {
    await render(
      <Component label="Password" value="hunter2" onChange={() => {}} />,
    );

    expect(field().props.secureTextEntry).toBe(true);

    await fireEvent.press(toggle("Show password"));

    await waitFor(() => {
      expect(field().props.secureTextEntry).toBe(false);
    });
  });

  it("masks it again on a second press", async () => {
    await render(
      <Component label="Password" value="hunter2" onChange={() => {}} />,
    );

    await fireEvent.press(toggle("Show password"));
    await waitFor(() => {
      expect(toggle("Hide password")).toBeTruthy();
    });

    await fireEvent.press(toggle("Hide password"));

    await waitFor(() => {
      expect(field().props.secureTextEntry).toBe(true);
    });
  });

  // The label names the action rather than the state, so it stays a correct
  // instruction whichever way round the field currently is.
  it("names the action the toggle will perform", async () => {
    await render(<Component label="Password" value="" onChange={() => {}} />);

    expect(toggle("Show password")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hide password" })).toBeNull();
  });

  /**
   * Without this a password manager has nothing to recognise, and the
   * new-vs-current distinction decides whether it offers the saved password
   * or a freshly generated one.
   */
  it("tells a password manager which kind of password this is", async () => {
    const signIn = await render(
      <Component label="Password" value="" onChange={() => {}} />,
    );
    expect(signIn.getByLabelText("Password").props.autoComplete).toBe(
      "current-password",
    );

    const signUp = await render(
      <Component label="Password" value="" onChange={() => {}} newPassword />,
    );
    expect(signUp.getByLabelText("Password").props.autoComplete).toBe(
      "new-password",
    );
  });

  it("does not toggle while disabled", async () => {
    await render(
      <Component
        label="Password"
        value="hunter2"
        onChange={() => {}}
        disabled
      />,
    );

    await fireEvent.press(toggle("Show password"));

    expect(field().props.secureTextEntry).toBe(true);
  });

  // The eye is the default, not a fixture: a caller with something else to
  // put there keeps the slot, the same way every other variation works.
  it("lets a caller replace the slot", async () => {
    await render(
      <Component
        label="Password"
        value=""
        onChange={() => {}}
        rightSlot={<RNText>mine</RNText>}
      />,
    );

    expect(screen.getByText("mine")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show password" })).toBeNull();
  });

  it("forwards its ref to the underlying text field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component ref={ref} label="Password" value="" onChange={() => {}} />,
    );

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    expect(() => ref.current?.focus()).not.toThrow();
  });
});
