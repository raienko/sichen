import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Icon from "@/components/icon";
import Text from "@/components/text";
import {
  controlA11yProps,
  useAnimationDuration,
} from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { easeOutClamped } from "@/utils/easing";
import { testId } from "@/utils/test-id";

import Collapsible from "./collapsible";

/** Short enough to feel instant on a tap, long enough to read as motion. */
const ANIMATION_DURATION = 220;

type Props = {
  title: string;
  /**
   * The header — the part a test taps — gets this id; the content inside
   * gets `<testID>.content` while it's open.
   */
  testID?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * A titled, collapsible section — tap the header to toggle. The chevron on
 * the right rotates 180° between collapsed/open instead of swapping between
 * two icon assets, so there's only ever one glyph to keep in sync with
 * state.
 *
 * It draws no box — only a hairline under each section — so a stack of
 * them reads as one ruled list rather than a pile of cards.
 *
 * Content grows and fades in, and shrinks and fades out, on the same
 * timing as the chevron — see ./collapsible.tsx. Collapsed content is
 * unmounted, so a closed section costs nothing to render.
 */
export default function Accordion({
  title,
  testID,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const duration = useAnimationDuration();

  // duration() collapses to 0 under "Reduce Motion" — everything still
  // ends up in the right place, it just doesn't move to get there.
  const ms = duration(ANIMATION_DURATION);

  function toggle() {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 1 : 0, {
      duration: ms,
      easing: easeOutClamped,
    });
  }

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View
      style={[styles.container, { borderBottomColor: theme.colors.divider }]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed ? { backgroundColor: theme.colors.pressed } : null,
        ]}
        onPress={toggle}
        testID={testID}
        {...controlA11yProps({ expanded: open })}
      >
        <Text value={title} style={styles.title} />
        <Animated.View style={chevronStyle}>
          <Icon
            name="chevron-down"
            size={spacing.x20}
            color={theme.colors.textSecondary}
          />
        </Animated.View>
      </Pressable>
      <Collapsible
        open={open}
        duration={ms}
        contentStyle={styles.content}
        contentTestID={testId(testID, "content")}
      >
        {children}
      </Collapsible>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  container: {
    // Fills whatever contains it, rather than picking a width of its own.
    // `alignSelf` (not `width: "100%"`) because the usual parent — Screen —
    // centers its children without stretching them, and only alignSelf
    // opts back out of that; without it the header's `space-between` has no
    // extra room to space with and the chevron sits against the title.
    // Constraining the width is the parent's call: see the Home screen,
    // which caps its content column at `sizes.contentMaxWidth`.
    alignSelf: "stretch",
    borderBottomWidth: spacing.x1,
  },
  header: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.x12,
    minHeight: sizes.elementHeightLg,
    paddingVertical: spacing.x12,
    // Without it the pressed fill and the keyboard focus ring sit flush
    // against the title and the chevron.
    paddingHorizontal: sizes.rowInset,
  },
  title: {
    flex: 1,
  },
  content: {
    gap: spacing.x12,
    // Matches the header's inset so the body lines up under the title.
    paddingHorizontal: sizes.rowInset,
    paddingBottom: spacing.x24,
  },
}));
