import { type ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createStyles, useUnits } from "@/features/responsive";

import type { ModalPosition } from "./config";

type Props = {
  position: ModalPosition;
  children: ReactNode;
};

/**
 * Scrolls content taller than the screen instead of letting it overflow —
 * bounded by ModalContent's own `maxHeight`, so it shrinks to fit short
 * content and only scrolls once content actually exceeds that cap.
 *
 * Children are spaced with a plain `gap` on the content container. (An
 * earlier version used explicit spacer Views, on the theory that `gap`
 * wasn't reliably applied to a ScrollView's content across RN
 * environments — that turned out to be a misread: the gap was rendering
 * correctly all along and was simply too subtle to see against the
 * backdrop in a screenshot.)
 *
 * `position === "bottom"` gets the safe-area bottom inset added as padding
 * *inside* the scrollable area (not on the card outside it), so it's always
 * reachable by scrolling to the end instead of being pushed past the
 * card's own (otherwise unbounded) height and clipped.
 */
export default function ModalScrollArea({ position, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const units = useUnits();

  const scrollStyle = position === "fullscreen" ? styles.flex : styles.shrink;
  const contentContainerStyle = [
    styles.container,
    position === "fullscreen" && styles.grow,
    position === "bottom" && { paddingBottom: insets.bottom + units(10) },
  ];

  return (
    <ScrollView
      style={scrollStyle}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  container: {
    gap: spacing.x8,
  },
  grow: {
    flexGrow: 1,
  },
}));
