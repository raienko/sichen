import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import Image, { type ImageSourceProp } from "@/components/image";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { SKELETON_COLORS } from "./colors";

/** One full breath, in and out, in ms. */
const PULSE_DURATION = 1600;
/** How far the highlight copy fades in at the top of a breath. */
const HIGHLIGHT_OPACITY = 0.5;
/** How far `children` with no artwork to light up dim at the top of one. */
const DIM_OPACITY = 0.45;

const breathe = Easing.inOut(Easing.quad);

/** 0 → 1 → 0 on repeat while `active`; parked at 0 otherwise. */
function usePulse(active: boolean) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION / 2, easing: breathe }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [active, pulse]);

  return pulse;
}

type HighlightProps = {
  active: boolean;
  source: ImageSourceProp;
  contentFit: string | undefined;
  testID?: string;
};

/**
 * The artwork again, in the highlight colour, fading in and out over the
 * base copy. Because it *is* the artwork, the light stays inside the shapes
 * on every platform, with no mask to build: expo-image draws SVG and raster
 * alike on iOS, Android and the web, which react-native-svg's mask `<Image>`
 * does not — on native it can't decode an SVG at all, so a masked sweep
 * there drew nothing.
 */
export function SkeletonHighlight({
  active,
  source,
  contentFit,
  testID,
}: HighlightProps) {
  const theme = useTheme();
  const styles = useStyles();
  const pulse = usePulse(active);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value * HIGHLIGHT_OPACITY,
  }));

  if (!active) return null;

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[styles.fill, style]}
    >
      <Image
        source={source}
        decorative
        contentFit={contentFit as "contain"}
        tintColor={theme.colors[SKELETON_COLORS.highlight]}
        fallback={null}
        style={styles.fill}
      />
    </Animated.View>
  );
}

/**
 * For `children` with no file behind them — an SVG component, several
 * elements — there are no shapes to light up separately, so the skeleton
 * itself breathes instead: this is the opacity for its own root, which
 * leaves the caller's layout untouched. A band swept across the box
 * painted the gaps between the shapes too, and read as a grey panel
 * sliding over the placeholder.
 */
export function useDimStyle(active: boolean) {
  const pulse = usePulse(active);
  return useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * DIM_OPACITY,
  }));
}

const useStyles = createStyles(() => ({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
