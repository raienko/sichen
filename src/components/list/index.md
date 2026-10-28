[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Lists

# List

> A virtualised list (Legend List) that recycles rows instead of mounting one view each.

<sub>`src/components/list` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import List from "@/components/list";

// default: each entry renders as a ListItem
<List
  data={people.map((person) => ({
    key: person.id,
    title: person.name,
    subtitle: person.email,
    onPress: () => open(person.id),
  }))}
/>

// or bring your own renderer
<List
  data={photos}
  keyExtractor={(photo) => photo.id}
  renderItem={({ item }) => <Image source={item.url} alt={item.caption} />}
/>
```

A virtualized list wrapping [Legend List](https://legendapp.com/open-source/list/) — a drop-in `FlatList` replacement that recycles item containers rather than mounting one view per row. Everything is Legend List's own API passed straight through (`ListHeaderComponent`, `ItemSeparatorComponent`, `ListEmptyComponent`, `onEndReached`, `numColumns`, `horizontal`, the viewability callbacks). The wrapper adds two things.

- **A default renderer.** Give it `data` of `ListItemData` — `ListItem`'s own props plus a `key` — and each entry renders as a `ListItem`, which is what most lists here are. Pass `renderItem` and it steps out of the way entirely: the item type is then inferred from `data` and stops asking for `ListItem`'s shape. Expressed as a union, so omitting `renderItem` with data that isn't `ListItemData` is a `tsc` error rather than a blank list.
- **Defaults it can actually know.** `keyExtractor` reads each row's `key`, and `estimatedItemSize` is `ListItem`'s own row height — a genuine first-render hint rather than a guess, which Legend List replaces with measured averages as soon as anything renders. Both are supplied _only_ for default rows: an item with its own renderer has a shape this knows nothing about, so guessing would be worse than Legend List's own fallbacks. Both are overridable.
- **The `key` never reaches the row.** React treats a spread `key` as the element's own key and warns about it — which the Showcase surfaced the first time this rendered. It's destructured out and used through `keyExtractor`, the only place it means anything. A required `key` rather than an index is the point of a recycling list: reorder or remove a row and an index key reuses the wrong content in the wrong container.
- **Composing rows needs the array annotated.** `ListItemData` is a union (text-or-children, pressable-or-not), so spreading over rows afterwards widens the array into a union of shapes that no longer matches the default branch, and the list starts asking for a `renderItem`. Build each row in one place, or annotate the array `ListItemData[]`.
- **Jest can't drive it.** Legend List renders no rows without a measured container, which under Jest is every time. The tests replace it with a stub and assert what the wrapper _hands over_ — the default renderer, the default key and size hint, and everything else untouched — with the virtualization left to Legend List's own suite. Verified in the browser instead: 200 rows, 11 mounted, still 11 after scrolling, and pressing a row reports it.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
