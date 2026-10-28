import { fireEvent, render, testId } from "@/root/testing";

import Component from "./index";

/**
 * Split from ./index.test.tsx for the reason `Badge`, `Tag`, `Avatar`,
 * `Stepper` and `Share` split theirs: past a certain number of renders in
 * one file this harness stops resolving queries against freshly rendered
 * trees. Jest isolates modules, so a second file starts clean.
 */
const hidden = { includeHiddenElements: true } as const;

describe("Pagination bounds and semantics", () => {
  describe("the arrows", () => {
    it("are disabled at the ends", async () => {
      const first = await render(
        <Component
          testID="pages"
          label="Orders"
          value={1}
          total={5}
          onChange={jest.fn()}
        />,
      );
      expect(
        first.getByTestId(testId("pages", "previous")).props.accessibilityState
          .disabled,
      ).toBe(true);
      expect(
        first.getByTestId(testId("pages", "next")).props.accessibilityState
          .disabled,
      ).toBe(false);

      const last = await render(
        <Component
          testID="pages"
          label="Orders"
          value={5}
          total={5}
          onChange={jest.fn()}
        />,
      );
      expect(
        last.getByTestId(testId("pages", "next")).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    it("are named, since a chevron says nothing on its own", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={2}
          total={5}
          onChange={jest.fn()}
        />,
      );

      expect(
        view.getByTestId(testId("pages", "previous")).props.accessibilityLabel,
      ).toBe("Previous page");
      expect(
        view.getByTestId(testId("pages", "next")).props.accessibilityLabel,
      ).toBe("Next page");
    });
  });

  describe("accessibility", () => {
    // "3" alone is no use to someone with no visible row of numbers to
    // read it among.
    it("announces each page's position, not just its number", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={1}
          total={5}
          onChange={jest.fn()}
        />,
      );

      expect(
        view.getByTestId(testId("pages", 3)).props.accessibilityLabel,
      ).toBe("Page 3 of 5");
    });

    it("marks the current page selected", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={3}
          total={5}
          onChange={jest.fn()}
        />,
      );

      expect(
        view.getByTestId(testId("pages", 3)).props.accessibilityState.selected,
      ).toBe(true);
      expect(
        view.getByTestId(testId("pages", 2)).props.accessibilityState.selected,
      ).toBe(false);
    });

    it("says what the numbers move through", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Search results"
          value={1}
          total={5}
          onChange={jest.fn()}
        />,
      );

      expect(view.getByTestId("pages", hidden).props.accessibilityLabel).toBe(
        "Search results, Pagination",
      );
    });

    // Marking the bar itself `accessible` would collapse the buttons into
    // one announcement and make them unreachable.
    it("leaves its buttons individually reachable", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={1}
          total={5}
          onChange={jest.fn()}
        />,
      );

      expect(
        view.getByTestId("pages", hidden).props.accessible,
      ).toBeUndefined();
      expect(view.getByTestId(testId("pages", 3))).toBeTruthy();
    });
  });

  describe("compact", () => {
    it("replaces the numbers with a summary", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={3}
          total={20}
          onChange={jest.fn()}
          compact
        />,
      );

      expect(view.getByText("Page 3 of 20", hidden)).toBeTruthy();
      expect(view.queryByTestId(testId("pages", 4), hidden)).toBeNull();
    });

    it("keeps the arrows", async () => {
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={3}
          total={20}
          onChange={jest.fn()}
          compact
        />,
      );

      fireEvent.press(view.getByTestId(testId("pages", "next")));
      expect(view.getByTestId(testId("pages", "previous"))).toBeTruthy();
    });
  });

  it("clamps a page outside the range rather than trusting it", async () => {
    const view = await render(
      <Component
        testID="pages"
        label="Orders"
        value={99}
        total={5}
        onChange={jest.fn()}
      />,
    );

    expect(
      view.getByTestId(testId("pages", 5)).props.accessibilityState.selected,
    ).toBe(true);
    expect(
      view.getByTestId(testId("pages", "next")).props.accessibilityState
        .disabled,
    ).toBe(true);
  });
});
