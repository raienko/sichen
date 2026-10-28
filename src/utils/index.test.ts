import { Platform } from "react-native";
import { Easing } from "react-native-reanimated";

import { easeOutClamped, isAndroid, isIOS, isWeb } from "./index";

describe("platform constants", () => {
  // Constants, not functions: the platform can't change while the app runs.
  it("names exactly the platform the app is running on", () => {
    expect([isWeb, isIOS, isAndroid].filter(Boolean)).toHaveLength(1);
  });

  it.each([
    ["web", () => isWeb],
    ["ios", () => isIOS],
    ["android", () => isAndroid],
  ] as const)("is true for %s only there", (os, read) => {
    expect(read()).toBe(Platform.OS === os);
  });

  /**
   * The reason these read `Platform.OS` rather than `process.env.EXPO_OS`,
   * which is the other way to ask: `babel-preset-expo` inlines that env
   * read at transform time, so under Jest it is permanently `"ios"` no
   * matter which platform is under test — and any behaviour behind it would
   * ship with no test able to reach it. Asserted so a change back to the
   * env read fails here rather than silently pinning every platform branch
   * to iOS.
   */
  it("does not follow the build-time env read, which Jest pins to ios", () => {
    expect(process.env.EXPO_OS).toBe("ios");
    expect(isIOS).toBe(Platform.OS === "ios");
  });
});

describe("easeOutClamped", () => {
  it("never leaves 0–1, even for progress just outside it", () => {
    expect(easeOutClamped(-0.05)).toBe(0);
    expect(easeOutClamped(1.05)).toBe(1);
  });

  it("is ease-out cubic in between", () => {
    expect(easeOutClamped(0.3)).toBe(Easing.out(Easing.cubic)(0.3));
  });
});
