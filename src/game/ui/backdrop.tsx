import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import type { ZoneDef } from "../sim/types";

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

/** Mixes two 0xRRGGBB colours, t = 0 → a, 1 → b. */
function mix(a: number, b: number, t: number): string {
  const ch = (shift: number) =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) <<
    shift;
  return hex(ch(16) | ch(8) | ch(0));
}

/**
 * The battle scene's backdrop: a dusk sky, two hill lines with tree
 * silhouettes and the ground the fighters stand on, tinted by the zone's
 * palette. Pure vector shapes, so it costs nothing to load and scales to any
 * screen; an art kit with painted backdrops can replace it.
 */
export function BattleBackdrop({ zone }: { zone: ZoneDef }) {
  const { sky, fog, ground } = zone.palette;
  const far = mix(fog, ground, 0.35);
  const near = mix(ground, 0x000000, 0.45);
  const earth = mix(ground, 0x000000, 0.15);
  // A row of fir silhouettes along the near hills.
  const trees = Array.from({ length: 14 }, (_, i) => {
    const x = 20 + i * 72 + ((i * 37) % 23);
    const h = 34 + ((i * 53) % 26);
    const base = 228 + ((i * 29) % 12);
    return `M${x} ${base} L${x + 11} ${base - h} L${x + 22} ${base} Z`;
  }).join(" ");
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={mix(sky, 0x000000, 0.4)} />
            <Stop offset="0.7" stopColor={hex(sky)} />
            <Stop offset="1" stopColor={mix(sky, 0xb0602c, 0.25)} />
          </LinearGradient>
          <LinearGradient id="earth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={earth} />
            <Stop offset="1" stopColor={mix(ground, 0x000000, 0.6)} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1000" height="400" fill="url(#sky)" />
        <Circle cx="760" cy="120" r="26" fill="#e8d9b0" opacity={0.18} />
        <Circle cx="760" cy="120" r="16" fill="#efe3c2" opacity={0.35} />
        <Path
          d="M0 200 Q120 150 240 185 T480 170 T720 180 T1000 160 L1000 260 L0 260 Z"
          fill={far}
          opacity={0.8}
        />
        <Path
          d="M0 235 Q160 205 320 228 T640 220 T1000 225 L1000 280 L0 280 Z"
          fill={near}
        />
        <Path d={trees} fill={near} />
        <Rect x="0" y="262" width="1000" height="138" fill="url(#earth)" />
        <Rect
          x="0"
          y="262"
          width="1000"
          height="2"
          fill="#000000"
          opacity={0.25}
        />
      </Svg>
    </View>
  );
}
