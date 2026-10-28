import type { Typography, TypographyToken } from "@/features/responsive";
import type { ThemeColors } from "@/features/theme";

/**
 * Which type-scale step each HTML heading is set in — the same mapping
 * `Text` uses to decide heading semantics, read in the other direction. A
 * markdown `#` rendered inside a `WebView` therefore comes out the size a
 * `<Text type="largeTitle">` would, and `Markdown`'s own `style.ts` makes
 * the same promise for native.
 */
const HEADING_TYPE: Record<string, TypographyToken> = {
  h1: "largeTitle",
  h2: "title1",
  h3: "title2",
  h4: "title3",
  h5: "headline",
  h6: "headline",
};

/** The type-scale steps published as custom properties for a page to use. */
const EXPOSED_TYPE: TypographyToken[] = [
  "largeTitle",
  "title1",
  "title2",
  "title3",
  "headline",
  "body",
  "callout",
  "subheadline",
  "footnote",
  "caption1",
  "caption2",
];

/** `largeTitle` -> `large-title`, so a CSS name reads like CSS. */
function kebab(token: string): string {
  return token.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * A CSS value can end a declaration or a block, so anything coming from a
 * palette or a font stack is stripped of the two characters that would let
 * it. Nothing in the app's own tokens contains them — this is here so a
 * rebrand that puts something odd in `palette.json`, or an app-supplied
 * `ThemeOverrides`, can't turn a colour into a rule of its own.
 */
function safe(value: string | number): string {
  return String(value).replace(/[;{}]/g, "");
}

/**
 * The app's theme and type scale as a stylesheet, for injecting into a page
 * so it reads as part of the app rather than as a website inside one.
 *
 * Two halves, and both are useful:
 *
 * - **Custom properties** (`--app-color-text`, `--app-font-size-body`, …)
 *   for a page that wants to style itself with the app's values. This is
 *   the half a cooperating page should build against, because it says what
 *   the values *are* without deciding what the page does with them.
 * - **Base rules** for `body`, headings, links and code, so a page that
 *   does nothing at all still comes out in the app's typography and
 *   palette, in the right scheme.
 *
 * Both are scoped to what the app owns and deliberately shallow — no
 * layout, no spacing, no component styling. A stylesheet that reached
 * further would fight whatever the page already does, and the point is to
 * make it belong, not to redesign it.
 */
export function buildThemeCss(
  colors: ThemeColors,
  typography: Typography,
): string {
  const colorVariables = (Object.keys(colors) as (keyof ThemeColors)[])
    .map((key) => `  --app-color-${kebab(key)}: ${safe(colors[key])};`)
    .join("\n");

  const typeVariables = EXPOSED_TYPE.flatMap((token) => {
    const step = typography[token];
    const name = kebab(token);
    return [
      `  --app-font-size-${name}: ${safe(step.fontSize)}px;`,
      `  --app-line-height-${name}: ${safe(step.lineHeight)}px;`,
      `  --app-font-weight-${name}: ${safe(step.fontWeight ?? "400")};`,
      `  --app-letter-spacing-${name}: ${safe(step.letterSpacing)}px;`,
    ];
  }).join("\n");

  const headings = Object.entries(HEADING_TYPE)
    .map(([tag, token]) => {
      const name = kebab(token);
      return `${tag} {
  font-size: var(--app-font-size-${name});
  line-height: var(--app-line-height-${name});
  font-weight: var(--app-font-weight-${name});
  letter-spacing: var(--app-letter-spacing-${name});
  color: var(--app-color-text);
}`;
    })
    .join("\n\n");

  return `:root {
  --app-font-family: ${safe(typography.body.fontFamily)};
${colorVariables}
${typeVariables}
  color-scheme: ${isDark(colors) ? "dark" : "light"};
}

html {
  background-color: var(--app-color-background);
}

body {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-font-size-body);
  line-height: var(--app-line-height-body);
  letter-spacing: var(--app-letter-spacing-body);
  color: var(--app-color-text);
  background-color: var(--app-color-background);
  -webkit-font-smoothing: antialiased;
}

${headings}

a {
  color: var(--app-color-primary);
}

small,
figcaption {
  font-size: var(--app-font-size-footnote);
  line-height: var(--app-line-height-footnote);
  color: var(--app-color-text-secondary);
}

hr {
  border: 0;
  border-top: 1px solid var(--app-color-border);
}

code,
pre {
  background-color: var(--app-color-background-element);
  color: var(--app-color-text);
}`;
}

/**
 * Which scheme the palette is, from the palette itself rather than from a
 * flag threaded in beside it — so `color-scheme` can't disagree with the
 * colours it sits next to. The page background being darker than the text
 * on it is what "dark" means.
 */
function isDark(colors: ThemeColors): boolean {
  return luminance(colors.background) < luminance(colors.text);
}

function luminance(color: string): number {
  const hex = color.trim().replace("#", "");
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}/i.test(expanded)) return 0;

  const [red, green, blue] = [0, 2, 4].map((offset) =>
    parseInt(expanded.slice(offset, offset + 2), 16),
  );
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}
