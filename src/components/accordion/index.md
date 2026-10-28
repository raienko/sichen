[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Accordion

> A titled section that collapses and expands.

<sub>`src/components/accordion` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Accordion from "@/components/accordion";

<Accordion title="Section">
  <Text value="Only visible when expanded." />
</Accordion>;
<Accordion title="Section" defaultOpen>
  <Text value="Open by default." />
</Accordion>;
```

A titled, collapsible section — tapping the header toggles `children` between hidden and shown. The chevron on the right (via `Icon`) rotates 180° between collapsed/open with a Reanimated `withTiming`, rather than swapping between two separate icon assets, so there's only ever one glyph to keep in sync with state. `defaultOpen` (default `false`) controls the initial state. Content grows and fades in (and back out) on the same 220ms ease-out as the chevron, by animating a clip's height towards the content's measured one (`collapsible.tsx`). The animation waits for that measurement, so a heavy section doesn't pop, and the content is laid out absolutely while it runs so Yoga can't squeeze it. At rest the height is `auto` again, and collapsed content is unmounted. Reanimated's layout transitions were tried and dropped: on Android they sometimes never apply the final layout, and on the web they're drawn as a scale. Under Reduce Motion the change is instant. The Showcase wraps each demo section in one.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
