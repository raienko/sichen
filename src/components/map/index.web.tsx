import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { View } from "react-native";
import type {
  Map as GlMap,
  Marker as GlMarker,
  MapMouseEvent,
} from "maplibre-gl";

import logger from "@/features/logger";
import { useLocale } from "@/features/localization";
import { testId } from "@/utils";
import { mapStyle, mapTiles, toLngLat, type Coordinate } from "@/features/maps";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import MapFrame from "./frame";
import { MapPin, UserDot } from "./pin";
import type { MapProps, MapView } from "./types";
import {
  cameraPadding,
  resolveView,
  viewKey,
  type CameraPadding,
} from "./view";

export type { MapMarker, MapProps } from "./types";

type GlModule = typeof import("maplibre-gl");

/**
 * maplibre-gl's worker, copied into public/ on install
 * (scripts/map-worker.mjs). Since v6 maplibre looks for it beside its own
 * file, which no bundle keeps. `EXPO_BASE_URL` is the app's base path under
 * Metro ("" at the root) and "." in the web Storybook, whose pages sit next
 * to its static files.
 */
const WORKER_URL = `${process.env.EXPO_BASE_URL ?? ""}/maplibre-gl-worker.mjs`;

const CAMERA_DURATION = 500;
const USER_ID = "user-location";

/**
 * The browser's `Map`: the same props, frame, pins, callout and generated
 * style as the native one (./index.tsx), drawn by `maplibre-gl`.
 *
 * The engine is imported lazily, so its ~800 KB only downloads when a map
 * is on screen; the frame renders immediately and the map fills in. Pins
 * are the same React components as on native, portalled into the DOM
 * elements `maplibre-gl` positions — so they stay real, themed buttons.
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

  const containerRef = useRef<View>(null);
  const [gl, setGl] = useState<{ lib: GlModule; map: GlMap }>();

  const styleSpec = useMemo(
    () => mapStyle(theme.colors, mapTiles, locale),
    [theme.colors, locale],
  );

  // Read through refs by the long-lived listeners below, so they always
  // call the current props without being re-registered every render.
  const onSelectRef = useRef(onSelectMarker);
  useEffect(() => {
    onSelectRef.current = onSelectMarker;
  });
  // The style the engine currently has — set at creation, then by restyles.
  const appliedStyle = useRef(styleSpec);

  useEffect(() => {
    let cancelled = false;
    let map: GlMap | undefined;

    import("maplibre-gl")
      .then((module) => {
        if (cancelled) return;
        // Interop can hand over the module itself or wrap it in `default`.
        const lib = ((module as { default?: GlModule }).default ??
          module) as GlModule;
        lib.setWorkerUrl(WORKER_URL);
        map = new lib.Map({
          container: containerRef.current as unknown as HTMLElement,
          style: appliedStyle.current as never,
          // Added below, in the top corner: the bottom belongs to the
          // selected place's card, and OpenStreetMap's licence requires the
          // credit to stay visible.
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
        });
        map.addControl(
          new lib.AttributionControl({ compact: true }),
          "top-right",
        );
        map.touchZoomRotate.disableRotation();
        // Handed over only once the style has loaded: the first load sets
        // the camera from the style itself, so a view applied earlier
        // would be thrown away, and restyling mid-load forces a rebuild.
        const ready = map;
        ready.once("load", () => {
          if (!cancelled) setGl({ lib, map: ready });
        });
        map.on("click", (event: MapMouseEvent) => {
          // A press on a pin also reaches the map; only bare map clears.
          const target = event.originalEvent.target as Element | null;
          if (target?.closest(".maplibregl-marker")) return;
          onSelectRef.current?.(undefined);
        });
      })
      .catch((error: unknown) =>
        logger.failed("Unable to load the map", error),
      );

    return () => {
      cancelled = true;
      map?.remove();
      setGl(undefined);
    };
  }, []);

  // Theme or language changed: restyle in place, keeping the camera. The
  // style the map was created with is already applied, so it's skipped.
  useEffect(() => {
    if (!gl || appliedStyle.current === styleSpec) return;
    appliedStyle.current = styleSpec;
    gl.map.setStyle(styleSpec as never);
  }, [gl, styleSpec]);

  const view = resolveView({
    center,
    zoom,
    points: [
      ...markers.map((marker) => marker.coordinate),
      ...(userLocation ? [userLocation] : []),
    ],
  });
  const viewId = viewKey(view);
  const selected = markers.find((marker) => marker.id === selectedId);
  // Measured, not assumed: the card grows with its subtitle and text size.
  const [cardHeight, setCardHeight] = useState(0);
  const covered = selected ? cardHeight : 0;
  const edge = spacing.x40;

  useEffect(() => {
    if (gl) moveCamera(gl.map, view, cameraPadding(edge, covered));
    // `viewId` stands for `view`: same places, same camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, viewId, edge, covered]);

  const points = useMemo(
    () => [
      ...markers.map((marker) => ({
        id: marker.id,
        coordinate: marker.coordinate,
      })),
      ...(userLocation ? [{ id: USER_ID, coordinate: userLocation }] : []),
    ],
    [markers, userLocation],
  );
  const elements = usePlacedElements(gl, points);

  return (
    <MapFrame
      label={label}
      height={height}
      style={style}
      testID={testID}
      selected={selected}
      onCalloutHeight={setCardHeight}
    >
      <View
        ref={containerRef}
        testID={testId(testID, "engine")}
        style={styles.engine}
      />
      {markers.map((marker) => (
        <InElement key={marker.id} element={elements.get(marker.id)}>
          <MapPin
            testID={testId(testID, "pin", marker.id)}
            title={marker.title}
            selected={marker.id === selectedId}
            onPress={() => onSelectMarker?.(marker.id)}
          />
        </InElement>
      ))}
      <InElement element={elements.get(USER_ID)}>
        <UserDot
          label={t("map.yourLocation")}
          testID={testId(testID, "user-location")}
        />
      </InElement>
    </MapFrame>
  );
}

/** Renders `children` into a DOM element the map engine owns, once it exists. */
function InElement({
  element,
  children,
}: {
  element?: HTMLElement;
  children: ReactNode;
}) {
  if (element === undefined) return null;
  return createPortal(children, element);
}

/**
 * One `maplibre-gl` marker per point, each holding a DOM element the pins
 * are portalled into. Added, moved and removed as `points` changes; returns
 * the elements by id once the engine has loaded.
 */
function usePlacedElements(
  gl: { lib: GlModule; map: GlMap } | undefined,
  points: readonly { id: string; coordinate: Coordinate }[],
): ReadonlyMap<string, HTMLElement> {
  const placed = useRef(new globalThis.Map<string, GlMarker>());
  // Which engine the markers in `placed` belong to. A new one (a remount,
  // a hot reload) starts empty, so they're placed again rather than moved
  // around on a map that's gone.
  const placedOn = useRef<GlMap | undefined>(undefined);
  const [elements, setElements] = useState<ReadonlyMap<string, HTMLElement>>(
    new globalThis.Map(),
  );

  useEffect(() => {
    if (!gl) return;
    const current = placed.current;
    if (placedOn.current !== gl.map) {
      for (const marker of current.values()) marker.remove();
      current.clear();
      placedOn.current = gl.map;
    }
    const wanted = new Set(points.map((point) => point.id));

    for (const [id, marker] of current) {
      if (!wanted.has(id)) {
        marker.remove();
        current.delete(id);
      }
    }
    for (const point of points) {
      const lngLat = toLngLat(point.coordinate);
      const existing = current.get(point.id);
      if (existing) {
        existing.setLngLat(lngLat);
      } else {
        const element = document.createElement("div");
        current.set(
          point.id,
          new gl.lib.Marker({ element }).setLngLat(lngLat).addTo(gl.map),
        );
      }
    }

    setElements(
      new globalThis.Map(
        [...current].map(([id, marker]) => [id, marker.getElement()]),
      ),
    );
  }, [gl, points]);

  useEffect(() => {
    const current = placed.current;
    return () => {
      for (const marker of current.values()) marker.remove();
      current.clear();
    };
  }, []);

  return elements;
}

function moveCamera(map: GlMap, view: MapView, padding: CameraPadding) {
  switch (view.kind) {
    case "center":
      map.easeTo({
        center: toLngLat(view.center),
        zoom: view.zoom,
        padding,
        duration: CAMERA_DURATION,
      });
      return;
    case "bounds":
      map.fitBounds(view.bounds, { padding, duration: CAMERA_DURATION });
      return;
    default:
      map.easeTo({ center: [0, 20], zoom: 1, duration: CAMERA_DURATION });
  }
}

const useStyles = createStyles(() => ({
  engine: {
    flex: 1,
  },
}));
