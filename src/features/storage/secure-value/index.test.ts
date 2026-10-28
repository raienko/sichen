import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import SecureValue from "./index";

/** The Map behind the expo-secure-store mock in jest.setup.js. */
const keychain = (SecureStore as unknown as { __store: Map<string, string> })
  .__store;

afterEach(() => {
  jest.restoreAllMocks();
});

describe("SecureValue", () => {
  it("round-trips a value through the keychain", () => {
    const token = new SecureValue<string>("token-a");
    token.setValue("jwt");

    expect(token.getValue()).toBe("jwt");
    expect(keychain.get("token-a")).toBe(JSON.stringify("jwt"));
  });

  it("awaits deletion before allowing another write to the same key", async () => {
    const token = new SecureValue<string>("token-b");
    token.setValue("old");

    let finish!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      finish = () => {
        keychain.delete("token-b");
        resolve();
      };
    });
    jest.spyOn(SecureStore, "deleteItemAsync").mockReturnValue(delayedDelete);

    const deletion = token.reset();
    expect(token.getValue()).toBeUndefined();
    expect(() => new SecureValue<string>("token-b").setValue("new")).toThrow(
      /await reset\(\)/,
    );

    finish();
    await deletion;
    token.setValue("new");
    expect(token.getValue()).toBe("new");
    expect(keychain.get("token-b")).toBe(JSON.stringify("new"));
  });

  it("restores the value and rejects when deletion fails", async () => {
    const token = new SecureValue<string>("token-c");
    token.setValue("jwt");
    jest
      .spyOn(SecureStore, "deleteItemAsync")
      .mockRejectedValueOnce(new Error("deletion failed"));

    await expect(token.reset()).rejects.toThrow("deletion failed");
    expect(token.getValue()).toBe("jwt");
    expect(keychain.get("token-c")).toBe(JSON.stringify("jwt"));
  });

  it("updates hook readers", async () => {
    const token = new SecureValue<string>("token-d");
    const { result } = await renderHook(() => token.useValue());
    expect(result.current).toBeUndefined();

    await act(async () => token.setValue("jwt"));
    expect(result.current).toBe("jwt");

    await act(async () => token.reset());
    expect(result.current).toBeUndefined();
  });

  it("stores device-only, readable while unlocked, by default", () => {
    const setItem = jest.spyOn(SecureStore, "setItem");

    new SecureValue<string>("token-e").setValue("jwt");
    new SecureValue<string>("token-f", { access: "afterFirstUnlock" }).setValue(
      "jwt",
    );

    expect(setItem).toHaveBeenNthCalledWith(1, "token-e", '"jwt"', {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    expect(setItem).toHaveBeenNthCalledWith(2, "token-f", '"jwt"', {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  });

  it("rejects invalid keys instead of aliasing another secret", () => {
    expect(() => new SecureValue("user@example.com/token")).toThrow(
      /Invalid SecureValue key/,
    );
    expect(() => new SecureValue("")).toThrow(/Invalid SecureValue key/);
    expect(() => new SecureValue("user_example.com_token")).not.toThrow();
  });
});
