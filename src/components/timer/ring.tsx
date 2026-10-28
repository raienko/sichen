import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useAccessibility } from "@/features/accessibility";
import { useTheme } from "@/features/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Outer diameter in points. */
  size: number;
  /** Stroke thickness in points. */
  thickness: number;
  /** How far through, 0 to 1, at the moment this mounted or last changed. */
  progress: number;
  /** Milliseconds left to run, which is how long the sweep should take. */
  remaining: number;
  paused: boolean;
  color: string;
};

/**
 * The draining ring behind a timer's digits.
 *
 * **This is the whole reason the component is animated rather than merely
 * ticking, and it never touches React.** The sweep is one `withTiming` on a
 * shared value, read by `useAnimatedProps` into the circle's
 * `strokeDashoffset` — so it runs on the UI thread at the display's own
 * rate, and stays smooth while JavaScript is busy. Driving it from the
 * once-a-second state the digits use would produce a ring that jumps in
 * sixty steps; driving it from a 60fps React render would be sixty renders
 * a second for something React does not need to know about.
 *
 * **A single timing to the end, not a per-frame recomputation.** The
 * remaining milliseconds *are* the duration, so one animation started once
 * describes the entire sweep. It is re-issued only when the timer itself
 * changes — a new deadline, a pause, a resume — which is the same reason
 * `ProgressBar`'s determinate fill is a `withTiming` rather than a frame
 * callback.
 */
export default function TimerRing({
  size,
  thickness,
  progress,
  remaining,
  paused,
  color,
}: Props) {
  const theme = useTheme();
  const { isReduceMotionEnabled } = useAccessibility();

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const swept = useSharedValue(progress);

  useEffect(() => {
    swept.value = progress;
    if (paused || remaining <= 0) return;

    // Linear on purpose: an eased sweep would mean the ring and the digits
    // disagree about how much time is left, which is the one thing a timer
    // must not do.
    swept.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
    // `progress` is the value this sweep starts from and is captured above;
    // re-running on it would restart the animation every second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, paused, swept]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * swept.value,
  }));

  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.colors.backgroundElementSelected}
        strokeWidth={thickness}
        fill="none"
      />
      <AnimatedCircle
        animatedProps={animatedProps}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        // Starts at twelve o'clock rather than three, which is where every
        // clock face a user has ever seen starts.
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        // Reduce Motion gets the ring at its true position without the
        // sweep: the number beside it already says how long is left, so
        // there is nothing the movement alone was carrying.
        {...(isReduceMotionEnabled
          ? { strokeDashoffset: circumference * progress }
          : null)}
      />
    </Svg>
  );
}
