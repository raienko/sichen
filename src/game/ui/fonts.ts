import { Alegreya_700Bold } from "@expo-google-fonts/alegreya/700Bold";
import { useFonts } from "expo-font";

/**
 * The display face for names, headings and single letters: a sturdy book
 * serif with Ukrainian glyphs. Its old-style figures sit low, so numbers
 * stay on the system font. Body text stays on the system font. Until the
 * file loads, text falls back to the system font rather than waiting.
 */
export const DISPLAY_FONT = "Alegreya_700Bold";

export function useGameFonts() {
  useFonts({ [DISPLAY_FONT]: Alegreya_700Bold });
}
