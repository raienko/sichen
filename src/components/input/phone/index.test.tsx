import { createRef } from "react";
import type { TextInput } from "react-native";

import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

// Real numbers: libphonenumber rejects the 555 range as fictional, so a
// made-up one would look like a validation bug.
const US_NATIONAL = "2133734253";
const US_E164 = "+12133734253";

const field = () => screen.getByLabelText("Phone");

describe(`${Component.displayName} smoke test`, () => {
  it("groups the number as it's typed", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );

    await fireEvent.changeText(field(), US_NATIONAL);

    expect(field().props.value).toBe("(213) 373-4253");
  });

  it("reports E.164 once the number is valid", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.changeText(field(), US_NATIONAL);

    expect(onChange).toHaveBeenLastCalledWith(US_E164);
  });

  // Null is how a caller tells a half-typed number from a finished one.
  it("reports null while the number is incomplete", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.changeText(field(), "213373");

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("stops accepting digits at the country's maximum length", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.changeText(field(), `${US_NATIONAL}99`);

    expect(field()).toHaveDisplayValue("(213) 373-4253");
    expect(onChange).toHaveBeenLastCalledWith(US_E164);
  });

  it("uses the selected country's length limit", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="UA"
        value={null}
        onChange={() => {}}
      />,
    );

    await fireEvent.changeText(field(), "12312123123123123");

    expect(field()).toHaveDisplayValue("1231212312");
  });

  it("understands an international number without a country", async () => {
    const onChange = jest.fn();
    await render(<Component label="Phone" value={null} onChange={onChange} />);

    await fireEvent.changeText(field(), "+380441234567");

    expect(onChange).toHaveBeenLastCalledWith("+380441234567");
  });

  // The same digits are a different number in each country, so without one
  // there's nothing to validate a national number against.
  it("reports null for a national number when no country is given", async () => {
    const onChange = jest.fn();
    await render(<Component label="Phone" value={null} onChange={onChange} />);

    await fireEvent.changeText(field(), US_NATIONAL);

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("reads the same digits against its default country", async () => {
    const onChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="GB"
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.changeText(field(), "7911123456");

    expect(onChange).toHaveBeenLastCalledWith("+447911123456");
  });

  it("shows an incoming value already grouped", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={US_E164}
        onChange={() => {}}
      />,
    );

    expect(field().props.value).toBe("(213) 373-4253");
  });

  /**
   * Backspacing onto a character the formatter added would otherwise re-add
   * it faster than it can be deleted, leaving the caret stuck on "(213)".
   */
  it("deletes a digit when backspacing onto formatting", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );
    await fireEvent.changeText(field(), "213");
    expect(field().props.value).toBe("(213)");

    // What a backspace on "(213)" actually delivers: only the bracket went,
    // so a digit is dropped instead and the grouping relaxes with it.
    await fireEvent.changeText(field(), "(213");

    expect(field().props.value).toBe("21");
  });

  it("asks for the phone keypad and offers a saved number", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );

    expect(field().props.keyboardType).toBe("phone-pad");
    expect(field().props.autoComplete).toBe("tel");
    expect(field().props.importantForAutofill).toBe("yes");
  });

  it("shows the default country's calling code in a picker", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Country calling code" }),
    ).toHaveAccessibilityValue({ text: "United States, +1" });
    expect(screen.getByText("+1")).toBeOnTheScreen();
  });

  it("changes numbering plan through the searchable country picker", async () => {
    const onChange = jest.fn();
    const onCountryChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={onChange}
        onCountryChange={onCountryChange}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Country calling code" }),
    );
    const search = await screen.findByPlaceholderText(
      "Search country or calling code",
    );
    await fireEvent.changeText(search, "United Kingdom");
    await fireEvent.press(
      screen.getByRole("button", { name: "United Kingdom, +44" }),
    );
    await fireEvent.changeText(field(), "2079460018");

    expect(onCountryChange).toHaveBeenLastCalledWith("GB");
    expect(onChange).toHaveBeenLastCalledWith("+442079460018");
  });

  it("closes the country picker from its header", async () => {
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Country calling code" }),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search country or calling code"),
      ).toBeNull();
    });
  });

  it("detects an international country while typing", async () => {
    const onCountryChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
        onCountryChange={onCountryChange}
      />,
    );

    await fireEvent.changeText(field(), "+380441234567");

    expect(onCountryChange).toHaveBeenLastCalledWith("UA");
    expect(
      screen.getByRole("button", { name: "Country calling code" }),
    ).toHaveAccessibilityValue({ text: "Ukraine, +380" });
    expect(field()).toHaveDisplayValue("44 123 4567");
  });

  it("distinguishes countries that share the +1 calling code", async () => {
    const onCountryChange = jest.fn();
    await render(
      <Component
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
        onCountryChange={onCountryChange}
      />,
    );

    await fireEvent.changeText(field(), "+12042345678");

    expect(onCountryChange).toHaveBeenLastCalledWith("CA");
    expect(
      screen.getByRole("button", { name: "Country calling code" }),
    ).toHaveAccessibilityValue({ text: "Canada, +1" });
  });

  it("forwards its ref to the underlying field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component
        ref={ref}
        label="Phone"
        defaultCountry="US"
        value={null}
        onChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    expect(() => ref.current?.focus()).not.toThrow();
  });
});
