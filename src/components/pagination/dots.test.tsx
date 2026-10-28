import { fireEvent, render, testId } from "@/root/testing";

import Component from "./index";

/**
 * Its own file for the reason the others are split: past a certain number
 * of renders in one file this harness stops resolving queries against
 * freshly rendered trees. Jest isolates modules, so a third file starts
 * clean.
 */
function dots(page: number, onChange = jest.fn()) {
  return render(
    <Component
      testID="dots"
      variant="dots"
      label="Slides"
      value={page}
      total={4}
      onChange={onChange}
    />,
  );
}

describe("Pagination dots", () => {
  /**
   * An 8pt dot needs a bigger touch target, and `hitSlop` is the obvious
   * way to get one — and the wrong one here, because dots sit a few points
   * apart so the slop overlaps every neighbour. Overlapping targets do not
   * average out: the topmost wins, so on iOS every press landed on the last
   * dot and the earlier ones could not be pressed at all.
   */
  it("gives each dot a real target, and marks only the current one", async () => {
    const view = await dots(3);
    const { props } = view.getByTestId(testId("dots", 1));
    const style = Object.assign({}, ...[props.style].flat(3).filter(Boolean));

    expect(props.hitSlop).toBeUndefined();
    expect(style.width).toBeGreaterThan(20);
    expect(style.height).toBeGreaterThan(20);

    expect(
      [1, 2, 3, 4].map(
        (n) =>
          view.getByTestId(testId("dots", n)).props.accessibilityState.selected,
      ),
    ).toEqual([false, false, true, false]);
  });

  it("reports the dot that was pressed, not its neighbour", async () => {
    const onChange = jest.fn();
    const view = await dots(1, onChange);

    fireEvent.press(view.getByTestId(testId("dots", 2)));
    expect(onChange).toHaveBeenLastCalledWith(2);

    fireEvent.press(view.getByTestId(testId("dots", 4)));
    expect(onChange).toHaveBeenLastCalledWith(4);

    fireEvent.press(view.getByTestId(testId("dots", 3)));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});
