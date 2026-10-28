import { render, renderHook, screen } from "@/root/testing";
import { deepLinks } from "@/features/deep-links";
import { useResponsive } from "@/features/responsive";
import { LocalValue } from "@/features/storage";

import Component from "./index";
import useMarkdownStyle from "./style";

/**
 * The package ships a Jest mock (wired up globally in `jest.setup.js`, since
 * the real component is a native view), but it deliberately drops
 * `markdownStyle`, `accessibilityLabels` and `onLinkPress` — it renders the
 * source as plain text and nothing else. Those three are precisely what
 * this wrapper exists to supply, so this file swaps in a stub that records
 * everything it was handed.
 */
const mockReceived: Record<string, unknown>[] = [];

jest.mock("react-native-enriched-markdown", () => ({
  EnrichedMarkdownText: (props: Record<string, unknown>) => {
    const { Text } = jest.requireActual("react-native");
    mockReceived.push(props);
    return <Text testID={props.testID as string}>{props.markdown}</Text>;
  },
}));

function lastProps() {
  return mockReceived[mockReceived.length - 1];
}

const SOURCE = "# Title\n\nSome **bold** text and a [link](/orders/12).";

describe(`${Component.name} smoke test`, () => {
  beforeEach(() => {
    mockReceived.length = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders its source", async () => {
    await render(<Component testID="markdown" markdown={SOURCE} />);

    expect(screen.getByTestId("markdown")).toBeTruthy();
    expect(lastProps().markdown).toBe(SOURCE);
  });

  // Every block is set from the app's scale and theme rather than the
  // library's defaults — see the style tests below for what that produces.
  it("hands the library the app's own styling", async () => {
    await render(<Component testID="markdown" markdown={SOURCE} />);

    expect(lastProps().markdownStyle).toBeTruthy();
  });

  describe("links", () => {
    // So `/orders/12` inside a document opens the same screen a push
    // notification would, and an external URL still goes to the browser.
    it("hands a tapped link to the deep-link pipeline by default", async () => {
      const open = jest.spyOn(deepLinks, "open").mockResolvedValue();
      await render(<Component testID="markdown" markdown={SOURCE} />);

      (lastProps().onLinkPress as (event: unknown) => void)({
        url: "/orders/12",
        text: "link",
      });

      expect(open).toHaveBeenCalledWith("/orders/12");
    });

    it("lets a caller take that over", async () => {
      const open = jest.spyOn(deepLinks, "open").mockResolvedValue();
      const onLinkPress = jest.fn();
      await render(
        <Component
          testID="markdown"
          markdown={SOURCE}
          onLinkPress={onLinkPress}
        />,
      );

      (lastProps().onLinkPress as (event: unknown) => void)({
        url: "/orders/12",
        text: "link",
      });

      expect(onLinkPress).toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe("accessibility labels", () => {
    // The library ships these in English only, which in a ten-locale app
    // is a defect you can't see.
    it("supplies the app's own translations", async () => {
      await render(<Component testID="markdown" markdown={SOURCE} />);
      const accessibilityLabels = lastProps().accessibilityLabels as Record<
        string,
        Record<string, string>
      >;

      expect(accessibilityLabels.list.bulletPoint).toBe("Bullet point");
      expect(accessibilityLabels.blockquote.quote).toBe("Blockquote");
      expect(accessibilityLabels.rotor.headings).toBe("Headings");
    });

    // Native substitutes these when it speaks, so a translation that drops
    // or renames one silently loses the number.
    it("leaves the library's placeholders intact", async () => {
      await render(<Component testID="markdown" markdown={SOURCE} />);
      const accessibilityLabels = lastProps().accessibilityLabels as Record<
        string,
        Record<string, string>
      >;

      expect(accessibilityLabels.list.orderedItem).toContain("{n}");
      expect(accessibilityLabels.table.row).toContain("{n}");
      expect(accessibilityLabels.table.row).toContain("{content}");
      expect(accessibilityLabels.math.equation).toContain("{latex}");
    });

    // Native is where they're spoken, so they have to survive here — the
    // web build is the one that drops them.
    it("keeps a caller's native-only props", async () => {
      await render(
        <Component
          testID="markdown"
          markdown={SOURCE}
          allowFontScaling={false}
        />,
      );

      expect(lastProps().allowFontScaling).toBe(false);
    });

    it("translates with the locale", async () => {
      new LocalValue("locale-preference").setValue("de");
      await render(<Component testID="markdown" markdown={SOURCE} />);

      const labels = lastProps().accessibilityLabels as Record<
        string,
        Record<string, string>
      >;
      expect(labels.list.bulletPoint).toBe("Aufzählungszeichen");
      new LocalValue("locale-preference").reset();
    });
  });
});

describe("useMarkdownStyle", () => {
  // Otherwise a paragraph of markdown is a different size and colour from
  // the Text beside it.
  it("sets every block in a step of the app's own type scale", async () => {
    const responsive = await renderHook(() => useResponsive());
    const { result } = await renderHook(() => useMarkdownStyle());
    const { typography } = responsive.result.current;

    expect(result.current.paragraph?.fontSize).toBe(typography.body.fontSize);
    expect(result.current.h1?.fontSize).toBe(typography.largeTitle.fontSize);
    expect(result.current.h2?.fontSize).toBe(typography.title1.fontSize);
    expect(result.current.codeBlock?.fontSize).toBe(
      typography.footnote.fontSize,
    );
  });

  // The scale only goes four titles deep; inventing two more sizes to fill
  // the gap would put values in the app that nothing else uses.
  it("falls h5 and h6 back to the last step above body", async () => {
    const responsive = await renderHook(() => useResponsive());
    const { result } = await renderHook(() => useMarkdownStyle());

    for (const level of ["h5", "h6"] as const) {
      expect(result.current[level]?.fontSize).toBe(
        responsive.result.current.typography.headline.fontSize,
      );
    }
  });

  it("colours text and links from the theme", async () => {
    const { result } = await renderHook(() => useMarkdownStyle());

    expect(result.current.paragraph?.color).toBeTruthy();
    expect(result.current.link?.color).toBeTruthy();
    expect(result.current.link?.color).not.toBe(
      result.current.paragraph?.color,
    );
  });

  it("follows the colour scheme", async () => {
    const light = await renderHook(() => useMarkdownStyle());
    const lightText = light.result.current.paragraph?.color;

    new LocalValue("theme-preference").setValue("dark");
    const dark = await renderHook(() => useMarkdownStyle());

    expect(dark.result.current.paragraph?.color).not.toBe(lightText);
    new LocalValue("theme-preference").reset();
  });
});
