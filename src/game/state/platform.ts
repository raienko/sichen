import { LocalValue } from "@/features/storage";

import { RULES } from "../data";

import type { SlotStorage } from "./save";

/**
 * The game's side of the app's storage: MMKV (encrypted at rest) on native,
 * localStorage on the web. Keys say "game", never the product's name, so a
 * rename keeps everyone's saves.
 */
const slots = Array.from(
  { length: RULES.saveSlots },
  (_, i) => new LocalValue<string>(`game-save-${i}`),
);

export const slotStorage: SlotStorage = {
  read: (slot) => slots[slot]?.getValue() ?? null,
  write: (slot, text) => slots[slot]?.setValue(text),
  remove: (slot) => slots[slot]?.reset(),
};

// ---------------------------------------------------------------- auth

export type Account = {
  id: string;
  provider: "anonymous" | "google" | "apple";
};

/**
 * Sign-in behind one interface. The slice ships only the anonymous provider
 * (a random id kept on the device); Google and Apple implement the same
 * shape later, and linking keeps the local saves because saves are keyed by
 * slot, not by account.
 */
export interface AuthProvider {
  readonly provider: Account["provider"];
  signIn(): Promise<Account>;
  signOut(): Promise<void>;
}

const deviceId = new LocalValue<string>("game-device-id");

function randomId(): string {
  const hex = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  return `${hex()}-${hex()}-${hex()}-${hex()}`;
}

export const anonymousAuth: AuthProvider = {
  provider: "anonymous",
  async signIn() {
    let id = deviceId.getValue();
    if (!id) {
      id = randomId();
      deviceId.setValue(id);
    }
    return { id, provider: "anonymous" };
  },
  async signOut() {},
};
