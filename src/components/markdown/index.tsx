import {
  EnrichedMarkdownText,
  type EnrichedMarkdownTextProps,
  type LinkPressEvent,
} from "react-native-enriched-markdown";
import type { StyleProp, ViewStyle } from "react-native";

import { deepLinks } from "@/features/deep-links";
import { useLocale } from "@/features/localization";
import { isWeb } from "@/utils";

import useMarkdownStyle from "./style";

/**
 * Props the library documents as `@platform ios, android` — its web build
 * exports a different component (`index.web.js` goes straight to the web
 * renderer, bypassing the native wrapper), and that one destructures only
 * the twelve props it understands and spreads the rest onto a `<div>`.
 * Anything from this list therefore reaches the DOM as an unrecognised
 * attribute and React warns about it, which is what `accessibilityLabels`
 * was doing on every render of this component.
 *
 * Taken from the library's own `@platform` annotations rather than guessed,
 * so it's checkable against the types when the package updates.
 */
const NATIVE_ONLY_PROPS = [
  "onCopyPress",
  "enableLinkPreview",
  "selectionHandleColor",
  "allowFontScaling",
  "maxFontSizeMultiplier",
  "flavor",
  "streamingAnimation",
  "streamingConfig",
  "spoilerOverlay",
  "contextMenuItems",
  "imageRequestHeaders",
  "selectionMenuConfig",
  "accessibilityLabels",
  "textBreakStrategy",
  "lineBreakStrategyIOS",
  "writingDirection",
] as const;

/** Drops the props above on web, and leaves everything untouched on native. */
function forPlatform<T extends Record<string, unknown>>(props: T): T {
  if (!isWeb) return props;

  const kept = { ...props };
  for (const key of NATIVE_ONLY_PROPS) delete kept[key];
  return kept;
}

type Props = Omit<
  EnrichedMarkdownTextProps,
  "markdownStyle" | "containerStyle" | "accessibilityLabels"
> & {
  /** The markdown source to render. */
  markdown: string;
  /**
   * What a tapped link does. Defaults to handing the URL to the deep-link
   * pipeline, which routes an in-app path and hands anything else to the
   * OS — so a link inside a document behaves exactly like one raised
   * anywhere else in the app.
   */
  onLinkPress?: (event: LinkPressEvent) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders markdown as native text, wrapping
 * [`react-native-enriched-markdown`](https://github.com/callstackincubator/react-native-enriched-markdown).
 *
 * Everything the library does is passed straight through — task lists,
 * tables, code fences, streaming, selection menus. This adds the three
 * things a wrapper is for.
 *
 * **It looks like the rest of the app.** Every block is set in a step of
 * the app's own type scale and coloured from the theme (see ./style.ts),
 * rather than the library's defaults — which would leave a paragraph of
 * markdown a different size and colour from the `Text` beside it. Because
 * those values come from `useResponsive()` and `useTheme()`, markdown
 * reflows with the device and with the OS text-size setting, and follows a
 * scheme change, for free.
 *
 * **Its screen-reader announcements are translated.** They're native-only
 * — dropped on web, where the library renders real HTML a screen reader
 * reads directly, and where passing them lands the prop on a `<div>`. The
 * library speaks
 * "Bullet point", "List item 2", "Row 3: …" while navigating a document,
 * and ships them in English only — which in a ten-locale app is a defect
 * you can't see. They're supplied from the app's own catalogue here, with
 * the `{n}`/`{content}`/`{latex}` placeholders left intact for native to
 * substitute at speak time.
 *
 * **A tapped link goes through the deep-link pipeline** rather than
 * straight to the OS, so `/orders/12` inside a document opens the same
 * screen a push notification would, and an external URL still opens in the
 * browser. Pass `onLinkPress` to take that over.
 *
 * @example <Markdown markdown={article.body} />
 * @example <Markdown markdown={source} selectable onLinkPress={openInSheet} />
 */
export default function Markdown({
  markdown,
  onLinkPress,
  style,
  ...props
}: Props) {
  const { t } = useLocale();
  const markdownStyle = useMarkdownStyle();

  return (
    <EnrichedMarkdownText
      {...forPlatform({
        ...props,
        markdown,
        markdownStyle,
        // Placeholders are left exactly as the library defines them:
        // native substitutes `{n}`, `{content}` and `{latex}` when it
        // speaks, so a translation that renames one silently loses the
        // number. Dropped entirely on web by `forPlatform` — see above.
        accessibilityLabels: {
          list: {
            bulletPoint: t("markdown.bulletPoint"),
            nestedBulletPoint: t("markdown.nestedBulletPoint"),
            orderedItem: t("markdown.orderedItem"),
            nestedOrderedItem: t("markdown.nestedOrderedItem"),
          },
          blockquote: {
            quote: t("markdown.quote"),
            nestedQuote: t("markdown.nestedQuote"),
          },
          table: { row: t("markdown.row") },
          math: { equation: t("markdown.equation") },
          rotor: {
            headings: t("markdown.headings"),
            links: t("markdown.links"),
            images: t("markdown.images"),
          },
        },
        onLinkPress:
          onLinkPress ??
          ((event: LinkPressEvent) => void deepLinks.open(event.url)),
        containerStyle: style as EnrichedMarkdownTextProps["containerStyle"],
      })}
    />
  );
}

export { default as useMarkdownStyle } from "./style";
export type { MarkdownStyle } from "react-native-enriched-markdown";
