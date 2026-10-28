/* eslint-disable @typescript-eslint/no-require-imports -- each launch needs a fresh module registry, which only require() inside jest.isolateModules gives */
import type * as SecureStoreModule from "expo-secure-store";

import type * as MMKVModule from "../../../../__mocks__/react-native-mmkv";
import type * as EncryptedStoreModule from "./index";

const KEY_NAME = "storage-encryption-key";

/**
 * A fresh launch: the module's cached key, the fake MMKV files and the fake
 * Keychain all start from nothing, and `before` can put state on "disk"
 * first — a plaintext store from an older build, an existing key.
 */
function launch(
  before?: (disk: {
    mmkv: typeof MMKVModule;
    keychain: Map<string, string>;
    secureStore: typeof SecureStoreModule;
  }) => void,
) {
  let loaded!: {
    createEncryptedStore: typeof EncryptedStoreModule.createEncryptedStore;
    mmkv: typeof MMKVModule;
    keychain: Map<string, string>;
  };
  jest.isolateModules(() => {
    const mmkv = require("react-native-mmkv") as typeof MMKVModule;
    const secureStore =
      require("expo-secure-store") as typeof SecureStoreModule;
    const keychain = (
      secureStore as unknown as { __store: Map<string, string> }
    ).__store;
    before?.({ mmkv, keychain, secureStore });
    const { createEncryptedStore } =
      require("./index") as typeof EncryptedStoreModule;
    loaded = { createEncryptedStore, mmkv, keychain };
  });
  return loaded;
}

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createEncryptedStore", () => {
  it("encrypts with a random per-install AES-256 key kept in secure storage", () => {
    const { createEncryptedStore, keychain } = launch();

    const store = createEncryptedStore("prefs") as unknown as ReturnType<
      typeof MMKVModule.createMMKV
    >;

    const saved = JSON.parse(keychain.get(KEY_NAME) as string) as string;
    expect(saved).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(store.configuration).toEqual({
      id: "prefs.encrypted",
      encryptionKey: saved,
      encryptionType: "AES-256",
    });
  });

  it("generates a different key on each install", () => {
    const first = launch();
    first.createEncryptedStore("prefs");
    const second = launch();
    second.createEncryptedStore("prefs");

    expect(first.keychain.get(KEY_NAME)).not.toBe(
      second.keychain.get(KEY_NAME),
    );
  });

  it("moves an unencrypted store from an older build and deletes it", () => {
    const { createEncryptedStore, mmkv } = launch(({ mmkv }) => {
      const legacy = mmkv.createMMKV({ id: "prefs" });
      legacy.set("theme", '"dark"');
    });

    const store = createEncryptedStore("prefs");

    expect(store.getString("theme")).toBe('"dark"');
    expect(mmkv.existsMMKV("prefs")).toBe(false);
  });

  it("keeps encrypted data when the key is already there", () => {
    const { createEncryptedStore } = launch(({ mmkv, keychain }) => {
      keychain.set(KEY_NAME, JSON.stringify("a".repeat(32)));
      mmkv.createMMKV({ id: "prefs.encrypted" }).set("theme", '"dark"');
    });

    expect(createEncryptedStore("prefs").getString("theme")).toBe('"dark"');
  });

  it("starts empty when the key is missing, rather than reading another key's file", () => {
    const { createEncryptedStore } = launch(({ mmkv }) => {
      mmkv.createMMKV({ id: "prefs.encrypted" }).set("theme", '"dark"');
    });

    expect(createEncryptedStore("prefs").getString("theme")).toBeUndefined();
  });

  it("replaces a malformed key and starts empty", () => {
    const { createEncryptedStore, keychain } = launch(({ mmkv, keychain }) => {
      keychain.set(KEY_NAME, JSON.stringify("short"));
      mmkv.createMMKV({ id: "prefs.encrypted" }).set("theme", '"dark"');
    });

    expect(createEncryptedStore("prefs").getString("theme")).toBeUndefined();
    expect(JSON.parse(keychain.get(KEY_NAME) as string)).toHaveLength(32);
  });

  it("uses a throwaway store and leaves the real one alone when the key can't be read", () => {
    const { createEncryptedStore, mmkv, keychain } = launch(
      ({ mmkv, keychain, secureStore }) => {
        keychain.set(KEY_NAME, JSON.stringify("a".repeat(32)));
        mmkv.createMMKV({ id: "prefs.encrypted" }).set("theme", '"dark"');
        jest.spyOn(secureStore, "getItem").mockImplementation(() => {
          throw new Error("Keychain locked");
        });
      },
    );

    const store = createEncryptedStore("prefs") as unknown as ReturnType<
      typeof MMKVModule.createMMKV
    >;

    expect(store.configuration.id).toBe("prefs.ephemeral");
    expect(store.getString("theme")).toBeUndefined();
    expect(mmkv.createMMKV({ id: "prefs.encrypted" }).getString("theme")).toBe(
      '"dark"',
    );
    expect(keychain.get(KEY_NAME)).toBe(JSON.stringify("a".repeat(32)));
  });

  it("stores the key device-only, readable after first unlock", () => {
    let setItem!: jest.SpyInstance;
    const { createEncryptedStore } = launch(({ secureStore }) => {
      setItem = jest.spyOn(secureStore, "setItem");
    });

    createEncryptedStore("prefs");

    expect(setItem).toHaveBeenCalledWith(KEY_NAME, expect.any(String), {
      keychainAccessible: 1, // AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY in the mock
    });
  });
});
