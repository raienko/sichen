import type { ViewStyle } from "react-native";

import { useSizes } from "@/features/responsive";

import useTheme from "./use-theme";

export type ElevationLevel = "raised" | "floating";

const ANDROID_ELEVATION: Record<ElevationLevel, number> = {
  raised: 3,
  floating: 6,
};

/** One cross-platform shadow recipe, with semantic Android elevations. */
export default function useElevationStyle(level: ElevationLevel): ViewStyle {
  const theme = useTheme();
  const { spacing } = useSizes();

  return {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: spacing.x2 },
    shadowOpacity: 0.12,
    shadowRadius: spacing.x8,
    elevation: ANDROID_ELEVATION[level],
  };
}
