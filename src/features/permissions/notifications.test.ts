import { PermissionStatus } from "expo";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
  type NotificationPermissionsStatus,
} from "expo-notifications";

import notifications from "./notifications";

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const undetermined: NotificationPermissionsStatus = {
  status: PermissionStatus.UNDETERMINED,
  granted: false,
  canAskAgain: true,
  expires: "never",
};

const granted: NotificationPermissionsStatus = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: "never",
};

describe("notifications permission", () => {
  afterEach(() => {
    notifications.reset();
    jest.clearAllMocks();
  });

  it("uses Expo Notifications for refresh and request", async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValue(undetermined);
    jest.mocked(requestPermissionsAsync).mockResolvedValue(granted);

    await expect(notifications.refresh()).resolves.toEqual(undetermined);
    await expect(notifications.request()).resolves.toEqual({
      ...granted,
      canAskAgain: false,
    });

    expect(getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});
