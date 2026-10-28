import { Text as RNText } from "react-native";

import Text from "@/components/text";
import { fireEvent, render, screen } from "@/root/testing";

import Component, { type ListItemData } from "./index";

/**
 * Legend List is virtualized: with no measured container it renders no rows
 * at all, which under Jest is every time. So it's replaced with a stub that
 * renders what it was handed — the wrapper's whole job is *what* it hands
 * over (a default renderer, a default key, a default size hint, and
 * everything else untouched), and that's what these assert. The
 * virtualization is Legend List's own to test.
 *
 * `mock`-prefixed so Jest allows the factory to reach it: a module factory
 * is hoisted above every other binding in the file.
 */
const mockReceived: any[] = [];

jest.mock("@legendapp/list/react-native", () => ({
  LegendList: (props: any) => {
    const { View } = jest.requireActual("react-native");
    mockReceived.push(props);

    if (props.data.length === 0) {
      return <View>{props.ListEmptyComponent}</View>;
    }

    const Separator = props.ItemSeparatorComponent;

    return (
      <View>
        {props.ListHeaderComponent}
        {props.data.map((item: any, index: number) => (
          <View key={props.keyExtractor?.(item, index) ?? index}>
            {props.renderItem({ item, index })}
            {Separator && index < props.data.length - 1 ? <Separator /> : null}
          </View>
        ))}
        {props.ListFooterComponent}
      </View>
    );
  },
}));

function lastProps() {
  return mockReceived[mockReceived.length - 1];
}

const PEOPLE: ListItemData[] = [
  { key: "ada", title: "Ada Lovelace", subtitle: "ada@example.com" },
  { key: "grace", title: "Grace Hopper", subtitle: "grace@example.com" },
  { key: "alan", title: "Alan Turing", subtitle: "alan@example.com" },
];

describe(`${Component.name} smoke test`, () => {
  beforeEach(() => {
    mockReceived.length = 0;
  });

  describe("the default renderer", () => {
    it("renders each entry as a ListItem", async () => {
      await render(<Component data={PEOPLE} />);

      for (const person of PEOPLE) {
        expect(screen.getByText(person.title as string)).toBeTruthy();
      }
      expect(screen.getByText("ada@example.com")).toBeTruthy();
    });

    // Every ListItem prop reaches the row, including the ones that make it
    // a control — the list doesn't have to re-describe them.
    it("passes a row's own props through", async () => {
      const onPress = jest.fn();
      await render(
        <Component data={[{ key: "ada", title: "Ada", onPress }]} />,
      );

      await fireEvent.press(screen.getByRole("button", { name: "Ada" }));

      expect(onPress).toHaveBeenCalled();
    });

    // React treats a spread `key` as the element's own key and warns about
    // it — which the Showcase surfaced the first time this rendered. The
    // list already uses it through `keyExtractor`, the only place it means
    // anything, so the row never sees it.
    it("does not spread the row's key into the ListItem", async () => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});

      await render(<Component data={PEOPLE} />);

      expect(error).not.toHaveBeenCalledWith(
        expect.stringContaining("key"),
        expect.anything(),
      );
      expect(
        error.mock.calls
          .flat()
          .some((arg) => String(arg).includes('"key" prop')),
      ).toBe(false);
      error.mockRestore();
    });

    it("renders slots on each row", async () => {
      await render(
        <Component
          data={[
            {
              key: "ada",
              title: "Ada",
              left: <RNText>avatar</RNText>,
              right: <RNText>chevron</RNText>,
            },
          ]}
        />,
      );

      expect(screen.getByText("avatar")).toBeTruthy();
      expect(screen.getByText("chevron")).toBeTruthy();
    });
  });

  describe("a caller's own renderer", () => {
    // The item type is inferred from `data`, so it needn't look anything
    // like what ListItem takes.
    it("replaces the default entirely", async () => {
      await render(
        <Component
          data={[{ id: 1, caption: "one" }]}
          renderItem={({ item }) => <Text value={item.caption} />}
        />,
      );

      expect(screen.getByText("one")).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("the defaults it supplies", () => {
    // A recycling list is exactly where an index key goes wrong: reorder or
    // remove a row and the wrong content is reused in the wrong container.
    it("keys default rows by their own key", async () => {
      await render(<Component data={PEOPLE} />);

      expect(lastProps().keyExtractor(PEOPLE[1], 1)).toBe("grace");
    });

    // A first-render hint the wrapper can actually know, because it knows
    // it is rendering ListItems. Legend List replaces it with measured
    // averages as soon as anything has rendered.
    it("hints the row height for default rows", async () => {
      await render(<Component data={PEOPLE} />);

      expect(lastProps().estimatedItemSize).toBeGreaterThan(0);
    });

    // An item with its own renderer has a shape this knows nothing about,
    // so guessing at either would be worse than Legend List's own defaults.
    it("supplies neither for a caller's own renderer", async () => {
      await render(
        <Component
          data={[{ id: 1, caption: "one" }]}
          renderItem={({ item }) => <Text value={item.caption} />}
        />,
      );

      expect(lastProps().keyExtractor).toBeUndefined();
      expect(lastProps().estimatedItemSize).toBeUndefined();
    });

    it("lets a caller override the key", async () => {
      await render(<Component data={PEOPLE} keyExtractor={() => "fixed"} />);

      expect(lastProps().keyExtractor(PEOPLE[0], 0)).toBe("fixed");
    });

    it("lets a caller override the size hint", async () => {
      await render(<Component data={PEOPLE} estimatedItemSize={123} />);

      expect(lastProps().estimatedItemSize).toBe(123);
    });
  });

  describe("pass-through", () => {
    it("renders a header and a footer", async () => {
      await render(
        <Component
          data={PEOPLE}
          ListHeaderComponent={<Text value="People" />}
          ListFooterComponent={<Text value="3 people" />}
        />,
      );

      expect(screen.getByText("People")).toBeTruthy();
      expect(screen.getByText("3 people")).toBeTruthy();
    });

    it("renders the empty component for empty data", async () => {
      await render(
        <Component data={[]} ListEmptyComponent={<Text value="Nobody" />} />,
      );

      expect(screen.getByText("Nobody")).toBeTruthy();
    });

    it("hands every other prop to the list untouched", async () => {
      await render(
        <Component data={PEOPLE} horizontal numColumns={2} testID="list" />,
      );

      expect(lastProps().horizontal).toBe(true);
      expect(lastProps().numColumns).toBe(2);
      expect(lastProps().testID).toBe("list");
    });
  });
});
