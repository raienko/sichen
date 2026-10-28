import { useEffect, useState } from "react";
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { progressA11yProps, useAccessibility } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

/** How long the fill takes to travel to a newly reported value. */
const FILL_DURATION = 250;
/** One pass of the indeterminate segment across the track. */
const SWEEP_DURATION = 1200;
/** One half of the Reduce Motion cross-fade that replaces that sweep. */
const PULSE_DURATION = 900;
/** How much of the track the indeterminate segment occupies. */
const SWEEP_WIDTH = 0.35;

export type ProgressBarSize = "small" | "medium";

type Props = {
  /**
   * How far along, from 0 to 1. Out-of-range values are clamped, so a
   * caller dividing by a total that turns out to be 0 gets an empty bar
   * rather than a fill running off the end.
   *
   * Omit it for an indeterminate bar — the case where something is
   * happening but there is no total to measure against. That is a genuine
   * claim rather than a missing prop, which is why it isn't `0` by default:
   * a bar reporting 0% says the work hasn't started, not that its size is
   * unknown.
   */
  value?: number;
  /**
   * What is progressing — "Uploading photos". Required, and not shown: it
   * is the bar's accessible name, and a progress bar has no text of its own
   * for a screen reader to derive one from.
   */
  label: string;
  /**
   * How the fraction is read out. Defaults to a whole percentage ("42%").
   * Pass your own for a count ("3 of 7 uploaded") or a rate.
   */
  formatValue?: (value: number) => string;
  /** Bar thickness. Defaults to `"medium"`. */
  size?: ProgressBarSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function clamp(value: number): number {
  // Only NaN is genuinely meaningless — the empty bar is the honest answer
  // for it. An infinity is just past the end, and `Math.min`/`Math.max`
  // already pin it to the right edge, so it isn't lumped in here.
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * A horizontal bar showing how far along a task is — an upload, a download,
 * a multi-step form.
 *
 * Reach for `Spinner` instead when the wait is short and shapeless; a bar
 * earns its space by answering "how much longer", which is also why an
 * indeterminate bar (`value` omitted) is the weaker of the two states and
 * not the default.
 *
 * **Both states honour Reduce Motion, differently.** A determinate fill
 * goes through `duration()`, so it lands on the new value instantly instead
 * of gliding. The indeterminate sweep can't just stop — the movement *is*
 * the signal that something is happening — so it becomes a cross-fade
 * instead, which is the substitution Apple's own guidance names: the bar
 * still reads as active without anything travelling across the screen.
 *
 * @example <ProgressBar value={uploaded / total} label="Uploading photos" />
 * @example <ProgressBar label="Checking for updates" />
 * @example
 * <ProgressBar
 *   value={step / steps}
 *   label="Setup"
 *   formatValue={(v) => `Step ${Math.round(v * steps)} of ${steps}`}
 * />
 */
export default function ProgressBar({
  value,
  label,
  formatValue,
  size = "medium",
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();
  const { duration, isReduceMotionEnabled } = useAccessibility();
  const [trackWidth, setTrackWidth] = useState(0);

  const indeterminate = value === undefined;
  const fraction = indeterminate ? 0 : clamp(value);
  const valueText = indeterminate
    ? t("common.loading")
    : (formatValue?.(fraction) ?? `${Math.round(fraction * 100)}%`);

  const progress = useSharedValue(fraction);
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (indeterminate) return;
    // 0 under Reduce Motion, which lands the fill on the new value rather
    // than gliding it there — the value still updates either way.
    progress.value = withTiming(fraction, {
      duration: duration(FILL_DURATION),
    });
  }, [fraction, indeterminate, progress, duration]);

  useEffect(() => {
    if (!indeterminate || trackWidth === 0) return;

    if (isReduceMotionEnabled) {
      // Nothing travels; the bar fades in and out in place instead.
      pulse.value = withRepeat(
        withTiming(0.35, { duration: PULSE_DURATION }),
        -1,
        true,
      );
      return;
    }

    sweep.value = 0;
    sweep.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION }),
      -1,
      false,
    );
  }, [indeterminate, isReduceMotionEnabled, trackWidth, sweep, pulse]);

  const fillStyle = useAnimatedStyle(() => {
    if (!indeterminate) {
      return { width: `${progress.value * 100}%`, opacity: 1, transform: [] };
    }

    if (isReduceMotionEnabled) {
      return {
        width: "100%" as const,
        opacity: pulse.value,
        transform: [],
      };
    }

    const segment = trackWidth * SWEEP_WIDTH;
    return {
      width: segment,
      opacity: 1,
      // Starts fully off the leading edge and ends fully off the trailing
      // one, so the segment enters and leaves rather than popping.
      transform: [
        { translateX: -segment + sweep.value * (trackWidth + segment) },
      ],
    };
  });

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      {...progressA11yProps({
        label,
        // Undefined for an indeterminate bar, which is how ARIA spells
        // "the total isn't known" — see progressA11yProps.
        value: indeterminate ? undefined : fraction,
        valueText,
      })}
      testID={testID}
      onLayout={handleLayout}
      style={[
        styles.track,
        styles[size],
        { backgroundColor: theme.colors.backgroundElementSelected },
        style,
      ]}
    >
      <Animated.View
        testID={testId(testID, "fill")}
        style={[
          styles.fill,
          { backgroundColor: theme.colors.primary },
          fillStyle,
        ]}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  track: {
    borderRadius: radius.indicator,
    // Fills whatever contains it rather than picking a width of its own —
    // same reason `Accordion` and `Card` use alignSelf rather than a width.
    alignSelf: "stretch",
    // Keeps the sweeping segment inside the track instead of
    // sliding out past its ends.
    overflow: "hidden",
    // The track is `backgroundElementSelected` rather than
    // `backgroundElement`: the latter is what most raised surfaces already
    // use, so an unfilled bar sitting on a `Card` would be invisible.
    justifyContent: "center",
  },
  small: {
    height: spacing.x4,
  },
  medium: {
    height: spacing.x8,
  },
  fill: {
    borderRadius: radius.indicator,
    height: "100%",
  },
}));
