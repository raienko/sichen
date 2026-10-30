import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);

function response(label) {
  return {
    ok: true,
    label,
    clone() {
      return response(label);
    },
  };
}

function worker({ fetch, caches }) {
  const listeners = new Map();
  let skipped = false;
  let claimed = false;
  const self = {
    registration: { scope: "https://example.test/sichen/" },
    location: { origin: "https://example.test" },
    addEventListener: (name, listener) => listeners.set(name, listener),
    skipWaiting: async () => {
      skipped = true;
    },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
  };
  vm.runInNewContext(source, { self, caches, fetch, URL });
  return {
    skipped: () => skipped,
    claimed: () => claimed,
    async lifecycle(name) {
      const work = [];
      listeners.get(name)({ waitUntil: (promise) => work.push(promise) });
      await Promise.all(work);
    },
    async request(path, mode = "no-cors") {
      let delivered;
      const work = [];
      listeners.get("fetch")({
        request: {
          method: "GET",
          mode,
          url: `https://example.test/sichen/${path}`,
        },
        respondWith: (promise) => {
          delivered = promise;
        },
        waitUntil: (promise) => work.push(promise),
      });
      const result = delivered ? await delivered : undefined;
      await Promise.all(work);
      return result;
    },
  };
}

test("worker installs and activates when CacheStorage fails", async () => {
  const app = worker({
    fetch: async () => response("network"),
    caches: {
      open: async () => {
        throw new Error("storage unavailable");
      },
      keys: async () => {
        throw new Error("storage unavailable");
      },
    },
  });
  await app.lifecycle("install");
  await app.lifecycle("activate");
  assert.equal(app.skipped(), true);
  assert.equal(app.claimed(), true);
});

test("activation removes old game caches without touching other sites", async () => {
  const removed = [];
  const app = worker({
    fetch: async () => response("network"),
    caches: {
      keys: async () => [
        "pages-v2",
        "files-v2",
        "/sichen/pages-v3",
        "/sichen/files-v3",
        "another-site-cache",
      ],
      delete: async (key) => {
        removed.push(key);
      },
    },
  });
  await app.lifecycle("activate");
  assert.deepEqual(removed, ["pages-v2", "files-v2"]);
  assert.equal(app.claimed(), true);
});

test("a failed cache write cannot block a fetched JavaScript bundle", async () => {
  const app = worker({
    fetch: async () => response("fresh bundle"),
    caches: {
      open: async () => ({
        keys: async () => [],
        put: async () => {
          throw new Error("quota exceeded");
        },
      }),
    },
  });
  const result = await app.request("_expo/static/js/web/entry-123.js");
  assert.equal(result.label, "fresh bundle");
});

test("network responses take priority over a cached old app shell", async () => {
  const app = worker({
    fetch: async () => response("current page"),
    caches: {
      open: async () => ({
        match: async () => response("old page"),
        put: async () => {},
      }),
    },
  });
  const result = await app.request("", "navigate");
  assert.equal(result.label, "current page");
});

test("a cached shell remains available offline", async () => {
  const app = worker({
    fetch: async () => {
      throw new Error("offline");
    },
    caches: {
      open: async () => ({ match: async () => response("offline page") }),
    },
  });
  const result = await app.request("", "navigate");
  assert.equal(result.label, "offline page");
});

test("API requests are not handled by the cache worker", async () => {
  const app = worker({
    fetch: async () => response("network"),
    caches: {
      open: async () => {
        throw new Error("unexpected cache call");
      },
    },
  });
  assert.equal(await app.request("api/status"), undefined);
});
