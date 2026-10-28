import logger from "@/features/logger";

import deepLinks from "./registry";

export type NativeIntentOptions = {
  path: string;
  initial: boolean;
};

/**
 * Gives registered deep-link commands to the feature pipeline and leaves
 * ordinary file-based routes to Expo Router.
 *
 * Returning `null` prevents Expo Router from navigating to the original URL.
 * The lifecycle listener in ./deep-links.tsx receives that same URL and runs
 * its handler only after every gate is open. This is deliberately kept in the
 * feature so branded apps can reuse it from their own +native-intent file.
 */
export function redirectSystemPath({
  path,
}: NativeIntentOptions): string | null {
  try {
    return deepLinks.claims(path) ? null : path;
  } catch (error) {
    // Throwing from +native-intent can abort app startup. Falling back to the
    // original path lets Expo Router resolve it (including to +not-found)
    // while still leaving an observable failure for diagnostics.
    logger.failed(`Unable to inspect native deep link "${path}"`, error);
    return path;
  }
}
