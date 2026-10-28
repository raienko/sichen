import * as SecureStore from "expo-secure-store";

import type { SecureAccess } from "../../types";

/**
 * Both are device-only: an item never syncs through iCloud Keychain and
 * never restores onto another device from a backup, so a token copied off
 * one phone can't sign in on another. Android Keystore keys are bound to
 * the device already; the option only matters on iOS.
 */
const KEYCHAIN_ACCESSIBLE: Record<
  SecureAccess,
  SecureStore.KeychainAccessibilityConstant
> = {
  whenUnlocked: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  afterFirstUnlock: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Native: the iOS Keychain and the Android Keystore, through
 * expo-secure-store. Reads and writes are synchronous; deletion is async.
 *
 * Accessibility is applied when an item is first added; overwriting an
 * existing item keeps the class it was created with, which is why a
 * credential is deleted (awaited `reset()`) before the next one is written.
 */
const secureBackend = {
  get: (key: string): string | undefined =>
    SecureStore.getItem(key) ?? undefined,
  set: (key: string, value: string, access: SecureAccess): void =>
    SecureStore.setItem(key, value, {
      keychainAccessible: KEYCHAIN_ACCESSIBLE[access],
    }),
  remove: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};

export default secureBackend;
