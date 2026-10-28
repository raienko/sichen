import { StyleSheet, type TextStyle } from "react-native";

import { fireEvent, render, screen } from "@/root/testing";

import Component from "./index";

/**
 * Text composes its style from several sources (type scale, theme colour,
 * caller override), so assertions flatten the result rather than reaching
 * into a particular array slot — that shape is an implementation detail.
 */
function styleOf(text: string): TextStyle {
  return StyleSheet.flatten(screen.getByText(text).props.style) as TextStyle;
}

describe(`${Component.name} smoke test`, () => {
  it("renders the given value", async () => {
    await render(<Component value="hello" />);

    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("applies a complete type-scale entry, not just a font size", async () => {
    await render(<Component value="hello" />);

    const style = styleOf("hello");
    expect(typeof style.fontSize).toBe("number");
    expect(typeof style.lineHeight).toBe("number");
    expect(typeof style.fontWeight).toBe("string");
    expect(typeof style.fontFamily).toBe("string");
  });

  it("scales fontSize and lineHeight together across types", async () => {
    await render(
      <>
        <Component value="big" type="largeTitle" />
        <Component value="small" type="caption2" />
      </>,
    );

    const big = styleOf("big");
    const small = styleOf("small");

    expect(big.fontSize!).toBeGreaterThan(small.fontSize!);
    // The regression this guards: overriding only fontSize used to leave the
    // previous type's lineHeight behind, so small text kept a tall line box.
    expect(big.lineHeight!).toBeGreaterThan(small.lineHeight!);
  });

  it("uses headline's heavier weight for headline", async () => {
    await render(
      <>
        <Component value="head" type="headline" />
        <Component value="plain" type="body" />
      </>,
    );

    expect(styleOf("head").fontWeight).toBe("600");
    expect(styleOf("plain").fontWeight).toBe("400");
  });
});

describe("Text heading semantics", () => {
  function headingPropsOf(text: string) {
    const { accessibilityRole, role, ...rest } = screen.getByText(text).props;
    return { accessibilityRole, role, level: rest["aria-level"] };
  }

  it("marks title sizes as headings, nested by size", async () => {
    await render(
      <>
        <Component value="page" type="largeTitle" />
        <Component value="section" type="title2" />
      </>,
    );

    expect(headingPropsOf("page")).toEqual({
      accessibilityRole: "header",
      role: "heading",
      level: 1,
    });
    expect(headingPropsOf("section").level).toBe(3);
  });

  it("leaves body and headline as plain text", async () => {
    await render(
      <>
        <Component value="plain" />
        <Component value="emphasis" type="headline" />
      </>,
    );

    expect(headingPropsOf("plain").accessibilityRole).toBeUndefined();
    expect(headingPropsOf("emphasis").accessibilityRole).toBeUndefined();
  });

  it("gives every title size a distinct, correctly ordered level", async () => {
    await render(
      <>
        <Component value="lt" type="largeTitle" />
        <Component value="t1" type="title1" />
        <Component value="t2" type="title2" />
        <Component value="t3" type="title3" />
      </>,
    );

    expect(
      ["lt", "t1", "t2", "t3"].map((t) => headingPropsOf(t).level),
    ).toEqual([1, 2, 3, 4]);
  });
});

describe("Text and OS font scaling", () => {
  it("keeps the scaled line height when font scaling is on (the default)", async () => {
    await render(<Component value="scaled" />);

    // Jest's RN preset reports fontScale 2, so the scaled line height is
    // visibly larger than the raw token's.
    expect(styleOf("scaled").lineHeight!).toBeGreaterThan(
      styleOf("scaled").fontSize!,
    );
  });

  it("undoes the line-height scaling when the caller opts out of font scaling", async () => {
    await render(
      <>
        <Component value="on" />
        <Component value="off" allowFontScaling={false} />
      </>,
    );

    // RN scales fontSize but not lineHeight, so typography pre-scales the
    // latter. Opting out has to undo that half too, or the glyphs stay put
    // while the line box keeps growing.
    expect(styleOf("off").lineHeight!).toBeLessThan(styleOf("on").lineHeight!);
  });

  it("renders spans with onPress as inline links", async () => {
    const onPress = jest.fn();
    await render(
      <Component
        value={[
          { text: "Read the " },
          { text: "terms", onPress },
          { text: "." },
        ]}
      />,
    );

    expect(screen.getByText("Read the terms.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link", { name: "terms" }));
    expect(onPress).toHaveBeenCalled();
  });

  // A control's label shouldn't highlight on a web double-click; content opts in.
  it("is not selectable unless asked to be", async () => {
    const { rerender } = await render(<Component value="Label" />);
    expect(screen.getByText("Label").props.selectable).toBe(false);

    await rerender(<Component value="Copy me" selectable />);
    expect(screen.getByText("Copy me").props.selectable).toBe(true);
  });
});
