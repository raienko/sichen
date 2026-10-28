import { parseDigits } from "libphonenumber-js";

import { act, renderHook } from "@/root/testing";

import usePhoneText from "./use-phone-text";

const US_E164 = "+12133734253";

describe("usePhoneText", () => {
  it("starts from an existing value, grouped", async () => {
    const { result } = await renderHook(() =>
      usePhoneText(US_E164, () => {}, "US"),
    );

    expect(result.current.text).toBe("(213) 373-4253");
    expect(result.current.country).toBe("US");
  });

  // A reset, or another field driving this one.
  it("follows the value when it changes from outside", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string | null }) =>
        usePhoneText(value, () => {}, "US"),
      { initialProps: { value: null as string | null } },
    );
    expect(result.current.text).toBe("");

    await rerender({ value: US_E164 });

    expect(result.current.text).toBe("(213) 373-4253");
  });

  it("clears the text when the value is cleared", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string | null }) =>
        usePhoneText(value, () => {}, "US"),
      { initialProps: { value: US_E164 as string | null } },
    );

    await rerender({ value: null });

    expect(result.current.text).toBe("");
  });

  // Otherwise re-formatting would put back what the user just deleted.
  it("leaves the text alone while it still parses to the same value", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string | null }) =>
        usePhoneText(value, () => {}, "US"),
      { initialProps: { value: null as string | null } },
    );

    await act(async () => {
      result.current.onChangeText("2133734253");
    });
    await rerender({ value: US_E164 });

    expect(result.current.text).toBe("(213) 373-4253");
  });

  it("detects a country from an international number", async () => {
    const onCountryChange = jest.fn();
    const { result } = await renderHook(() =>
      usePhoneText(null, () => {}, "US", onCountryChange),
    );

    await act(() => {
      result.current.onChangeText("+380441234567");
    });

    expect(result.current.country).toBe("UA");
    expect(result.current.text).toBe("44 123 4567");
    expect(onCountryChange).toHaveBeenLastCalledWith("UA");
  });

  it("reinterprets national digits when the picker changes country", async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      usePhoneText(null, onChange, "US"),
    );

    await act(() => {
      result.current.onChangeText("2079460018");
    });
    await act(() => {
      result.current.selectCountry("GB");
    });

    expect(result.current.country).toBe("GB");
    expect(result.current.text).toBe("20 7946 0018");
    expect(onChange).toHaveBeenLastCalledWith("+442079460018");
  });

  /**
   * The picker already shows `+380`, so a trunk `0` in the field reads as
   * `+380 066…` — not a number. Typed without it, the digits are grouped as
   * they follow the calling code and never gain one; typed with it, the
   * finished number drops it. Either way the value is the same E.164.
   */
  describe("trunk prefix", () => {
    it("never adds one to digits typed without it", async () => {
      const onChange = jest.fn();
      const { result } = await renderHook(() =>
        usePhoneText(null, onChange, "UA"),
      );

      for (const digit of "665889189") {
        await act(() => {
          result.current.onChangeText(`${result.current.text}${digit}`);
        });
        expect(result.current.text.startsWith("0")).toBe(false);
      }

      expect(result.current.text).toBe("66 588 9189");
      expect(onChange).toHaveBeenLastCalledWith("+380665889189");
    });

    it("drops one that was typed once the number is complete", async () => {
      const onChange = jest.fn();
      const { result } = await renderHook(() =>
        usePhoneText(null, onChange, "UA"),
      );

      await act(() => {
        result.current.onChangeText("0665889189");
      });

      expect(result.current.text).toBe("66 588 9189");
      expect(onChange).toHaveBeenLastCalledWith("+380665889189");
    });

    it("shows a stored value without one", async () => {
      const { result } = await renderHook(() =>
        usePhoneText("+380665889189", () => {}, "UA"),
      );

      expect(result.current.text).toBe("66 588 9189");
    });

    it("keeps the value when a digit is deleted and retyped", async () => {
      const onChange = jest.fn();
      const { result } = await renderHook(() =>
        usePhoneText(null, onChange, "UA"),
      );

      await act(() => {
        result.current.onChangeText("665889189");
      });
      await act(() => {
        result.current.onChangeText(result.current.text.slice(0, -1));
      });
      expect(onChange).toHaveBeenLastCalledWith(null);

      await act(() => {
        result.current.onChangeText(`${result.current.text}9`);
      });
      expect(result.current.text).toBe("66 588 9189");
      expect(onChange).toHaveBeenLastCalledWith("+380665889189");
    });

    it("leaves a plan without one grouped the local way", async () => {
      const { result } = await renderHook(() =>
        usePhoneText(null, () => {}, "US"),
      );

      await act(() => {
        result.current.onChangeText("2133734253");
      });

      expect(result.current.text).toBe("(213) 373-4253");
    });
  });

  it("keeps international mode when deleting formatter punctuation", async () => {
    const { result } = await renderHook(() =>
      usePhoneText(null, () => {}, "US"),
    );

    await act(() => {
      result.current.onChangeText("+44 20");
    });
    await act(() => {
      result.current.onChangeText("+4420");
    });

    expect(result.current.text.startsWith("+44")).toBe(true);
  });

  it("caps unknown international input at the E.164 maximum", async () => {
    const { result } = await renderHook(() => usePhoneText(null, () => {}));

    await act(() => {
      result.current.onChangeText("+999999999999999999999999");
    });

    expect(parseDigits(result.current.text)).toHaveLength(15);
  });

  it("keeps the country limit while typing one character at a time", async () => {
    const { result } = await renderHook(() =>
      usePhoneText(null, () => {}, "UA"),
    );

    for (const digit of "12312123123123123") {
      await act(() => {
        result.current.onChangeText(`${result.current.text}${digit}`);
      });
    }

    expect(parseDigits(result.current.text)).toHaveLength(10);
  });
});
