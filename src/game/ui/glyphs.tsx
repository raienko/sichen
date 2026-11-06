import Svg, { Circle, Path } from "react-native-svg";

import { palette } from "./palette";

/**
 * The HUD's own line glyphs, drawn on a 24-unit grid with one stroke weight
 * so they read as one family next to the round buttons. Font icons cover
 * the rest until the full set is drawn.
 */
export type GlyphName = "sabre" | "bow" | "eye" | "check" | "menu";

const PATHS: Record<GlyphName, readonly string[]> = {
  // A curved blade, a crossguard and a grip.
  sabre: [
    "M5 19 C9 15 15 10 20 3 C19 9 14 15 8 19",
    "M5 15 L9 19",
    "M3 21 L6 18",
  ],
  // A bow on its side: the limbs, the string and an arrow across.
  bow: [
    "M8 3 C17 6 17 18 8 21",
    "M8 3 L8 21",
    "M3 12 L20 12",
    "M17 9 L20 12 L17 15",
  ],
  // An almond eye; the pupil is a circle below.
  eye: ["M2 12 C6 5.5 18 5.5 22 12 C18 18.5 6 18.5 2 12 Z"],
  check: ["M4 12.5 L9.5 18 L20 6.5"],
  menu: [
    "M12 1 L16 5 L12 9 L8 5 Z",
    "M5 8 L9 12 L5 16 L1 12 Z",
    "M19 8 L23 12 L19 16 L15 12 Z",
    "M12 15 L16 19 L12 23 L8 19 Z",
  ],
};

export function Glyph({
  name,
  size = 22,
  color = palette.ivory,
  weight = 2,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  weight?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {PATHS[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={weight}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {name === "eye" ? <Circle cx={12} cy={12} r={3} fill={color} /> : null}
    </Svg>
  );
}
