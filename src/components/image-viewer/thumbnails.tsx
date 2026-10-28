import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";

import Image from "@/components/image";
import { controlA11yProps } from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import type { ImageViewerItem } from "./types";

type Props = {
  images: readonly ImageViewerItem[];
  index: number;
  describe: (index: number) => string;
  onSelect: (index: number) => void;
  testID?: string;
};

/**
 * The album in miniature, for jumping straight to a picture. The current
 * one takes Graphite's selection — an `accent` edge with a band of
 * background between it and the picture — and is kept scrolled into view
 * as the viewer pages.
 */
export default function ViewerThumbnails({
  testID,
  images,
  index,
  describe,
  onSelect,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing, sizes } = useSizes();
  const scroll = useRef<ScrollView>(null);
  const viewport = useRef(0);

  // Each thumbnail is a fixed size — the touch-target height — so where one
  // sits is arithmetic rather than a measurement, and the strip can centre
  // it before it has laid out.
  const size = sizes.elementHeightMd;
  const slot = size + spacing.x8;

  useEffect(() => {
    const centre = index * slot + size / 2 + spacing.x12;
    scroll.current?.scrollTo({
      x: Math.max(0, centre - viewport.current / 2),
      animated: true,
    });
  }, [index, slot, size, spacing]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => {
        viewport.current = event.nativeEvent.layout.width;
      }}
      contentContainerStyle={styles.strip}
    >
      {images.map((item, position) => {
        const current = position === index;
        return (
          <Pressable
            key={position}
            testID={testId(testID, "thumbnail", position)}
            {...controlA11yProps({
              label: describe(position),
              selected: current,
            })}
            onPress={() => onSelect(position)}
            style={[
              styles.thumb,
              {
                borderColor: current ? theme.colors.accent : "transparent",
                backgroundColor: current
                  ? theme.colors.mediaSurface
                  : "transparent",
              },
            ]}
          >
            <View style={[styles.frame, current ? null : styles.dimmed]}>
              <Image
                source={item.thumbnail ?? item.source}
                decorative
                contentFit="cover"
                style={styles.image}
              />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  strip: {
    gap: spacing.x8,
    paddingHorizontal: spacing.x12,
  },
  thumb: {
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    padding: spacing.x2,
    borderWidth: spacing.x2,
    borderRadius: radius.indicator,
  },
  frame: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.indicator,
  },
  dimmed: {
    opacity: 0.6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
}));
