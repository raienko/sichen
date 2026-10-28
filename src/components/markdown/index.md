[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Markdown

> Markdown rendered as native text in the app's type scale and palette.

<sub>`src/components/markdown` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`web.test.tsx`](web.test.tsx)</sub>

```tsx
import Markdown from "@/components/markdown";

<Markdown markdown={article.body} />
<Markdown markdown={source} selectable onLinkPress={openInSheet} />
```

Renders markdown as native text, wrapping [`react-native-enriched-markdown`](https://github.com/callstackincubator/react-native-enriched-markdown). Task lists, tables, code fences, streaming and selection menus are all the library's own API, passed straight through. The wrapper adds three things.

- **It looks like the rest of the app.** Every block is set in a step of the app's type scale and coloured from the theme (`style.ts`), rather than the library's own defaults — which would leave a paragraph of markdown a different size and colour from the `Text` beside it. `h1`–`h4` take the four title steps, the same mapping `Text` uses to decide heading semantics, so a markdown `#` and a `<Text type="largeTitle">` come out identical. `h5`/`h6` fall back to `headline`: the scale doesn't go six levels deep, and inventing two sizes to fill the gap would put values in the app that nothing else uses. Because it all comes from `useResponsive()`/`useTheme()`, markdown reflows with the device and the OS text-size setting and follows a scheme change for free — asserted in tests against the tokens themselves rather than against numbers.
- **Its screen-reader announcements are translated.** They're native-only — see the stripping note below; on web the library renders real HTML a screen reader reads directly. The library speaks "Bullet point", "List item 2", "Row 3: …" while navigating a document and ships them in English only, which in a ten-locale app is a defect you can't see. They come from the app's own catalogue, with the library's `{n}`/`{content}`/`{latex}` placeholders left intact for native to substitute at speak time — a test asserts they survive, since a translation that renames one silently loses the number.
- **A tapped link goes through the deep-link pipeline**, so `/orders/12` inside a document opens the same screen a push notification would and an external URL still opens in the browser. `onLinkPress` takes that over.
- **The style bridge disables `no-restricted-syntax` on two lines.** That rule exists to stop hand-picked type sizes; these are the opposite — read straight off the app's scale — and the numbers are unavoidable because the library takes a style shape of its own rather than an RN `TextStyle`, so a token can't just be spread in.
- **Native-only props are stripped on web.** The package ships a different component there: `index.web.js` exports the web renderer directly, bypassing the native wrapper, and that renderer destructures the twelve props it understands and spreads everything else onto a `<div>` — so a native-only prop reaches the DOM as an unrecognised attribute and React warns. `accessibilityLabels` did exactly that on every render. The wrapper drops the sixteen props the library's own types annotate `@platform ios, android`, taken from those annotations rather than guessed so the list is checkable when the package updates. Everything the web renderer does understand is left untouched, which its tests assert — stripping is for silencing a warning, not for breaking the component.
- **Jest**: the package ships its own mock (wired up in `jest.setup.js`, since the component is a native view), but it deliberately drops `markdownStyle`, `accessibilityLabels` and `onLinkPress` — exactly what this wrapper supplies — so the component's own tests swap in a stub that records what it was handed.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
