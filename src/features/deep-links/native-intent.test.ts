import env from "@/constants/env";

import deepLinks from "./registry";
import { redirectSystemPath } from "./native-intent";

const options = (path: string) => ({ path, initial: true });

describe("redirectSystemPath", () => {
  beforeEach(() => {
    deepLinks.reset();
  });

  it("suppresses Expo Router navigation for a registered deep-link command", () => {
    deepLinks.register({ pattern: "/account", handle: jest.fn() });

    expect(
      redirectSystemPath(options(`${env.appScheme}://account`)),
    ).toBeNull();
  });

  it("leaves ordinary file-based routes to Expo Router", () => {
    const path = `${env.appScheme}://settings`;

    expect(redirectSystemPath(options(path))).toBe(path);
  });

  it("leaves external URLs untouched", () => {
    expect(redirectSystemPath(options("https://not-ours.example/path"))).toBe(
      "https://not-ours.example/path",
    );
  });

  it("falls back to the original path if inspection fails", () => {
    const path = `${env.appScheme}://orders/12`;
    jest.spyOn(deepLinks, "claims").mockImplementationOnce(() => {
      throw new Error("broken registry");
    });

    expect(redirectSystemPath(options(path))).toBe(path);
  });
});
