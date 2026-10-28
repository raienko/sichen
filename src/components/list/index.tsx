import { LegendList, type LegendListProps } from "@legendapp/list/react-native";

import ListItem, { type ListItemProps } from "@/components/list-item";
import { useSizes } from "@/features/responsive";

/**
 * What the default renderer needs from each row: everything `ListItem`
 * takes, plus a stable `key`.
 *
 * The key is required rather than derived from the index, because a
 * recycling list is exactly where an index key goes wrong — reorder or
 * remove a row and the wrong content is reused in the wrong container.
 * It also becomes the default `keyExtractor`, so a call site supplies it
 * once instead of twice.
 */
export type ListItemData = ListItemProps & { key: string };

type RenderItem<Item> = LegendListProps<Item>["renderItem"];

type Props<Item> = Omit<
  LegendListProps<Item>,
  "data" | "renderItem" | "children"
> &
  (
    | {
        data: readonly Item[];
        /** Replaces the default `ListItem` rendering entirely. */
        renderItem: RenderItem<Item>;
      }
    | {
        /** Each entry is rendered as a `ListItem` — see `ListItemData`. */
        data: readonly ListItemData[];
        renderItem?: never;
      }
  );

/**
 * A virtualized list, wrapping [Legend List](https://legendapp.com/open-source/list/)
 * — a drop-in `FlatList` replacement that recycles item containers rather
 * than mounting one view per row, so a long list stays at a constant number
 * of mounted views.
 *
 * Everything is Legend List's own API, passed straight through:
 * `ListHeaderComponent`, `ItemSeparatorComponent`, `ListEmptyComponent`,
 * `onEndReached`, `numColumns`, `horizontal`, the viewability callbacks.
 * This adds two things.
 *
 * **A default renderer.** Give it `data` of `ListItemData` and each entry
 * renders as a `ListItem`, which is what most lists in this app are — a
 * row with something on the left, text in the middle, something on the
 * right. Pass `renderItem` and it steps out of the way completely; the
 * types then infer the item type from `data` and stop asking for
 * `ListItem`'s shape.
 *
 * **An `estimatedItemSize` it can actually know.** Legend List uses it as a
 * first-render hint before it has measured anything, and a wrapper that
 * knows it is rendering `ListItem`s knows their height. A call site with
 * its own `renderItem` should pass its own; one using the default gets a
 * correct hint for free rather than a guess or nothing.
 *
 * @example
 * <List
 *   data={people.map((person) => ({
 *     key: person.id,
 *     title: person.name,
 *     subtitle: person.email,
 *     onPress: () => open(person.id),
 *   }))}
 * />
 * @example
 * <List data={photos} renderItem={({ item }) => <Image source={item.url} alt={item.caption} />} />
 */
export default function List<Item = ListItemData>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  ...props
}: Props<Item>) {
  const { sizes } = useSizes();

  const render = (renderItem ??
    (({ item }: { item: unknown }) => {
      // Safe by construction: `renderItem` is only optional on the branch
      // whose `data` is `ListItemData[]`, so reaching this line means the
      // items are exactly what ListItem takes. The cast is what carries
      // that across the union, which TypeScript can't narrow on its own.
      //
      // `key` is pulled out rather than spread: React treats a spread
      // `key` as the element's own key and warns about it, and the list
      // already uses it through `keyExtractor` — which is the only place
      // it means anything.
      const { key, ...row } = item as ListItemData;
      void key;
      return <ListItem {...row} />;
    })) as NonNullable<RenderItem<Item>>;

  return (
    <LegendList
      // A default only for the rows this component renders itself: an item
      // with its own `renderItem` has a shape we know nothing about, and
      // guessing a key off it would be worse than Legend List's own
      // index-based fallback.
      keyExtractor={
        keyExtractor ??
        (renderItem === undefined
          ? (item) => (item as ListItemData).key
          : undefined)
      }
      // The row's own minimum height — its real height is that plus
      // padding, and Legend List replaces the hint with measured averages
      // as soon as anything has rendered.
      estimatedItemSize={
        estimatedItemSize ??
        (renderItem === undefined ? sizes.elementHeightMd : undefined)
      }
      {...(props as LegendListProps<Item>)}
      data={data as readonly Item[]}
      renderItem={render}
    />
  );
}

export type { ListItemProps } from "@/components/list-item";
export type { LegendListRef as ListRef } from "@legendapp/list/react-native";
