import { useEffect, useRef } from "react";
import { View, type LayoutRectangle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  disabledA11yProps,
  useAnimationDuration,
} from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { easeOutClamped, testId } from "@/utils";

/** How long the indicator takes to slide to a new segment, in ms (0 under Reduce Motion). Matches TabBar's. */
export const SLIDE_DURATION = 240;

type Props = {
  /** Where the selected segment sits inside the track, once measured. */
  target?: LayoutRectangle;
  /** The owner's id; this part derives its own from it. */
  testID?: string;
};

/**
 * The current segment's marking — the `selected` tint and the `accent` bar
 * along its bottom edge — drawn once behind the segments and slid to
 * whichever is chosen, the way TabBar's indicator moves between tabs. A
 * change of choice then reads as one thing moving rather than one segment
 * switching off and another on.
 *
 * Decoration only: each segment's radio state is what assistive technology
 * hears, so this is hidden from the accessibility tree and takes no
 * touches.
 *
 * Positioned from the segment's own measured layout, not an index times an
 * equal share, so the separators' hairlines can't push it out of register.
 * Measured `x` is physical (from the left), so the layer it moves in is
 * pinned to `ltr`, or native RTL would mirror the offset a second time.
 *
 * The first position is placed without animating, so it doesn't slide in
 * from the corner on mount. Under Reduce Motion it moves instantly.
 */
export default function SegmentIndicator({ target, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const duration = useAnimationDuration();

  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const placed = useRef<LayoutRectangle | undefined>(undefined);

  useEffect(() => {
    // Also skips a re-run that changes nothing, so a new `duration`
    // identity can't restart a slide that's already under way.
    if (!target || sameRect(placed.current, target)) return;
    const first = placed.current === undefined;
    placed.current = target;
    if (first) {
      x.value = target.x;
      width.value = target.width;
      height.value = target.height;
      return;
    }
    const timing = {
      duration: duration(SLIDE_DURATION),
      easing: easeOutClamped,
    };
    x.value = withTiming(target.x, timing);
    width.value = withTiming(target.width, timing);
    height.value = withTiming(target.height, timing);
  }, [target, duration, x, width, height]);

  const position = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: width.value,
    height: height.value,
  }));

  return (
    <View
      testID={testId(testID, "indicator-layer")}
      pointerEvents="none"
      style={styles.layer}
    >
      <Animated.View
        testID={testId(testID, "indicator")}
        {...disabledA11yProps()}
        style={[
          styles.indicator,
          {
            backgroundColor: theme.colors.selected,
            borderBottomColor: theme.colors.accent,
            borderBottomWidth: spacing.x2,
            opacity: target ? 1 : 0,
          },
          position,
        ]}
      />
    </View>
  );
}

function sameRect(a: LayoutRectangle | undefined, b: LayoutRectangle) {
  return (
    a !== undefined &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

const useStyles = createStyles(() => ({
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    direction: "ltr",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
  },
}));
