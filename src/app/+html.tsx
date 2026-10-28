import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import env from "@/constants/env";
import { colors } from "@/features/theme";

/**
 * The web page every route renders into — server output takes it from here
 * rather than public/index.html. Runs in Node at build/request time only,
 * so nothing here reaches the app bundle and no browser API is available.
 */
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-web-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* The light background until the app loads; then
            @/features/web-app keeps it on the active theme. */}
        <meta name="theme-color" content={colors.light.background} />
        {/* Body doesn't scroll; ScrollViews do (react-native-web's reset). */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
