const PROBE_KEY = "__storage_persistence_probe__";

/**
 * Whether anything written to storage will actually survive a reload.
 *
 * On web, MMKV is backed by `localStorage` — and when the browser refuses
 * access (private browsing, cookies-and-site-data blocked, an enterprise
 * policy), it quietly substitutes an in-memory `Map` instead of failing.
 * Writes then look like they worked and disappear on the next reload. MMKV
 * doesn't expose which of the two is in play, so this asks the same
 * question directly.
 *
 * It *writes* rather than just reading `window.localStorage`, because the
 * two aren't equivalent: Safari's private mode has historically exposed a
 * perfectly normal-looking `localStorage` whose quota is zero, so it only
 * throws once something is actually stored. A probe that round-trips is
 * the only answer that matches what a real write will do.
 *
 * The result is stable for the lifetime of the page, so it's computed once
 * rather than on every call — the probe touches synchronous storage, and
 * anything rendering a persistence warning would otherwise pay for it on
 * every render.
 */
let cached: boolean | undefined;

export function isStoragePersistent(): boolean {
  if (cached !== undefined) {
    return cached;
  }

  // Expo's static web export prerenders on a server, where nothing persists
  // and touching `window` would throw. Deliberately not cached: the answer
  // for the prerender pass isn't the answer for the browser that loads it.
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(PROBE_KEY, "1");
    window.localStorage.removeItem(PROBE_KEY);
    cached = true;
  } catch {
    cached = false;
  }

  return cached;
}
