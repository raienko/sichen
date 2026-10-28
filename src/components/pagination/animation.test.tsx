import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testId,
  testIdPattern,
} from "@/root/testing";

import Component from "./index";

/**
 * Its own file for the reason the others are split: past a certain number
 * of renders in one file this harness stops resolving queries against
 * freshly rendered trees.
 */
function flat(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...[style].flat(4).filter(Boolean));
}

function layout(testID: string, x: number) {
  return fireEvent(screen.getByTestId(testID), "layout", {
    nativeEvent: { layout: { x, y: 0, width: 44, height: 44 } },
  });
}

describe("Pagination animation", () => {
  it("draws one highlight, hidden until the current page is measured", async () => {
    await render(
      <Component
        testID="pages"
        label="Results"
        value={2}
        total={5}
        onChange={jest.fn()}
      />,
    );

    const indicator = screen.getByTestId(testId("pages", "indicator"), {
      includeHiddenElements: true,
    });
    expect(flat(indicator.props.style).opacity).toBe(0);

    await layout(testId("pages", 2), 48);

    expect(
      flat(
        screen.getByTestId(testId("pages", "indicator"), {
          includeHiddenElements: true,
        }).props.style,
      ).opacity,
    ).toBe(1);
  });

  it("is decoration: hidden from assistive technology, never pressed", async () => {
    await render(
      <Component label="Results" value={1} total={3} onChange={jest.fn()} />,
    );

    const indicator = screen.getByTestId(testId("pagination", "indicator"), {
      includeHiddenElements: true,
    });
    expect(indicator.props.pointerEvents).toBe("none");
    expect(indicator.props.accessibilityElementsHidden).toBe(true);
  });

  it("clears the buttons' own selected tint, so only the highlight shows it", async () => {
    await render(
      <Component
        testID="pages"
        label="Results"
        value={3}
        total={5}
        onChange={jest.fn()}
      />,
    );

    const current = screen.getByTestId(testId("pages", 3));
    expect(current.props.accessibilityState.selected).toBe(true);
    expect(flat(current.props.style).backgroundColor).toBe("transparent");
  });

  it("has no highlight in compact mode, where there are no page buttons", async () => {
    await render(
      <Component
        label="Results"
        value={3}
        total={5}
        onChange={jest.fn()}
        compact
      />,
    );

    expect(
      screen.queryByTestId(testId("pages", "indicator"), {
        includeHiddenElements: true,
      }),
    ).toBeNull();
  });

  it("keeps the dots' press targets fixed while their shapes change", async () => {
    const { rerender } = await render(
      <Component
        testID="dots"
        variant="dots"
        label="Slides"
        value={1}
        total={3}
        onChange={jest.fn()}
      />,
    );
    const before = flat(screen.getByTestId(testId("dots", 1)).props.style);

    await act(async () => {
      await rerender(
        <Component
          testID="dots"
          variant="dots"
          label="Slides"
          value={2}
          total={3}
          onChange={jest.fn()}
        />,
      );
    });

    const after = flat(screen.getByTestId(testId("dots", 1)).props.style);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
    expect(
      screen.getAllByTestId(testIdPattern("dots", ANY, "shape"), {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3);
  });
});
