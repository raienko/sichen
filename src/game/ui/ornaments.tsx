import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { palette } from "./palette";

/** One small, original stitch mark shared by actions and popup rules. */
export function StitchMark({
  size = 23,
  color = palette.bronze,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M3 16h8m10 0h8M16 3v8m0 10v8M11 11l5 5 5-5-5-5-5 5Zm0 10 5-5 5 5-5 5-5-5ZM6 9l3 3-3 3M26 9l-3 3 3 3M6 23l3-3-3-3m20 6-3-3 3-3"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </Svg>
  );
}

/** A quiet weave behind text, used only when a stronger action needs it. */
export function WovenFill({ color = palette.bronze }: { color?: string }) {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox="0 0 200 44"
      preserveAspectRatio="none"
      style={styles.fill}
    >
      <Path
        d="M0 6h200M0 38h200M0 18l12 0 8-8 8 8 12 0 8 8 8-8 12 0 8-8 8 8 12 0 8 8 8-8 12 0 8-8 8 8 12 0 8 8 8-8 12 0 8-8 8 8 12 0M0 26l12 0 8 8 8-8 12 0 8-8 8 8 12 0 8 8 8-8 12 0 8-8 8 8 12 0 8 8 8-8 12 0 8-8 8 8 12 0"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        opacity={0.15}
      />
    </Svg>
  );
}

export function OrnamentRule() {
  return (
    <View style={styles.rule}>
      <View style={styles.line} />
      <StitchMark size={15} color={palette.bronze} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill },
  rule: { width: "100%", flexDirection: "row", alignItems: "center", gap: 8 },
  line: { flex: 1, height: 1, backgroundColor: palette.lineSoft },
});
