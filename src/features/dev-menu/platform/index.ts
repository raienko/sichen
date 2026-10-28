import { registerDevMenuItems } from "expo-dev-client";
import { DevSettings } from "react-native";

import logger from "@/features/logger";

/**
 * Adds "App dev menu" to Expo's own dev menu (shake, three-finger long
 * press, or `m` in the terminal), so the app's menu is one tap from where
 * developers already look. Debug builds with expo-dev-client only.
 */
export function registerTrigger(open: () => void): () => void {
  registerDevMenuItems([
    { name: "App dev menu", callback: open, shouldCollapse: true },
  ]).catch((error: unknown) =>
    logger.log("dev menu: couldn't register the trigger", error),
  );
  return () => {};
}

export function reload(): void {
  DevSettings.reload();
}
