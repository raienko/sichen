import { render } from "@/root/testing";

import Component from "./index";

type View = Awaited<ReturnType<typeof render>>;

function flatten(style: unknown): Record<string, unknown>[] {
  if (Array.isArray(style)) return style.flatMap(flatten);
  if (style && typeof style === "object")
    return [style as Record<string, unknown>];
  return [];
}

function styleOf(view: View, testID: string) {
  return Object.assign(
    {},
    ...flatten(
      view.getByTestId(testID, { includeHiddenElements: true }).props.style,
    ),
  ) as Record<string, unknown>;
}

describe(`${Component.name} smoke test`, () => {
  it("shows literal text", async () => {
    const view = await render(<Component value="Beta" />);

    expect(view.getByText("Beta")).toBeTruthy();
  });

  it("sizes itself to its own content rather than stretching", async () => {
    const view = await render(<Component testID="badge" value="Beta" />);

    expect(styleOf(view, "badge").alignSelf).toBe("flex-start");
  });

  it("merges a caller's style over its own", async () => {
    const view = await render(
      <Component testID="badge" value="Beta" style={{ minWidth: 80 }} />,
    );

    expect(styleOf(view, "badge").minWidth).toBe(80);
  });

  describe("count", () => {
    it("shows the number", async () => {
      const view = await render(<Component count={3} />);

      expect(view.getByText("3")).toBeTruthy();
    });

    it("caps at 99 by default", async () => {
      const view = await render(<Component count={412} />);

      expect(view.getByText("99+")).toBeTruthy();
    });

    it("takes a caller's own cap", async () => {
      const view = await render(<Component count={1200} max={999} />);

      expect(view.getByText("999+")).toBeTruthy();
    });

    // "No unread" is not a thing to show a badge about.
    it("renders nothing at all for zero", async () => {
      const view = await render(<Component testID="badge" count={0} />);

      expect(
        view.queryByTestId("badge", { includeHiddenElements: true }),
      ).toBeNull();
    });

    it("renders nothing for a negative count either", async () => {
      const view = await render(<Component testID="badge" count={-2} />);

      expect(
        view.queryByTestId("badge", { includeHiddenElements: true }),
      ).toBeNull();
    });

    // The escape hatch for the one case that does want a visible zero.
    it("shows a literal zero passed as text", async () => {
      const view = await render(<Component value="0" />);

      expect(view.getByText("0")).toBeTruthy();
    });
  });

  describe("dot", () => {
    it("has no text", async () => {
      const view = await render(<Component testID="badge" dot />);

      expect(
        view.getByTestId("badge", { includeHiddenElements: true }),
      ).toBeTruthy();
      expect(view.queryByText("")).toBeNull();
    });

    // With nothing to announce it's decoration, and decoration shouldn't be
    // a stop a screen-reader user swipes past — the treatment `Spacer` and
    // an unlabelled `Divider` get.
    it("hides an unlabelled dot on every platform", async () => {
      const view = await render(<Component testID="badge" dot />);
      const { props } = view.getByTestId("badge", {
        includeHiddenElements: true,
      });

      expect(props.accessible).toBe(false);
      expect(props.accessibilityElementsHidden).toBe(true);
      expect(props.importantForAccessibility).toBe("no-hide-descendants");
      expect(props["aria-hidden"]).toBe(true);
    });

    // The other side of the same fact: a query that respects accessibility
    // never sees it.
    it("is not reachable as an accessibility element", async () => {
      const view = await render(<Component testID="badge" dot />);

      expect(view.queryByTestId("badge")).toBeNull();
    });

    it("announces a labelled dot", async () => {
      const view = await render(
        <Component testID="badge" dot label="Online" />,
      );
      const { props } = view.getByTestId("badge");

      expect(props.accessible).toBe(true);
      expect(props.accessibilityLabel).toBe("Online");
    });
  });

  describe("label", () => {
    // "3" is no use out of context, and the context is the position — the
    // one thing that doesn't survive being read aloud.
    it("announces what the count is of, in place of the digits", async () => {
      const view = await render(
        <Component testID="badge" count={3} label="3 unread messages" />,
      );

      expect(view.getByTestId("badge").props.accessibilityLabel).toBe(
        "3 unread messages",
      );
    });

    // An explicit label repeating the text would announce it twice.
    it("adds no label of its own when none is given", async () => {
      const view = await render(<Component testID="badge" value="Beta" />);
      const { props } = view.getByTestId("badge", {
        includeHiddenElements: true,
      });

      expect(props.accessibilityLabel).toBeUndefined();
      expect(props.accessible).toBeUndefined();
    });
  });
});
