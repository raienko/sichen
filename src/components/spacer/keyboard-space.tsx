import type { ViewProps } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";

type Props = ViewProps & {
  /** The tallest of the spacer's other sizes — the floor it never drops below. */
  floor: number;
  /** Taken off the keyboard's height: the bottom inset, when the spacer sits above it. */
  offset: number;
};

/**
 * The part of `Spacer` that follows the keyboard. Kept apart so only a
 * spacer whose size includes `"keyboard"` pays for Reanimated: its height
 * is set on the UI thread, frame by frame, in step with the keyboard's own
 * animation rather than after a JS event. On web the keyboard height stays
 * at zero — the browser resizes the viewport itself.
 */
export default function KeyboardSpace({
  floor,
  offset,
  style,
  ...props
}: Props) {
  const keyboard = useAnimatedKeyboard();
  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(floor, keyboard.height.value - offset),
  }));

  return <Animated.View {...props} style={[animatedStyle, style]} />;
}
