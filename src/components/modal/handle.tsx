import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, withTiming, type SharedValue } from "react-native-reanimated";

import { useAnimationDuration } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { ANIMATION_DURATION } from "./constants";

const DRAG_DISMISS_DISTANCE = 100;
const DRAG_DISMISS_VELOCITY = 800;

type Props = {
  dragY: SharedValue<number>;
  onDismiss: () => void;
  testID?: string;
};

/**
 * The grabber a `bottomSheet`/`actions` sheet can be dragged down from to
 * dismiss. Deliberately just this small handle, not the whole sheet —
 * wrapping the entire content (including its ScrollView) in the pan gesture
 * would fight the ScrollView's own vertical scrolling for the same gesture.
 *
 * Only *updates* `dragY` (a shared value owned by index.tsx and also read
 * by ModalContent's animated style, so the content visually follows the
 * finger) — index.tsx doesn't otherwise need to know about the gesture.
 */
export default function ModalHandle({ dragY, onDismiss, testID }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const duration = useAnimationDuration();
  const snapBackDuration = duration(ANIMATION_DURATION);

  // dragY is a Reanimated SharedValue passed down as a prop (so ModalContent
  // can read the same value) — `.value =` is its own designed-to-be-mutable
  // API, not a React props mutation, but react-hooks/immutability can't tell
  // the two apart since it only sees "a prop got assigned to".
  const dragGesture = Gesture.Pan()
    .withTestId("modal-drag-handle")
    .onUpdate((event) => {
      // eslint-disable-next-line react-hooks/immutability -- see comment above
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (
        dragY.value > DRAG_DISMISS_DISTANCE ||
        event.velocityY > DRAG_DISMISS_VELOCITY
      ) {
        runOnJS(onDismiss)();
      }
      // eslint-disable-next-line react-hooks/immutability -- see comment above
      dragY.value = withTiming(0, { duration: snapBackDuration });
    });

  return (
    <GestureDetector gesture={dragGesture}>
      <View testID={testID} style={styles.grabberHandle}>
        <View
          style={[styles.grabber, { backgroundColor: theme.colors.grabber }]}
        />
      </View>
    </GestureDetector>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  grabberHandle: {
    alignItems: "center",
    paddingVertical: spacing.x8,
  },
  grabber: {
    width: sizes.grabberWidth,
    height: sizes.grabberHeight,
    borderRadius: radius.full,
  },
}));
