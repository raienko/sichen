[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Security headers

> The web build's HTTP security headers, added to every response by `src/app/+middleware.ts`.

<sub>`src/features/security-headers` · Tests: [`index.test.ts`](index.test.ts)</sub>

| Header                                | Value                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| `Strict-Transport-Security`           | one year, subdomains included                                        |
| `X-Content-Type-Options`              | `nosniff`                                                            |
| `X-Frame-Options`                     | `DENY` — the app can't be framed (clickjacking)                      |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin`                                    |
| `Permissions-Policy`                  | camera and geolocation for the app itself; microphone, payment … off |
| `Content-Security-Policy-Report-Only` | production only; see below                                           |

- **The CSP starts in report-only.** Violations show as console warnings, nothing breaks. Once a preview build runs clean (maps, images, the API, WebView embeds), set `ENFORCE_CSP` to `true` in `index.ts` and the same policy is enforced.
- **What it allows.** Scripts only from the app. Styles inline too, because react-native-web writes `<style>` tags. Images, media and frames from any `https:` host (attachments, avatars, embedded pages). `connect-src` names the API origin and the map tile and glyph origins, from the same env the app reads. A tile provider whose TileJSON points at a different host needs that host added here.
- **Not in development.** Metro's hot reload needs `eval` and a websocket; a policy loose enough for that says nothing about production. The other headers are sent everywhere.
- **Middleware** needs `unstable_useServerMiddleware: true` on the `expo-router` plugin (app.config.ts). It runs for pages, static assets and [API routes](../../app/api/index.md) alike.

Check a production build:

```bash
yarn web:build && npx expo serve
```

```bash
curl -sI http://localhost:8081/ | grep -iE "strict-transport|x-frame|x-content|referrer|permissions|content-security"
```

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
