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

import sameRect from "./same-rect";

/** How long the indicator takes to slide to a new tab, in ms (0 under Reduce Motion). */
export const SLIDE_DURATION = 240;

type Props = {
  /** Where the selected tab sits inside the row, once measured. */
  target?: LayoutRectangle;
  /** The owner's id; this part derives its own from it. */
  testID?: string;
};

/**
 * The selected tab's indicator, drawn once behind the row and slid to
 * whichever tab is selected — so switching tabs reads as one thing moving
 * rather than one tab switching off and another on. The same shape as
 * `Pagination`'s highlight.
 *
 * Graphite's selection, not a solid fill: the `selected` tint with an
 * `accent` bar along the top edge. It's decoration — the tab above it
 * carries the selected state for assistive technology — so it's hidden from
 * the accessibility tree and ignores touches.
 *
 * Its position and width come from the tab's own measured layout, not from
 * an index times an equal share, so a row whose tabs differ in width still
 * lands under the right one. Measured `x` is always physical (from the
 * left), so the layer it moves in is pinned to `ltr`: under native RTL
 * Yoga would otherwise read `left` as the leading edge and mirror the
 * offset a second time.
 *
 * The first position is placed without animating, so the indicator doesn't
 * fly in from the corner on mount. Under Reduce Motion it moves instantly.
 */
export default function TabIndicator({ target, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const duration = useAnimationDuration();

  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const placed = useRef<LayoutRectangle | undefined>(undefined);

  useEffect(() => {
    // Also skips a re-run that changes nothing — the accessibility settings
    // arriving hand `duration` a new identity, and re-timing to the same
    // spot would restart an animation already under way.
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
            borderTopColor: theme.colors.accent,
            borderTopWidth: spacing.x2,
            opacity: target ? 1 : 0,
          },
          position,
        ]}
      />
    </View>
  );
}

const useStyles = createStyles(({ radius }) => ({
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
    borderRadius: radius.indicator,
  },
}));
