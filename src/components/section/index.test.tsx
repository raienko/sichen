import { Text as RNText, View } from "react-native";

import Text from "@/components/text";
import { render } from "@/root/testing";

import Component from "./index";

const hidden = { includeHiddenElements: true } as const;

function fontSizeOf(heading: { props: { style?: unknown } }): number {
  const style = Object.assign(
    {},
    ...[heading.props.style].flat(3).filter(Boolean),
  ) as { fontSize: number };
  return style.fontSize;
}

describe(`${Component.name} smoke test`, () => {
  it("shows its title, description, footer and content", async () => {
    const view = await render(
      <Component
        title="Notifications"
        description="Choose what reaches you."
        footer="Applies to this device only."
      >
        <Text value="Content" />
      </Component>,
    );

    expect(view.getByText("Notifications")).toBeTruthy();
    expect(view.getByText("Choose what reaches you.")).toBeTruthy();
    expect(view.getByText("Applies to this device only.")).toBeTruthy();
    expect(view.getByText("Content")).toBeTruthy();
  });

  // A group that needs spacing but no heading is a real thing.
  it("renders content with no title at all", async () => {
    const view = await render(
      <Component testID="section">
        <Text value="Content" />
      </Component>,
    );

    expect(view.getByText("Content")).toBeTruthy();
    expect(view.queryByRole("heading")).toBeNull();
  });

  it("puts an action beside the title", async () => {
    const view = await render(
      <Component title="Recent orders" action={<Text value="See all" />}>
        <Text value="Order #12" />
      </Component>,
    );

    expect(view.getByText("See all")).toBeTruthy();
  });

  it("stretches to its container rather than picking a width", async () => {
    const view = await render(
      <Component testID="section">
        <View />
      </Component>,
    );
    const style = Object.assign(
      {},
      ...[view.getByTestId("section", hidden).props.style]
        .flat(3)
        .filter(Boolean),
    );

    expect(style.alignSelf).toBe("stretch");
  });

  it("merges a caller's style over its own", async () => {
    const view = await render(
      <Component testID="section" style={{ gap: 40 }}>
        <View />
      </Component>,
    );
    const style = Object.assign(
      {},
      ...[view.getByTestId("section", hidden).props.style]
        .flat(3)
        .filter(Boolean),
    );

    expect(style.gap).toBe(40);
  });

  /**
   * The outline is the point of the component, and it is invisible — only
   * ever read through a screen reader's heading rotor — so it is the part
   * most worth pinning down.
   */
  describe("heading hierarchy", () => {
    // Level 1 belongs to the screen, and `Header` already claims it.
    it("announces at level 2 by default", async () => {
      const view = await render(
        <Component title="Notifications">
          <RNText>Content</RNText>
        </Component>,
      );
      const heading = view.getByRole("heading");

      expect(heading.props.children).toBe("Notifications");
      expect(heading.props["aria-level"]).toBe(2);
    });

    it("counts nesting, so nobody passes a number", async () => {
      const view = await render(
        <Component title="Outer">
          <Component title="Middle">
            <Component title="Inner">
              <RNText>Content</RNText>
            </Component>
          </Component>
        </Component>,
      );

      expect(
        view
          .getAllByRole("heading")
          .map((h) => [h.props.children, h.props["aria-level"]]),
      ).toEqual([
        ["Outer", 2],
        ["Middle", 3],
        ["Inner", 4],
      ]);
    });

    // An untitled group is still a level of nesting for what is below it,
    // or a screen would silently flatten wherever it used one.
    it("still counts a section that has no title of its own", async () => {
      const view = await render(
        <Component title="Outer">
          <Component>
            <Component title="Inner">
              <RNText>Content</RNText>
            </Component>
          </Component>
        </Component>,
      );

      expect(
        view.getAllByRole("heading").map((h) => h.props["aria-level"]),
      ).toEqual([2, 4]);
    });

    // There is no <h7>, so it stops rather than producing a level nothing
    // can represent.
    it("stops descending at 6", async () => {
      const view = await render(
        <Component title="a" headingLevel={5}>
          <Component title="b">
            <Component title="c">
              <RNText>Content</RNText>
            </Component>
          </Component>
        </Component>,
      );

      expect(
        view.getAllByRole("heading").map((h) => h.props["aria-level"]),
      ).toEqual([5, 6, 6]);
    });

    // So a title looks like what it announces as, without anyone choosing
    // a size.
    it("sizes the title from its level", async () => {
      const view = await render(
        <Component title="Outer">
          <Component title="Inner">
            <RNText>Content</RNText>
          </Component>
        </Component>,
      );
      const [outer, inner] = view.getAllByRole("heading").map(fontSizeOf);

      expect(outer).toBeGreaterThan(inner);
    });

    it("takes a size without changing the level it announces at", async () => {
      const sized = await render(
        <Component title="Notifications" titleType="footnote">
          <RNText>Content</RNText>
        </Component>,
      );
      const custom = sized.getByRole("heading");

      const plain = await render(
        <Component title="Notifications">
          <RNText>Content</RNText>
        </Component>,
      );
      const byLevel = plain.getByRole("heading");

      // Compared against the level's own size rather than a number: every
      // size here goes through `units()`, so the absolute value depends on
      // the window the test happens to run in.
      expect(fontSizeOf(custom)).toBeLessThan(fontSizeOf(byLevel));
      // The size moved and the outline did not, which is the whole claim.
      expect(custom.props["aria-level"]).toBe(2);
    });

    it("takes an explicit level, and nests from there", async () => {
      const view = await render(
        <Component title="Page" headingLevel={1}>
          <Component title="Group">
            <RNText>Content</RNText>
          </Component>
        </Component>,
      );

      expect(
        view.getAllByRole("heading").map((h) => h.props["aria-level"]),
      ).toEqual([1, 2]);
    });
  });
});
