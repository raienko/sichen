import { useFonts } from "expo-font";

/** The same face is used throughout the game until a final type system lands. */
export const DISPLAY_FONT = "Zakon";

export function useGameFonts() {
  useFonts({ [DISPLAY_FONT]: require("../assets/Zakon-Regular.ttf") });
}
