import { openURL } from "expo-linking";

import deepLinks from ".";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));
// The documented way to run a platform branch under Jest — see @/utils.
jest.mock("@/utils", () => ({
  ...jest.requireActual("@/utils"),
  isWeb: true,
}));

describe("deepLinks.open on the web", () => {
  afterEach(() => jest.clearAllMocks());

  it("opens another site's address in a new tab, not over the app", async () => {
    // Jest runs the native environment, which has no window.open to spy on.
    const open = jest.fn();
    Object.defineProperty(window, "open", { value: open, configurable: true });

    await deepLinks.open("https://example.com/agenda");

    expect(open).toHaveBeenCalledWith(
      "https://example.com/agenda",
      "_blank",
      "noopener,noreferrer",
    );
    expect(openURL).not.toHaveBeenCalled();
  });

  it("still hands mail and phone links to openURL", async () => {
    await deepLinks.open("mailto:ada@example.com");

    expect(openURL).toHaveBeenCalledWith("mailto:ada@example.com");
  });
});
