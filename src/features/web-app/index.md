[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Web app

> The web build as an installable app (a PWA): add it to the home screen or dock, and it opens in its own window, offline too.

<sub>`src/features/web-app` · `public/`</sub>

```bash
yarn web:build   # dist/client (the app) + dist/server (pages, API routes)
npx expo serve   # try the export locally
```

| Piece                             | Where                      | What it does                                                                                                                         |
| --------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `manifest.json`, `icon-web-*.png` | `public/`, by `yarn brand` | Name, icons and window colours the browser installs with, from `assets/brand` (gitignored)                                           |
| `+html.tsx`                       | `src/app/`                 | The page template: manifest and iOS tags, plus a production worker update that runs before the app bundle                            |
| `sw.js`                           | `public/`                  | The service worker: network first for every app file, cached copies only when offline; cache failures never block a network response |
| `<WebApp />`                      | `src/features/web-app`     | Mounted in Root to keep `theme-color` on the active theme's background                                                               |

- **Production only.** The service worker isn't registered by `yarn web`: it would answer with cached bundles over Metro's live ones. Registration runs in the HTML shell so an older worker can update even if the app bundle fails to load. Try it with `yarn web:build` and `npx expo serve`. `app.config.ts` reads the env files itself, so `expo export` sees them before it loads them.
- **Updates need nothing.** Files come from the network first, so a deploy shows on the next launch. The browser's HTTP cache still handles unchanged hashed bundles. The worker keeps a bounded offline fallback; CacheStorage failures cannot block an available network response. Bump `VERSION` in `sw.js` after changing its rules to retire the previous cache.
- **Same-origin only, and never `/api/`.** API calls to another host, the app's own [API routes](../../app/api/index.md), map tiles and fonts from a CDN are never cached by the worker; offline, the app opens and those requests fail as they would anyway.
- **Hosted by a server, not static files.** The web build has `output: "server"` so `src/app` can hold API routes: deploy `dist/` to EAS Hosting (`eas deploy`) or another host with an Expo server adapter. Pages are rendered in Node first, so `Root` renders an empty shell there and mounts the app in the browser — anything read while modules load has to tolerate having no `window`.
- **Native is untouched.** `index.ts` is a no-op; only `index.web.ts` does anything.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
