import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import Image from "@/components/image";
import { createStyles } from "@/features/responsive";

import type { ImageViewerItem } from "./types";

type Props = {
  item: ImageViewerItem;
  position: number;
  /** The index the stage is showing, on the UI thread — moves before React re-renders. */
  shown: SharedValue<number>;
  /** 1 left-to-right, -1 right-to-left: which way "next" lies. */
  direction: number;
  width: SharedValue<number>;
  pagerX: SharedValue<number>;
  dismissY: SharedValue<number>;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  onAspectRatio: (position: number, aspectRatio: number) => void;
};

/**
 * One picture on the stage. Placed by its distance from the shown index, so
 * paging is one shared offset rather than a re-layout; only the shown page
 * takes the zoom and the swipe-to-close offset.
 *
 * Decorative to assistive technology: the stage around it is the single
 * element a screen reader lands on, and it carries this picture's `alt`.
 */
export default function ViewerPage({
  item,
  position,
  shown,
  direction,
  width,
  pagerX,
  dismissY,
  scale,
  translateX,
  translateY,
  onAspectRatio,
}: Props) {
  const styles = useStyles();

  const placement = useAnimatedStyle(() => {
    const current = position === shown.get();
    return {
      transform: [
        {
          translateX:
            direction * (position - shown.get()) * width.get() +
            pagerX.get() +
            (current ? translateX.get() : 0),
        },
        { translateY: current ? translateY.get() + dismissY.get() : 0 },
        { scale: current ? scale.get() : 1 },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.page, placement]}>
      <Image
        source={item.source}
        decorative
        contentFit="contain"
        onLoad={(event) => {
          const { width: w, height: h } = event.source;
          if (w > 0 && h > 0) onAspectRatio(position, w / h);
        }}
        style={styles.image}
      />
    </Animated.View>
  );
}

const useStyles = createStyles(() => ({
  page: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
}));
