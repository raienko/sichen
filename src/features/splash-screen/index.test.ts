import { isRunningInExpoGo } from "expo";
import * as SplashScreen from "expo-splash-screen";

import { renderHook } from "@/root/testing";

import { useHideSplashScreen } from "./index";

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  setOptions: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  isRunningInExpoGo: jest.fn(() => false),
}));

const prevent = jest.mocked(SplashScreen.preventAutoHideAsync);
const hide = jest.mocked(SplashScreen.hide);
const setOptions = jest.mocked(SplashScreen.setOptions);

// The module keeps whether the splash was held and hidden, as the app does
// for its lifetime, so these tests start from a fresh copy. The hook test
// uses the copy imported above instead: a fresh copy would bring its own
// React, which the renderer's hooks don't share.
function load(): typeof import("./index") {
  let module: typeof import("./index") | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the module's held/hidden state is under test, so each case needs a fresh copy
    module = require("./index");
  });
  return module!;
}

describe("splash screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("holds the splash once, however often it's asked", () => {
    const { keepSplashScreen } = load();

    keepSplashScreen();
    keepSplashScreen();

    expect(prevent).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
  });

  it("fades it out", () => {
    const { keepSplashScreen, SPLASH_SCREEN_FADE_MS } = load();

    keepSplashScreen();

    expect(setOptions).toHaveBeenCalledWith({
      fade: true,
      duration: SPLASH_SCREEN_FADE_MS,
    });
  });

  it("leaves the animation alone in Expo Go, which can't set it", () => {
    jest.mocked(isRunningInExpoGo).mockReturnValueOnce(true);
    const { keepSplashScreen } = load();

    keepSplashScreen();

    expect(setOptions).not.toHaveBeenCalled();
  });

  it("keeps it up for the minimum time when the app is ready sooner", () => {
    const { keepSplashScreen, hideSplashScreen, SPLASH_SCREEN_MIN_MS } = load();
    keepSplashScreen();

    jest.advanceTimersByTime(500);
    hideSplashScreen();
    jest.advanceTimersByTime(SPLASH_SCREEN_MIN_MS - 501);
    expect(hide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("hides it at once when the app is ready after the minimum time", () => {
    const { keepSplashScreen, hideSplashScreen, SPLASH_SCREEN_MIN_MS } = load();
    keepSplashScreen();

    jest.advanceTimersByTime(SPLASH_SCREEN_MIN_MS + 1_000);
    hideSplashScreen();

    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("hides it once, however often it's asked", () => {
    const { keepSplashScreen, hideSplashScreen, SPLASH_SCREEN_TIMEOUT_MS } =
      load();

    keepSplashScreen();
    hideSplashScreen();
    hideSplashScreen();
    jest.advanceTimersByTime(SPLASH_SCREEN_TIMEOUT_MS);

    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("hides it once the app is ready, and not before", async () => {
    // Rendering settles on real timers.
    jest.useRealTimers();

    const { rerender } = await renderHook(
      ({ ready }: { ready: boolean }) => useHideSplashScreen(ready),
      { initialProps: { ready: false } },
    );
    expect(hide).not.toHaveBeenCalled();

    await rerender({ ready: true });
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("hides it anyway when startup never finishes", () => {
    const { keepSplashScreen, SPLASH_SCREEN_TIMEOUT_MS } = load();
    keepSplashScreen();

    jest.advanceTimersByTime(SPLASH_SCREEN_TIMEOUT_MS - 1);
    expect(hide).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("drops the fallback once hidden on time", () => {
    const { keepSplashScreen, hideSplashScreen, SPLASH_SCREEN_TIMEOUT_MS } =
      load();
    keepSplashScreen();
    hideSplashScreen();

    jest.advanceTimersByTime(SPLASH_SCREEN_TIMEOUT_MS);

    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("doesn't throw when the splash can't be held", async () => {
    prevent.mockRejectedValueOnce(new Error("already hidden"));
    const { keepSplashScreen } = load();

    expect(() => keepSplashScreen()).not.toThrow();
    await Promise.resolve();
  });
});
