import { useIsFocused } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { useTheme } from "@/features/theme";

/**
 * The colour of the status bar's content (clock, battery): `light` is white
 * text for a dark background, `dark` is black text for a light one. `auto`
 * follows the **app's** theme — not the OS appearance, which is what the
 * platform does on its own and gets wrong as soon as someone picks Dark in
 * the app on a phone set to Light. `inverted` is the opposite of `auto`.
 */
export type StatusBarStyle = "auto" | "inverted" | "light" | "dark";

export type StatusBarProps = {
  /** Default `auto` — matches the app theme. */
  style?: StatusBarStyle;
  hidden?: boolean;
  /** Animate a change of style or visibility. Default `true`. */
  animated?: boolean;
};

/**
 * `true` when not inside a navigator at all (a story, a test, the app root),
 * otherwise whether this screen is the focused one.
 *
 * `useIsFocused` throws outside a navigator, after only reading context —
 * no hook state is created before the throw — and whether a component sits
 * inside a navigator never changes while it's mounted, so the hooks called
 * are the same on every render of a given instance.
 */
function useIsFocusedOrStandalone(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true;
  }
}

/**
 * Sets the status bar for as long as it's mounted — the last one mounted
 * wins, and unmounting restores the one before. The app already mounts one
 * that follows the theme (src/root/providers.tsx), so a screen adds its own
 * only to differ: a full-bleed photo, a dark hero on a light app.
 *
 * Inside a navigator it applies only while its screen is focused, because
 * tab screens stay mounted behind the active one and would otherwise keep
 * overriding it.
 *
 * Renders nothing on web, where there is no status bar.
 *
 * @example <StatusBar />                    // follows the app theme (already mounted at the root)
 * @example <StatusBar style="light" />      // white text over a dark image, whatever the theme
 * @example <StatusBar hidden />             // a full-screen viewer
 */
export default function StatusBar({
  style = "auto",
  hidden = false,
  animated = true,
}: StatusBarProps) {
  const { scheme } = useTheme();
  const focused = useIsFocusedOrStandalone();
  if (!focused) return null;

  // Dark theme → light text, and the reverse.
  const themed = scheme === "dark" ? "light" : "dark";
  const resolved = {
    auto: themed,
    inverted: themed === "light" ? "dark" : "light",
    light: "light",
    dark: "dark",
  } as const satisfies Record<StatusBarStyle, "light" | "dark">;

  return (
    <ExpoStatusBar
      style={resolved[style]}
      hidden={hidden}
      animated={animated}
    />
  );
}
