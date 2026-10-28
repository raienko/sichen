import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useAnimationDuration } from "@/features/accessibility";
import { useIsRtl } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { easeOutClamped } from "@/utils";

import SwitchRow from "./row";
import type { SwitchImplementationProps, SwitchIndicatorProps } from "./types";

/** Quick enough to keep up with repeated taps, long enough to read as a slide. */
const TOGGLE_DURATION = 180;

/**
 * The track and its thumb. A single progress value, 0 (off) → 1 (on),
 * drives everything — the thumb slides across, grows slightly, and the
 * track and thumb change colour together — so nothing can get out of step
 * with anything else. The first render lands in place without animating;
 * under Reduce Motion the duration is 0 and every change is instant.
 */
function CustomIndicator({ value }: SwitchIndicatorProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const duration = useAnimationDuration();
  const isRTL = useIsRtl();

  // How far the thumb moves: the track's inside width, less the thumb.
  const travel = spacing.x40 - 2 * spacing.x1 - 2 * spacing.x2 - spacing.x16;

  const progress = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: duration(TOGGLE_DURATION),
      easing: easeOutClamped,
    });
  }, [value, duration, progress]);

  const { primary, onPrimary, border } = theme.colors;
  // The off track has no fill: the primary colour at zero opacity, so the
  // fill fades in rather than passing through grey on the way.
  const clearPrimary = `${primary.slice(0, 7)}00`;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [clearPrimary, primary],
    ),
    borderColor: interpolateColor(progress.value, [0, 1], [border, primary]),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    // Off sits at the reading start edge: the left, or the right in RTL.
    // The layer is pinned left-to-right (below), so this offset is
    // physical and native layout can't mirror it a second time.
    const offset = (isRTL ? 1 - progress.value : progress.value) * travel;
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [border, onPrimary],
      ),
      transform: [{ translateX: offset }, { scale: 1 + 0.1 * progress.value }],
    };
  });

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </View>
  );
}

/** The app-owned switch, rendered entirely with React Native primitives. */
export default function CustomSwitch(props: SwitchImplementationProps) {
  return <SwitchRow {...props} Indicator={CustomIndicator} />;
}

const useStyles = createStyles(({ spacing, radius }) => ({
  track: {
    borderRadius: radius.control,
    width: spacing.x40,
    height: spacing.x24,
    padding: spacing.x2,
    borderWidth: spacing.x1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    direction: "ltr",
  },
  thumb: {
    borderRadius: radius.control,
    width: spacing.x16,
    height: spacing.x16,
  },
}));
