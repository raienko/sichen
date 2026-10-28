import { getRandomValues } from "expo-crypto";
import {
  createMMKV,
  deleteMMKV,
  existsMMKV,
  type MMKV,
} from "react-native-mmkv";

import logger from "@/features/logger";

import SecureValue from "../secure-value";

/** 64 symbols, so one random byte masked to six bits picks one without bias. */
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** AES-256 takes a 32-byte key; 32 symbols of six random bits each. */
const KEY_LENGTH = 32;

/**
 * One key per install, for every encrypted store. `afterFirstUnlock`
 * because MMKV is opened at startup, and a launch in the background — a
 * notification, a background fetch — can happen while the phone is locked.
 * Device-only like every `SecureValue`, so a backup restored onto another
 * phone carries files it can't decrypt, and starts empty.
 */
const storageKey = new SecureValue<string>("storage-encryption-key", {
  access: "afterFirstUnlock",
});

type Key = {
  value: string;
  /** Created this launch: anything already on disk was encrypted with another. */
  isNew: boolean;
  /** Saved to the Keychain/Keystore. If not, it lives as long as this launch. */
  isSaved: boolean;
};

let key: Key | undefined;

function generateKey(): string {
  const bytes = getRandomValues(new Uint8Array(KEY_LENGTH));
  return Array.from(bytes, (byte) => ALPHABET[byte & 63]).join("");
}

function isValidKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === KEY_LENGTH &&
    [...value].every((char) => ALPHABET.includes(char))
  );
}

/**
 * The install's key: read once, or made and saved on the first launch.
 *
 * A key that can't be read is not the same as a key that isn't there. An
 * unreadable one (the Keychain refusing before first unlock, a Keystore
 * error) gets a throwaway key for this launch only, and the real stores are
 * left alone for the next one; only a missing or malformed key means the
 * data on disk is unreadable for good and is started over.
 */
function encryptionKey(): Key {
  if (key !== undefined) return key;

  let stored: string | undefined;
  try {
    stored = storageKey.getValue();
  } catch (error) {
    logger.error(
      "Storage key unreadable; storing in memory this launch.",
      error,
    );
    key = { value: generateKey(), isNew: true, isSaved: false };
    return key;
  }

  if (isValidKey(stored)) {
    key = { value: stored, isNew: false, isSaved: true };
    return key;
  }

  const value = generateKey();
  try {
    storageKey.setValue(value);
    key = { value, isNew: true, isSaved: true };
  } catch (error) {
    logger.error(
      "Storage key not saved; storing in memory this launch.",
      error,
    );
    key = { value, isNew: true, isSaved: false };
  }
  return key;
}

/**
 * An MMKV instance encrypted at rest (AES-256) with the install's key, and
 * the one way the app opens MMKV on native.
 *
 * - **Upgrading** from a build that wrote `id` unencrypted: its contents are
 *   copied into the encrypted store (`${id}.encrypted`) and the plaintext
 *   file is deleted, once.
 * - **A new key** (first launch, a restore onto another device, a lost
 *   key): whatever encrypted file is there was written with a different key
 *   and can't be read, so it's deleted and the store starts empty.
 * - **A key that couldn't be saved or read**: a separate store, emptied at
 *   startup, so nothing from this launch is mixed into the real one or left
 *   readable after it.
 *
 * The web build has its own answer — see index.web.ts.
 */
export function createEncryptedStore(id: string): MMKV {
  const { value, isNew, isSaved } = encryptionKey();
  const encryptedId = isSaved ? `${id}.encrypted` : `${id}.ephemeral`;

  if (isNew) deleteMMKV(encryptedId);

  const store = createMMKV({
    id: encryptedId,
    encryptionKey: value,
    encryptionType: "AES-256",
  });

  if (isSaved && existsMMKV(id)) {
    try {
      store.importAllFrom(createMMKV({ id }));
      deleteMMKV(id);
    } catch (error) {
      // Not worth a crash: the old file stays for the next launch to retry.
      logger.error(`Couldn't move "${id}" into encrypted storage.`, error);
    }
  }

  return store;
}
