import { useEffect } from "react";

import { useTheme } from "@/features/theme";

/**
 * Registers public/sw.js, which caches the app so the installed web app
 * opens offline. Production only: in development the worker would answer
 * with cached bundles instead of Metro's live ones.
 */
function registerServiceWorker() {
  if (__DEV__ || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Not fatal: the app works without it, only not offline. Browsers
    // refuse it on plain http and in some private modes.
  });
}

/**
 * Keeps `<meta name="theme-color">` — the browser bar, and the title bar
 * of the installed app — on the active theme's background, so it follows
 * light/dark like the rest of the page.
 */
function useThemeColor() {
  const { colors } = useTheme();
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = colors.background;
  }, [colors.background]);
}

/**
 * What makes the web build an installable app at runtime; the manifest and
 * icons it installs with are written by `yarn brand` into public/. Mounted
 * once, in Root.
 */
export function WebApp() {
  useEffect(registerServiceWorker, []);
  useThemeColor();
  return null;
}
