import brand from "@/constants/brand";
import env from "@/constants/env";

/**
 * The map's default provider (src/features/maps/config.ts). Repeated rather
 * than imported: `@/features/maps` brings react-native-web and Reanimated
 * with it, and this runs as server middleware on every request.
 */
const DEFAULT_MAP_ORIGIN = "https://tiles.openfreemap.org";

/**
 * The Content-Security-Policy is reported, not enforced, until a preview
 * build has run clean with it: a violation is then a console warning
 * instead of a broken map or image. Flip this once the reports are quiet
 * (security plan, SEC-05).
 */
const ENFORCE_CSP = false;

/** `https://host[:port]` of an absolute URL, or nothing. */
function originOf(url: string | undefined): string[] {
  const origin = /^https?:\/\/[^/?#]+/i.exec(url ?? "")?.[0];
  return origin ? [origin.toLowerCase()] : [];
}

/**
 * Who the page may talk to and load from. Images and media come from
 * anywhere over https — chat attachments, avatars, a CMS — and so do
 * frames, since the WebView component embeds pages by URL. Scripts only
 * ever come from the app itself.
 */
export function contentSecurityPolicy(): string {
  const connect = new Set([
    "'self'",
    ...originOf(env.apiUrl),
    ...originOf(brand.mapTilesUrl ?? DEFAULT_MAP_ORIGIN),
    ...originOf(brand.mapGlyphsUrl ?? DEFAULT_MAP_ORIGIN),
  ]);

  return [
    "default-src 'self'",
    "script-src 'self'",
    // react-native-web writes its styles into <style> tags at runtime.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src ${[...connect].join(" ")}`,
    // maplibre's worker is served from public/ and spawns blob: workers.
    "worker-src 'self' blob:",
    "frame-src 'self' https:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join("; ");
}

/**
 * Every response's security headers. The CSP is left out in development:
 * Metro's hot reload needs `eval` and a websocket, and a policy loose
 * enough for that says nothing about production.
 */
export function securityHeaders(production: boolean): Record<string, string> {
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    // Also `frame-ancestors 'none'` in the CSP, but browsers ignore that in
    // report-only mode — this is what stops clickjacking until it's enforced.
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Location for the map, the camera for the image picker; nothing else.
    "Permissions-Policy":
      "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=()",
    ...(production
      ? {
          [ENFORCE_CSP
            ? "Content-Security-Policy"
            : "Content-Security-Policy-Report-Only"]: contentSecurityPolicy(),
        }
      : {}),
  };
}
