import * as ExpoNetwork from "expo-network";

import { renderHook } from "@/root/testing";

import {
  getNetworkStatus,
  NetworkStateType,
  onNetworkChange,
  toNetworkStatus,
  useNetworkStatus,
} from "./index";

jest.mock("expo-network", () => {
  const listeners = new Set<(mockState: object) => void>();
  return {
    NetworkStateType: { UNKNOWN: "UNKNOWN", NONE: "NONE", WIFI: "WIFI" },
    getNetworkStateAsync: jest.fn(async () => ({
      isConnected: true,
      isInternetReachable: true,
      type: "WIFI",
    })),
    addNetworkStateListener: (listener: (mockState: object) => void) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    useNetworkState: jest.fn(() => ({})),
    emit: (mockState: object) =>
      listeners.forEach((listener) => listener(mockState)),
  };
});

const emit = (ExpoNetwork as unknown as { emit: (mockState: object) => void })
  .emit;

describe("network", () => {
  it("counts an unknown state as online", () => {
    expect(toNetworkStatus({})).toEqual({
      isOnline: true,
      isConnected: true,
      isInternetReachable: undefined,
      type: NetworkStateType.UNKNOWN,
    });
  });

  it("is offline without a connection, or when the internet doesn't answer", () => {
    expect(toNetworkStatus({ isConnected: false }).isOnline).toBe(false);
    expect(
      toNetworkStatus({ isConnected: true, isInternetReachable: false })
        .isOnline,
    ).toBe(false);
  });

  it("reads the status once", async () => {
    await expect(getNetworkStatus()).resolves.toMatchObject({
      isOnline: true,
      type: "WIFI",
    });
  });

  it("calls back on every change until unsubscribed", () => {
    const listener = jest.fn();
    const stop = onNetworkChange(listener);

    emit({ isConnected: false, type: "NONE" });
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOnline: false, type: "NONE" }),
    );

    stop();
    emit({ isConnected: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("gives components the normalised status", async () => {
    jest.mocked(ExpoNetwork.useNetworkState).mockReturnValue({
      isConnected: false,
      type: ExpoNetwork.NetworkStateType.NONE,
    });
    const { result } = await renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });
});
