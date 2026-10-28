import type { Preview } from "@storybook/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { deepLinks } from "@/features/deep-links";
import { useTheme } from "@/features/theme";
import Providers from "@/root/providers";

/**
 * A story has no navigator, so <DeepLinks> never opens the built-in `ready`
 * gate and every link would queue forever (the showcase's deep-links demo
 * sat at "waiting on a gate"). Nothing here is waiting to mount, so it's
 * ready from the start; a handler that returns an href still has no router
 * to go to, which the registry logs rather than throws.
 */
deepLinks.setGate("ready", true);

/**
 * Matches the web canvas's `layout: "padded"` (1rem a side), so stories that
 * size themselves against it — the chat frame — fit the same on device.
 */
const CANVAS_PADDING = 16;

/**
 * The on-device counterpart of the web preview's themed canvas: fills the
 * story area in the theme's own background, so a dark device doesn't draw the
 * dark palette's light text on Storybook's white, and insets every story from
 * the screen edges the way the web canvas does.
 */
function ThemedCanvas({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.canvas, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    padding: CANVAS_PADDING,
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <Providers>
        <ThemedCanvas>
          <Story />
        </ThemedCanvas>
      </Providers>
    ),
  ],
};

export default preview;
