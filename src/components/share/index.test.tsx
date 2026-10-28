import { Share as RNShare } from "react-native";
import * as Clipboard from "expo-clipboard";

import Toast from "@/components/toast";
import { fireEvent, render, waitFor } from "@/root/testing";

import Component from "./index";

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

const setString = Clipboard.setStringAsync as jest.Mock;
const URL = "https://example.com/order/12";
const hidden = { includeHiddenElements: true } as const;

beforeEach(() => {
  jest.restoreAllMocks();
  setString.mockReset().mockResolvedValue(true);
});

/**
 * The character the icon actually drew. A vector icon is a `Text` in its
 * own font, so the glyph is the only evidence of which icon was picked.
 */
function glyphOf(view: Awaited<ReturnType<typeof render>>): string {
  const tree = JSON.stringify(view.toJSON());
  return (
    /"fontFamily":"Feather"[^}]*}[^\]]*\],"allowFontScaling":false},"children":\["(.*?)"\]/.exec(
      tree,
    )?.[1] ?? ""
  );
}

function unsupported() {
  return jest
    .spyOn(RNShare, "share")
    .mockRejectedValue(new Error("Share is not supported in this browser"));
}

describe(`${Component.displayName} smoke test`, () => {
  /**
   * One control beside the thing being shared, not a word competing with
   * it — so there is no text unless a caller asks for some, which makes
   * the accessible name carry the whole meaning.
   */
  describe("by default it is an icon", () => {
    it("shows no text", async () => {
      const view = await render(
        <Component testID="share" content={{ url: URL }} />,
      );

      expect(view.queryByText("Share", hidden)).toBeNull();
    });

    it("is still named, so it is never an unnamed control", async () => {
      const view = await render(
        <Component testID="share" content={{ url: URL }} />,
      );

      expect(view.getByTestId("share").props.accessibilityLabel).toBe("Share");
    });

    it("names itself Copy in copy mode", async () => {
      const view = await render(
        <Component testID="share" content={{ url: URL }} mode="copy" />,
      );

      expect(view.getByTestId("share").props.accessibilityLabel).toBe("Copy");
    });

    // Two different actions — one opens a sheet, the other silently fills
    // the clipboard — so they do not share a glyph any more than a label.
    it("wears a different glyph per mode", async () => {
      const shared = await render(
        <Component testID="share" content={{ url: URL }} />,
      );
      const copied = await render(
        <Component testID="share" content={{ url: URL }} mode="copy" />,
      );

      // Compared as *glyphs*, because that is what reaches the screen: a
      // vector icon renders the character its name maps to, so the name
      // itself never appears in the tree.
      expect(glyphOf(shared)).not.toBe(glyphOf(copied));
      expect(glyphOf(shared)).not.toBe("");
    });

    // `Button` has an `auto` size and `IconButton` has none, because a
    // square has nothing to hug.
    it("takes a size Button has and IconButton does not", async () => {
      const view = await render(
        <Component testID="share" content={{ url: URL }} size="auto" />,
      );

      expect(view.getByTestId("share")).toBeTruthy();
    });
  });

  it("becomes a text button when given text", async () => {
    const view = await render(
      <Component
        testID="share"
        content={{ url: URL }}
        value="Send to a friend"
      />,
    );

    expect(view.getByText("Send to a friend", hidden)).toBeTruthy();
  });

  it("opens the share sheet when pressed", async () => {
    const share = jest
      .spyOn(RNShare, "share")
      .mockResolvedValue({ action: RNShare.sharedAction });
    const onResult = jest.fn();
    const view = await render(
      <Component testID="share" content={{ url: URL }} onResult={onResult} />,
    );

    fireEvent.press(view.getByTestId("share"));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith("shared"));
    expect(share).toHaveBeenCalled();
  });

  it("copies without a sheet in copy mode", async () => {
    const share = jest.spyOn(RNShare, "share");
    const onResult = jest.fn();
    const view = await render(
      <Component
        testID="share"
        content={{ url: URL }}
        mode="copy"
        onResult={onResult}
      />,
    );

    fireEvent.press(view.getByTestId("share"));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith("copied"));
    expect(setString).toHaveBeenCalledWith(URL);
    expect(share).not.toHaveBeenCalled();
  });

  // The normal path in most desktop browsers, not an edge case.
  it("falls back to the clipboard where there is no sheet", async () => {
    unsupported();
    const onResult = jest.fn();
    const view = await render(
      <Component testID="share" content={{ url: URL }} onResult={onResult} />,
    );

    fireEvent.press(view.getByTestId("share"));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith("copied"));
  });

  /**
   * Nothing on screen changes when text reaches the clipboard, so the only
   * way to know it worked is to paste somewhere and look.
   */
  describe("feedback", () => {
    it("confirms a copy", async () => {
      const success = jest.spyOn(Toast, "success").mockResolvedValue("id");
      const view = await render(
        <Component testID="share" content={{ url: URL }} mode="copy" />,
      );

      fireEvent.press(view.getByTestId("share"));

      await waitFor(() =>
        expect(success).toHaveBeenCalledWith("Copied to clipboard"),
      );
    });

    it("reports a failure", async () => {
      const error = jest.spyOn(Toast, "error").mockResolvedValue("id");
      setString.mockResolvedValue(false);
      setString.mockRejectedValue(new Error("NotAllowedError"));
      const view = await render(
        <Component testID="share" content={{ url: URL }} mode="copy" />,
      );

      fireEvent.press(view.getByTestId("share"));

      await waitFor(() =>
        expect(error).toHaveBeenCalledWith("Could not share"),
      );
    });

    it("stays quiet for a caller showing its own", async () => {
      const success = jest.spyOn(Toast, "success").mockResolvedValue("id");
      const onResult = jest.fn();
      const view = await render(
        <Component
          testID="share"
          content={{ url: URL }}
          mode="copy"
          notify={false}
          onResult={onResult}
        />,
      );

      fireEvent.press(view.getByTestId("share"));

      await waitFor(() => expect(onResult).toHaveBeenCalledWith("copied"));
      expect(success).not.toHaveBeenCalled();
    });

    // A dismissal is not a failure and there is nothing to apologise for.
    it("says nothing when the user closes the sheet", async () => {
      const success = jest.spyOn(Toast, "success").mockResolvedValue("id");
      const error = jest.spyOn(Toast, "error").mockResolvedValue("id");
      jest
        .spyOn(RNShare, "share")
        .mockResolvedValue({ action: RNShare.dismissedAction });
      const onResult = jest.fn();
      const view = await render(
        <Component testID="share" content={{ url: URL }} onResult={onResult} />,
      );

      fireEvent.press(view.getByTestId("share"));

      await waitFor(() => expect(onResult).toHaveBeenCalledWith("dismissed"));
      expect(success).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  });

  // Reached by a URL that hasn't loaded yet more often than by a caller
  // getting it wrong, and an empty sheet is worse than a disabled button.
  it("disables itself when there is nothing to share", async () => {
    const view = await render(
      <Component testID="share" content={{ message: "  " }} />,
    );

    expect(view.getByTestId("share").props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it("exposes the same behaviour without a button", async () => {
    jest
      .spyOn(RNShare, "share")
      .mockResolvedValue({ action: RNShare.sharedAction });

    await expect(Component.share({ url: URL })).resolves.toBe("shared");
    await expect(Component.copy(URL)).resolves.toBe(true);
  });
});
