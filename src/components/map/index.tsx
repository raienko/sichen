import { useMemo, useState } from "react";
import {
  Camera,
  Map as MapLibreMap,
  Marker,
  type CameraProps,
} from "@maplibre/maplibre-react-native";

import { useLocale } from "@/features/localization";
import { testId } from "@/utils";
import { mapStyle, mapTiles, toLngLat } from "@/features/maps";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import MapFrame from "./frame";
import { MapPin, UserDot } from "./pin";
import type { MapProps, MapView } from "./types";
import { cameraPadding, resolveView, type CameraPadding } from "./view";

export type { MapMarker, MapProps } from "./types";

/** How long the camera takes to move to a new view, in ms. */
const CAMERA_DURATION = 500;

/**
 * A map with a few places on it, over MapLibre — the native engine here,
 * `maplibre-gl` in the browser (./index.web.tsx), one style for both.
 *
 * ```tsx
 * const location = useUserLocation();
 * <Map
 *   label="Stores near you"
 *   markers={stores}
 *   userLocation={location.coordinate}
 *   selectedId={selected}
 *   onSelectMarker={setSelected}
 * />
 * ```
 *
 * **It looks like the app.** The style is generated from the theme
 * (`mapStyle` in @/features/maps), so it follows light and dark like any
 * other component; tiles come from OpenFreeMap unless EXPO_PUBLIC_MAP_*
 * says otherwise.
 *
 * **Markers are app components** — themed square pins that are real
 * buttons, the only parts of a map a screen reader can reach. Pressing one
 * selects it; the selected place gets a card with Directions, which opens
 * the platform's own map app rather than navigating here.
 *
 * **The view fits what's on it.** With no `center`, the camera frames every
 * marker and the user's position, and moves again when they change.
 */
export default function Map({
  label,
  markers,
  userLocation,
  center,
  zoom,
  selectedId,
  onSelectMarker,
  height,
  style,
  testID = "map",
}: MapProps) {
  const theme = useTheme();
  const { locale, t } = useLocale();
  const { spacing } = useSizes();
  const styles = useStyles();

  const styleSpec = useMemo(
    () => mapStyle(theme.colors, mapTiles, locale),
    [theme.colors, locale],
  );

  const view = resolveView({
    center,
    zoom,
    points: [
      ...markers.map((marker) => marker.coordinate),
      ...(userLocation ? [userLocation] : []),
    ],
  });

  const selected = markers.find((marker) => marker.id === selectedId);
  // Measured, not assumed: the card grows with its subtitle and text size.
  const [cardHeight, setCardHeight] = useState(0);
  const padding = cameraPadding(spacing.x40, selected ? cardHeight : 0);

  return (
    <MapFrame
      label={label}
      height={height}
      style={style}
      testID={testID}
      selected={selected}
      onCalloutHeight={setCardHeight}
    >
      <MapLibreMap
        testID={testId(testID, "engine")}
        style={styles.engine}
        mapStyle={styleSpec}
        logo={false}
        compass={false}
        attribution
        // Top corner: the bottom belongs to the selected place's card, and
        // OpenStreetMap's licence requires the credit to stay visible.
        attributionPosition={{ top: spacing.x8, right: spacing.x8 }}
        tintColor={theme.colors.accent}
        onPress={() => onSelectMarker?.(undefined)}
      >
        <Camera {...cameraFor(view, padding)} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            id={marker.id}
            lngLat={toLngLat(marker.coordinate)}
          >
            <MapPin
              testID={testId(testID, "pin", marker.id)}
              title={marker.title}
              selected={marker.id === selectedId}
              onPress={() => onSelectMarker?.(marker.id)}
            />
          </Marker>
        ))}
        <UserMarker
          coordinate={userLocation}
          label={t("map.yourLocation")}
          testID={testId(testID, "user-location")}
        />
      </MapLibreMap>
    </MapFrame>
  );
}

/**
 * The user's dot, when there is a position to put it at. Its own component
 * so the coordinate is only read once it exists.
 */
function UserMarker({
  coordinate,
  label,
  testID,
}: {
  coordinate?: MapProps["userLocation"];
  label: string;
  testID?: string;
}) {
  if (coordinate === undefined) return null;

  return (
    <Marker id="user-location" lngLat={toLngLat(coordinate)}>
      <UserDot label={label} testID={testID} />
    </Marker>
  );
}

/** The resolved view as Camera props — animated, with room around the edges. */
function cameraFor(view: MapView, padding: CameraPadding): CameraProps {
  switch (view.kind) {
    case "center":
      return {
        center: toLngLat(view.center),
        zoom: view.zoom,
        padding,
        duration: CAMERA_DURATION,
      };
    case "bounds":
      return {
        bounds: view.bounds,
        padding,
        duration: CAMERA_DURATION,
      };
    default:
      return { zoom: 0 };
  }
}

const useStyles = createStyles(() => ({
  engine: {
    flex: 1,
  },
}));
