import { createMMKV, type MMKV } from "react-native-mmkv";

/**
 * Web: MMKV is `localStorage` here, and a page can't encrypt anything from
 * its own scripts in a way that matters — the key would sit beside the
 * data. So the store is plain, under the same `id` as before, and the rule
 * stands that the web keeps only non-sensitive values in it (secrets are
 * memory-only, see `SecureValue`). The native build has the real answer —
 * see index.ts.
 */
export function createEncryptedStore(id: string): MMKV {
  return createMMKV({ id });
}
