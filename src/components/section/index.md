[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Section

> A titled group — settings, a fieldset, a list with a “See all” action.

<sub>`src/components/section` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Section from "@/components/section";

<Section title="Notifications" description="Choose what reaches you.">
  <Switch value={push} onChange={setPush} label="Push" />
</Section>

<Section title="Recent orders" action={<Button value="See all" size="small" onPress={openAll} />}>
  <ListItem title="Order #12" />
</Section>

<Section title="Address" footer="Used for delivery only.">
  <Input type="text" label="Street" value={street} onChange={setStreet} />
</Section>
```

A titled group of related things: a block of settings, a fieldset, a "Recent orders" list with a "See all" beside it.

- **It draws no surface.** No fill, no border, no shadow — that is `Card`'s job, and a second component owning the same box is how two of them end up disagreeing about a radius. This owns the _structure_: a heading, the copy around it, and the gaps between them. Wrap it in a `Card` when the group should also look raised, and the two compose without either knowing about the other.
- **The heading level is counted, not passed.** A `Section` announces at level 2, because level 1 belongs to the screen and `Header` already claims it; a `Section` inside a `Section` announces at 3, and so on to 6 — through a context, so nobody writes a number. That matters because a hand-written level is right when it is written and wrong the first time a screen is rearranged, and the damage is invisible: an outline is only ever read through a screen reader's heading rotor. Verified in the browser, where the showcase produces a real `h1 → h2 → h3 → h4 → h5` document outline.
- **An untitled section still counts as a level.** A group that needs the gaps but not a heading is a real thing, and if it did not provide a deeper level the outline would silently flatten wherever a screen used one.
- **Size follows the level**, so a title looks like what it announces as — `title1` at level 2 down to `headline`, where it stops, since there is nothing smaller left that is still a heading. `titleType` changes the size without touching the level, the same split `Header` makes when it sets its `<h1>` in `headline`.
- **The level is declared explicitly rather than left to `Text`'s own type-to-level mapping.** That mapping stops at `title3`, so a fifth- or sixth-level heading set in `headline` would announce as plain text and drop out of the outline entirely.
- **Text slots are strings, control slots are nodes.** `description` and `footer` are strings because owning their typography is most of what this component is for; `action` is a `ReactNode` because it is whatever control the screen already uses. Anything richer than a footnote belongs in `children`, where it is content rather than a caption.
- **`title`, `description` and `action` are a union.** A `description` with no title has nothing to qualify and an `action` with no title has nothing to act on, so an untitled section cannot carry either — the same construction `ListItem` and `Header` use.
- **It is not an accessibility group.** Marking the whole thing `accessible` would collapse everything inside into one announcement and make the controls in it unreachable — the trap `Card` and `ListItem` both document. The heading is what gives a screen reader the structure, which is the same thing it gives a sighted reader.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
