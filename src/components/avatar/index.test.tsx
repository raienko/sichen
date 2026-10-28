import Icon from "@/components/icon";
import { render } from "@/root/testing";

import Component from "./index";

const PHOTO = "https://example.com/ada.jpg";

describe(`${Component.name} smoke test`, () => {
  it("shows the initials of the name", async () => {
    const view = await render(<Component name="Ada Lovelace" />);

    expect(view.getByText("AL", { includeHiddenElements: true })).toBeTruthy();
  });

  it("still shows them behind a picture, as its loading state", async () => {
    const view = await render(<Component name="Ada Lovelace" source={PHOTO} />);

    expect(view.getByText("AL", { includeHiddenElements: true })).toBeTruthy();
    expect(
      view.getByTestId("image", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  // `Image` renders nothing for an empty source, so the monogram underneath
  // is simply what's left — no separate branch to get wrong.
  it("renders no picture at all when there is no source", async () => {
    const view = await render(<Component name="Ada Lovelace" />);

    expect(
      view.queryByTestId("image", { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("shows an icon instead of the initials when given one", async () => {
    const view = await render(
      <Component name="Design team" icon={<Icon name="users" />} />,
    );

    expect(view.queryByText("DT", { includeHiddenElements: true })).toBeNull();
  });

  // A name with no letters in it is the one case with nothing to draw.
  it("falls through to a person glyph for a nameless avatar", async () => {
    const view = await render(<Component testID="avatar" name="  " />);

    expect(view.queryByText("")).toBeNull();
    expect(
      view.getByTestId("avatar", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("sizes itself rather than stretching to its container", async () => {
    const view = await render(<Component testID="avatar" name="Ada" />);
    const style = Object.assign(
      {},
      ...[view.getByTestId("avatar").props.style].flat(3).filter(Boolean),
    );

    expect(style.alignSelf).toBe("flex-start");
  });

  describe("accessibility", () => {
    // "A L" is the abbreviation being read out instead of the person.
    it("announces the name, not the monogram", async () => {
      const view = await render(
        <Component testID="avatar" name="Ada Lovelace" />,
      );
      const { props } = view.getByTestId("avatar");

      expect(props.accessible).toBe(true);
      expect(props.accessibilityLabel).toBe("Ada Lovelace");
      expect(props.accessibilityRole).toBe("image");
    });

    it("hides the monogram itself on every platform", async () => {
      const view = await render(<Component name="Ada Lovelace" />);
      const { props } = view.getByText("AL", { includeHiddenElements: true });

      expect(props.accessible).toBe(false);
      expect(props.accessibilityElementsHidden).toBe(true);
      expect(props.importantForAccessibility).toBe("no-hide-descendants");
      expect(props["aria-hidden"]).toBe(true);
    });

    // An element with an empty name is exactly the anonymous stop the rest
    // of this codebase goes out of its way to avoid.
    it("hides an avatar with nothing to be called", async () => {
      const view = await render(<Component testID="avatar" name="  " />);
      const { props } = view.getByTestId("avatar", {
        includeHiddenElements: true,
      });

      expect(props.accessible).toBe(false);
      expect(props["aria-hidden"]).toBe(true);
      expect(view.queryByTestId("avatar")).toBeNull();
    });

    // A nameless avatar with a status should announce the status, not
    // ", Online".
    it("announces a status alone when there is no name", async () => {
      const view = await render(
        <Component
          testID="avatar"
          name=""
          status="success"
          statusLabel="Online"
        />,
      );

      expect(view.getByTestId("avatar").props.accessibilityLabel).toBe(
        "Online",
      );
    });

    it("appends the status to the name", async () => {
      const view = await render(
        <Component
          testID="avatar"
          name="Ada Lovelace"
          status="success"
          statusLabel="Online"
        />,
      );

      expect(view.getByTestId("avatar").props.accessibilityLabel).toBe(
        "Ada Lovelace, Online",
      );
    });

    // The picture is decorative because the container already carries the
    // name — two elements naming the same person announces it twice.
    it("leaves the picture out of the accessibility tree", async () => {
      const view = await render(
        <Component name="Ada Lovelace" source={PHOTO} />,
      );
      const { props } = view.getByTestId("image", {
        includeHiddenElements: true,
      });

      expect(props.accessible).toBe(false);
      expect(props["aria-hidden"]).toBe(true);
    });
  });

  describe("status", () => {
    it("adds no dot when there is no status", async () => {
      const view = await render(<Component testID="avatar" name="Ada" />);

      expect(
        view.getByTestId("avatar", { includeHiddenElements: true }).children,
      ).toHaveLength(1);
    });

    it("pins a dot outside the clipping surface, so it isn't cut in half", async () => {
      const view = await render(
        <Component
          testID="avatar"
          name="Ada"
          status="success"
          statusLabel="Online"
        />,
      );

      expect(
        view.getByTestId("avatar", { includeHiddenElements: true }).children,
      ).toHaveLength(2);
    });
  });

  // The square is a fixed graphic that has to line up down a list, so
  // letters that grew with the OS text size would clip rather than help.
  it("keeps the monogram out of OS text scaling", async () => {
    const view = await render(<Component name="Ada Lovelace" />);

    expect(
      view.getByText("AL", { includeHiddenElements: true }).props
        .allowFontScaling,
    ).toBe(false);
  });
});
