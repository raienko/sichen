import * as ExpoHaptics from "expo-haptics";

import { haptics } from "./index";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
}));

const impact = jest.mocked(ExpoHaptics.impactAsync);
const notification = jest.mocked(ExpoHaptics.notificationAsync);
const selection = jest.mocked(ExpoHaptics.selectionAsync);

describe("haptics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    haptics.setEnabled(true);
  });

  it("maps each kind of feedback onto the engine", () => {
    haptics.tap();
    haptics.impact("heavy");
    haptics.selection();
    haptics.success();
    haptics.error();

    expect(impact.mock.calls).toEqual([["light"], ["heavy"]]);
    expect(selection).toHaveBeenCalledTimes(1);
    expect(notification.mock.calls).toEqual([["success"], ["error"]]);
  });

  it("plays nothing once turned off", () => {
    haptics.setEnabled(false);
    haptics.tap();
    haptics.success();

    expect(haptics.isEnabled()).toBe(false);
    expect(impact).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
  });

  it("never throws when the engine fails", async () => {
    impact.mockRejectedValueOnce(new Error("no taptic engine"));
    expect(() => haptics.tap()).not.toThrow();
    await Promise.resolve();
  });
});
