import env from "@/constants/env";

/**
 * Whether this is a build made for end-to-end tests (`yarn e2e:start`,
 * `EXPO_PUBLIC_E2E=1`). A constant, like `isWeb`: it's fixed when the
 * bundle is built, so every check reads as a fact.
 *
 * Use it to make the app hold still and stay predictable for a test
 * runner — a fixed language, no autoplay, no dev overlays, no network
 * images — never to change what the app does for its users.
 *
 * @example
 * if (isE2E) LogBox.ignoreAllLogs();
 */
export const isE2E = env.e2e;

/**
 * `inE2E` in an end-to-end test build, `otherwise` everywhere else — for
 * the common case of a value that only needs to differ under test.
 *
 * @example
 * <Carousel autoplay={ifE2E(false, autoplay)} />
 * const interval = ifE2E(0, seconds(5));
 */
export function ifE2E<T>(inE2E: T, otherwise: T): T {
  return isE2E ? inE2E : otherwise;
}

/**
 * A development build that isn't an end-to-end run: where developer-only
 * tooling — the in-app dev menu, debug readouts, verbose logging — is on.
 * `false` in every release build and in an e2e run, where a tool that can
 * pop up over the screen is one more thing in the way of a flow.
 *
 * @example
 * if (isDebug) registerDevTools();
 */
export const isDebug = __DEV__ && !isE2E;
