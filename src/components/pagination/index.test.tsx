import { fireEvent, render, testId } from "@/root/testing";

import Component from "./index";

const hidden = { includeHiddenElements: true } as const;

describe(`${Component.name} smoke test`, () => {
  it("shows every page when they all fit", async () => {
    const view = await render(
      <Component label="Orders" value={1} total={5} onChange={jest.fn()} />,
    );

    ["1", "2", "3", "4", "5"].forEach((page) => {
      expect(view.getByText(page, hidden)).toBeTruthy();
    });
  });

  /**
   * A bar for a single page is a control that cannot do anything — and it
   * is the state a real screen spends most of its time in.
   */
  it.each([
    ["one page", 1],
    ["no pages", 0],
  ])("renders nothing for %s", async (_name, total) => {
    const view = await render(
      <Component
        testID="pages"
        label="Orders"
        value={1}
        total={total}
        onChange={jest.fn()}
      />,
    );

    expect(view.queryByTestId("pages", hidden)).toBeNull();
  });

  it("reports the page that was pressed", async () => {
    const onChange = jest.fn();
    const view = await render(
      <Component
        testID="pages"
        label="Orders"
        value={1}
        total={5}
        onChange={onChange}
      />,
    );

    fireEvent.press(view.getByTestId(testId("pages", 3)));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("says nothing when the current page is pressed again", async () => {
    const onChange = jest.fn();
    const view = await render(
      <Component
        testID="pages"
        label="Orders"
        value={3}
        total={5}
        onChange={onChange}
      />,
    );

    fireEvent.press(view.getByTestId(testId("pages", 3)));

    expect(onChange).not.toHaveBeenCalled();
  });

  describe("the arrows", () => {
    it("step one page at a time", async () => {
      const onChange = jest.fn();
      const view = await render(
        <Component
          testID="pages"
          label="Orders"
          value={3}
          total={5}
          onChange={onChange}
        />,
      );

      fireEvent.press(view.getByTestId(testId("pages", "previous")));
      expect(onChange).toHaveBeenLastCalledWith(2);

      fireEvent.press(view.getByTestId(testId("pages", "next")));
      expect(onChange).toHaveBeenLastCalledWith(4);
    });
  });
});
