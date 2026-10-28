import { openURL } from "expo-linking";

import logger from "@/features/logger";
import { isAndroid, isIOS } from "@/utils";

import type { Coordinate } from "./types";

type Platform = "ios" | "android" | "web";

/**
 * Where "Directions" sends someone, per platform. Turn-by-turn is the
 * platform map app's job, not ours:
 *
 * - **iOS** — Apple Maps, through its universal link, which opens the app
 *   and starts a route to the destination.
 * - **Android** — a `geo:` intent, so the user's own choice of app
 *   (Google Maps, Waze, …) opens rather than one we picked for them. The
 *   `q=lat,lng(label)` form drops a named pin they can route to.
 * - **Web** — Google Maps' public directions URL, in a new tab.
 *
 * Pure, so each platform's URL is tested without a device.
 */
export function directionsUrl(
  { latitude, longitude }: Coordinate,
  label: string | undefined,
  platform: Platform,
): string {
  const point = `${latitude},${longitude}`;
  const name = label === undefined ? "" : encodeURIComponent(label);

  switch (platform) {
    case "ios":
      return `https://maps.apple.com/?daddr=${point}${name ? `&q=${name}` : ""}`;
    case "android":
      return `geo:${point}?q=${point}${name ? `(${name})` : ""}`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${point}`;
  }
}

/**
 * Hands navigation to the platform's map app. Logged rather than thrown
 * when nothing can open the URL — a device with no map app at all is rare,
 * but a press handler that rejects is never what the caller wants.
 */
export async function openDirections(
  coordinate: Coordinate,
  label?: string,
): Promise<void> {
  const platform: Platform = isIOS ? "ios" : isAndroid ? "android" : "web";
  const url = directionsUrl(coordinate, label, platform);

  try {
    await openURL(url);
  } catch (error) {
    logger.failed(`Unable to open directions to "${label ?? url}"`, error);
  }
}
