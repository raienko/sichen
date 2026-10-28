import { PermissionStatus, type PermissionResponse } from "expo";
import type { MediaLibraryPermissionResponse } from "expo-image-picker";

import permissions from "./registry";

const response: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: false,
  expires: "never",
};

const galleryResponse: MediaLibraryPermissionResponse = {
  ...response,
  accessPrivileges: "all",
};

describe("permissions registry", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refreshes every registered permission", async () => {
    const camera = jest
      .spyOn(permissions.camera, "refresh")
      .mockResolvedValue(response);
    const gallery = jest
      .spyOn(permissions.gallery, "refresh")
      .mockResolvedValue(galleryResponse);
    const location = jest
      .spyOn(permissions.location, "refresh")
      .mockResolvedValue(response as never);
    const notifications = jest
      .spyOn(permissions.notifications, "refresh")
      .mockResolvedValue(response);

    await expect(permissions.refresh()).resolves.toEqual({
      camera: response,
      gallery: galleryResponse,
      location: response,
      notifications: response,
    });

    expect(camera).toHaveBeenCalledTimes(1);
    expect(gallery).toHaveBeenCalledTimes(1);
    expect(location).toHaveBeenCalledTimes(1);
    expect(notifications).toHaveBeenCalledTimes(1);
  });
});
