import type { Rarity } from "../sim/types";

/**
 * The game's own palette: dark parchment, ember gold and vyshyvanka red.
 * The app's light/dark theme stays for app screens; the game always plays
 * dark. Swapping the look is a matter of this file and the art kit.
 */
export const palette = {
  night: "#0d0b09",
  bg: "#15110d",
  panel: "#1f1914",
  panelHi: "#2a221b",
  line: "#5b4630",
  lineSoft: "#3a2e22",
  text: "#ecdfc6",
  muted: "#a39479",
  faint: "#6d6150",
  gold: "#d4a94e",
  ember: "#e07a2f",
  red: "#b3261e",
  embroidery: "#a3181f",
  hp: "#c0392b",
  mana: "#2f6fd0",
  stamina: "#c9a227",
  xp: "#8a5cd6",
  good: "#5fae5a",
  bad: "#d8513b",
  overlay: "rgba(8, 6, 4, 0.82)",
  shade: "rgba(0, 0, 0, 0.45)",
  white: "#ffffff",
  delivery: { melee: "#d0803a", ranged: "#5ea4d8", mental: "#b07ad8" },
  status: { burn: "#ff7a2f", freeze: "#8fd3ff", stun: "#f2d24b" },
} as const;

export const rarityColor: Record<Rarity, string> = {
  normal: "#cfc8bb",
  magic: "#7b97ff",
  rare: "#f0d14a",
  set: "#4fd06a",
  unique: "#e8873a",
};

/** Hair colours on character creation, in the same order as Look.hairColor. */
export const HAIR_COLORS = [
  "#1d1a17",
  "#5a3a1e",
  "#a9763b",
  "#c9c1b2",
] as const;
export const SKIN_TONES = ["#e0b48f", "#c79670", "#9c6b48"] as const;

/**
 * How dangerous a foe's level is next to the hero's, as a badge colour:
 * grey trivial, green easy, amber even, orange hard, red dangerous (packs
 * this far above the hero charge on sight), purple deadly.
 */
export function levelTone(level: number, heroLevel: number): string {
  const diff = level - heroLevel;
  if (diff <= -5) return "#5c554c";
  if (diff <= -2) return "#3d8a3a";
  if (diff <= 1) return "#a8832e";
  if (diff === 2) return "#cf6f1f";
  if (diff <= 4) return "#c0392b";
  return "#8e3cc8";
}
