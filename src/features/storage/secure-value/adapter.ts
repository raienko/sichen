import { useSyncExternalStore } from "react";

import type { SecureAccess, StorageAdapter } from "../types";
import secureBackend from "./backend";

/**
 * What's been read or written this launch. The Keychain has no change
 * events, so this is what `useValue` subscribes to. A pending delete is
 * visible immediately, but writes to that key must wait for it to finish.
 */
const mirror = new Map<string, string | undefined>();
const listeners = new Map<string, Set<() => void>>();
const pendingDeletes = new Map<string, Promise<void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function read(key: string): string | undefined {
  if (!mirror.has(key)) mirror.set(key, secureBackend.get(key));
  return mirror.get(key);
}

function createSecureStorageAdapter(
  access: SecureAccess,
): StorageAdapter<Promise<void>> {
  return {
    getItem: read,
    setItem: (key, value) => {
      if (pendingDeletes.has(key)) {
        throw new Error(
          `SecureValue "${key}" is being deleted; await reset() before writing it again.`,
        );
      }
      secureBackend.set(key, value, access);
      mirror.set(key, value);
      notify(key);
    },
    removeItem: (key) => {
      const pending = pendingDeletes.get(key);
      if (pending) return pending;

      const previous = read(key);
      // Keep the promise in the map until the backend finishes. A failed
      // deletion rechecks the visible value and rejects to the auth caller.
      const deletion = Promise.resolve()
        .then(() => secureBackend.remove(key))
        .catch((error) => {
          // A native failure may happen before or after the item changed.
          // Reflect the backend's actual state when it is still readable.
          try {
            mirror.set(key, secureBackend.get(key));
          } catch {
            mirror.set(key, previous);
          }
          notify(key);
          throw error;
        })
        .finally(() => pendingDeletes.delete(key));
      pendingDeletes.set(key, deletion);
      mirror.set(key, undefined);
      notify(key);
      return deletion;
    },
    useValue: (key) =>
      useSyncExternalStore(
        (listener) => {
          const set = listeners.get(key) ?? new Set();
          set.add(listener);
          listeners.set(key, set);
          return () => {
            set.delete(listener);
            if (set.size === 0) listeners.delete(key);
          };
        },
        () => read(key),
        () => undefined,
      ),
  };
}

/**
 * One adapter per access class. They share the mirror above: a key is the
 * same secret whichever value object reads it.
 */
const adapters: Record<SecureAccess, StorageAdapter<Promise<void>>> = {
  whenUnlocked: createSecureStorageAdapter("whenUnlocked"),
  afterFirstUnlock: createSecureStorageAdapter("afterFirstUnlock"),
};

export default function secureStorageAdapter(
  access: SecureAccess,
): StorageAdapter<Promise<void>> {
  return adapters[access];
}
