import { PermissionStatus, type PermissionResponse } from "expo";

import { LocalValue } from "@/features/storage";

import Permission from "./permission";

const initial: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  granted: false,
  canAskAgain: true,
  expires: "never",
};

const granted: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: "never",
};

const denied: PermissionResponse = {
  status: PermissionStatus.DENIED,
  granted: false,
  canAskAgain: true,
  expires: "never",
};

describe("Permission", () => {
  it("persists values returned by refresh and request", async () => {
    const get = jest.fn().mockResolvedValue(initial);
    const request = jest.fn().mockResolvedValue(granted);
    const permission = new Permission("test", { get, request });
    permission.reset();

    expect(permission.get()).toBeUndefined();
    await expect(permission.refresh()).resolves.toEqual(initial);
    expect(permission.get()).toEqual(initial);

    await expect(permission.request()).resolves.toEqual({
      ...granted,
      canAskAgain: false,
    });
    expect(permission.get()).toEqual({ ...granted, canAskAgain: false });
  });

  it("sets canAskAgain to false when permission is denied", async () => {
    const permission = new Permission("test-denied", {
      get: jest.fn().mockResolvedValue(denied),
      request: jest.fn().mockResolvedValue(denied),
    });
    permission.reset();

    await expect(permission.request()).resolves.toEqual({
      ...denied,
      canAskAgain: false,
    });
    expect(permission.get()?.canAskAgain).toBe(false);
  });

  it("normalizes a completed response already stored on the device", () => {
    new LocalValue<PermissionResponse>("permission-test-migration").setValue(
      granted,
    );

    const permission = new Permission("test-migration", {
      get: jest.fn(),
      request: jest.fn(),
    });

    expect(permission.get()).toEqual({ ...granted, canAskAgain: false });
  });

  it("does not replace the stored value when an OS read fails", async () => {
    const permission = new Permission("test-failure", {
      get: jest.fn().mockResolvedValue(initial),
      request: jest.fn().mockRejectedValue(new Error("native failure")),
    });
    permission.reset();

    await permission.refresh();
    await expect(permission.request()).rejects.toThrow("native failure");
    expect(permission.get()).toEqual(initial);
  });
});
