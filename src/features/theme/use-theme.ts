import { useContext } from "react";

import ThemeContext from "./context";
import type { Theme } from "./types";

export default function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}
