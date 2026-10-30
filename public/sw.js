/**
 * Offline shell for the web game. CacheStorage is optional: a full or
 * unavailable cache must never turn a successful network response into a
 * failed script or page load (notably on iOS after a suspended tab resumes).
 */
const VERSION = "v3";
const BASE = new URL(self.registration.scope).pathname;
const PAGES = `${BASE}pages-${VERSION}`;
const FILES = `${BASE}files-${VERSION}`;
const MAX_FILES = 40;

async function match(cacheName, request) {
  try {
    return await (await caches.open(cacheName)).match(request);
  } catch {
    return undefined;
  }
}

async function store(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    if (cacheName === FILES) {
      // Make room before writing: a failed write is harmless, but old builds
      // should not keep filling the browser's limited mobile storage.
      const keys = await cache.keys();
      await Promise.all(
        keys
          .slice(0, Math.max(0, keys.length - MAX_FILES + 1))
          .map((key) => cache.delete(key)),
      );
    }
    await cache.put(request, response);
  } catch {
    // The response is already being delivered from the network.
  }
}

self.addEventListener("install", (event) => {
  // The HTML bootstrap reloads on controllerchange; that navigation fills
  // the offline shell cache. Installation must not wait on CacheStorage.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(
              (key) =>
                key !== PAGES &&
                key !== FILES &&
                (key.startsWith(`${BASE}pages-`) ||
                  key.startsWith(`${BASE}files-`) ||
                  key === "pages-v2" ||
                  key === "files-v2"),
            )
            .map((key) => caches.delete(key)),
        );
      } catch {
        // Cache cleanup is optional; taking control of the page is not.
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(BASE) ||
    url.pathname.startsWith(`${BASE}api/`)
  )
    return;

  const navigation = request.mode === "navigate";
  const cacheName = navigation ? PAGES : FILES;
  const cacheKey = navigation ? BASE : request;

  const result = (async () => {
    try {
      return { response: await fetch(request), fetched: true };
    } catch (error) {
      const cached = await match(cacheName, cacheKey);
      if (cached) return { response: cached, fetched: false };
      throw error;
    }
  })();

  event.respondWith(result.then(({ response }) => response));
  event.waitUntil(
    result
      .then(({ response, fetched }) => {
        if (fetched && response.ok)
          return store(cacheName, cacheKey, response.clone());
      })
      .catch(() => {}),
  );
});
