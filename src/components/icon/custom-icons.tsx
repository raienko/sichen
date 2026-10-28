import Svg, { Path } from "react-native-svg";

import type { CustomIconProps } from "./types";

/**
 * Custom SVG icons not covered by react-native-vector-icons. Add a new one
 * by adding a component here and one line to CUSTOM_ICONS below — nothing
 * else needs to change.
 */
function Logo({ size = 12, color }: CustomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l9-9 9 9M5 10v10h14V10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const CUSTOM_ICONS = {
  logo: Logo,
};

export type CustomIconName = keyof typeof CUSTOM_ICONS;
