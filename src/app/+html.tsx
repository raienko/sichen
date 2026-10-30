import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import env from "@/constants/env";
import { colors } from "@/features/theme";

/**
 * The web page every route renders into — server output takes it from here
 * rather than public/index.html. Runs in Node at build/request time only,
 * so nothing here reaches the app bundle and no browser API is available.
 */
/** "" on a domain root, "/<repo>" on GitHub Pages (app.config.ts). */
const BASE = process.env.EXPO_BASE_URL ?? "";

// Runs before the deferred app bundle. If an older worker blocks that bundle,
// React never mounts and cannot register its replacement from an effect.
const WORKER_BOOTSTRAP = `
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
  navigator.serviceWorker.register("${BASE}/sw.js", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch(() => {});
}`;

export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover lets the installed app draw under the notch;
            the safe-area insets keep content clear of it. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>{env.appName}</title>
        {/* Installable app: manifest.json and the icons are written by
            `yarn brand` from assets/brand. */}
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE}/icon-web-192.png`} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* The installed iOS app draws under a transparent status bar (white
            text); the game is always dark, and its HUD pads for the inset. */}
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* Dark until the app loads; then @/features/web-app keeps it on the
            active theme, which the game pins to dark. */}
        <meta name="theme-color" content={colors.dark.background} />
        <style>{`html, body { background-color: ${colors.dark.background}; }`}</style>
        {process.env.NODE_ENV === "production" ? (
          <script dangerouslySetInnerHTML={{ __html: WORKER_BOOTSTRAP }} />
        ) : null}
        {/* Body doesn't scroll; ScrollViews do (react-native-web's reset). */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
