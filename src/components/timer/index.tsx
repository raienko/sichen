import { useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import If from "@/components/if";
import Text from "@/components/text";
import { imageA11yProps } from "@/features/accessibility";
import { createStyles, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import {
  describeDuration,
  formatDuration,
  type DurationFormat,
} from "./duration";
import TimerRing from "./ring";
import { useTimer } from "./use-timer";

export type { DurationFormat } from "./duration";
export {
  describeDuration,
  formatDuration,
  msUntilNextSecond,
  toSeconds,
} from "./duration";

/** How thick the ring is, as a fraction of its diameter. */
const RING_THICKNESS = 0.07;
/** Room for the ring, so the digits never sit under it. */
const RING_INSET = 0.22;

/**
 * Counting down to a moment, or up from one. Exactly one, as a union: a
 * component given both has no sensible answer, and one given neither has
 * nothing to count.
 */
type DirectionProps =
  | {
      /** The deadline. Counts down, and stops at zero. */
      until: Date | number;
      since?: never;
      /**
       * Draws the draining ring. Countdown only — counting up has no total
       * to be a fraction of, so there is nothing for a ring to show.
       */
      ring?: boolean;
      /** Fires once, when the deadline passes. */
      onComplete?: () => void;
    }
  | {
      until?: never;
      /** The start. Counts up, with no end — a stopwatch. */
      since: Date | number;
      ring?: never;
      onComplete?: never;
    };

type Props = DirectionProps & {
  /**
   * What is being timed — "Time remaining", "Session length". Required: a
   * bare `4:07` on screen says nothing about what it is counting, and a
   * screen reader has only this to go on.
   */
  label: string;
  /** Defaults to `"auto"` — see `DurationFormat`. */
  format?: DurationFormat;
  /** Which step of the type scale the digits take. Defaults to `"title1"`. */
  type?: TypographyToken;
  /** The ring's diameter in points. Defaults to 120. */
  size?: number;
  /** Freezes the display and the ring where they are. */
  paused?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A countdown or a stopwatch.
 *
 * ```tsx
 * <Timer label="Time remaining" until={expiresAt} ring onComplete={expire} />
 * <Timer label="Session length" since={startedAt} type="body" />
 * ```
 *
 * **The two halves run at different rates, on purpose.** The digits change
 * once a second, so they are React state and cost one cheap re-render a
 * second. The ring changes every frame, so it is a `withTiming` on a shared
 * value read straight into the circle's `strokeDashoffset` — it runs on the
 * UI thread, never re-renders React, and stays smooth while JavaScript is
 * busy. Driving both from one clock would mean either a ring that jumps in
 * sixty steps or sixty React renders a second for something React does not
 * need to know about.
 *
 * **It cannot drift.** Every value is `Date.now()` measured against the
 * target rather than a count of elapsed ticks, so it is still correct after
 * the app was backgrounded, after the device slept, and after a slow frame.
 * The redraw is scheduled to the next *second boundary* rather than a flat
 * 1000ms, so each one lands when the digits actually change — once each,
 * instead of drifting through the second and sometimes firing twice in one.
 *
 * **The digits are tabular.** In a proportional font `11:11` is narrower
 * than `00:00`, so a timer laid out normally jiggles every second and
 * shoves whatever is beside it. `fontVariant: ["tabular-nums"]` fixes the
 * width of every digit; it is the difference between a timer and a timer
 * that looks broken.
 *
 * **A screen reader hears words, not a clock face.** `4:07` is announced as
 * "four oh seven", which is a time of day rather than a length of one, so
 * the spoken form is built separately — "4 minutes 7 seconds". It is the
 * element's *value* rather than a live region: a timer that announced
 * itself every second would talk over everything else on the screen, so it
 * is read on demand like any other value.
 *
 * @example <Timer label="Offer ends in" until={endsAt} ring size={160} />
 * @example <Timer label="Recording" since={startedAt} type="headline" />
 */
export default function Timer({
  until,
  since,
  ring = false,
  onComplete,
  label,
  format = "auto",
  type = "title1",
  size = 120,
  paused = false,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  const counting = until !== undefined;
  const target = Number(counting ? until : since);

  // The moment the countdown was handed to us, which is the only thing that
  // can stand in for a total: a deadline says when it ends and nothing
  // about when it began.
  const [startedAt] = useState(() => Date.now());
  const total = counting ? Math.max(1, target - startedAt) : 0;

  const { value } = useTimer({
    target,
    direction: counting ? -1 : 1,
    paused,
    onComplete,
  });

  const digits = formatDuration(value, format);
  const showRing = counting && ring;

  return (
    <View
      testID={testID}
      // One element with a name and a value, rather than a live region: a
      // timer that announced every second would talk over the screen.
      {...imageA11yProps({ label })}
      accessibilityValue={{ text: describeDuration(value) }}
      aria-valuetext={describeDuration(value)}
      style={[
        styles.timer,
        showRing ? { width: size, height: size } : null,
        style,
      ]}
    >
      <If condition={showRing}>
        <TimerRing
          size={size}
          thickness={size * RING_THICKNESS}
          // What has already elapsed, which is where this sweep starts.
          progress={Math.min(1, Math.max(0, 1 - value / total))}
          remaining={value}
          paused={paused}
          color={theme.colors.accent}
        />
      </If>
      <Text
        value={digits}
        type={type}
        style={[
          styles.digits,
          showRing ? { paddingHorizontal: size * RING_INSET } : null,
        ]}
      />
    </View>
  );
}

const useStyles = createStyles(() => ({
  timer: {
    // Sized by its own content, or by `size` when there is a ring.
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  digits: {
    // `11:11` is narrower than `00:00` in a proportional font, so a timer
    // without this jiggles every second and shoves its neighbours.
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
}));
