/**
 * Plain JS (typed via the sibling index.d.ts) so this file can be `require`d
 * as-is from app.config.ts, which Expo only transpiles as a single entry
 * file and cannot resolve local .ts imports for.
 *
 * Only EXPO_PUBLIC_-prefixed vars are inlined by Metro into the iOS/Android/
 * Web bundle. Node (app.config.ts) reads process.env directly regardless of
 * prefix, so the same file works unmodified in both places.
 */
// process.env.EXPO_PUBLIC_X must stay a static property access (not
// process.env[key]) below — Metro's inliner only replaces literal
// `process.env.NAME` text it can find via static analysis; a dynamic key
// can't be inlined and would be undefined in native/production bundles.
// ESLint enforces this via expo/no-dynamic-env-var.
function required(key, value) {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(value) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function apiUrl(value) {
  const normalized = optional(value);
  if (normalized === undefined) return undefined;
  const local =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?(\/\S*)?$/;
  if (!/^https:\/\/\S+$/.test(normalized) && !local.test(normalized)) {
    throw new Error(
      `Environment variable EXPO_PUBLIC_API_URL must be an https:// URL (plain http only for localhost), got: ${normalized}`,
    );
  }
  return normalized.replace(/\/+$/, "");
}

/**
 * An on/off var: `1` or `true` (any case) is on, anything else — unset
 * included — is off. Strict on purpose, so `EXPO_PUBLIC_E2E=0` or `=false`
 * can't switch something on by being non-empty.
 */
function flag(value) {
  return /^(1|true)$/i.test(value?.trim() ?? "");
}

/** A comma-separated var as a list, with blanks and stray spaces dropped. */
function list(value) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const env = {
  appName: required("EXPO_PUBLIC_APP_NAME", process.env.EXPO_PUBLIC_APP_NAME),
  appSlug: required("EXPO_PUBLIC_APP_SLUG", process.env.EXPO_PUBLIC_APP_SLUG),
  appScheme: required(
    "EXPO_PUBLIC_APP_SCHEME",
    process.env.EXPO_PUBLIC_APP_SCHEME,
  ),
  appBundleId: required(
    "EXPO_PUBLIC_APP_BUNDLE_ID",
    process.env.EXPO_PUBLIC_APP_BUNDLE_ID,
  ),
  projectId: optional(process.env.EXPO_PUBLIC_EAS_PROJECT_ID),
  // Domains this app is allowed to open universal links (iOS) and app links
  // (Android) for. Read twice: app.config.ts turns them into the native
  // associated-domain/intent-filter entries that make the OS deliver those
  // links here at all, and @/features/deep-links checks incoming URLs
  // against them so a link for someone else's site opens in the browser.
  appLinkDomains: list(process.env.EXPO_PUBLIC_APP_LINK_DOMAINS),
  // The backend the request client (@/features/api) talks to. Optional:
  // unset until a brand has one. https only, except plain http to a local
  // dev server — localhost, or 10.0.2.2, the Android emulator's name for
  // the host machine — since release builds refuse cleartext traffic.
  apiUrl: apiUrl(process.env.EXPO_PUBLIC_API_URL),
  // A build made for end-to-end tests (`yarn e2e:start`). Not a brand
  // setting: it's switched on per run, never in a store build. Read through
  // `isE2E` / `ifE2E` in @/utils rather than from here.
  e2e: flag(process.env.EXPO_PUBLIC_E2E),
};

module.exports = env;
