import { useSyncExternalStore } from "react";

type Listener = (key: string) => void;

type Configuration = {
  id?: string;
  encryptionKey?: string;
  encryptionType?: "AES-128" | "AES-256";
};

function createFakeMMKV(configuration: Configuration) {
  const store = new Map<string, string>();
  const listeners = new Set<Listener>();

  return {
    /** What it was opened with, so a test can see whether it's encrypted. */
    configuration,
    set: (key: string, value: string) => {
      store.set(key, String(value));
      listeners.forEach((listener) => listener(key));
    },
    getString: (key: string) => store.get(key),
    getAllKeys: () => [...store.keys()],
    clearAll: () => {
      const keys = [...store.keys()];
      store.clear();
      keys.forEach((key) => listeners.forEach((listener) => listener(key)));
    },
    importAllFrom: (other: {
      getAllKeys(): string[];
      getString(key: string): string | undefined;
    }) => {
      const keys = other.getAllKeys();
      keys.forEach((key) => store.set(key, other.getString(key) as string));
      return keys.length;
    },
    remove: (key: string) => {
      const existed = store.delete(key);
      if (existed) {
        listeners.forEach((listener) => listener(key));
      }
      return existed;
    },
    addOnValueChangedListener: (onValueChanged: Listener) => {
      listeners.add(onValueChanged);
      return { remove: () => listeners.delete(onValueChanged) };
    },
  };
}

type FakeMMKV = ReturnType<typeof createFakeMMKV>;

// Real MMKV shares one on-disk store per `id`; mirror that so repeated
// createMMKV({ id }) calls in tests see the same in-memory data.
const instancesById = new Map<string, FakeMMKV>();

export function createMMKV(configuration: Configuration = {}): FakeMMKV {
  const id = configuration.id ?? "mmkv.default";
  let instance = instancesById.get(id);
  if (!instance) {
    instance = createFakeMMKV(configuration);
    instancesById.set(id, instance);
  }
  return instance;
}

export function existsMMKV(id: string): boolean {
  return instancesById.has(id);
}

export function deleteMMKV(id: string): boolean {
  return instancesById.delete(id);
}

export function useMMKVString(
  key: string,
  instance?: FakeMMKV,
): [string | undefined, (value: string) => void] {
  const mmkv = instance ?? createMMKV();
  const value = useSyncExternalStore(
    (onChange) => {
      const listener = mmkv.addOnValueChangedListener((changedKey) => {
        if (changedKey === key) {
          onChange();
        }
      });
      return () => listener.remove();
    },
    () => mmkv.getString(key),
  );
  return [value, (next: string) => mmkv.set(key, next)];
}
