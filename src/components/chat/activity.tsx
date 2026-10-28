import { useEffect, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import If from "@/components/if";
import Text from "@/components/text";
import {
  disabledA11yProps,
  statusA11yProps,
  useAnimationDuration,
} from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { activitySentence } from "./format";
import type { ChatActivity, ChatParticipant } from "./types";

type Props = {
  activity: readonly ChatActivity[];
  participants: ReadonlyMap<string, ChatParticipant>;
  /** Left out of the sentence — nobody needs telling that they are typing. */
  currentUserId: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const DOT_COUNT = 3;
const STEP_MS = 300;

function Dot({ index }: { index: number }) {
  const theme = useTheme();
  const styles = useStyles();
  const duration = useAnimationDuration();
  const opacity = useSharedValue(1);
  const step = duration(STEP_MS);

  useEffect(() => {
    // Reduce Motion gives a zero duration: the dots then simply stay put,
    // which still reads as "something is happening" next to the sentence.
    if (step === 0) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0.3;
    opacity.value = withDelay(
      index * step,
      withRepeat(
        withSequence(
          withTiming(1, { duration: step }),
          withTiming(0.3, { duration: step }),
          withTiming(0.3, { duration: step * (DOT_COUNT - 2) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [index, opacity, step]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: theme.colors.textSecondary },
        animated,
      ]}
    />
  );
}

/**
 * What the others in the chat are doing right now — "Ada is typing…",
 * "Ada and Grace are recording audio…", "4 people are typing…" — with the
 * three pulsing dots chat apps have taught everyone to read.
 *
 * **Renders nothing when nobody is doing anything**, so it can stay mounted
 * at the foot of the thread and simply appear.
 *
 * **A polite live region**, so a screen reader hears it once when it starts
 * or changes, without interrupting. The dots are hidden from it and stop
 * moving under Reduce Motion.
 *
 * @example <Chat.Activity activity={activity} participants={people} currentUserId={me} />
 */
export default function Activity({
  activity,
  participants,
  currentUserId,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  const sentence = useMemo(
    () => activitySentence(activity, participants, currentUserId, locale, t),
    [activity, participants, currentUserId, locale, t],
  );

  return (
    <If condition={sentence}>
      <View testID={testID} style={[styles.row, style]}>
        <View {...disabledA11yProps()} style={styles.dots}>
          {Array.from({ length: DOT_COUNT }, (_, index) => (
            <Dot key={index} index={index} />
          ))}
        </View>
        <View {...statusA11yProps()}>
          <Text
            value={sentence}
            type="footnote"
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary }}
          />
        </View>
      </View>
    </If>
  );
}

const useStyles = createStyles(({ units, spacing, radius, isRTL }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
  },
  dots: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: units(3),
  },
  dot: {
    width: units(6),
    height: units(6),
    borderRadius: radius.indicator,
  },
}));
