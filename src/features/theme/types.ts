import { colors, type ColorScheme, type ThemeColors } from "./colors";

export type ThemePreference = ColorScheme | "system";

// Derived from palette.json's own keys (not hand-typed) so a new scheme
// added there shows up here — and in ThemeSwitcher, which imports this —
// automatically.
export const THEME_PREFERENCES: ThemePreference[] = [
  ...(Object.keys(colors) as ColorScheme[]),
  "system",
];

export type Theme = {
  /** The resolved scheme actually in effect (preference "system" resolved against the OS setting). */
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};
