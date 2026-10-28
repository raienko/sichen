import { fireEvent, render } from "@/root/testing";

import Component from "./index";

/**
 * Queried through each render's own view rather than the shared `screen`:
 * this file renders a lot, and past a certain count the harness stops
 * resolving `screen` against the freshly rendered tree — the same trap that
 * split Button's content tests into their own file.
 */
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
  it("shows its text", async () => {
    const view = await render(<Component value="Design" />);

    expect(view.getByText("Design")).toBeTruthy();
  });

  // A static tag is content, not a control: nothing to press, and no role
  // claiming otherwise.
  it("is inert with neither onPress nor onClose", async () => {
    const view = await render(<Component value="Design" />);

    expect(view.queryByRole("button")).toBeNull();
  });

  it("sizes itself to its own text rather than stretching", async () => {
    const view = await render(<Component testID="tag" value="Design" />);

    expect(styleOf(view, "tag").alignSelf).toBe("flex-start");
  });

  it("merges a caller's style over its own", async () => {
    const view = await render(
      <Component testID="tag" value="Design" style={{ borderWidth: 4 }} />,
    );

    expect(styleOf(view, "tag").borderWidth).toBe(4);
  });

  describe("press", () => {
    it("reports a press on the body", async () => {
      const onPress = jest.fn();
      const view = await render(<Component value="Unread" onPress={onPress} />);

      fireEvent.press(view.getByRole("button", { name: "Unread" }));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("announces a selected tag as selected", async () => {
      const view = await render(
        <Component value="Unread" onPress={jest.fn()} selected />,
      );

      expect(
        view.getByRole("button", { name: "Unread" }).props.accessibilityState
          .selected,
      ).toBe(true);
    });

    it("takes an accessible name over its own text", async () => {
      const view = await render(
        <Component value="Unread" label="Only unread" onPress={jest.fn()} />,
      );

      expect(view.getByRole("button", { name: "Only unread" })).toBeTruthy();
    });

    it("blocks presses when disabled", async () => {
      const onPress = jest.fn();
      const view = await render(
        <Component value="Unread" onPress={onPress} disabled />,
      );

      fireEvent.press(view.getByRole("button", { name: "Unread" }));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("onClose", () => {
    it("adds no remove button when it isn't passed", async () => {
      const view = await render(<Component value="Ada Lovelace" />);

      expect(view.queryByRole("button")).toBeNull();
    });

    it("reports a press on the remove button", async () => {
      const onClose = jest.fn();
      const view = await render(
        <Component value="Ada Lovelace" onClose={onClose} />,
      );

      fireEvent.press(
        view.getByRole("button", { name: "Remove Ada Lovelace" }),
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    // A row of tags is a row of identical ✕ glyphs otherwise, and which one
    // you're on is exactly what a screen-reader user can't see.
    it("names what it removes", async () => {
      const view = await render(
        <Component value="Ada Lovelace" onClose={jest.fn()} />,
      );

      expect(
        view.getByRole("button", { name: "Remove Ada Lovelace" }),
      ).toBeTruthy();
    });

    it("takes a caller's own label for it", async () => {
      const view = await render(
        <Component
          value="Ada Lovelace"
          onClose={jest.fn()}
          closeLabel="Uninvite Ada"
        />,
      );

      expect(view.getByRole("button", { name: "Uninvite Ada" })).toBeTruthy();
    });

    it("blocks presses when disabled", async () => {
      const onClose = jest.fn();
      const view = await render(
        <Component value="Ada Lovelace" onClose={onClose} disabled />,
      );

      fireEvent.press(
        view.getByRole("button", { name: "Remove Ada Lovelace" }),
      );

      expect(onClose).not.toHaveBeenCalled();
    });

    // The whole point of the sibling layout: nested inside a pressable body
    // the remove button would be unreachable, and one tap would carry two
    // meanings.
    it("keeps the body and the remove button as two separate controls", async () => {
      const onPress = jest.fn();
      const onClose = jest.fn();
      const view = await render(
        <Component value="Unread" onPress={onPress} onClose={onClose} />,
      );

      expect(view.getAllByRole("button")).toHaveLength(2);

      fireEvent.press(view.getByRole("button", { name: "Unread" }));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.press(view.getByRole("button", { name: "Remove Unread" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
