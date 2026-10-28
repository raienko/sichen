export interface StorageAdapter<RemoveResult = void> {
  getItem(key: string): string | undefined;
  setItem(key: string, value: string): void;
  removeItem(key: string): RemoveResult;
  useValue(key: string): string | undefined;
}

/**
 * When a `SecureValue` can be read on iOS. Both are device-only.
 *
 * - `whenUnlocked` (the default): only while the device is unlocked — a
 *   credential has no business being read from a locked phone.
 * - `afterFirstUnlock`: also while locked, once the device has been
 *   unlocked since boot — for a value a background launch (a notification,
 *   a background fetch) needs, such as the storage encryption key.
 */
export type SecureAccess = "whenUnlocked" | "afterFirstUnlock";
