import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { controlA11yProps } from "@/features/accessibility";
import { useTheme } from "@/features/theme";

type Props = {
  progress: SharedValue<number>;
  /** How dark it gets once fully shown — the type's `backdropOpacity`. */
  maxOpacity: number;
  onDismiss: () => void;
  testID?: string;
};

/**
 * The dimmed, tap-to-dismiss layer behind a modal's content. Fades in/out
 * with `progress` (the same 0–1 value driving the content's own enter/exit
 * animation, owned by index.tsx) — kept as a separate component since it's
 * a self-contained concern (its own Pressable, its own accessibility props)
 * that types without a backdrop (`fullscreen`) simply don't render.
 */
export default function ModalBackdrop({
  testID,
  progress,
  maxOpacity,
  onDismiss,
}: Props) {
  const theme = useTheme();

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * maxOpacity,
  }));

  return (
    <Pressable
      testID={testID}
      style={StyleSheet.absoluteFill}
      onPress={onDismiss}
      // It has no text of its own, so unlike Button it needs an explicit
      // label — otherwise a screen reader announces an unnamed button.
      {...controlA11yProps({ label: "Dismiss" })}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
          backdropStyle,
        ]}
      />
    </Pressable>
  );
}
