import { Text as RNText } from "react-native";

import { render } from "@/root/testing";
import { colors } from "@/features/theme/colors";

import Component from "./index";

const hidden = { includeHiddenElements: true } as const;
const URL = "https://example.com/order/12";

describe(`${Component.name} smoke test`, () => {
  it("draws a QR as one path", async () => {
    const view = await render(
      <Component testID="code" format="qr" value={URL} label="Order" />,
    );
    const json = JSON.stringify(view.toJSON());

    expect(json).toContain("RNSVGPath");
  });

  it("draws a linear barcode as bars", async () => {
    const view = await render(
      <Component
        testID="code"
        format="CODE128"
        value="PKG-4821"
        label="Package"
      />,
    );
    const json = JSON.stringify(view.toJSON());

    expect(json).toContain("RNSVGRect");
  });

  it("prints the human-readable line under a linear code", async () => {
    const view = await render(
      <Component format="CODE128" value="PKG-4821" label="Package" />,
    );

    expect(view.getByText("PKG-4821", hidden)).toBeTruthy();
  });

  it("prints the computed check digit, not the input", async () => {
    const view = await render(
      <Component format="EAN13" value="590123412345" label="Product" />,
    );

    expect(view.getByText("5901234123457", hidden)).toBeTruthy();
  });

  it("leaves the line off when asked", async () => {
    const view = await render(
      <Component
        format="CODE128"
        value="PKG-4821"
        label="Package"
        showValue={false}
      />,
    );

    expect(view.queryByText("PKG-4821", hidden)).toBeNull();
  });

  // A QR has no human-readable convention, so the prop does not apply.
  it("prints nothing under a QR", async () => {
    const view = await render(
      <Component format="qr" value="hello" label="Code" />,
    );

    expect(view.queryByText("hello", hidden)).toBeNull();
  });

  /**
   * A code is a target a camera reads, and most linear decoders will not
   * read a light-on-dark symbol. The failure is silent and happens on
   * someone else's phone.
   */
  it("stays black on white in both schemes", async () => {
    const view = await render(
      <Component testID="code" format="qr" value={URL} label="Order" />,
    );
    const style = Object.assign(
      {},
      ...[view.getByTestId("code", hidden).props.style].flat(3).filter(Boolean),
    );

    expect(style.backgroundColor).toBe(colors.light.scanSurface);
    expect(colors.light.scanSurface).toBe(colors.dark.scanSurface);
    expect(colors.light.onScanSurface).toBe(colors.dark.onScanSurface);
  });

  describe("accessibility", () => {
    // A grid of squares says nothing, and someone who cannot see it also
    // cannot point a camera at it — the string is all they get.
    it("names the code and offers its value", async () => {
      const view = await render(
        <Component
          testID="code"
          format="qr"
          value={URL}
          label="Order QR code"
        />,
      );
      const { props } = view.getByTestId("code");

      expect(props.accessibilityRole).toBe("image");
      expect(props.accessibilityLabel).toBe("Order QR code");
      expect(props.accessibilityHint).toBe(URL);
    });

    /**
     * The container is one accessibility element, which is what collapses
     * the drawing inside it — so the drawing declares nothing of its own.
     * That matters beyond tidiness: react-native-svg forwards unknown props
     * straight to the DOM `<svg>` on the web, where React rejects
     * react-native's spellings of them. Caught in the browser console, the
     * same leak `WebView` hit with `maskType`.
     */
    it("is one element, with nothing inside it declaring its own", async () => {
      const view = await render(
        <Component
          testID="code"
          format="CODE128"
          value="PKG-4821"
          label="Package"
        />,
      );

      expect(view.getByTestId("code").props.accessible).toBe(true);
      // The printed line is still there for a sighted reader; it just has
      // no accessibility props of its own to leak.
      const printed = view.getByText("PKG-4821");
      expect(printed.props.accessibilityElementsHidden).toBeUndefined();
      expect(printed.props.importantForAccessibility).toBeUndefined();
    });
  });

  /**
   * Drawing something anyway produces a code that scans as the wrong thing,
   * with nothing on screen to say so.
   */
  describe("what it will not draw", () => {
    it.each([
      ["an empty QR", "qr", ""],
      ["an empty barcode", "CODE128", ""],
      ["an EAN13 of the wrong length", "EAN13", "123"],
      ["a non-numeric EAN13", "EAN13", "abcdefghijkl"],
    ] as const)("renders the fallback for %s", async (_name, format, value) => {
      const view = await render(
        <Component
          format={format}
          value={value}
          label="Code"
          fallback={<RNText>Cannot encode</RNText>}
        />,
      );

      expect(view.getByText("Cannot encode", hidden)).toBeTruthy();
    });

    it("renders nothing at all with no fallback", async () => {
      const view = await render(
        <Component testID="code" format="EAN13" value="123" label="Code" />,
      );

      expect(view.queryByTestId("code", hidden)).toBeNull();
    });
  });
});
