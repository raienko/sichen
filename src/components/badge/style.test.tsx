import { useTheme, type ThemeColors } from "@/features/theme";
import { render, renderHook } from "@/root/testing";

import Component, { type BadgeType } from "./index";

/**
 * Split from ./index.test.tsx rather than appended to it: past a certain
 * number of renders in one file this harness stops resolving queries
 * against freshly rendered trees. Jest isolates modules, so a second file
 * starts clean — the same split `Button` and `Tag` needed.
 */
type View = Awaited<ReturnType<typeof render>>;

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function styleOf(view: View, testID: string) {
  return Object.assign(
    {},
    ...flatten(
      view.getByTestId(testID, { includeHiddenElements: true }).props.style,
    ),
  ) as Record<string, unknown>;
}

/** The semantic types, each paired with the palette entry it fills from. */
const SEMANTIC: [BadgeType, keyof ThemeColors][] = [
  ["success", "success"],
  ["warning", "warning"],
  ["error", "error"],
  ["info", "info"],
];

describe("Badge theming", () => {
  it("defaults to the neutral raised surface", async () => {
    const { result } = await renderHook(() => useTheme());
    const view = await render(<Component testID="badge" value="Beta" />);

    expect(styleOf(view, "badge").backgroundColor).toBe(
      result.current.colors.backgroundElement,
    );
    expect(
      Object.assign({}, ...flatten(view.getByText("Beta").props.style)).color,
    ).toBe(result.current.colors.text);
  });

  it.each(SEMANTIC)(
    "fills a %s badge from its own token",
    async (type, token) => {
      const { result } = await renderHook(() => useTheme());
      const view = await render(
        <Component testID="badge" type={type} value="Beta" />,
      );

      expect(styleOf(view, "badge").backgroundColor).toBe(
        result.current.colors[token],
      );
    },
  );

  /**
   * The semantic colours are tuned to contrast against the *page*, so using
   * one as a fill inverts the problem: `text` on `error` is 3.25:1 in the
   * light scheme, under WCAG 1.4.3's 4.5. The page colour it was measured
   * against is the one that still contrasts — worst pair across all four
   * types and both schemes is 6.47:1.
   */
  it.each(SEMANTIC)(
    "labels a %s badge with the page colour, not the text colour",
    async (type) => {
      const { result } = await renderHook(() => useTheme());
      const view = await render(<Component type={type} value="Beta" />);

      expect(
        Object.assign({}, ...flatten(view.getByText("Beta").props.style)).color,
      ).toBe(result.current.colors.background);
    },
  );

  /**
   * A `backgroundElement` fill on a `backgroundElement` surface — a Card, an
   * open Accordion — is the same colour as what's behind it. Caught in the
   * showcase, where a neutral dot on a card was invisible.
   */
  it("gives the neutral badge an edge, so it survives a raised surface", async () => {
    const { result } = await renderHook(() => useTheme());
    const view = await render(<Component testID="badge" value="Beta" />);
    const style = styleOf(view, "badge");

    expect(style.borderColor).toBe(result.current.colors.border);
    expect(style.borderWidth).toBeGreaterThan(0);
  });

  // The semantic fills contrast with any surface on their own, and a
  // transparent border is not free: it is drawn inside the box, so it would
  // quietly shrink the dot's coloured area.
  it.each(SEMANTIC)("gives a %s badge no border at all", async (type) => {
    const view = await render(
      <Component testID="badge" type={type} value="Beta" />,
    );

    expect(styleOf(view, "badge").borderWidth).toBeUndefined();
  });

  it("paints a dot from the same palette as a text badge", async () => {
    const { result } = await renderHook(() => useTheme());
    const view = await render(
      <Component testID="badge" dot type="success" label="Online" />,
    );

    expect(styleOf(view, "badge").backgroundColor).toBe(
      result.current.colors.success,
    );
  });

  // Minimums rather than a fixed height, so a single digit comes out round
  // and text that outgrows the box under large dynamic type makes the badge
  // grow instead of clipping.
  it("reserves a square minimum so one digit is round", async () => {
    const view = await render(<Component testID="badge" count={3} />);
    const style = styleOf(view, "badge");

    expect(style.minWidth).toBe(style.minHeight);
    expect(style.height).toBeUndefined();
    expect(style.width).toBeUndefined();
  });

  // A dot has nothing to read, so it takes an exact size instead.
  it("gives the dot an exact, square size", async () => {
    const view = await render(<Component testID="badge" dot />);
    const style = styleOf(view, "badge");

    expect(style.width).toBe(style.height);
    expect(style.width).toBeGreaterThan(0);
  });
});
