import {
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
} from "expo-location";

import logger from "@/features/logger";
import { permissions } from "@/features/permissions";
import { renderHook, waitFor } from "@/root/testing";

import useUserLocation from "./use-user-location";

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const fix = (latitude: number, longitude: number) => ({
  coords: { latitude, longitude },
  timestamp: 0,
});

const answer = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain, status: granted ? "granted" : "denied" }) as never;

afterEach(() => jest.restoreAllMocks());

describe("useUserLocation", () => {
  it("asks once, then reports a fresh fix", async () => {
    jest
      .spyOn(permissions.location, "refresh")
      .mockResolvedValue(answer(false));
    const request = jest
      .spyOn(permissions.location, "request")
      .mockResolvedValue(answer(true));
    jest.mocked(getLastKnownPositionAsync).mockResolvedValue(null);
    jest.mocked(getCurrentPositionAsync).mockResolvedValue(fix(1, 2) as never);

    const { result } = await renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.coordinate).toEqual({ latitude: 1, longitude: 2 });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("reports a refusal as denied, without a coordinate", async () => {
    jest
      .spyOn(permissions.location, "refresh")
      .mockResolvedValue(answer(false, false));

    const { result } = await renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.coordinate).toBeUndefined();
  });

  it("doesn't prompt when told not to", async () => {
    jest
      .spyOn(permissions.location, "refresh")
      .mockResolvedValue(answer(false));
    const request = jest.spyOn(permissions.location, "request");

    const { result } = await renderHook(() =>
      useUserLocation({ request: false }),
    );

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps the last known position when a fresh fix fails", async () => {
    jest.spyOn(permissions.location, "refresh").mockResolvedValue(answer(true));
    jest
      .mocked(getLastKnownPositionAsync)
      .mockResolvedValue(fix(5, 6) as never);
    jest
      .mocked(getCurrentPositionAsync)
      .mockRejectedValue(new Error("timed out"));
    jest.spyOn(logger, "failed").mockImplementation(() => {});

    const { result } = await renderHook(() => useUserLocation());

    await waitFor(() =>
      expect(jest.mocked(getCurrentPositionAsync)).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(result.current).toEqual({
        status: "ready",
        coordinate: { latitude: 5, longitude: 6 },
      }),
    );
  });

  it("is unavailable when there is no position at all", async () => {
    jest.spyOn(permissions.location, "refresh").mockResolvedValue(answer(true));
    jest.mocked(getLastKnownPositionAsync).mockResolvedValue(null);
    jest
      .mocked(getCurrentPositionAsync)
      .mockRejectedValue(new Error("location services off"));
    jest.spyOn(logger, "failed").mockImplementation(() => {});

    const { result } = await renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
  });
});
