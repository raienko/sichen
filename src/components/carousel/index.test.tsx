import { createRef } from "react";
import { Text as RNText, View } from "react-native";

import { act, fireEvent, render, screen } from "@/root/testing";

import Component, { type CarouselRef } from "./index";

const SLIDES = ["one", "two", "three"];

type Props = Parameters<typeof Component<string>>[0];

/**
 * Under `react-native-reanimated/mock` nothing animates, so the library
 * never settles a slide and `onSnapToItem` never fires — an index only
 * moves for real on a device or in a browser. What *is* testable here is
 * every piece of wiring this wrapper owns: the accessibility it puts on the
 * region, the pagination it renders, and that the controls reach the
 * library's own handle. The two spies below do the last part by patching
 * the very object the component calls into — `useImperativeHandle` hands
 * the caller the library's handle itself, not a copy.
 */
function renderCarousel(props: Partial<Props> = {}) {
  return render(
    <Component
      data={SLIDES}
      label="Trip photos"
      renderItem={({ item }) => (
        <View>
          <RNText>{item}</RNText>
        </View>
      )}
      {...props}
    />,
  );
}

function carousel() {
  return screen.getByTestId("carousel");
}

/** The pagination dots, which are real buttons when they're rendered. */
function dots() {
  return screen.queryAllByRole("button");
}

describe(`${Component.name} smoke test`, () => {
  it("renders every slide", async () => {
    await renderCarousel();

    // Hidden-element queries: the library mounts every slide at once and
    // hides the ones that aren't current from assistive technology. Nothing
    // has settled under a mocked Reanimated, so here that's all of them.
    for (const slide of SLIDES) {
      expect(
        screen.getByText(slide, { includeHiddenElements: true }),
      ).toBeTruthy();
    }
  });

  describe("pagination", () => {
    // A carousel's remaining content is off-screen by definition; without
    // dots nothing says it exists.
    it("shows one dot per slide by default", async () => {
      await renderCarousel();

      expect(dots()).toHaveLength(SLIDES.length);
    });

    it("hides the dots when hasPagination is false", async () => {
      await renderCarousel({ hasPagination: false });

      expect(dots()).toHaveLength(0);
    });

    it("renders no dots for empty data", async () => {
      await renderCarousel({ data: [] });

      expect(dots()).toHaveLength(0);
    });

    // The dots are the one navigation path a screen reader can take, so
    // each is a named button carrying whether it's the current slide.
    it("names every dot and marks the current one", async () => {
      await renderCarousel();
      const [first, second] = dots();

      expect(first.props.accessibilityLabel).toBe("Slide 1 of 3");
      expect(second.props.accessibilityLabel).toBe("Slide 2 of 3");
      expect(first.props.accessibilityState).toEqual({ selected: true });
    });

    it("jumps to a slide when its dot is pressed", async () => {
      const ref = createRef<CarouselRef>();
      await renderCarousel({ ref });
      const scrollTo = jest.spyOn(ref.current as CarouselRef, "scrollTo");

      await act(() => fireEvent.press(dots()[2]));

      expect(scrollTo).toHaveBeenCalledWith({ index: 2 });
    });
  });

  describe("accessibility", () => {
    it("names the region on every platform", async () => {
      await renderCarousel();
      const { props } = carousel();

      expect(props.accessibilityLabel).toBe("Trip photos");
      expect(props["aria-label"]).toBe("Trip photos");
      // The ARIA authoring-practices spelling of this widget, which native
      // has no equivalent of.
      expect(props.role).toBe("group");
      expect(props["aria-roledescription"]).toBe("carousel");
    });

    // A pan gesture is unreachable by a screen reader, so the region offers
    // the native swipe-up/down adjustable gestures instead.
    it("offers increment and decrement as native actions", async () => {
      await renderCarousel();
      const { props } = carousel();

      expect(props.accessibilityRole).toBe("adjustable");
      expect(props.accessibilityActions).toEqual([
        { name: "increment" },
        { name: "decrement" },
      ]);
    });

    it.each([
      ["increment", "next"],
      ["decrement", "prev"],
    ] as const)("moves the carousel on %s", async (actionName, method) => {
      const ref = createRef<CarouselRef>();
      await renderCarousel({ ref });
      const step = jest.spyOn(ref.current as CarouselRef, method);

      await act(() =>
        carousel().props.onAccessibilityAction({ nativeEvent: { actionName } }),
      );

      expect(step).toHaveBeenCalled();
    });

    it("ignores an action it doesn't own", async () => {
      const ref = createRef<CarouselRef>();
      await renderCarousel({ ref });
      const next = jest.spyOn(ref.current as CarouselRef, "next");
      const prev = jest.spyOn(ref.current as CarouselRef, "prev");

      await act(() =>
        carousel().props.onAccessibilityAction({
          nativeEvent: { actionName: "activate" },
        }),
      );

      expect(next).not.toHaveBeenCalled();
      expect(prev).not.toHaveBeenCalled();
    });

    it("announces the position as a range", async () => {
      await renderCarousel({ defaultIndex: 1 });

      expect(carousel().props.accessibilityValue).toEqual({
        min: 1,
        max: 3,
        now: 2,
        text: "Slide 2 of 3",
      });
      expect(carousel().props["aria-valuetext"]).toBe("Slide 2 of 3");
    });

    // Otherwise a screen reader offers gestures that can't do anything.
    it("offers no actions when there is nowhere to go", async () => {
      await renderCarousel({ data: ["only"] });
      const { props } = carousel();

      expect(props.accessibilityActions).toBeUndefined();
      expect(props.accessibilityValue).toBeUndefined();
      // Still a named region, either way.
      expect(props.accessibilityLabel).toBe("Trip photos");
    });

    describe("slideLabel", () => {
      const slideLabel = (item: string) => `Photo ${item}`;

      // The region and the dots describe the carousel rather than being
      // it, so neither has any text of its own to derive a name from.
      it("leads the region's announcement with the slide's own description", async () => {
        await renderCarousel({ slideLabel, defaultIndex: 1 });

        expect(carousel().props.accessibilityValue.text).toBe(
          "Photo two, Slide 2 of 3",
        );
      });

      it("labels the dots with it too", async () => {
        await renderCarousel({ slideLabel });

        expect(dots()[2].props.accessibilityLabel).toBe(
          "Photo three, Slide 3 of 3",
        );
      });

      it("falls back to the position alone without one", async () => {
        await renderCarousel();

        expect(carousel().props.accessibilityValue.text).toBe("Slide 1 of 3");
      });
    });
  });

  it("hands the caller the library's own handle", async () => {
    const ref = createRef<CarouselRef>();
    await renderCarousel({ ref });

    expect(typeof ref.current?.next).toBe("function");
    expect(typeof ref.current?.prev).toBe("function");
    expect(typeof ref.current?.scrollTo).toBe("function");
    expect(ref.current?.getCurrentIndex()).toBe(0);
  });

  // The library reads its position once, at mount, and doesn't re-fit it
  // when `loop` changes — so a carousel wrapped backwards past its first
  // slide went blank when loop was turned off. Switching mode remounts it,
  // and the caller's handle has to follow to the new one.
  it("remounts when loop changes, and the ref follows", async () => {
    const ref = createRef<CarouselRef>();
    const view = (loop: boolean) => (
      <Component
        ref={ref}
        data={SLIDES}
        label="Trip photos"
        loop={loop}
        renderItem={({ item }) => <RNText>{item}</RNText>}
      />
    );

    await render(view(true));
    const before = ref.current;
    await screen.rerender(view(false));

    expect(ref.current).not.toBeNull();
    expect(ref.current).not.toBe(before);
    expect(typeof ref.current?.next).toBe("function");
    expect(
      screen.getByText("one", { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
