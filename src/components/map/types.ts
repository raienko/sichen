import type { StyleProp, ViewStyle } from "react-native";

import type { Coordinate } from "@/features/maps";

export type MapMarker = {
  /** Stable identity — what `selectedId` and `onSelectMarker` speak in. */
  id: string;
  coordinate: Coordinate;
  /** Named on the pin for a screen reader, and shown when it's selected. */
  title: string;
  /** A second line when selected — an address, a distance, opening hours. */
  subtitle?: string;
};

export type MapProps = {
  /** What the map shows — "Stores near you". Names the map for assistive technology. */
  label: string;
  markers: readonly MapMarker[];
  /**
   * The user's position, drawn as a dot and included when fitting the
   * view. Pass `useUserLocation().coordinate`; omit it and there is no dot.
   */
  userLocation?: Coordinate;
  /**
   * Where to look. Omitted, the map fits every marker and the user's
   * position; with no markers either, it shows the whole world.
   */
  center?: Coordinate;
  /** Zoom for `center`. Defaults to street level (14). */
  zoom?: number;
  /** The selected marker, shown highlighted with its details and a Directions action. */
  selectedId?: string;
  /** Called with a marker's id when it's pressed, and `undefined` when the map itself is. */
  onSelectMarker?: (id: string | undefined) => void;
  /** Defaults to 320. A map has no intrinsic height. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** What a renderer needs to put the camera in the right place. */
export type MapView =
  | { kind: "center"; center: Coordinate; zoom: number }
  | {
      kind: "bounds";
      /** [west, south, east, north] */
      bounds: [number, number, number, number];
    }
  | { kind: "world" };
