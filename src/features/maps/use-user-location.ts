import { useEffect, useState } from "react";
import {
  Accuracy,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  type LocationObject,
} from "expo-location";

import logger from "@/features/logger";
import { permissions } from "@/features/permissions";
import { minutes } from "@/utils";

import type { Coordinate } from "./types";

export type UserLocationStatus =
  /** Asking for permission, or waiting on the first fix. */
  | "locating"
  /** `coordinate` is set. */
  | "ready"
  /** The user said no — show the map without them on it. */
  | "denied"
  /** Permission was given but no position came back (location off, indoors, a browser without it). */
  | "unavailable";

export type UserLocation = {
  status: UserLocationStatus;
  coordinate?: Coordinate;
};

function toCoordinate({ coords }: LocationObject): Coordinate {
  return { latitude: coords.latitude, longitude: coords.longitude };
}

/**
 * The user's position, once, for "what's near me" — not a live track.
 *
 * Asks for foreground permission through `permissions.location` (only if it
 * hasn't been answered yet), shows the last known position straight away
 * when there is a recent one, then replaces it with a fresh fix at
 * `Balanced` accuracy (about 100 m — plenty to centre a map, and much
 * cheaper on battery than GPS-grade).
 *
 * Never throws: a refusal is `denied`, any other failure `unavailable`, so
 * a screen can always render the map and decide what to say.
 *
 * @example
 * const location = useUserLocation();
 * <Map center={location.coordinate} showUserLocation={location.status === "ready"} … />
 */
export default function useUserLocation({
  request = true,
}: {
  /** Prompt when permission hasn't been asked yet. Off to only use a permission already given. */
  request?: boolean;
} = {}): UserLocation {
  const [location, setLocation] = useState<UserLocation>({
    status: "locating",
  });

  useEffect(() => {
    let active = true;
    // The best fix so far, so a failed refresh doesn't throw away a good
    // last-known position.
    let found: Coordinate | undefined;
    const update = (next: UserLocation) => {
      if (active) setLocation(next);
    };

    void (async () => {
      try {
        let permission = await permissions.location.refresh();
        if (!permission.granted && permission.canAskAgain && request) {
          permission = await permissions.location.request();
        }
        if (!permission.granted) {
          update({ status: "denied" });
          return;
        }

        const lastKnown = await getLastKnownPositionAsync({
          maxAge: minutes(1),
        });
        if (lastKnown) {
          found = toCoordinate(lastKnown);
          update({ status: "ready", coordinate: found });
        }

        const current = await getCurrentPositionAsync({
          accuracy: Accuracy.Balanced,
        });
        update({ status: "ready", coordinate: toCoordinate(current) });
      } catch (error) {
        logger.failed("Unable to get the user's location", error);
        update(
          found === undefined
            ? { status: "unavailable" }
            : { status: "ready", coordinate: found },
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [request]);

  return location;
}
