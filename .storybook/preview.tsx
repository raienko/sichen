// Registers Expo's web font loader. The icon sets only pull it in if
// `globalThis.expo` already exists when they first evaluate — true under
// Metro, not in Vite's module order — and without it every icon renders as
// a missing-glyph box.
import "expo-font";

import type { Preview } from "@storybook/react-native-web-vite";
import { useEffect, type ReactNode } from "react";

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
 * Paints the canvas in the theme's own background. Storybook's canvas is
 * always white, so under a dark OS setting a story would otherwise draw the
 * dark palette's light text on white — the one pairing the palette never
 * checks for contrast. The page body rather than a wrapper, so the colour
 * reaches the edges however short the story is.
 */
function ThemedCanvas({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = colors.background;
  }, [colors.background]);

  return children;
}

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
