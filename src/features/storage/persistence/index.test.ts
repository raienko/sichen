/**
 * Imported by path rather than through `./persistence`, so this exercises
 * the web implementation regardless of which platform Jest resolves for —
 * the whole point of the module is browser behaviour that native never hits.
 *
 * Each case re-imports through `jest.isolateModules` because the real
 * module caches its answer for the page's lifetime; without that, the first
 * test's result would be handed to every one after it. That has to be a
 * `require` — the async variant needs `--experimental-vm-modules`, which
 * this project's Jest doesn't run with.
 */
function loadIsStoragePersistent() {
  let fn!: () => boolean;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- see comment above
    fn = (require("./index.web") as typeof import("./index.web"))
      .isStoragePersistent;
  });
  return fn;
}

function stubLocalStorage(value: unknown) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { localStorage: value },
  });
}

describe("isStoragePersistent (web)", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      // @ts-expect-error restoring an environment that had no window
      delete globalThis.window;
    }
  });

  it("reports persistent when a value round-trips", () => {
    const store = new Map<string, string>();
    stubLocalStorage({
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });

    expect(loadIsStoragePersistent()()).toBe(true);
    // The probe cleans up after itself rather than leaving a stray key.
    expect(store.size).toBe(0);
  });

  // Safari's private mode has historically exposed a normal-looking
  // localStorage whose quota is zero — it only fails once you write.
  it("reports non-persistent when writing throws despite the API existing", () => {
    stubLocalStorage({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    });

    expect(loadIsStoragePersistent()()).toBe(false);
  });

  it("reports non-persistent when the browser denies access outright", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: {
        get localStorage(): never {
          throw new Error("ACCESS_DENIED");
        },
      },
    });

    expect(loadIsStoragePersistent()()).toBe(false);
  });

  it("reports non-persistent during a server prerender", () => {
    // @ts-expect-error simulating the static-export pass, where there's no window
    delete globalThis.window;

    expect(loadIsStoragePersistent()()).toBe(false);
  });

  it("does not cache the prerender answer for the browser that follows", () => {
    const isStoragePersistent = loadIsStoragePersistent();

    // @ts-expect-error prerender pass
    delete globalThis.window;
    expect(isStoragePersistent()).toBe(false);

    const store = new Map<string, string>();
    stubLocalStorage({
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    expect(isStoragePersistent()).toBe(true);
  });

  it("caches a real answer instead of probing on every call", () => {
    const setItem = jest.fn();
    stubLocalStorage({ setItem, removeItem: jest.fn() });

    const isStoragePersistent = loadIsStoragePersistent();
    isStoragePersistent();
    isStoragePersistent();
    isStoragePersistent();

    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
