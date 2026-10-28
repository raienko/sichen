[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Badge

> A small status marker: an unread count, a label, or a dot.

<sub>`src/components/badge` · [Stories](index.stories.tsx) · Tests: [`count.test.ts`](count.test.ts), [`index.test.tsx`](index.test.tsx), [`style.test.tsx`](style.test.tsx)</sub>

```tsx
import Badge from "@/components/badge";

<Badge value="Beta" type="info" />
<Badge count={unread} label={`${unread} unread`} type="error" />
<Badge count={1200} max={999} />                 // "999+"
<Badge dot type="success" label="Online" />
```

A small status marker attached to something else: an unread count on a tab, "Beta" beside a feature's name, a dot on an avatar. Content is a union of three shapes — `value` (text), `count` (a quantity), `dot` (no content at all) — so a badge carrying both a count and a caption, which has room for neither, won't compile.

- **It doesn't position itself.** A badge is sized by its own content and nothing more; where it sits — inline after a title, pinned to the corner of an icon — belongs to whatever owns both it and the thing it marks. An `anchor` prop would put one component in charge of another's layout, the trade `Spacer` and `Divider` also decline.
- **A filled badge is labelled in `background`, not `text`.** The semantic colours are tuned to contrast against the page — dark in the light scheme, light in the dark one — so using one as a _fill_ inverts the problem, and the token that still contrasts is the page colour it was measured against. `text` on `error` is 3.25:1 in light and 2.77:1 in dark, both under WCAG 1.4.3's 4.5; `background` on the same fills is 6.47:1 and 7.59:1, and the worst pair across all four types and both schemes is 6.47:1. Asserted per type, so a new palette can't quietly regress it.
- **`neutral` carries a border and the semantic types don't**, for the reason `Button`'s `secondary` does: its fill is `backgroundElement`, so on one of the app's raised surfaces it is the same colour as what's behind it and vanishes — which is exactly what a neutral dot did the first time the showcase rendered one on a card. The border is applied only where there is one rather than as a transparent edge everywhere, because `borderWidth` is drawn inside the box and a transparent one would quietly shrink the dot's coloured area.
- **A count of zero (or less) renders nothing at all.** "No unread" is not a thing to show a badge about, so the component returns `null` rather than a badge saying "0"; a caller who really does want a visible zero passes `value="0"`. Overflow is `max` (default 99) and the `badge.overflow` translation key, so a locale is free to put the "+" somewhere other than the end.
- **Counts go through `Intl.NumberFormat` keyed on the resolved locale** (`count.ts`, pure and separately tested). A thousands separator is a comma in `en` and a full stop in `de` — verified live by switching the showcase to Deutsch and watching `1,200` become `1.200` — and a locale that asks for its own numbering system gets its own digits. Hermes' `Intl` coverage varies by platform, so the `try`/`catch` falling back to plain digits is load-bearing rather than defensive.
- **An unlabelled dot is invisible to assistive technology.** With no text it has nothing to announce, so it goes through `disabledA11yProps()` and is hidden on every platform rather than left as an anonymous stop — the treatment `Spacer` and an unlabelled `Divider` get, asserted from both sides. A dot that _does_ mean something says so through `label` and is then announced like any other badge.
- **`label` replaces the announced text rather than adding to it.** "3" is no use read aloud, because its meaning is carried entirely by where it sits; pass a label whenever the badge isn't already inside something that names it. Omitted, the badge announces its own text and adds no duplicate.
- **Minimums, not a fixed size.** `minWidth`/`minHeight` are equal, so a single digit comes out square, and text that outgrows the box under large dynamic type makes the badge grow instead of clipping. Its corners are `radius.indicator`. The dot is the exception: it takes an exact size, scaling with the device but not with the OS text size, because there is nothing to read.
- There is no `primary` type: `primary` and `info` are the same value in both schemes, so it would be a second name for a badge that already exists.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
