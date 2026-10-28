[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Divider

> A hairline between rows, form sections or columns, optionally labelled.

<sub>`src/components/divider` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Divider from "@/components/divider";

<Divider />
<Divider label="or" />
<Divider inset="x16" />              // clears the leading edge
<Divider orientation="vertical" />
```

A rule between things: between list rows, between sections of a form, between two columns.

- **An unlabelled divider is invisible to assistive technology.** It's a drawn boundary and nothing more — the grouping it suggests is already carried by the content either side — so it goes through `disabledA11yProps()` and is hidden on every platform rather than left as an empty stop a screen-reader user swipes past. Same treatment `Spacer` gets, for the same reason, and asserted from both sides in the tests.
- **A labelled one is not.** "or", "Today", "3 more" is content, so the label is announced and it's the two rules either side that become the decoration. They each take an equal half of what the label leaves, so it sits centred however long it is — measured in the browser at 160px + label + 160px in a 349px row.
- **`inset`** leaves both ends clear, as a step of the spacing scale (`SpacingToken`) or a raw px value, and follows the orientation: horizontal margins on a horizontal rule, vertical on a vertical one, so it always clears the ends rather than the sides. That's what lines a list rule up with the text instead of running under the avatars — verified live at 347px with no inset, 313px at `x16`, 263px at `x40`.
- **`label` and `orientation="vertical"` are mutually exclusive in the types**: a vertical rule has no room for text, and turning text sideways is a different component's problem.
- `List`'s `ItemSeparatorComponent` in the Showcase and stories now uses it, replacing the inline separator `View`s written before it existed.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
