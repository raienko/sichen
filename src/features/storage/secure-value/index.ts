import StorageValue from "../storage-value";
import type { SecureAccess } from "../types";
import secureStorageAdapter from "./adapter";

type Options = {
  /**
   * When the value can be read on iOS; see `SecureAccess`. Defaults to
   * `"whenUnlocked"`. Either way the item stays on this device: it never
   * syncs through iCloud Keychain or restores onto another phone.
   */
  access?: SecureAccess;
};

/**
 * A value for secrets: the iOS Keychain and the Android Keystore, through
 * expo-secure-store. Reads and writes are synchronous; reset is asynchronous
 * and must be awaited before a sign-out is considered complete.
 *
 * Keep values small — native secure storage can reject large payloads, so
 * store tokens and keys here, not documents. Items are device-only, so a
 * restore onto a new phone starts signed out. On the web there is
 * nowhere a page's own scripts can't read, so values live in memory only
 * and are gone on reload.
 *
 * @example
 * const token = new SecureValue<string>("access-token");
 * token.setValue(jwt);
 * token.getValue(); // jwt
 * await token.reset(); // deleted before auth accepts a new sign-in
 */
export default class SecureValue<T> extends StorageValue<T, Promise<void>> {
  constructor(key: string, { access = "whenUnlocked" }: Options = {}) {
    // SecureStore only accepts these characters. Reject invalid keys rather
    // than mapping distinct caller keys onto the same secret.
    if (!/^[A-Za-z0-9._-]+$/.test(key)) {
      throw new Error(`Invalid SecureValue key "${key}"`);
    }
    super(secureStorageAdapter(access), key);
  }
}
