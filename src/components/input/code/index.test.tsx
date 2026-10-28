import { createRef, useState } from "react";
import type { TextInput } from "react-native";

import { fireEvent, render, screen, testId, waitFor } from "@/root/testing";

import Component, { caretAfter } from "./index";

/** The one real input behind the boxes. */
const field = () => screen.getByLabelText("Code");

/**
 * What the boxes are currently drawing, in order.
 *
 * Asked for with `includeHiddenElements` because they're deliberately out of
 * the accessibility tree — the field carries the announcement — and RNTL
 * skips hidden elements by default. Reading the rendered text rather than
 * matching on it keeps an empty box a first-class result instead of a query
 * for "".
 */
function drawn(length = 6): string[] {
  return Array.from({ length }, (_, index) => {
    const cell = screen.getByTestId(testId("code", "cell", index), {
      includeHiddenElements: true,
    });
    const [text] = cell.children;
    if (text === undefined || typeof text === "string") return "";

    return text.children.filter((part) => typeof part === "string").join("");
  });
}

describe(`${Component.displayName} smoke test`, () => {
  it("draws one box per character, six by default", async () => {
    await render(<Component label="Code" value="" onChange={() => {}} />);

    expect(drawn()).toEqual(["", "", "", "", "", ""]);
  });

  it("takes the requested length", async () => {
    await render(
      <Component label="Code" value="" onChange={() => {}} length={4} />,
    );

    expect(drawn(4)).toEqual(["", "", "", ""]);
    expect(
      screen.queryByTestId(testId("code", "cell", 4), {
        includeHiddenElements: true,
      }),
    ).toBeNull();
  });

  it("spreads the value across the boxes", async () => {
    await render(<Component label="Code" value="1234" onChange={() => {}} />);

    expect(drawn()).toEqual(["1", "2", "3", "4", "", ""]);
  });

  it("reports what was typed", async () => {
    const onChange = jest.fn();
    await render(<Component label="Code" value="" onChange={onChange} />);

    await fireEvent.changeText(field(), "123");

    expect(onChange).toHaveBeenCalledWith("123");
  });

  it("never reports more than the code's length", async () => {
    const onChange = jest.fn();
    await render(
      <Component label="Code" value="" onChange={onChange} length={4} />,
    );

    await fireEvent.changeText(field(), "123456789");

    expect(onChange).toHaveBeenCalledWith("1234");
  });

  it("calls onComplete once the last character lands", async () => {
    const onComplete = jest.fn();
    await render(
      <Component
        label="Code"
        value="12345"
        onChange={() => {}}
        onComplete={onComplete}
      />,
    );

    await fireEvent.changeText(field(), "123456");

    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("does not call onComplete while the code is short", async () => {
    const onComplete = jest.fn();
    await render(
      <Component
        label="Code"
        value=""
        onChange={() => {}}
        onComplete={onComplete}
      />,
    );

    await fireEvent.changeText(field(), "12345");

    expect(onComplete).not.toHaveBeenCalled();
  });

  describe("charset", () => {
    it("keeps only digits and asks for the number pad by default", async () => {
      const onChange = jest.fn();
      await render(<Component label="Code" value="" onChange={onChange} />);

      expect(field().props.keyboardType).toBe("number-pad");

      await fireEvent.changeText(field(), "1a2-3 4");

      expect(onChange).toHaveBeenCalledWith("1234");
    });

    it("keeps letters too when alphanumeric, on the normal keyboard", async () => {
      const onChange = jest.fn();
      await render(
        <Component
          label="Code"
          value=""
          onChange={onChange}
          charset="alphanumeric"
        />,
      );

      expect(field().props.keyboardType).toBe("default");
      expect(field().props.autoCapitalize).toBe("characters");

      await fireEvent.changeText(field(), "a1-b2 c3");

      expect(onChange).toHaveBeenCalledWith("a1b2c3");
    });
  });

  /**
   * The whole reason this is one input rather than a box each: iOS fills a
   * texted code into a *single* field, so a row of six would take the entire
   * code into the first one.
   */
  describe("as one field", () => {
    it("carries the one-time-code hints", async () => {
      await render(<Component label="Code" value="" onChange={() => {}} />);

      expect(field().props.textContentType).toBe("oneTimeCode");
      expect(field().props.autoComplete).toBe("one-time-code");
      expect(field().props.maxLength).toBe(6);
    });

    // The boxes and the wrapping Pressable are both out of the accessibility
    // tree, so this is the only thing a screen reader can land on.
    it("is the only accessibility target in the row", async () => {
      await render(<Component label="Code" value="12" onChange={() => {}} />);

      expect(screen.getAllByLabelText("Code")).toHaveLength(1);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    // The invisible field covers the row and would mostly catch the tap
    // itself, but that would leave focus depending on hit-testing a
    // zero-opacity view — so the row forwards it explicitly.
    it("focuses when the row is tapped", async () => {
      const ref = createRef<TextInput>();
      await render(
        <Component ref={ref} label="Code" value="" onChange={() => {}} />,
      );
      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });
      const focus = jest.spyOn(ref.current as TextInput, "focus");

      await fireEvent.press(screen.getByTestId(testId("code", "row")));

      expect(focus).toHaveBeenCalled();
    });

    /**
     * A tap lands somewhere in the invisible field and takes the real caret
     * with it. Pinned to the end, so the box drawn as active is the one that
     * actually receives the next character.
     */
    it("pins the caret to the end while the code is short", async () => {
      await render(<Component label="Code" value="12" onChange={() => {}} />);

      expect(field().props.selection).toEqual({ start: 2, end: 2 });
    });

    describe("correcting one character", () => {
      /** A controlled field, so each edit lands in the next render. */
      function Harness({ initial }: { initial: string }) {
        const [code, setCode] = useState(initial);
        return <Component label="Code" value={code} onChange={setCode} />;
      }

      const box = (index: number) =>
        screen.getByTestId(testId("code", "cell", index), {
          includeHiddenElements: true,
        });

      it("selects a filled box when it's tapped", async () => {
        await render(<Harness initial="123456" />);

        await fireEvent.press(box(2));

        expect(field().props.selection).toEqual({ start: 2, end: 3 });
      });

      it("replaces that character and moves to the next", async () => {
        await render(<Harness initial="123456" />);

        await fireEvent.press(box(2));
        await fireEvent.changeText(field(), "129456");

        expect(drawn()).toEqual(["1", "2", "9", "4", "5", "6"]);
        expect(field().props.selection).toEqual({ start: 3, end: 4 });
      });

      it("removes that character on backspace, keeping the rest", async () => {
        await render(<Harness initial="123456" />);

        await fireEvent.press(box(2));
        await fireEvent.changeText(field(), "12456");

        expect(drawn()).toEqual(["1", "2", "4", "5", "6", ""]);
        expect(field().props.selection).toEqual({ start: 2, end: 3 });
      });

      it("goes to the end from an empty box", async () => {
        await render(<Harness initial="12" />);

        await fireEvent.press(box(4));

        expect(field().props.selection).toEqual({ start: 2, end: 2 });
      });

      it("focuses the field from a box", async () => {
        const ref = createRef<TextInput>();
        await render(
          <Component ref={ref} label="Code" value="12" onChange={() => {}} />,
        );
        await waitFor(() => {
          expect(ref.current).toBeTruthy();
        });
        const focus = jest.spyOn(ref.current as TextInput, "focus");

        await fireEvent.press(box(1));

        expect(focus).toHaveBeenCalled();
      });
    });

    it("releases the caret once the code is full", async () => {
      await render(
        <Component label="Code" value="123456" onChange={() => {}} />,
      );

      expect(field().props.selection).toBeUndefined();
    });
  });

  it("shows an error under the row and announces it", async () => {
    await render(
      <Component
        label="Code"
        value="123"
        onChange={() => {}}
        error="That code didn't work"
      />,
    );

    expect(screen.getByText("That code didn't work")).toBeTruthy();
    expect(field().props.accessibilityHint).toBe("That code didn't work");
  });

  it("shows helper text when there's no error", async () => {
    await render(
      <Component
        label="Code"
        value=""
        onChange={() => {}}
        helperText="We texted you a code"
      />,
    );

    expect(screen.getByText("We texted you a code")).toBeTruthy();
  });

  it("is not editable while disabled", async () => {
    await render(
      <Component label="Code" value="" onChange={() => {}} disabled />,
    );

    expect(field().props.editable).toBe(false);
  });

  // Focusing is how a caller sends the user straight to the code on arrival.
  it("forwards its ref to the field", async () => {
    const ref = createRef<TextInput>();
    await render(
      <Component ref={ref} label="Code" value="" onChange={() => {}} />,
    );

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    expect(() => ref.current?.focus()).not.toThrow();
  });
});

describe("caretAfter", () => {
  it("follows a character typed at the end", () => {
    expect(caretAfter("12", "123")).toBe(3);
  });

  it("goes to the end after a pasted or autofilled code", () => {
    expect(caretAfter("", "123456")).toBe(6);
    expect(caretAfter("111111", "123456")).toBe(6);
  });

  it("moves past a replaced character", () => {
    expect(caretAfter("123456", "129456", 2)).toBe(3);
  });

  it("stays where a character was removed", () => {
    expect(caretAfter("123456", "12456", 2)).toBe(2);
  });

  // Comparing the values alone can't say which `1` went.
  it("trusts the selected box in a run of the same character", () => {
    expect(caretAfter("1111", "111", 1)).toBe(1);
    expect(caretAfter("1111", "1211", 1)).toBe(2);
  });
});
