import { isRunningInExpoGo } from "expo";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import logger from "@/features/logger";

/**
 * The shortest time the splash screen is on screen, however fast startup
 * is: long enough for the brand to register rather than flicker past.
 */
export const SPLASH_SCREEN_MIN_MS = 2_500;

/** The fade the splash screen hides with. */
export const SPLASH_SCREEN_FADE_MS = 400;

/**
 * How long the splash screen may stay up before it is hidden anyway. Startup
 * work that hangs (a stalled read, a promise nobody resolves) must not leave
 * the app stuck behind its logo; a screen that draws late beats one that
 * never does.
 */
export const SPLASH_SCREEN_TIMEOUT_MS = 5_000;

let heldAt: number | undefined;
let hidden = false;
let timeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Keeps the native splash screen up until `hideSplashScreen()` is called,
 * instead of letting it drop as soon as the router draws its first frame.
 *
 * Call it once, at module scope of src/root/index.tsx — inside a component or
 * hook it can run after the splash is already gone. Only the real app loads
 * that file, so Storybook and Jest, which import src/root/providers.tsx
 * directly, are never held.
 */
export function keepSplashScreen(): void {
  if (heldAt !== undefined || hidden) return;
  heldAt = Date.now();
  SplashScreen.preventAutoHideAsync().catch((error: unknown) =>
    logger.warn("splash screen could not be held", error),
  );
  // Android fades by default; iOS needs asking. Expo Go can't set options
  // and warns if asked.
  if (!isRunningInExpoGo()) {
    SplashScreen.setOptions({ fade: true, duration: SPLASH_SCREEN_FADE_MS });
  }
  timeout = setTimeout(() => {
    logger.warn(
      `splash screen still up after ${SPLASH_SCREEN_TIMEOUT_MS} ms; hiding it`,
    );
    hideSplashScreen();
  }, SPLASH_SCREEN_TIMEOUT_MS);
}

/**
 * Fades the splash screen out — at once, or as soon as it has been up for
 * `SPLASH_SCREEN_MIN_MS`. Safe to call more than once and from anywhere;
 * only the first call does anything. A no-op on web, which has no native
 * splash screen.
 */
export function hideSplashScreen(): void {
  if (hidden) return;
  hidden = true;
  clearTimeout(timeout);
  const remaining =
    heldAt === undefined ? 0 : heldAt + SPLASH_SCREEN_MIN_MS - Date.now();
  if (remaining <= 0) {
    timeout = undefined;
    SplashScreen.hide();
  } else {
    timeout = setTimeout(() => {
      timeout = undefined;
      SplashScreen.hide();
    }, remaining);
  }
}

/**
 * Hides the splash screen once `ready` turns true — after the commit that
 * drew the ready tree, so the screen behind it is never blank.
 *
 * @example
 * const fontsLoaded = useFonts(...)[0];
 * useHideSplashScreen(fontsLoaded && !isRestoringSession);
 */
export function useHideSplashScreen(ready: boolean): void {
  useEffect(() => {
    if (ready) hideSplashScreen();
  }, [ready]);
}
