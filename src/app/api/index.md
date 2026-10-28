[Docs](../../../docs/index.md) › API routes

# API routes

> Server endpoints that live with the app: a file in `src/app` ending in `+api.ts` answers HTTP requests at its path.

<sub>`src/app/api` · Expo Router API routes</sub>

```ts
// src/app/api/health+api.ts → GET /api/health
export function GET() {
  return Response.json({ status: "ok" });
}
```

```bash
curl http://localhost:8081/api/health   # while `yarn web` / `yarn start` runs
```

| Route             | Does                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `GET /api/health` | `{ status }` — the server is up. The dev menu has a button for it. |

- **Server code.** A route runs in Node (the Expo dev server, or the host in production), never in the app bundle, so it can read env vars without `EXPO_PUBLIC_` and hold secrets. Export one function per method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`); any other method gets a 405, and a throw a 500. Requests and responses are the standard `Request` / `Response`.
- **Keep them under `src/app/api/`.** A route is a route: `src/app/health+api.ts` would answer `/health` beside the app's screens. One folder keeps them apart and lets the service worker skip `/api/` in one rule.
- **Calling them.** On web, `fetch("/api/health")` goes to the page's own origin. In development on iOS and Android it goes to the dev server. A release build needs to know where the server is: set the `expo-router` plugin's `origin` in `app.config.ts` once it's deployed.
- **What it took.** `web.output` is `"server"` (on SDK 57 API routes need it), so the web build is deployed to a server — see [Web app](../../features/web-app/index.md). No platform files: `health+api.web.ts` would not work.
- **Security headers** come from [`+middleware.ts`](../+middleware.ts), on every response including these.
- **Not for the app's real backend.** These suit small things that belong with the app — a health check, a webhook, a proxy that hides a key. Product data still goes through [`api`](../../features/api/index.md) to the backend at `EXPO_PUBLIC_API_URL`.

## Rules for every route

A route is a public endpoint the moment the web build is deployed. Before adding one:

- **Authenticate.** Anything beyond a health check reads the `Authorization: Bearer …` header and verifies the token server-side (signature, expiry, audience) before doing anything else. Never trust a user id from the body or query.
- **Validate input with zod.** Parse `await request.json()` and the search params through a schema; reject anything else with a 400. Cap body size before parsing.
- **Rate-limit.** At the hosting layer (EAS Hosting / the CDN) or in middleware, keyed by user and IP, stricter on anything that sends mail, costs money or checks a password.
- **Return generic errors.** `{ error: "invalid_request" }` and a status code — no stack traces, SQL, upstream responses or which part of a credential was wrong.
- **Leak nothing about the build.** No versions, commit hashes or env names in public responses (`/api/health` returns `{ status }` only).
- **Never log bodies or headers.** Log the route, status and duration; anything more goes through `redact` from `@/features/logger`.
- **Secrets stay server-side.** Read them from env vars without `EXPO_PUBLIC_`; never echo them back.

```ts
import { z } from "zod";

const Body = z.object({ title: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const user = await authenticate(request); // throws a 401 Response
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  // …
}
```

---

[Docs index](../../../docs/index.md)
