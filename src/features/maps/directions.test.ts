import { openURL } from "expo-linking";

import logger from "@/features/logger";

import { directionsUrl, openDirections } from "./directions";

jest.mock("expo-linking", () => ({
  ...jest.requireActual("expo-linking"),
  openURL: jest.fn(),
}));

const CAFE = { latitude: 38.7223, longitude: -9.1393 };

describe("directionsUrl", () => {
  it("opens Apple Maps on iOS", () => {
    expect(directionsUrl(CAFE, "Café Rosa", "ios")).toBe(
      "https://maps.apple.com/?daddr=38.7223,-9.1393&q=Caf%C3%A9%20Rosa",
    );
  });

  it("lets Android choose the app with a geo: intent", () => {
    expect(directionsUrl(CAFE, "Café Rosa", "android")).toBe(
      "geo:38.7223,-9.1393?q=38.7223,-9.1393(Caf%C3%A9%20Rosa)",
    );
  });

  it("uses Google Maps' public directions link on the web", () => {
    expect(directionsUrl(CAFE, undefined, "web")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=38.7223,-9.1393",
    );
  });

  it("drops the label cleanly when there isn't one", () => {
    expect(directionsUrl(CAFE, undefined, "ios")).toBe(
      "https://maps.apple.com/?daddr=38.7223,-9.1393",
    );
  });
});

describe("openDirections", () => {
  it("logs instead of rejecting when nothing can open the link", async () => {
    jest.mocked(openURL).mockRejectedValueOnce(new Error("no handler"));
    const failed = jest.spyOn(logger, "failed").mockImplementation(() => {});

    await expect(openDirections(CAFE, "Café Rosa")).resolves.toBeUndefined();
    expect(failed).toHaveBeenCalled();

    failed.mockRestore();
  });
});
