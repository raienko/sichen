/**
 * The web build's service worker: what lets the installed app open with no
 * network, and start fast with one. Registered by @/features/web-app, in
 * production builds only — in development it would serve stale bundles over
 * Metro's live ones.
 *
 * Three rules, all for same-origin GET requests (an API on another host, map
 * tiles and the like always go straight to the network, and so do the app's
 * own API routes under /api/ — a cached answer there would be a wrong one):
 * - Pages: network first, so a deploy shows up on the next launch; the last
 *   page seen when offline. The build is a single-page app, so any cached
 *   page is the whole app shell.
 * - Build output (/_expo/static/, /assets/): cache first. Every file name
 *   there carries a content hash, so a cached copy is never out of date.
 * - Everything else in public/ (icons, the manifest): the cached copy now,
 *   refreshed in the background for next time.
 *
 * Bump VERSION only to drop every cache at once, e.g. after changing these
 * rules; ordinary deploys need nothing.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const FILES = `files-${VERSION}`;
/** Hashed bundles pile up across deploys; the oldest go past this many. */
const MAX_FILES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGES && key !== FILES)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (
    url.pathname.startsWith("/_expo/static/") ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put("/", response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match("/");
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await store(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fresh = fetch(request).then(async (response) => {
    if (response.ok) await store(request, response.clone());
    return response;
  });
  if (cached) {
    fresh.catch(() => {});
    return cached;
  }
  return fresh;
}

async function store(request, response) {
  const cache = await caches.open(FILES);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - MAX_FILES))
      .map((key) => cache.delete(key)),
  );
}
