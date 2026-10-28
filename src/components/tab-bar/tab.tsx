import { useEffect } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { withIconDefaults } from "@/components/icon";
import Text from "@/components/text";
import {
  disabledA11yProps,
  tabA11yProps,
  useAccessibility,
} from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { easeOutClamped, testId } from "@/utils";

import type { TabBarIconState, TabBarItem } from "./types";

/** How long a tab's icon and label take to change colour, in ms. */
export const FADE_DURATION = 200;

/** How much a selected tab's icon and label grow. Kept small: it's a cue, not a bounce. */
export const SELECTED_SCALE = 1.06;

type Props = {
  item: TabBarItem;
  selected: boolean;
  onPress: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  testID?: string;
};

/**
 * One destination: its icon, its label, and the whole column as the touch
 * target — a tab bar's most common miss is a hit area the size of the glyph,
 * which is a quarter of the space the row already reserves for it.
 *
 * The current tab is marked by the bar's indicator — the `selected` tint
 * with an `accent` bar along its top edge — as well as a `text` label, not
 * by recolouring alone: a shift between two greys is the cue greyscale and
 * colour-blind viewers are most likely to lose.
 *
 * **The change of state crossfades.** The icon and label are drawn twice,
 * once in each colour, and the `text` copy fades in over the
 * `textSecondary` one — an icon renders its colour as a glyph or an SVG,
 * so there is no single colour value to interpolate. The copy on top is
 * hidden from assistive technology; the tab's own label already names it.
 * The pair also grows a touch when selected.
 *
 * Under Reduce Motion the growth goes and the crossfade stays: a fade is
 * the substitution Apple's own guidance names for movement, and it isn't
 * movement itself.
 */
export default function Tab({
  item,
  selected,
  onPress,
  onLayout,
  testID,
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const { isReduceMotionEnabled } = useAccessibility();

  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: FADE_DURATION,
      easing: easeOutClamped,
    });
  }, [selected, progress]);

  const grow = isReduceMotionEnabled ? 0 : SELECTED_SCALE - 1;
  const stack = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + grow * progress.value }],
  }));
  const current = useAnimatedStyle(() => ({ opacity: progress.value }));

  function content(color: string, focused: boolean) {
    const size = spacing.x24;
    return (
      <>
        {/* Colour and size filled in from the tab's state, so a call site
            passes `<Icon name="home" />` and nothing else. */}
        {renderIcon(item.icon, { focused, color, size })}
        <Text
          value={item.label}
          type="caption2"
          numberOfLines={1}
          style={[styles.label, { color }]}
        />
      </>
    );
  }

  return (
    <Pressable
      {...tabA11yProps({ label: item.label, selected })}
      testID={testID}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
    >
      <Animated.View
        testID={testId(testID, "content")}
        style={[styles.stack, stack]}
      >
        <View style={styles.content}>
          {content(theme.colors.textSecondary, false)}
        </View>
        <Animated.View
          {...disabledA11yProps()}
          testID={testId(testID, "current")}
          style={[styles.content, styles.overlay, current]}
        >
          {content(theme.colors.text, true)}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function renderIcon(icon: TabBarItem["icon"], state: TabBarIconState) {
  if (typeof icon === "function") return icon(state);
  return withIconDefaults(icon, { color: state.color, size: state.size });
}

const useStyles = createStyles(({ spacing }) => ({
  tab: {
    // Equal shares, so the row divides evenly however many tabs there are
    // and every touch target is the same size.
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.x4,
    // The whole column, not just the glyph.
    alignSelf: "stretch",
    // Room for the indicator's accent bar, reserved on every tab so the
    // glyph doesn't shift under it.
    paddingTop: spacing.x2,
  },
  stack: {
    // The full column width, so both copies truncate a long label at the
    // same point and line up exactly.
    alignSelf: "stretch",
  },
  content: {
    alignItems: "center",
    gap: spacing.x2,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  label: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.6,
  },
}));
