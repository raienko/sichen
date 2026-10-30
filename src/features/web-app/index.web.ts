import { useEffect } from "react";

import { useTheme } from "@/features/theme";

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
 * Keeps the web chrome themed after the app mounts. The service worker is
 * registered in +html.tsx before the app bundle so a failed bundle can still
 * receive a worker update.
 */
export function WebApp() {
  useThemeColor();
  return null;
}
