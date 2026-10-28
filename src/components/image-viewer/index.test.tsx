import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testIdPattern,
  waitFor,
} from "@/root/testing";

import Component, { type ImageViewerItem } from "./index";

const mockShare = jest.fn();
jest.mock("@/components/share", () => ({
  ...jest.requireActual("@/components/share"),
  shareContent: (...args: unknown[]) => mockShare(...args),
}));

const PHOTOS: ImageViewerItem[] = [
  {
    source: "https://example.com/a.jpg",
    alt: "Harbour at dawn",
    caption: "Lisbon, 6:10",
  },
  { source: "https://example.com/b.jpg", alt: "Tram on a hill" },
  { source: 1, alt: "Bundled sketch" },
];

const hidden = { includeHiddenElements: true };

async function open(
  index = 0,
  props: Partial<Parameters<typeof Component>[0]> = {},
) {
  await render(<Component id="viewer" images={PHOTOS} {...props} />);
  await act(async () => {
    void Component.show("viewer", index);
  });
  await waitFor(() =>
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "stage")),
    ).toBeTruthy(),
  );
}

function stage() {
  return screen.getByTestId(testIdPattern("image-viewer", ANY, "stage"));
}

describe(`${Component.name}`, () => {
  afterEach(() => mockShare.mockReset());

  it("opens on the picture it was asked for", async () => {
    await open(1);

    expect(stage().props.accessibilityLabel).toBe(
      "Photo 2 of 3, Tram on a hill",
    );
    expect(screen.getByText("2 / 3", hidden)).toBeTruthy();
  });

  it("shows the caption of the current picture only", async () => {
    await open(0);
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "caption")).props
        .children,
    ).toBe("Lisbon, 6:10");

    await act(async () => {
      fireEvent(stage(), "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    });
    expect(
      screen.queryByTestId(testIdPattern("image-viewer", ANY, "caption")),
    ).toBeNull();
  });

  it("pages with a screen reader's adjust actions, and reports it", async () => {
    const onIndexChange = jest.fn();
    await open(0, { onIndexChange });

    await act(async () => {
      fireEvent(stage(), "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(stage().props.accessibilityLabel).toMatch(/^Photo 2 of 3/);

    await act(async () => {
      fireEvent(stage(), "accessibilityAction", {
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it("doesn't page past either end", async () => {
    const onIndexChange = jest.fn();
    await open(0, { onIndexChange });

    await act(async () => {
      fireEvent(stage(), "accessibilityAction", {
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("jumps to a picture from its thumbnail", async () => {
    await open(0);

    await act(async () => {
      fireEvent.press(
        screen.getByTestId(testIdPattern("image-viewer", ANY, "thumbnail", 2)),
      );
    });
    expect(stage().props.accessibilityLabel).toMatch(/^Photo 3 of 3/);
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "thumbnail", 2))
        .props.accessibilityState.selected,
    ).toBe(true);
  });

  it("offers share only for a picture another app can open", async () => {
    await open(0);
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "share")),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(
        screen.getByTestId(testIdPattern("image-viewer", ANY, "share")),
      );
    });
    expect(mockShare).toHaveBeenCalledWith({
      url: "https://example.com/a.jpg",
      title: "Harbour at dawn",
    });

    await act(async () => {
      fireEvent.press(
        screen.getByTestId(testIdPattern("image-viewer", ANY, "thumbnail", 2)),
      );
    });
    expect(
      screen.queryByTestId(testIdPattern("image-viewer", ANY, "share")),
    ).toBeNull();
  });

  it("hides the thumbnails and the counter for a single picture", async () => {
    await render(<Component id="single" images={[PHOTOS[0]!]} />);
    await act(async () => {
      void Component.show("single");
    });
    await waitFor(() =>
      expect(
        screen.getByTestId(testIdPattern("image-viewer", ANY, "stage")),
      ).toBeTruthy(),
    );

    expect(
      screen.queryByTestId(testIdPattern("image-viewer", ANY, "thumbnail", 0)),
    ).toBeNull();
    // Nor a "1 / 1" counter, and the picture is announced by its alt alone.
    expect(screen.queryByText("1 / 1", hidden)).toBeNull();
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "stage")).props
        .accessibilityLabel,
    ).toBe("Harbour at dawn");
    expect(
      screen.getByTestId(testIdPattern("image-viewer", ANY, "stage")).props
        .accessibilityRole,
    ).toBe("image");
  });

  it("closes from its close button", async () => {
    const onClose = jest.fn();
    await open(0, { onClose });

    await act(async () => {
      fireEvent.press(
        screen.getByTestId(testIdPattern("image-viewer", ANY, "close")),
      );
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
