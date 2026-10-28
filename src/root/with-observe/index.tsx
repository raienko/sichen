import type { ComponentType } from "react";

import env from "@/constants/env";

type ExpoObserveModule = typeof import("expo-observe");

/**
 * Enables EAS Observe only for builds configured with a project ID.
 *
 * The runtime require is deliberate: importing expo-observe eagerly
 * initializes its Android native module, which throws when the project ID is
 * absent. Returning the original component keeps unlinked builds unchanged.
 */
export default function withObserve<Props extends Record<string, unknown>>(
  Component: ComponentType<Props>,
): ComponentType<Props> {
  if (!env.projectId) return Component;

  try {
    const { Observe, ObserveRoot } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-observe") as ExpoObserveModule;

    Observe.configure({
      integrations: { "expo-router": true },
      dispatchInDebug: false,
    });

    return ObserveRoot.wrap(Component);
  } catch {
    // Android initializes the native module during require(). A build created
    // without extra.eas.projectId can therefore reject a newer JS bundle that
    // enables Observe. Keep the application usable until it is rebuilt with
    // the matching native configuration.
    return Component;
  }
}
