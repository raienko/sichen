import { useEffect, useRef } from "react";
import type { LayoutRectangle } from "react-native";
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

/** How long the highlight takes to slide to a new page, in ms (0 under Reduce Motion). */
const SLIDE_DURATION = 240;

type Props = {
  /** Where the current page's button sits inside the row, once measured. */
  target?: LayoutRectangle;
  /** The owner's id; this part derives its own from it. */
  testID?: string;
};

/**
 * The current page's highlight, drawn once behind the row and slid to
 * whichever page is current — so changing page reads as one thing moving
 * rather than one button switching off and another on.
 *
 * Graphite's selection, not a solid fill: the `selected` tint with an
 * `accent` edge along the bottom. It's decoration — the button above it
 * carries the selected state for assistive technology — so it's hidden
 * from the accessibility tree and ignores touches.
 *
 * The first position is placed without animating, so the bar doesn't fly
 * in from the corner on mount. Under Reduce Motion it moves instantly.
 */
export default function PageIndicator({ target, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const duration = useAnimationDuration();

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!target) return;
    if (!placed.current) {
      placed.current = true;
      x.value = target.x;
      y.value = target.y;
      width.value = target.width;
      height.value = target.height;
      return;
    }
    const timing = {
      duration: duration(SLIDE_DURATION),
      easing: easeOutClamped,
    };
    x.value = withTiming(target.x, timing);
    y.value = withTiming(target.y, timing);
    width.value = withTiming(target.width, timing);
    height.value = withTiming(target.height, timing);
  }, [target, duration, x, y, width, height]);

  const position = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    width: width.value,
    height: height.value,
  }));

  return (
    <Animated.View
      testID={testId(testID, "indicator")}
      pointerEvents="none"
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
  );
}

const useStyles = createStyles(({ radius }) => ({
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: radius.control,
  },
}));
