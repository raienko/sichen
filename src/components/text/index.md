[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Text

> All app text: the type scale, theme colour, direction and heading semantics.

<sub>`src/components/text` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Text from "@/components/text";

<Text value="Settings" type="largeTitle" />   // announced as heading level 1
<Text value="Account" type="title2" />        // heading level 3
<Text value="Signed in as Ana" />             // body
<Text value="Updated 2 min ago" type="caption1" style={{ color: theme.colors.textSecondary }} />
```

- **This is the only way to draw text.** ESLint rejects `Text` imported from `react-native` anywhere under `src/app`, `components`, `root` and `screens`, and also rejects ad-hoc `fontSize` / `fontWeight` / `lineHeight` style properties. Type comes from the HIG-named scale in `@/features/responsive`.
- **`type` also sets heading semantics.** `largeTitle`, `title1`, `title2` and `title3` announce as headings 1–4 and render as real `<h1>`–`<h4>` on web. Everything else is plain text. There is no separate `heading` prop because the type scale already is the hierarchy.
- **Takes a string `value`, not children** — or an array of spans, where a span with `onPress` is an inline link: accent-coloured and underlined (colour alone isn't enough), announced as a link, and nested in the same text so it never breaks the line. Chat uses it for URLs in messages. Rich formatting beyond links belongs in [`Markdown`](../markdown/index.md).
- **Colour and alignment** default to `text` and the reading direction (right-aligned in RTL). Override with `style`.
- **`allowFontScaling={false}`** also undoes the pre-scaled line height, so opting out of Dynamic Type doesn't leave oversized line boxes.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
