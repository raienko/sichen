import { useIsRestoring } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { LogBox } from "react-native";

import { DevMenu } from "@/features/dev-menu";
import {
  keepSplashScreen,
  useHideSplashScreen,
} from "@/features/splash-screen";
import { WebApp } from "@/features/web-app";
import { isE2E, isWeb } from "@/utils";

import prepareE2EPage from "./e2e-page";
import Providers from "./providers";
import withObserve from "./with-observe";
import type { ProvidersConfig } from "./providers";

export { default as Providers } from "./providers";
export type { ProvidersConfig } from "./providers";

export type RootConfig = ProvidersConfig;

type Props = {
  children: ReactNode;
  /** Provider-specific app configuration; omitted values keep core defaults. */
  config?: RootConfig;
};

/**
 * Wraps the router (mounted once, in src/app/_layout.tsx). This is the single
 * place for:
 * - context providers every screen needs — see providers.tsx
 * - deciding when the app is ready to show — see `SplashScreenGate`
 * - global overlay UI rendered above the current screen. Toasts already
 *   have theirs (`ToastsProvider`, in providers.tsx, so stories and tests
 *   get it too); this is the place for overlay UI the real app alone needs.
 * - global listeners/services that should run for the lifetime of the app
 *   (analytics init, push notification listeners, app-state listeners, ...) —
 *   set those up here via useEffect once there's a concrete one to add.
 *   Ones that Storybook and Jest should get too go in providers.tsx
 *   instead, next to `Permissions` and `DeepLinks`.
 */
// Development warnings stack up as toasts over the bottom of the screen,
// right where a flow taps; an end-to-end run reads its logs elsewhere.
if (isE2E) LogBox.ignoreAllLogs();

// Held from the moment the app loads until SplashScreenGate says it's ready.
// Storybook and Jest import ./providers rather than this file, so they never
// hold it.
keepSplashScreen();

const subscribeNothing = () => () => {};

/**
 * `false` on the server and during hydration, `true` once in the browser —
 * and always `true` on iOS and Android, which have no server render.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => !isWeb,
  );
}

/**
 * Hides the splash screen (held since this file loaded) once everything
 * the first screen needs is in place. Each condition is one line here; add
 * the next (fonts, a restored session, ...) the same way.
 */
function SplashScreenGate() {
  // The persisted query cache, so the first screen draws last launch's data.
  const isRestoring = useIsRestoring();

  useHideSplashScreen(!isRestoring);
  return null;
}

function Root({ children, config }: Props) {
  // The web build has server output so src/app can hold API routes, which
  // means every page is also rendered in Node first. The app reads
  // localStorage, window and the like while rendering, so the server and
  // the first browser render both draw an empty page, and the app mounts
  // right after — the same empty shell a single-page build served.
  const isClient = useIsClient();
  // An end-to-end run drives every platform the same way; on web that needs
  // testIDs as element ids and a page that scrolls (./e2e-page).
  useEffect(() => (isE2E ? prepareE2EPage() : undefined), []);
  if (!isClient) return null;

  return (
    <Providers config={config}>
      <SplashScreenGate />
      {children}
      <WebApp />
      <DevMenu />

      {/* Global overlay UI the real app alone needs goes here. */}
    </Providers>
  );
}

export default withObserve(Root);
