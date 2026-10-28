import type { Coordinate } from "@/features/maps";

import type { MapView } from "./types";

/** Street level: individual buildings and road names. */
export const DEFAULT_ZOOM = 14;

/**
 * A lone point can't be "fitted" — its bounds have no size and fitting
 * zooms in until the tiles run out. Below this span (degrees, roughly a
 * few hundred metres) the map centres on the point at `DEFAULT_ZOOM`.
 */
const MIN_SPAN = 0.002;

/**
 * Where the camera should go, from what the caller gave it. Pure, so the
 * decision is tested once and both renderers just apply it.
 *
 * An explicit `center` wins. Otherwise everything worth seeing — the
 * markers and the user — is fitted into view; nothing at all shows the
 * whole world rather than an arbitrary city.
 */
export function resolveView({
  center,
  zoom = DEFAULT_ZOOM,
  points,
}: {
  center?: Coordinate;
  zoom?: number;
  points: readonly Coordinate[];
}): MapView {
  if (center) return { kind: "center", center, zoom };
  if (points.length === 0) return { kind: "world" };

  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);

  if (east - west < MIN_SPAN && north - south < MIN_SPAN) {
    return {
      kind: "center",
      center: { latitude: (south + north) / 2, longitude: (west + east) / 2 },
      zoom,
    };
  }

  return { kind: "bounds", bounds: [west, south, east, north] };
}

/** Value equality, so a re-render with the same view doesn't move the camera. */
export function viewKey(view: MapView): string {
  return JSON.stringify(view);
}

export type CameraPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * Room the camera leaves around what it frames: `edge` on every side, plus
 * whatever the selected place's card covers at the bottom — so fitting the
 * places never parks one of them under the card.
 */
export function cameraPadding(edge: number, covered = 0): CameraPadding {
  return { top: edge, right: edge, bottom: edge + covered, left: edge };
}
