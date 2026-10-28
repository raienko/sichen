import type { QueryParams } from "expo-linking";

import env from "@/constants/env";

/** A link's URL reduced to the two things a route is matched against. */
export type NormalizedUrl = {
  url: string;
  path: string;
  query: QueryParams;
};

const WEB_SCHEMES = new Set(["http", "https"]);

/**
 * The schemes Expo Go and `expo start` deliver URLs with. They carry the
 * packager's own address as the authority and put the app's path after a
 * `--/` marker (`exp://192.168.1.5:8081/--/orders/12`), so the authority is
 * dropped and only what follows the marker is the app's path.
 */
const DEV_SCHEMES = new Set(["exp", "exps"]);
const DEV_PATH_MARKER = "/--/";

const APP_SCHEME = env.appScheme.toLowerCase();
const LINK_DOMAINS = new Set(
  env.appLinkDomains.map((domain) => domain.toLowerCase()),
);

/**
 * Turns anything that could name a destination in this app into a path, or
 * returns `null` when it names somewhere else.
 *
 * The four shapes that arrive in practice, all reduced to the same result:
 *
 * - `myapp://orders/12` — a custom-scheme deep link. There is no real host
 *   in one, but the part before the first `/` sits where a host goes.
 * - `myapp:///orders/12` — the triple-slashed spelling `Linking.createURL()`
 *   produces, whose authority is empty and whose path is the whole thing.
 * - `https://example.com/orders/12` — a universal link (iOS) or app link
 *   (Android), accepted only for a host in `EXPO_PUBLIC_APP_LINK_DOMAINS`.
 * - `/orders/12` — a bare path, which is how a link inside a payload
 *   (a push notification, a toast action) is usually written.
 *
 * Rejecting the rest is what lets `deepLinks.open()` hand a link that isn't
 * ours to the OS instead of trying to route it: an `https://` URL for a
 * domain we don't own belongs in the browser, and `tel:` belongs in the
 * phone app.
 */
export function normalizeUrl(url: string): NormalizedUrl | null {
  const parsed = splitUrl(url.trim());
  if (!parsed) return null;

  const { scheme, authority, path, search } = parsed;
  const query = parseQuery(search);

  // No scheme at all: a bare path, already the shape we want.
  if (scheme === null) return { url, path: toPath(path), query };

  if (WEB_SCHEMES.has(scheme)) {
    return LINK_DOMAINS.has(toHostname(authority)) ||
      isCurrentWebAuthority(authority)
      ? { url, path: toPath(path), query }
      : null;
  }

  if (DEV_SCHEMES.has(scheme)) {
    const marker = path.indexOf(DEV_PATH_MARKER);
    const appPath =
      marker === -1 ? "" : path.slice(marker + DEV_PATH_MARKER.length);
    return { url, path: toPath(appPath), query };
  }

  if (scheme !== APP_SCHEME) return null;

  // Putting the authority back in front of the path is what makes
  // `myapp://orders/12` (authority "orders", path "/12") and
  // `myapp:///orders/12` (no authority, path "/orders/12") the same link.
  return { url, path: toPath(`${authority}/${path}`), query };
}

type SplitUrl = {
  /** Lower-cased, or `null` when the input was a bare path. */
  scheme: string | null;
  /** Whatever sat between `//` and the next `/`. Not always a host — see above. */
  authority: string;
  path: string;
  /** The query string, without its leading `?`. */
  search: string;
};

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Splits a URL by hand rather than with `URL` or `Linking.parse`.
 *
 * `URL` looks like the obvious choice and isn't: React Native's global is a
 * regex shim (Libraries/Blob/URL.js) whose `hostname` and `pathname` only
 * match `https?://`, so it reports an empty host and a path of `/` for
 * exactly the custom-scheme links this feature exists to handle.
 * `Linking.parse` is built on that same `URL`, and additionally reads
 * `expo-constants` for the dev-server address, which makes it throw where
 * those constants aren't populated.
 *
 * The grammar being split here is small and fixed (RFC 3986's
 * `scheme:[//authority]path[?query][#fragment]`), so parsing it directly
 * costs a few lines and behaves identically on iOS, Android, web and Jest.
 */
function splitUrl(input: string): SplitUrl | null {
  if (!input) return null;

  const hash = input.indexOf("#");
  const withoutFragment = hash === -1 ? input : input.slice(0, hash);

  const question = withoutFragment.indexOf("?");
  const beforeQuery =
    question === -1 ? withoutFragment : withoutFragment.slice(0, question);
  const search = question === -1 ? "" : withoutFragment.slice(question + 1);

  const scheme = SCHEME.exec(beforeQuery);

  if (!scheme) {
    // Without a scheme the only thing this can be is a bare path. Anything
    // else ("not a url") is not a link and is rejected rather than guessed at.
    return beforeQuery.startsWith("/")
      ? { scheme: null, authority: "", path: beforeQuery, search }
      : null;
  }

  const rest = beforeQuery.slice(scheme[0].length);

  // Only `//` introduces an authority. `mailto:a@b.com` and `tel:5555555`
  // have none, and their path must not be mistaken for one.
  if (!rest.startsWith("//")) {
    return {
      scheme: scheme[1].toLowerCase(),
      authority: "",
      path: rest,
      search,
    };
  }

  const afterSlashes = rest.slice(2);
  const separator = afterSlashes.indexOf("/");

  return {
    scheme: scheme[1].toLowerCase(),
    authority:
      separator === -1 ? afterSlashes : afterSlashes.slice(0, separator),
    path: separator === -1 ? "" : afterSlashes.slice(separator),
    search,
  };
}

/** Only meaningful for http(s), where the authority really is a host. */
function toHostname(authority: string): string {
  const afterUserInfo = authority.slice(authority.lastIndexOf("@") + 1);
  const port = afterUserInfo.lastIndexOf(":");

  return (
    port === -1 ? afterUserInfo : afterUserInfo.slice(0, port)
  ).toLowerCase();
}

/**
 * A browser is already running on an origin the app owns. Native associated
 * domains decide which HTTPS links an OS may deliver; they must not decide
 * whether the web build accepts its own current URL (including localhost).
 */
function isCurrentWebAuthority(authority: string): boolean {
  if (typeof globalThis.location === "undefined") return false;

  return authority.toLowerCase() === globalThis.location.host.toLowerCase();
}

/**
 * `""` → `"/"`, `"orders//12/"` → `"/orders/12"`.
 *
 * Left percent-encoded: decoding here would turn an encoded `/` inside a
 * segment into a segment boundary. Captured params are decoded in ./match.ts
 * instead, once the pattern has said where the boundaries are.
 */
function toPath(value: string): string {
  return `/${value.split("/").filter(Boolean).join("/")}`;
}

function parseQuery(search: string): QueryParams {
  const query: QueryParams = {};

  for (const pair of search.split("&")) {
    if (!pair) continue;

    const separator = pair.indexOf("=");
    const key = decode(separator === -1 ? pair : pair.slice(0, separator));
    const value = separator === -1 ? "" : decode(pair.slice(separator + 1));
    const existing = query[key];

    // A key can legitimately repeat (`?tag=a&tag=b`), which is why
    // QueryParams allows an array.
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  return query;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    // A malformed escape is the sender's problem, not a reason to drop the
    // link — hand the raw text over instead.
    return value;
  }
}
