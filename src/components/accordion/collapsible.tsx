import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import If from "@/components/if";
import { easeOutClamped } from "@/utils/easing";

/** How long opening waits for the content's first measurement, in ms. */
const MEASURE_TIMEOUT = 300;

type Props = {
  open: boolean;
  /** Already through `useAnimationDuration()`, so 0 under Reduce Motion. */
  duration: number;
  contentStyle?: StyleProp<ViewStyle>;
  contentTestID?: string;
  children: ReactNode;
};

/**
 * Content that grows and fades in, and shrinks and fades out, by animating
 * a clip's height towards the content's measured one. The sections below
 * move with it through ordinary layout, on every platform alike.
 *
 * Three details make that hold up on device:
 *
 * - While animating, the content is laid out absolutely inside the clip.
 *   In normal flow, Yoga squeezes it to fit the pinned clip (down to its
 *   padding), so its measured height is wrong until the animation is over.
 * - Opening waits for the first measurement. A heavy section can take
 *   several frames to mount, and starting the clock on the tap meant most
 *   of the animation ran towards a height of zero, then popped.
 * - At rest, open, the clip is `auto` and the content back in flow, so
 *   content that changes size while open is never clipped or lagged.
 *
 * Reanimated's layout transitions would have avoided the measuring, but on
 * Android they sometimes never apply the final layout (the section stays at
 * its first child's height, overlapping everything below), and on the web
 * they're drawn as a scale.
 */
export default function Collapsible({
  open,
  duration,
  contentStyle,
  contentTestID,
  children,
}: Props) {
  // Stays true through the collapse so the content can animate out.
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const contentHeight = useSharedValue(0);
  const animating = useSharedValue(false);

  // Whether the mounted content has reported its height yet, and whether
  // this opening has started — refs, because measuring and the effect below
  // can land in either order.
  const measured = useRef(false);
  const started = useRef(open);

  // Decided during render, so the content mounts in the same commit.
  if (open && !mounted) setMounted(true);

  function unmount() {
    measured.current = false;
    setMounted(false);
  }

  function expand() {
    started.current = true;
    animating.value = true;
    progress.value = withTiming(
      1,
      { duration, easing: easeOutClamped },
      (finished) => {
        if (finished) animating.value = false;
      },
    );
  }

  useEffect(() => {
    if (open) {
      // Re-opened mid-collapse: still mounted and measured, so go now.
      // Otherwise the first measurement starts it — or, if none arrives
      // (a browser tab in the background delivers no layout events), this
      // does, so a section never stays shut; it then opens to `auto`.
      if (measured.current && !started.current) expand();
      const fallback = setTimeout(() => {
        if (!started.current) expand();
      }, MEASURE_TIMEOUT);
      return () => clearTimeout(fallback);
    }
    started.current = false;
    animating.value = true;
    progress.value = withTiming(
      0,
      { duration, easing: easeOutClamped },
      // A toggle mid-animation cancels this one; only the last one settles.
      (finished) => {
        if (finished) runOnJS(unmount)();
      },
    );
    // expand/unmount only touch refs, setters and shared values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, duration]);

  function measure(event: LayoutChangeEvent) {
    contentHeight.value = event.nativeEvent.layout.height;
    measured.current = true;
    // `open` from this render — the handler is recreated on every one.
    if (open && !started.current) expand();
  }

  const clipStyle = useAnimatedStyle(() => ({
    height: animating.value
      ? progress.value * contentHeight.value
      : progress.value === 1
        ? "auto"
        : 0,
    opacity: progress.value,
  }));

  const contentLayout = useAnimatedStyle(() => ({
    position: animating.value || progress.value < 1 ? "absolute" : "relative",
  }));

  return (
    <If condition={mounted}>
      <Animated.View style={[clip, clipStyle]}>
        <Animated.View style={[fill, contentLayout]}>
          {/* Measured on a plain View: on the web, Animated.View doesn't
              forward onLayout. */}
          <View testID={contentTestID} style={contentStyle} onLayout={measure}>
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </If>
  );
}

const clip = { overflow: "hidden" } as const;
// Offsets for the absolute case; no effect once back in flow.
const fill = { top: 0, left: 0, right: 0 } as const;
