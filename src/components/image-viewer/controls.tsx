import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { useAnimationDuration } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import ViewerThumbnails from "./thumbnails";
import type { ImageViewerItem } from "./types";

/** How long the controls take to fade in or out, in ms. */
const FADE_DURATION = 200;

type Props = {
  images: readonly ImageViewerItem[];
  index: number;
  visible: boolean;
  /** The swipe-to-close offset: the controls fade away as the picture is dragged off. */
  dismissY: SharedValue<number>;
  describe: (index: number) => string;
  onClose: () => void;
  onShare?: () => void;
  onSelect: (index: number) => void;
  testID?: string;
};

/**
 * Everything over the picture: close, "2 / 5" and share along the top;
 * the caption and the thumbnails along the bottom. Light on dark whatever
 * the theme, because the stage behind it is always `mediaSurface`.
 *
 * A single tap fades it out for an unobstructed look, and it fades with the
 * backdrop while the picture is dragged away to close. Hidden, it also
 * stops taking touches, so it can't swallow a gesture meant for the
 * picture under it.
 */
export default function ViewerControls({
  testID,
  images,
  index,
  visible,
  dismissY,
  describe,
  onClose,
  onShare,
  onSelect,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  // Resolved here, on the JS thread: the helper is a plain function, and
  // the worklet below runs on the UI thread, which can't call it.
  const fadeDuration = useAnimationDuration()(FADE_DURATION);

  const shownOpacity = useDerivedValue(() =>
    withTiming(visible ? 1 : 0, { duration: fadeDuration }),
  );
  const fade = useAnimatedStyle(() => ({
    opacity:
      shownOpacity.get() * Math.max(0, 1 - Math.abs(dismissY.get()) / 120),
  }));

  const item = images[index];
  const onMedia = theme.colors.onPrimary;
  const scrim = { backgroundColor: theme.colors.overlay };

  return (
    <>
      <Animated.View
        pointerEvents={visible ? "box-none" : "none"}
        style={[styles.top, { paddingTop: insets.top }, fade]}
      >
        <View style={[styles.scrim, scrim]} />
        <View style={styles.bar}>
          <IconButton
            testID={testId(testID, "close")}
            label={t("imageViewer.close")}
            onPress={onClose}
          >
            <Icon name="x" color={onMedia} />
          </IconButton>
          {/* No "1 / 1": a counter with nothing to count is noise. The
              space it takes stays, so close and share don't move. */}
          <View style={styles.counter}>
            <If condition={images.length > 1}>
              <Text
                value={t("imageViewer.position", {
                  index: index + 1,
                  total: images.length,
                })}
                type="headline"
                style={[styles.counterText, { color: onMedia }]}
                // Read as part of the picture's own label instead.
                accessible={false}
                importantForAccessibility="no"
              />
            </If>
          </View>
          <View style={styles.trailing}>
            <If condition={onShare}>
              <IconButton
                testID={testId(testID, "share")}
                label={t("imageViewer.share")}
                onPress={onShare}
              >
                <Icon name="share" color={onMedia} />
              </IconButton>
            </If>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={visible ? "box-none" : "none"}
        style={[styles.bottom, { paddingBottom: insets.bottom }, fade]}
      >
        <View style={[styles.scrim, scrim]} />
        <If condition={item?.caption}>
          <Text
            testID={testId(testID, "caption")}
            value={item?.caption ?? ""}
            type="callout"
            numberOfLines={3}
            style={[styles.caption, { color: onMedia }]}
          />
        </If>
        <If condition={images.length > 1}>
          <ViewerThumbnails
            testID={testID}
            images={images}
            index={index}
            describe={describe}
            onSelect={onSelect}
          />
        </If>
      </Animated.View>
    </>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: spacing.x12,
    paddingTop: spacing.x12,
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.45,
  },
  bar: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    paddingHorizontal: spacing.x8,
    minHeight: sizes.elementHeightLg,
  },
  counter: {
    flex: 1,
  },
  counterText: {
    textAlign: "center",
  },
  // Same width as the close button, so the counter stays centred whether
  // or not there's a share button.
  trailing: {
    minWidth: sizes.elementHeightMd,
    alignItems: "flex-end",
  },
  caption: {
    paddingHorizontal: spacing.x16,
  },
}));
