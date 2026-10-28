import { useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { LocalValue } from "@/features/storage";

import {
  composePalette,
  type ColorScheme,
  type ThemeOverrides,
} from "./colors";
import ThemeContext from "./context";
import type { Theme, ThemePreference } from "./types";

const themePreference = new LocalValue<ThemePreference>("theme-preference");

export type ThemeProviderConfig = {
  /** Partial application values layered over the core light and dark palettes. */
  overrides?: ThemeOverrides;
};

type Props = {
  children: ReactNode;
  config?: ThemeProviderConfig;
};

export default function ThemeProvider({ children, config }: Props) {
  const systemScheme = useColorScheme();
  const preference = themePreference.useValue() ?? "system";
  const scheme: ColorScheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const palette = useMemo(
    () => composePalette(config?.overrides),
    [config?.overrides],
  );
  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: palette[scheme],
      preference,
      setPreference: (next) => themePreference.setValue(next),
    }),
    [scheme, preference, palette],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
