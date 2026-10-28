import { useMMKVString } from "react-native-mmkv";

import { createEncryptedStore } from "../encrypted-store";
import type { StorageAdapter } from "../types";

/**
 * One adapter for every platform. On native the store is encrypted at rest
 * with a per-install key (see ../encrypted-store). `react-native-mmkv`
 * ships its own web implementation (`createMMKV.web.ts`, backed by
 * `localStorage` with keys namespaced by this `id`), so the bundler's
 * platform resolution swaps it in and there's nothing for this file to
 * branch on — no `.web.ts` twin, and one code path to reason about.
 *
 * What *is* web-specific is what happens when `localStorage` is
 * unavailable: MMKV silently falls back to an in-memory store, so writes
 * appear to work and then vanish on reload. That's surfaced by
 * `isStoragePersistent()` (../persistence) rather than handled here —
 * nothing this adapter can do makes the data persist, so the honest move
 * is to let the app tell the user.
 */
const mmkv = createEncryptedStore("local-storage");

/**
 * The web build is also rendered in Node (server output, for API routes),
 * where there is no `localStorage` and MMKV throws on any access. A value
 * read while modules load — a permission's stored snapshot, say — then
 * reads as unset and a write is dropped; the browser has the real data.
 * iOS, Android and Jest all have a `window`.
 */
const onServer = typeof window === "undefined";

const localStorageAdapter: StorageAdapter = {
  getItem: (key) => (onServer ? undefined : mmkv.getString(key)),
  setItem: (key, value) => {
    if (!onServer) mmkv.set(key, value);
  },
  removeItem: (key) => {
    if (!onServer) mmkv.remove(key);
  },
  // useMMKVString subscribes to just this key, instead of a generic
  // "any key changed" listener re-checked in JS on every change.
  useValue: (key) => useMMKVString(key, mmkv)[0],
};

export default localStorageAdapter;
