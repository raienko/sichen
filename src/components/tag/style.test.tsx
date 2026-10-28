import Icon from "@/components/icon";
import { useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { render, renderHook, testId } from "@/root/testing";

import Component from "./index";

/**
 * Split from ./index.test.tsx rather than appended to it: past a certain
 * number of renders in one file this harness stops resolving queries
 * against freshly rendered trees, and these were landing on the wrong side
 * of that line. Jest isolates modules, so a second file starts clean —
 * the same split Button's content tests needed.
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

describe("Tag sizing and theming", () => {
  describe("size", () => {
    // Both halves take the tag's full height, so neither target is a
    // fraction of what it looks like.
    it("gives the remove button the touch-target height by default", async () => {
      const { result } = await renderHook(() => useSizes());
      const view = await render(
        <Component testID="tag" value="Design" onClose={jest.fn()} />,
      );

      expect(styleOf(view, testId("tag", "close")).minHeight).toBe(
        result.current.sizes.elementHeightMd,
      );
    });

    it("drops to the compact height when asked", async () => {
      const { result } = await renderHook(() => useSizes());
      const view = await render(
        <Component
          testID="tag"
          value="Design"
          size="small"
          onClose={jest.fn()}
        />,
      );

      expect(styleOf(view, testId("tag", "close")).minHeight).toBe(
        result.current.sizes.elementHeightSm,
      );
    });
  });

  describe("theme", () => {
    it("paints the resting tag from the raised-surface tokens", async () => {
      const { result } = await renderHook(() => useTheme());
      const view = await render(<Component testID="tag" value="Design" />);

      expect(styleOf(view, "tag").backgroundColor).toBe(
        result.current.colors.backgroundElement,
      );
      expect(styleOf(view, "tag").borderColor).toBe(
        result.current.colors.border,
      );
    });

    it("tints a selected tag and labels it in the accent", async () => {
      const { result } = await renderHook(() => useTheme());
      const view = await render(
        <Component testID="tag" value="Unread" onPress={jest.fn()} selected />,
      );

      expect(styleOf(view, "tag").backgroundColor).toBe(
        result.current.colors.selected,
      );
      expect(styleOf(view, "tag").borderColor).toBe(
        result.current.colors.accent,
      );
      expect(
        Object.assign({}, ...flatten(view.getByText("Unread").props.style))
          .color,
      ).toBe(result.current.colors.accent);
    });

    it("dims a disabled tag", async () => {
      const view = await render(
        <Component testID="tag" value="Design" disabled />,
      );

      expect(styleOf(view, "tag").opacity).toBe(0.5);
    });

    // Same contract Button's content has: the surface knows its foreground,
    // so an icon child never restates it.
    it("hands its foreground down to a leading icon", async () => {
      let accent = "";
      function Reader() {
        accent = useTheme().colors.accent;
        return null;
      }

      const { toJSON } = await render(
        <>
          <Reader />
          <Component
            value="Draft"
            icon={<Icon name="edit-3" />}
            onPress={jest.fn()}
            selected
          />
        </>,
      );

      expect(JSON.stringify(toJSON())).toContain(accent);
    });
  });
});
