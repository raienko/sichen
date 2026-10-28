import type { ReactNode } from "react";
import {
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { ModalTypeConfig } from "./config";

type Props = {
  config: ModalTypeConfig;
  progress: SharedValue<number>;
  dragY: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * The animated card itself — position-specific background/padding/corner
 * radius (from `config`) plus the fade/slide enter-exit animation driven by
 * `progress` (and `dragY`, so a `bottomSheet`/`actions` drag-in-progress
 * visually follows the finger on top of the base animation). Doesn't know
 * about the grabber or scrolling — those are ModalHandle/ModalScrollArea,
 * rendered as its `children` by index.tsx.
 */
export default function ModalContent({
  config,
  progress,
  dragY,
  style,
  children,
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useStyles();

  const contentStyle = useAnimatedStyle(() => {
    if (config.animation === "fade") {
      return { opacity: progress.value };
    }
    return {
      transform: [
        {
          translateY:
            interpolate(progress.value, [0, 1], [windowHeight, 0]) +
            dragY.value,
        },
      ],
    };
  });

  const baseStyle =
    config.position === "center"
      ? styles.popupContent
      : config.position === "bottom"
        ? styles.sheetContent
        : config.edgeToEdge
          ? styles.edgeToEdge
          : [
              styles.fullscreenContent,
              { paddingTop: spacing.x20 + insets.top },
            ];

  return (
    <Animated.View
      style={[
        baseStyle,
        config.contentBackground
          ? { backgroundColor: theme.colors.background }
          : null,
        contentStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  popupContent: {
    borderRadius: radius.surface,
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    maxHeight: "85%",
    padding: spacing.x20,
  },
  sheetContent: {
    borderTopLeftRadius: radius.surface,
    borderTopRightRadius: radius.surface,
    maxHeight: "85%",
    paddingHorizontal: spacing.x20,
  },
  fullscreenContent: {
    flex: 1,
    padding: spacing.x20,
  },
  edgeToEdge: {
    flex: 1,
  },
}));
