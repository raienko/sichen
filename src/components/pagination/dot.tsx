import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  controlA11yProps,
  useAnimationDuration,
} from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { easeOutClamped, testId } from "@/utils";

type Props = {
  active: boolean;
  label: string;
  onPress: () => void;
  orientation: "horizontal" | "vertical";
  testID?: string;
};

/** How long a dot takes to grow or shrink, in ms (0 under Reduce Motion). */
const DOT_DURATION = 220;

/**
 * One dot.
 *
 * **It animates between states, not along a drag.** When the page changes
 * the dot that lost it shrinks and fades to `border` while the new one
 * grows into `accent`, over the same 220 ms, so the length looks like it
 * travels. It's driven by `active` alone — the settled page — never by a
 * carousel's live scroll progress: interpolating that produced two iOS
 * press bugs and was removed (see `Pagination`). Only the inner shape
 * animates; the `Pressable` target never moves or resizes.
 *
 * **The pressable area is a real box, not `hitSlop`.** An 8pt dot needs a
 * touch target several times its size, and the obvious way to get one is
 * `hitSlop` — which is wrong here, because dots sit a few points apart and
 * the slop then overlaps every neighbour. Overlapping targets do not
 * average out: the topmost wins, so on iOS every press landed on the last
 * dot rendered and the earlier ones could not be pressed at all. Sizing the
 * `Pressable` itself makes the targets tile instead of stack.
 */
export default function PaginationDot({
  active,
  label,
  onPress,
  orientation,
  testID,
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const duration = useAnimationDuration();

  const rest = spacing.x8;
  const grown = spacing.x20;
  const vertical = orientation === "vertical";
  const idle = theme.colors.border;
  const current = theme.colors.accent;

  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: duration(DOT_DURATION),
      easing: easeOutClamped,
    });
  }, [active, duration, progress]);

  const shape = useAnimatedStyle(() => {
    const length = rest + (grown - rest) * progress.value;
    return {
      width: vertical ? rest : length,
      height: vertical ? length : rest,
      // Longer as well as recoloured: colour is never the sole carrier of
      // state (WCAG 1.4.1), and a shape change survives greyscale.
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [idle, current],
      ),
    };
  });

  return (
    <Pressable
      testID={testID}
      // A plain Pressable has no role of its own — the gap `Button` shipped
      // with. `selected` is what makes a screen reader say which one you
      // are on.
      {...controlA11yProps({ label, selected: active })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.target,
        pressed ? { backgroundColor: theme.colors.pressed } : null,
      ]}
    >
      <Animated.View
        testID={testId(testID, "shape")}
        style={[styles.dot, shape]}
      />
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  target: {
    // The target, not the dot. Wide enough to press and narrow enough that
    // a row of them still reads as a row.
    width: spacing.x32,
    height: spacing.x32,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: radius.indicator,
  },
}));
