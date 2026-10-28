[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Lists

# ListItem

> One row: leading slot, title and subtitle, trailing slot.

<sub>`src/components/list-item` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ListItem from "@/components/list-item";

<ListItem title="Ada Lovelace" subtitle="ada@example.com" left={<Avatar />} />

<ListItem
  title="Account"
  right={<Icon name="chevron-right" />}
  onPress={openAccount}
/>

// the button is the control; the row just labels it, so it stays inert
<ListItem
  title="Ada Lovelace"
  right={<IconButton label="Remove Ada Lovelace" onPress={remove}>…</IconButton>}
/>
```

One row in a list: something on the left, text in the middle, something on the right. Both slots take one element or several.

- **The middle is _not_ centred**, unlike `Header`'s. A list is read down its leading edge, and text that shifts with the width of whatever sits beside it is much harder to scan. It takes the space the slots don't need and truncates before either of them shrinks — a squashed avatar or control is unusable, while a clipped line is merely shorter. That needs `minWidth: 0` on both the middle _and_ the lines inside it: a flex item's default minimum size is its own content, so one level isn't enough (the same trap `Header` documents).
- **`onPress` makes the whole row one control**, named from its own text (`label` overrides), with `selected` and `disabled` announced. Right for a row that navigates; wrong for a row that _holds_ a control — `accessible` groups the children into one announcement, so an `IconButton` in the right slot of a pressable row becomes unreachable. Give the button the interaction and leave the row inert. Both halves are covered by tests, and verified in the browser: the rows announce as buttons with `aria-selected` tracking the pick, and the remove button inside an inert row is still reachable and still fires.
- **`Switch`, `Checkbox` and `RadioButton` don't go in a slot at all.** Each is already a full labelled row (they share `BinaryControlRow`), so nesting one puts its label beside this row's title and says everything twice — caught the first time the Showcase rendered a "Notifications" row with the word in it twice. They replace a `ListItem` rather than sitting inside one.
- **Title, subtitle and custom middle content are a union**, so a `subtitle` with no `title` to sub, or a custom element competing with a title, won't compile — the same construction `Header` uses.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
