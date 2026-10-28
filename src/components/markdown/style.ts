import type { MarkdownStyle } from "react-native-enriched-markdown";

import { useResponsive } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/**
 * Which step of the app's type scale each markdown block is set in.
 *
 * Mapped rather than invented: the library defaults to its own sizes, which
 * would leave a paragraph of markdown a different size from the `Text`
 * beside it. Going through the scale means markdown reflows with the
 * device and with the OS text-size setting for free, because
 * `useResponsive()` has already folded both into every token.
 *
 * `h1`–`h4` take the four title steps, which is the same mapping `Text`
 * uses to decide heading semantics — a markdown `#` and a
 * `<Text type="largeTitle">` therefore come out identical. `h5`/`h6` fall
 * back to `headline`, the last step above body weight; the scale simply
 * doesn't go six levels deep, and inventing two more sizes to fill the gap
 * would put values in the app that nothing else uses.
 */
const BLOCK_TYPOGRAPHY = {
  paragraph: "body",
  h1: "largeTitle",
  h2: "title1",
  h3: "title2",
  h4: "title3",
  h5: "headline",
  h6: "headline",
} as const;

/**
 * The whole app's look, expressed in the shape the library wants.
 *
 * A hook rather than a constant because every value it reads is reactive:
 * the colour scheme, the window width behind `units()`, and the OS
 * text-size multiplier all change under a running app, and a markdown
 * block has to follow them the way every other component does.
 */
export default function useMarkdownStyle(): MarkdownStyle {
  const theme = useTheme();
  const { typography, spacing, radius } = useResponsive();

  const block = (token: keyof typeof typography) => ({
    // The rule this disables exists to stop hand-picked type sizes, and
    // these are the opposite: they're read straight off the app's own
    // scale. The numbers are unavoidable here because the library takes a
    // style shape of its own rather than an RN `TextStyle`, so a token
    // can't simply be spread in.
    // eslint-disable-next-line no-restricted-syntax
    fontSize: typography[token].fontSize,
    // eslint-disable-next-line no-restricted-syntax
    lineHeight: typography[token].lineHeight,
    color: theme.colors.text,
  });

  return {
    paragraph: {
      ...block(BLOCK_TYPOGRAPHY.paragraph),
      marginTop: 0,
      marginBottom: spacing.x8,
    },
    h1: { ...block(BLOCK_TYPOGRAPHY.h1), marginTop: spacing.x16 },
    h2: { ...block(BLOCK_TYPOGRAPHY.h2), marginTop: spacing.x16 },
    h3: { ...block(BLOCK_TYPOGRAPHY.h3), marginTop: spacing.x12 },
    h4: { ...block(BLOCK_TYPOGRAPHY.h4), marginTop: spacing.x12 },
    h5: { ...block(BLOCK_TYPOGRAPHY.h5), marginTop: spacing.x8 },
    h6: { ...block(BLOCK_TYPOGRAPHY.h6), marginTop: spacing.x8 },

    link: {
      color: theme.colors.accent,
      underline: true,
    },
    strong: { color: theme.colors.text },
    em: { color: theme.colors.text },

    list: {
      ...block("body"),
      // The marker takes the muted colour the way a `Text` set in
      // `textSecondary` does — it's structure, not content.
      bulletColor: theme.colors.textSecondary,
      markerColor: theme.colors.textSecondary,
      itemSpacing: spacing.x4,
      marginLeft: spacing.x8,
    },

    blockquote: {
      ...block("body"),
      color: theme.colors.textSecondary,
      borderColor: theme.colors.border,
      borderWidth: spacing.x2,
      borderRadius: radius.surface,
      backgroundColor: theme.colors.backgroundElement,
      padding: spacing.x12,
      gapWidth: spacing.x8,
    },

    code: {
      // Inline code sits on a raised chip: `backgroundElement` is the same
      // token every other raised surface uses, so it reads as one.
      backgroundColor: theme.colors.backgroundElement,
      color: theme.colors.text,
    },
    codeBlock: {
      ...block("footnote"),
      backgroundColor: theme.colors.backgroundElement,
      borderColor: theme.colors.border,
      borderWidth: spacing.x1,
      borderRadius: radius.surface,
      padding: spacing.x12,
    },

    table: {
      borderColor: theme.colors.border,
      borderWidth: spacing.x1,
    },
    // The rule between sections, matched to `Divider` so a markdown `---`
    // and a `<Divider />` on the same screen are the same line.
    thematicBreak: {
      color: theme.colors.border,
      height: spacing.x1,
      marginTop: spacing.x12,
      marginBottom: spacing.x12,
    },
  };
}
