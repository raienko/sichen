import { Share as RNShare } from "react-native";
import * as Clipboard from "expo-clipboard";

import logger from "@/features/logger";

import { copyText, shareContent } from "./share";

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

const setString = Clipboard.setStringAsync as jest.Mock;

beforeEach(() => {
  jest.restoreAllMocks();
  setString.mockReset().mockResolvedValue(true);
});

/** What a browser with no Web Share API throws — see react-native-web. */
const UNSUPPORTED = new Error("Share is not supported in this browser");

/** What a browser throws when the user closes the sheet. */
function abort() {
  const error = new Error("Share canceled");
  error.name = "AbortError";
  return error;
}

describe("copyText", () => {
  it("puts the text on the clipboard", async () => {
    await expect(copyText("https://example.com")).resolves.toBe(true);
    expect(setString).toHaveBeenCalledWith("https://example.com");
  });

  // The web clipboard is permission-gated and secure-context only, so this
  // genuinely fails sometimes in ways nothing can prevent.
  it("reports a refusal rather than throwing", async () => {
    jest.spyOn(logger, "failed").mockImplementation(() => {});
    setString.mockRejectedValue(new Error("NotAllowedError"));

    await expect(copyText("https://example.com")).resolves.toBe(false);
  });

  it("declines to copy nothing", async () => {
    await expect(copyText("   ")).resolves.toBe(false);
    expect(setString).not.toHaveBeenCalled();
  });
});

describe("shareContent", () => {
  it("reports a share the OS says went through", async () => {
    jest
      .spyOn(RNShare, "share")
      .mockResolvedValue({ action: RNShare.sharedAction });

    await expect(shareContent({ url: "https://example.com" })).resolves.toBe(
      "shared",
    );
  });

  it("reports a sheet the user closed", async () => {
    jest
      .spyOn(RNShare, "share")
      .mockResolvedValue({ action: RNShare.dismissedAction });

    await expect(shareContent({ url: "https://example.com" })).resolves.toBe(
      "dismissed",
    );
  });

  // The web resolves with nothing at all when it goes ahead; a cancel
  // there arrives as a rejection instead.
  it("treats an empty resolution as a share", async () => {
    jest.spyOn(RNShare, "share").mockResolvedValue(undefined as never);

    await expect(shareContent({ url: "https://example.com" })).resolves.toBe(
      "shared",
    );
  });

  /**
   * Most desktop browsers have no Web Share API, so this is the normal path
   * on the web rather than an edge case.
   */
  it("copies when there is no share sheet at all", async () => {
    jest.spyOn(RNShare, "share").mockRejectedValue(UNSUPPORTED);

    await expect(
      shareContent({ message: "Check this out", url: "https://example.com" }),
    ).resolves.toBe("copied");
    // The link, not the sentence wrapped around it.
    expect(setString).toHaveBeenCalledWith("https://example.com");
  });

  /**
   * Someone who opened the sheet and closed it has decided not to share.
   * Copying anyway, and announcing it, does the opposite of what they asked
   * — and the web reports that cancel as a rejection, indistinguishable
   * from a real failure unless the name is checked.
   */
  it("never falls back to copying after a dismissal", async () => {
    jest.spyOn(RNShare, "share").mockRejectedValue(abort());

    await expect(shareContent({ url: "https://example.com" })).resolves.toBe(
      "dismissed",
    );
    expect(setString).not.toHaveBeenCalled();
  });

  it("fails when there is no sheet and the clipboard refuses too", async () => {
    jest.spyOn(logger, "failed").mockImplementation(() => {});
    jest.spyOn(RNShare, "share").mockRejectedValue(UNSUPPORTED);
    setString.mockRejectedValue(new Error("NotAllowedError"));

    await expect(shareContent({ url: "https://example.com" })).resolves.toBe(
      "failed",
    );
  });

  it("does not open an empty sheet", async () => {
    const share = jest.spyOn(RNShare, "share");

    await expect(shareContent({ message: "   " })).resolves.toBe("failed");
    expect(share).not.toHaveBeenCalled();
  });

  it("passes the title and the url through", async () => {
    const share = jest
      .spyOn(RNShare, "share")
      .mockResolvedValue({ action: RNShare.sharedAction });

    await shareContent({ url: "https://example.com", title: "Order #12" });

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com",
        title: "Order #12",
      }),
    );
  });
});
