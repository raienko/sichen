import { Image as ExpoImage } from "expo-image";

import { act, render, screen, testId } from "@/root/testing";

import Component from "./index";

const REMOTE = "https://example.com/photo.png";

function image() {
  return screen.getByTestId("image", { includeHiddenElements: true });
}

/**
 * expo-image normalizes a string source into `[{ uri }]` before it reaches
 * the native view, which is the only place a query can read it — RNTL 14
 * has no composite-element queries.
 */
function expectSource(uri: string) {
  expect(image().props.source).toEqual([expect.objectContaining({ uri })]);
}

/**
 * The testID lands on expo-image's own native view, whose `onError` expects
 * a native synthetic event — so this fires the same shape the platform
 * would, rather than calling our handler directly and testing nothing about
 * how it's wired up.
 */
function fireError(message = "404") {
  return act(() =>
    image().props.onError?.({ nativeEvent: { error: message } }),
  );
}

describe(`${Component.displayName} smoke test`, () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the source it was given", async () => {
    await render(<Component source={REMOTE} alt="A photo" />);

    expectSource(REMOTE);
    expect(screen.queryByTestId(testId("image", "fallback"))).toBeNull();
  });

  it("names the image for a screen reader, on every platform and in the DOM", async () => {
    await render(<Component source={REMOTE} alt="A photo" />);
    const { props } = image();

    // expo-image defaults `accessible` to false, so an image left alone
    // isn't an accessibility element at all.
    expect(props.accessible).toBe(true);
    expect(props.accessibilityRole).toBe("image");
    expect(props.role).toBe("img");
    // expo-image folds its own `alt` prop into `accessibilityLabel` before
    // the native view, so this one assertion covers both spellings here.
    // The DOM `alt` attribute `alt` produces on web is verified in the
    // browser, not from Jest.
    expect(props.accessibilityLabel).toBe("A photo");
  });

  // Browsers make every <img> a native HTML5 drag source, and starting one
  // cancels the pointer stream a gesture is reading — which silently killed
  // dragging a `Carousel` whose slides were images. Observed directly: the
  // pan fired `begin` then `end` with a translation of 0, right after the
  // browser's own `dragstart`.
  it("is not a native drag source on web", async () => {
    await render(<Component source={REMOTE} alt="A photo" />);

    expect(image().props.draggable).toBe(false);
  });

  it("lets a caller opt back into dragging", async () => {
    await render(<Component source={REMOTE} alt="A photo" draggable />);

    expect(image().props.draggable).toBe(true);
  });

  it("hides a decorative image from assistive technology entirely", async () => {
    await render(<Component source={REMOTE} decorative />);
    const { props } = image();

    expect(props.accessible).toBe(false);
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe("no-hide-descendants");
    expect(props["aria-hidden"]).toBe(true);
    expect(props.accessibilityLabel).toBeUndefined();
  });

  describe("fallback", () => {
    // "" is what a record with no picture looks like straight out of an
    // API — without this it would sit loading nothing forever.
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an empty string", ""],
      ["an empty array", []],
    ])(
      "shows the placeholder when the source is %s",
      async (_label, source) => {
        await render(<Component source={source} alt="A photo" />);

        expect(screen.getByTestId(testId("image", "fallback"))).toBeTruthy();
      },
    );

    it("shows the placeholder once the source fails to load", async () => {
      await render(<Component source={REMOTE} alt="A photo" />);
      await fireError();

      expect(screen.getByTestId(testId("image", "fallback"))).toBeTruthy();
    });

    it("keeps the description on the placeholder", async () => {
      await render(<Component source="" alt="A photo" />);

      expect(
        screen.getByTestId(testId("image", "fallback")).props
          .accessibilityLabel,
      ).toBe("A photo");
    });

    it("shows a caller's own fallback source instead of the placeholder", async () => {
      const branded = "https://example.com/placeholder.png";
      await render(
        <Component source={REMOTE} fallback={branded} alt="A photo" />,
      );
      await fireError();

      expectSource(branded);
      expect(screen.queryByTestId(testId("image", "fallback"))).toBeNull();
    });

    // Our own error handling comes off once the fallback is showing —
    // there is nothing further to fall back to, and the failure it would
    // record is one already recorded. The caller's own `onError` stays
    // wired, so they still hear about the fallback failing too.
    it("stops handling errors once it is already showing the fallback", async () => {
      const onError = jest.fn();
      await render(
        <Component
          source={REMOTE}
          fallback="https://example.com/placeholder.png"
          alt="A photo"
          onError={onError}
        />,
      );

      await fireError();
      await fireError();

      const logged = (console.log as jest.Mock).mock.calls.filter((call) =>
        call.some(
          (part: unknown) =>
            typeof part === "string" && part.includes("Unable to load image"),
        ),
      );
      expect(logged).toHaveLength(1);
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("renders nothing at all when the fallback is null", async () => {
      await render(<Component source="" fallback={null} alt="A photo" />);

      expect(screen.queryByTestId(testId("image", "fallback"))).toBeNull();
      expect(screen.queryByTestId("image")).toBeNull();
    });

    // A new source is by definition not the one that failed, so it gets a
    // real attempt rather than inheriting the previous failure.
    it("recovers when the source changes after a failure", async () => {
      const view = await render(<Component source={REMOTE} alt="A photo" />);
      await fireError();
      expect(screen.getByTestId(testId("image", "fallback"))).toBeTruthy();

      await view.rerender(
        <Component source="https://example.com/other.png" alt="A photo" />,
      );

      expect(screen.queryByTestId(testId("image", "fallback"))).toBeNull();
      expectSource("https://example.com/other.png");
    });

    // The identity of `{{ uri }}` changes every render; the key derived
    // from its value doesn't, so a failure sticks instead of re-rendering
    // into the same failing load forever.
    it("keeps an object source failed across re-renders", async () => {
      const view = await render(
        <Component source={{ uri: REMOTE }} alt="A photo" />,
      );
      await fireError();

      await view.rerender(<Component source={{ uri: REMOTE }} alt="A photo" />);

      expect(screen.getByTestId(testId("image", "fallback"))).toBeTruthy();
    });

    it("still calls a caller's own onError", async () => {
      const onError = jest.fn();
      await render(
        <Component source={REMOTE} alt="A photo" onError={onError} />,
      );
      await fireError("boom");

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ error: "boom" }),
      );
    });
  });

  describe("preload", () => {
    it("prefetches through expo-image", async () => {
      const prefetch = jest
        .spyOn(ExpoImage, "prefetch")
        .mockResolvedValue(true);

      await expect(Component.preload([REMOTE])).resolves.toBe(true);
      expect(prefetch).toHaveBeenCalledWith([REMOTE], undefined);
    });

    // A warm cache is an optimization; a failed preload just means the
    // image is fetched at render instead, as it would have been anyway.
    it("reports failure instead of throwing", async () => {
      jest.spyOn(ExpoImage, "prefetch").mockRejectedValue(new Error("offline"));

      await expect(Component.preload(REMOTE)).resolves.toBe(false);
    });
  });

  describe("cacheClear", () => {
    it("clears both caches by default", async () => {
      const memory = jest
        .spyOn(ExpoImage, "clearMemoryCache")
        .mockResolvedValue(true);
      const disk = jest
        .spyOn(ExpoImage, "clearDiskCache")
        .mockResolvedValue(true);

      await expect(Component.cacheClear()).resolves.toBe(true);
      expect(memory).toHaveBeenCalled();
      expect(disk).toHaveBeenCalled();
    });

    it.each([
      ["memory", "clearDiskCache"],
      ["disk", "clearMemoryCache"],
    ] as const)(
      "leaves the other cache alone for %s",
      async (target, other) => {
        jest.spyOn(ExpoImage, "clearMemoryCache").mockResolvedValue(true);
        jest.spyOn(ExpoImage, "clearDiskCache").mockResolvedValue(true);

        await Component.cacheClear(target);

        expect(ExpoImage[other]).not.toHaveBeenCalled();
      },
    );

    // `false` means "nothing was cleared" (web has no cache of its own),
    // not "something broke".
    it("reports false when a cache could not be cleared", async () => {
      jest.spyOn(ExpoImage, "clearMemoryCache").mockResolvedValue(true);
      jest.spyOn(ExpoImage, "clearDiskCache").mockResolvedValue(false);

      await expect(Component.cacheClear()).resolves.toBe(false);
    });

    it("reports failure instead of throwing", async () => {
      jest
        .spyOn(ExpoImage, "clearMemoryCache")
        .mockRejectedValue(new Error("no activity"));
      jest.spyOn(ExpoImage, "clearDiskCache").mockResolvedValue(true);

      await expect(Component.cacheClear()).resolves.toBe(false);
    });
  });
});
