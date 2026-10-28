import type { QueryParams } from "expo-linking";
import type { Href } from "expo-router";

/**
 * Every condition a link can be made to wait for. `ready` is built in and
 * applies to every link — it opens once the navigation tree is mounted (see
 * ./deep-links.tsx), so a handler can navigate and show UI without checking
 * whether the app has finished starting. The rest are the app's own: a route
 * lists them in `gates` and the app opens/closes them with
 * `deepLinks.setGate()` as its state changes.
 *
 * Declared as a list rather than a free-form string so a typo is a `tsc`
 * error and so the set is discoverable — the same reason LOCALES and
 * THEME_PREFERENCES are enumerated rather than inferred.
 */
export const DEEP_LINK_GATES = ["ready", "auth"] as const;

export type DeepLinkGate = (typeof DEEP_LINK_GATES)[number];

/** Required by every link, so a handler never runs before the app is up. */
export const READY_GATE = "ready" satisfies DeepLinkGate;

/** One incoming link, normalized so handlers never parse a URL themselves. */
export type DeepLink = {
  /** The original URL, exactly as it arrived. Useful for logs and telemetry. */
  url: string;
  /**
   * The app-relative path, always `/`-prefixed and with no trailing slash.
   * `myapp://orders/12`, `myapp:///orders/12` and `https://example.com/orders/12`
   * all normalize to `/orders/12` — see ./url.ts.
   *
   * Left percent-encoded: decoding here would turn an encoded `/` inside a
   * segment into a segment boundary. `params` below are decoded instead,
   * once the pattern says where the boundaries actually are.
   */
  path: string;
  /** Values captured by the route pattern's `:name` segments, decoded. */
  params: Record<string, string>;
  /** The URL's query string, parsed. */
  query: QueryParams;
  /** Whether this link is what launched the app, rather than arriving while it ran. */
  initial: boolean;
};

/**
 * What a handler does with a link. Return an `Href` to navigate there, or
 * nothing at all when the handler did the work itself — showing a modal,
 * refetching, applying a promo code. Both cases are dispatched identically;
 * only the return value differs.
 */
export type DeepLinkResult = Href | void;

export type DeepLinkHandler = (
  link: DeepLink,
) => DeepLinkResult | Promise<DeepLinkResult>;

export type DeepLinkRoute = {
  /**
   * A `/`-prefixed path pattern. `:name` captures one segment into
   * `link.params.name`, and a trailing `*` captures whatever is left into
   * `link.params.rest` — e.g. `/orders/:id`, `/article/*`.
   */
  pattern: string;
  /**
   * Conditions to wait for before running `handle`, on top of the always-on
   * `ready` gate. A link arriving while any of them is closed is held until
   * every one is open, then dispatched — that's how "open this only once
   * the user is signed in" is expressed.
   */
  gates?: DeepLinkGate[];
  handle: DeepLinkHandler;
};
