[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Tag

> A short label: static, selectable as a filter, or removable.

<sub>`src/components/tag` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`style.test.tsx`](style.test.tsx)</sub>

```tsx
import Tag from "@/components/tag";

<Tag value="Design" />                                   // static: content, not a control
<Tag value="Unread" onPress={toggle} selected={unread} /> // a filter chip
<Tag value="Ada Lovelace" onClose={() => remove(ada)} />  // removable
<Tag value="Draft" icon={<Icon name="edit-3" />} size="small" />
```

A short piece of text in a small outlined box: a keyword on an article, an applied filter, one of the recipients in a "To:" field. Three shapes out of two props — neither is static, `onPress` makes the body a control that can be `selected`, `onClose` adds the remove button — and both props together give one pill with two controls in it.

- **The remove button is its own target, never part of the body's.** A pressable body groups its children into one announcement, so a remove button _inside_ it would be unreachable to a screen reader, and the whole pill would carry two meanings on one tap — "apply this filter" and "delete it" — with no way to choose. They sit side by side instead, each with its own name; the test asserts exactly two controls and that pressing one never fires the other. Same rule `ListItem` states for a row that holds a control.
- **The remove button names what it removes** — "Remove Ada Lovelace", not "Close". A row of tags is a row of identical ✕ glyphs otherwise, and which one you're on is exactly what a screen-reader user can't see. The wording is a translation key (`tag.remove`, interpolating the value) in all ten locales, with `closeLabel` for product wording that differs.
- **`selected`, `label` and `closeLabel` are unions with the props they belong to**, so a static tag that reports itself as selected, or a `closeLabel` with no remove button to name, is a `tsc` error rather than a state nothing reads — the same construction `ListItem` uses for its inert/pressable split.
- **Both halves take the pill's full height**, so neither target is a fraction of what it looks like, and `size` defaults to `"medium"` — the 44pt touch target every other control in the app defaults to. `"small"` is the compact 32pt pill, best kept for static tags.
- **`borderRadius` is `radius.control`**, the same corner as every button and field, so a tag in a row of controls never looks like a different kit.
- **It sizes itself to its own text** (`alignSelf: "flex-start"`), unlike `Card` and `ListItem` which stretch — a tag is a word, and a row of them should read as a row. A tag longer than its container truncates rather than overflowing it: the body shrinks and the remove button never does.
- Colours come from the same tokens `Button`'s `secondary` uses — `backgroundElement` over a `border` edge — and a selected tag takes the `selected` tint with an `accent` edge and label rather than inverting into a solid block.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
