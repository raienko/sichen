import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastsProvider } from "@/components/toast";
import { StateViewsProvider } from "@/components/state-view";
import StatusBar from "@/components/status-bar";
import { AccessibilityProvider } from "@/features/accessibility";
import { ApiProvider } from "@/features/api";
import { DeepLinks } from "@/features/deep-links";
import {
  LocaleProvider,
  type LocaleProviderConfig,
} from "@/features/localization";
import { Permissions } from "@/features/permissions";
import { ThemeProvider, type ThemeProviderConfig } from "@/features/theme";

export type ProvidersConfig = {
  theme?: ThemeProviderConfig;
  locale?: LocaleProviderConfig;
};

type Props = {
  children: ReactNode;
  config?: ProvidersConfig;
};

/**
 * Every context provider a screen might need (state, theme, safe area, ...).
 * Shared by Root (the real app) and testing.tsx (Jest + Storybook), so a new
 * provider is added in exactly one place and every screen, test, and story
 * picks it up automatically — see src/root/index.tsx and src/root/testing.tsx.
 *
 * Not every entry is a context provider: `Permissions`, `DeepLinks`,
 * `StatusBar` and `ToastsProvider` own app-lifetime lifecycle or overlay UI rather than a
 * value — keeping the OS permission snapshots fresh, subscribing to
 * incoming links, and rendering whatever toasts are currently up. They live
 * here so they're mounted exactly once, wrapping everything, on the same
 * "add it in one place" terms as the providers. The first two do nothing in
 * Storybook or Jest: their state lives outside React (a LocalValue, a
 * singleton), and the deep-link pipeline stays gated shut without a
 * navigator to route into — until something opens `ready` by hand, as both
 * Storybook previews do. `ToastsProvider` is the exception that earns its
 * place here rather than in `Root` — a story or a test that calls
 * `Toast.show()` should see a toast, which it only can if the thing that
 * renders them is part of the shared tree.
 *
 * StateViewsProvider uses a native fullscreen Modal, so its blocking state
 * remains above screen content, toasts, and any modal that was already open.
 * Both overlay providers can read the theme, locale and safe-area insets
 * provided above them.
 *
 * GestureHandlerRootView is here (rather than only where a gesture is used,
 * e.g. Modal's bottom-sheet swipe-to-dismiss) because react-native-gesture-handler
 * requires exactly one, wrapping the whole app, to reliably capture touches
 * on Android — not just wherever a gesture happens to be defined.
 */
export default function Providers({ children, config }: Props) {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AccessibilityProvider>
          <Permissions>
            <ApiProvider>
              <DeepLinks>
                <ThemeProvider config={config?.theme}>
                  <LocaleProvider config={config?.locale}>
                    {/* Follows the app theme; a screen mounts its own to differ. */}
                    <StatusBar />
                    <ToastsProvider>
                      <StateViewsProvider>{children}</StateViewsProvider>
                    </ToastsProvider>
                  </LocaleProvider>
                </ThemeProvider>
              </DeepLinks>
            </ApiProvider>
          </Permissions>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
