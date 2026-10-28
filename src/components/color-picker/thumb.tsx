import { View } from "react-native";

import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type Props = {
  /** Centre of the thumb, in the parent's coordinates. */
  x: number;
  y: number;
  color: string;
};

/**
 * The marker on the square and the bar: the picked colour in a white ring
 * with a black edge. It sits over every possible colour, so it can't take
 * a theme colour — any one of them vanishes against some part of the
 * field. White over black is visible on all of them, in both schemes; the
 * palette's `scanSurface`/`onScanSurface` are that fixed pair.
 */
export default function ColorThumb({ x, y, color }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const size = spacing.x24;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.thumb,
        {
          width: size,
          height: size,
          left: x - size / 2,
          top: y - size / 2,
          backgroundColor: color,
          borderColor: theme.colors.scanSurface,
          outlineColor: theme.colors.onScanSurface,
        },
      ]}
    />
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  thumb: {
    position: "absolute",
    borderRadius: radius.control,
    borderWidth: spacing.x2,
    // The dark edge outside the white ring, so the ring still reads on
    // white and pale colours.
    outlineWidth: spacing.x1,
    outlineStyle: "solid",
  },
}));
