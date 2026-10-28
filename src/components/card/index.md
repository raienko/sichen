[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Card

> A raised, outlined or filled surface for grouping content.

<sub>`src/components/card` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Card from "@/components/card";

<Card>
  <Text value="Total" type="footnote" />
  <Text value="£42.00" type="title2" />
</Card>

<Card type="outlined" onPress={() => router.navigate("/orders/12")}>
  <Text value="Order #12" />
</Card>

<Card padded={false}><Image source={url} alt="Preview" /></Card>
```

A raised surface that groups related content. It owns the box and nothing else — no title, no footer, no slots; content is `children`, composed from `Text`, `Image`, `Spacer` and the rest, which is what keeps one component from growing a prop per layout anyone ever wants. `Accordion` (below) is the version that also owns a header, and stays separate for that reason.

| `type`     | fill                | border | shadow |
| ---------- | ------------------- | ------ | ------ |
| `elevated` | `backgroundElement` | no     | yes    |
| `outlined` | **none**            | yes    | no     |
| `filled`   | `backgroundElement` | no     | no     |

(Defaults to `elevated`. The table lives in code as `TYPE_CONFIG` — add a type by adding one entry there plus the literal in `CardType`.)

- **`outlined` has no fill at all, and that's the interesting one.** The other two fill with `backgroundElement`, the same token every other raised surface uses, so a card sitting on an `Accordion` or a `Modal` is literally the same colour as what's behind it — the trap `Button`'s `secondary` already documents. Filling `outlined` with `background` instead looks like the obvious fix and is the wrong one: on a dark scheme `background` is _darker_ than the raised surface, so the card reads as a well punched into the page rather than a thing resting on it. It came out as a black hole in a grey panel the first time it rendered on screen. Taking whatever is behind it and drawing only the `border` edge reads correctly on any surface in either scheme — checked in both.
- **The shadow is emitted in both spellings** (`shadow*` for iOS and web, `elevation` for Android) and is nearly invisible against a dark background whatever you do, which is why `elevated` also carries the raised _fill_ rather than leaning on the shadow alone to separate it from the page.
- **`padded={false}`** hands spacing to the content, for a card whose image or rows go edge to edge. The card clips to its edge (`overflow: hidden`) so that content stays inside its `radius.surface` corners and border.
- **`onPress` makes the whole card a single button**, named from the text inside it the way a labelled `Button` is (`label` overrides). That's the right shape for a card that navigates and the wrong one for a card with its own controls: `accessible` groups the children into one announcement, so a button nested inside a pressable card becomes unreachable. Put `onPress` on the inner control instead when the card holds more than one thing to do. Expressed as a union, so `label`/`disabled` can't be passed to a card that isn't pressable in the first place.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
