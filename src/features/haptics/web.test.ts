import * as ExpoHaptics from "expo-haptics";

import { haptics } from "./index";

// Settled at module load, so the mock has to be in a file of its own.
jest.mock("@/utils", () => ({
  ...jest.requireActual("@/utils"),
  isWeb: true,
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
}));

describe("haptics on web", () => {
  it("is silent", () => {
    haptics.tap();
    haptics.success();
    expect(ExpoHaptics.impactAsync).not.toHaveBeenCalled();
    expect(ExpoHaptics.notificationAsync).not.toHaveBeenCalled();
  });
});
