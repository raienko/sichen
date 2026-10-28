[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Deep links

> One pipeline for every incoming link: parsing, matching, queueing and routing.

<sub>`src/features/deep-links` · Tests: [`deep-links.test.tsx`](deep-links.test.tsx), [`match.test.ts`](match.test.ts), [`native-intent.test.ts`](native-intent.test.ts), [`queue.test.ts`](queue.test.ts) …</sub>

```
src/features/deep-links/
  routes.ts        The app's link table — the one place to add a link
  registry.ts       The pipeline: match, gate, dispatch. `deepLinks` + `deepLinkEvents`
  deep-links.tsx    <DeepLinks> — subscribes to incoming URLs. Mounted in providers.tsx
  native-intent.ts  Native Router interception, reusable by branded app entry points
  url.ts            Any URL shape → an app path + query
  match.ts          `/orders/:id` → captured params
  queue.ts          Links held until their gates open
  types.ts          DeepLink, DeepLinkRoute, DeepLinkGate, DEEP_LINK_GATES
```

```ts
import { deepLinks } from "@/features/deep-links";

// Declared once, in routes.ts:
{ pattern: "/orders/:id", handle: ({ params }) => `/orders/${params.id}` }
{ pattern: "/promo/:code", handle: ({ params }) => Modal.show(`promo-${params.code}`) }
{ pattern: "/account", gates: ["auth"], handle: () => "/account" }

// Dispatched from anywhere — a tapped push notification, a toast action:
deepLinks.open(url);

// Released when the app says the condition is met:
deepLinks.setGate("auth", true);
```

**One pipeline, whatever raised the link.** `<DeepLinks>` (mounted in `providers.tsx`) owns the feature's `Linking` subscription and reads the URL the app was launched with, handing both to `deepLinks.receive()`. It clears Expo's cached launch URL after reading it and the registry deduplicates initial URLs, so a development remount or the two native initial-URL readers cannot replay one launch intent. Links the app raises itself never reach the OS, so they call `deepLinks.open()` and run exactly the same handlers.

**One native navigation owner.** [`src/app/+native-intent.tsx`](../../app/+native-intent.tsx) is intentionally only an import/export of the reusable implementation in [`native-intent.ts`](native-intent.ts). A branded app can keep its own app entry point and reuse the feature unchanged. The implementation asks whether the registry claims the URL: a registered command returns `null`, preventing Expo Router from navigating to the original URL; an ordinary route is returned unchanged for Router to resolve by file. `<DeepLinks>` receives the same registered URL and dispatches it after its gates open, so a handler that returns an href is its only navigation rather than a second navigation racing Router.

The two programmatic entry points still differ on unregistered paths:

|                           | Path a route claims | Path no route claims                             |
| ------------------------- | ------------------- | ------------------------------------------------ |
| `receive()` — from the OS | Runs the handler    | **Left alone** — Router owns ordinary route URLs |
| `open()` — from the app   | Runs the handler    | Navigates, letting the router resolve it by file |

On web, `+native-intent` does not run. Expo Router resolves the browser location first, so authentication must also be enforced by the protected route/layout itself; a deep-link gate postpones its command handler, not web route rendering. Registered side-effect-only web URLs should therefore also have a real route (or a root-layout redirect) rather than relying on a non-existent path.

**Any link shape.** `url.ts` reduces all four of these to the same `/orders/12`:

| Shape                           | Where it comes from                              |
| ------------------------------- | ------------------------------------------------ |
| `myapp://orders/12`             | A custom-scheme deep link, as the OS delivers it |
| `myapp:///orders/12`            | `Linking.createURL()`'s triple-slashed spelling  |
| `https://example.com/orders/12` | A universal link (iOS) / app link (Android)      |
| `/orders/12`                    | A bare path inside a payload — a push, a toast   |

`https://` is accepted for a host in `EXPO_PUBLIC_APP_LINK_DOMAINS` (`app.config.ts` turns the same list into the `associatedDomains` and verified intent filters that make a native OS deliver those links) or for the web build's current origin, including localhost. Anything else — another app's scheme, a site we don't own — is _not_ ours, and `deepLinks.open()` hands it to the OS with `Linking.openURL` instead. One call site can therefore take any link at all without knowing in advance whether it points inside the app. Programmatic fallback navigation preserves repeated query parameters rather than reducing the link to its pathname.

The URL is split by hand rather than with `URL` or `Linking.parse`. React Native's global `URL` is a regex shim whose `hostname`/`pathname` only match `https?://`, so it reports an empty host and a path of `/` for exactly the custom-scheme links this exists to handle; `Linking.parse` is built on that same `URL` and additionally reads `expo-constants`, which makes it throw where those aren't populated.

**Postponed links — gates.** Every route can name conditions it needs before its handler runs; a link that arrives while any of them is closed is held in memory and dispatched the moment they all open. Up to ten pending intents are retained, with the oldest discarded if an eleventh arrives. `gates: ["auth"]` is the "handle this only once the user is signed in" case, and `deepLinks.setGate("auth", true)` after a sign-in releases it. Native registered commands are also suppressed by `+native-intent` while waiting; protected web routes still need their own layout-level authentication guard.

`ready` is built in and applies to _every_ link. `<DeepLinks>` opens it once the navigation tree exists, which is what makes a launch URL safe: it's read while Expo Router is still working out its initial state, so the handler waits rather than calling `router.navigate` into a navigator that doesn't exist yet. The queue is deliberately in-memory — a held link is a _this-launch_ intent, and persisting it would mean a link tapped last week reopening a screen out of nowhere. An app that wants an invite to survive an install should persist that one link itself with `LocalValue` and its own expiry, then hand it back through `deepLinks.open()`.

**Watching rather than handling.** `deepLinkEvents` (an `@/features/event-bus` bus) emits `handled` and `deferred` for every link — the hook for analytics counting deep-link opens, or a debug screen. The showcase's Deep links section uses it to keep its "waiting on a gate" readout live.

**Web.** `Linking.getInitialURL()` returns `window.location.href` there, so a page load runs through the same pipeline as a native launch — handlers fire on web too, alongside the router rendering the route.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
