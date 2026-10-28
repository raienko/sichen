import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useIsScreenReaderEnabled } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import { TOASTS_TEST_ID } from "./constants";
import ToastItem from "./item";
import toasts, { useToasts } from "./store";

type Props = {
  children: ReactNode;
  /**
   * Which edge the stack is anchored to. Defaults to `"top"`, which stays
   * clear of the keyboard, of a bottom tab bar, and of the home indicator —
   * all things a bottom-anchored toast ends up fighting with.
   */
  position?: "top" | "bottom";
};

/**
 * Puts the toasts on screen. Mounted once, in `Providers`, so a toast
 * raised from anywhere lands above whatever is currently rendered without
 * that screen having to host anything.
 *
 * Not a context provider despite the name: there's no value to hand down,
 * because the toasts live in ./store.ts and are reached by importing
 * `Toast` rather than by being inside anything. It sits in `Providers` for
 * the same reason `Permissions` and `DeepLinks` do — app-lifetime UI and
 * lifecycle that has to exist exactly once, wrapping everything.
 *
 * The overlay is a sibling of `children` rather than a wrapper: it's
 * absolutely positioned with `pointerEvents="box-none"`, so the app
 * underneath keeps every touch that doesn't land on an actual toast.
 */
export default function ToastsProvider({ children, position = "top" }: Props) {
  const entries = useToasts();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const isScreenReaderEnabled = useIsScreenReaderEnabled();

  // A timing tuned to how fast a sentence *reads* is the wrong clock for
  // someone hearing the screen one element at a time, so toasts stop
  // expiring on their own while a screen reader is running and wait to be
  // dismissed instead (WCAG 2.2.1). The store owns the timers; this is
  // just the one place that knows the flag.
  useEffect(() => {
    toasts.setAutoHide(!isScreenReaderEnabled);
    return () => toasts.setAutoHide(true);
  }, [isScreenReaderEnabled]);

  return (
    <>
      {children}

      <View
        testID={TOASTS_TEST_ID}
        // Lets every touch through except the ones landing on a toast — the
        // overlay spans the screen, so anything else would make the app
        // untouchable for as long as a toast is up.
        pointerEvents="box-none"
        style={[
          styles.overlay,
          position === "top"
            ? { top: insets.top, flexDirection: "column" }
            : // Newest nearest the edge the stack grows from, so the one
              // that just arrived is always the closest to it.
              { bottom: insets.bottom, flexDirection: "column-reverse" },
        ]}
      >
        {entries.map((entry) => (
          <ToastItem key={entry.id} entry={entry} position={position} />
        ))}
      </View>
    </>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  overlay: {
    // On web the page itself can scroll (Storybook, a long screen without a
    // ScrollView), and `absolute` would scroll the stack away with it;
    // `fixed` pins it to the viewport. React Native's types don't list
    // `fixed`, but react-native-web passes it through to CSS.
    position: isWeb ? ("fixed" as "absolute") : "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing.x8,
    padding: spacing.x16,
  },
}));
