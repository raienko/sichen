// Type only — erased at build, so the web bundle never pulls in the native
// module through it.
import type { StyleSpecification } from "@maplibre/maplibre-react-native";

import type { ThemeColors } from "@/features/theme";

import { MAP_FONT, type MapTilesConfig } from "./config";

const SOURCE = "openmaptiles";

type Expression = unknown[];

/** Line width that grows with zoom, so a road reads at city and street level. */
function width(atZoom10: number, atZoom18: number): Expression {
  return [
    "interpolate",
    ["exponential", 1.4],
    ["zoom"],
    10,
    atZoom10,
    18,
    atZoom18,
  ];
}

/** The place's name in the app's language, falling back to English, then local. */
function name(language: string): Expression {
  return [
    "coalesce",
    ["get", `name:${language}`],
    ["get", "name_en"],
    ["get", "name"],
  ];
}

const LINE_GEOMETRY: Expression = [
  "match",
  ["geometry-type"],
  ["LineString", "MultiLineString"],
  true,
  false,
];
const POLYGON_GEOMETRY: Expression = [
  "match",
  ["geometry-type"],
  ["Polygon", "MultiPolygon"],
  true,
  false,
];

/**
 * The map's look, built from the app's palette rather than downloaded — so
 * it is Graphite in both schemes, follows a theme switch like every other
 * component, and is identical on native and the web, which read the same
 * style.
 *
 * Deliberately quiet. The map is the ground the markers stand on, not the
 * subject: land is the page background, water the `selected` tint, roads
 * the hairline `divider` and `border` steps, labels the text tokens. No
 * colour here competes with a marker's `primary`/`accent`.
 *
 * Written against the OpenMapTiles schema, which OpenFreeMap, MapTiler and
 * self-hosted planet files all serve, so changing provider is an env var,
 * not a style rewrite.
 */
export function mapStyle(
  colors: ThemeColors,
  tiles: MapTilesConfig,
  language = "en",
): StyleSpecification {
  const label = name(language);
  const halo = {
    "text-halo-color": colors.background,
    "text-halo-width": 1.5,
  };

  return {
    version: 8,
    glyphs: tiles.glyphsUrl,
    sources: {
      [SOURCE]: { type: "vector", url: tiles.tilesUrl },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": colors.background },
      },
      {
        id: "landuse",
        type: "fill",
        source: SOURCE,
        "source-layer": "landuse",
        filter: [
          "all",
          POLYGON_GEOMETRY,
          ["==", ["get", "class"], "residential"],
        ],
        paint: { "fill-color": colors.backgroundElement, "fill-opacity": 0.5 },
      },
      {
        id: "park",
        type: "fill",
        source: SOURCE,
        "source-layer": "park",
        filter: POLYGON_GEOMETRY,
        paint: { "fill-color": colors.backgroundElement },
      },
      {
        id: "water",
        type: "fill",
        source: SOURCE,
        "source-layer": "water",
        filter: ["all", POLYGON_GEOMETRY, ["!=", ["get", "brunnel"], "tunnel"]],
        paint: { "fill-color": colors.selected },
      },
      {
        id: "waterway",
        type: "line",
        source: SOURCE,
        "source-layer": "waterway",
        filter: LINE_GEOMETRY,
        paint: { "line-color": colors.selected, "line-width": width(0.5, 3) },
      },
      {
        id: "building",
        type: "fill",
        source: SOURCE,
        "source-layer": "building",
        minzoom: 13,
        paint: { "fill-color": colors.backgroundElementSelected },
      },
      {
        id: "road-minor",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        minzoom: 12,
        filter: [
          "all",
          LINE_GEOMETRY,
          [
            "match",
            ["get", "class"],
            ["minor", "service", "track", "path"],
            true,
            false,
          ],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": colors.divider, "line-width": width(0.5, 8) },
      },
      {
        id: "road-major",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        minzoom: 7,
        filter: [
          "all",
          LINE_GEOMETRY,
          [
            "match",
            ["get", "class"],
            ["primary", "secondary", "tertiary", "trunk", "motorway"],
            true,
            false,
          ],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colors.border,
          "line-opacity": 0.6,
          "line-width": width(0.75, 12),
        },
      },
      {
        id: "rail",
        type: "line",
        source: SOURCE,
        "source-layer": "transportation",
        minzoom: 11,
        filter: ["all", LINE_GEOMETRY, ["==", ["get", "class"], "rail"]],
        paint: {
          "line-color": colors.border,
          "line-opacity": 0.5,
          "line-width": 1,
          "line-dasharray": [2, 2],
        },
      },
      {
        id: "boundary",
        type: "line",
        source: SOURCE,
        "source-layer": "boundary",
        filter: [
          "all",
          ["<=", ["get", "admin_level"], 4],
          ["!=", ["get", "maritime"], 1],
        ],
        paint: {
          "line-color": colors.border,
          "line-opacity": 0.5,
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
      },
      {
        id: "road-label",
        type: "symbol",
        source: SOURCE,
        "source-layer": "transportation_name",
        minzoom: 14,
        filter: LINE_GEOMETRY,
        layout: {
          "symbol-placement": "line",
          "text-field": label,
          "text-font": [MAP_FONT],
          "text-size": 12,
        },
        paint: { "text-color": colors.textSecondary, ...halo },
      },
      {
        id: "water-label",
        type: "symbol",
        source: SOURCE,
        "source-layer": "water_name",
        layout: {
          "text-field": label,
          "text-font": [MAP_FONT],
          "text-size": 12,
        },
        paint: { "text-color": colors.textSecondary, ...halo },
      },
      {
        id: "place-label",
        type: "symbol",
        source: SOURCE,
        "source-layer": "place",
        filter: [
          "match",
          ["get", "class"],
          ["city", "town", "village", "suburb", "neighbourhood"],
          true,
          false,
        ],
        layout: {
          "text-field": label,
          "text-font": [MAP_FONT],
          "text-max-width": 8,
          "text-size": ["match", ["get", "class"], "city", 16, "town", 14, 12],
        },
        paint: { "text-color": colors.text, ...halo },
      },
    ] as StyleSpecification["layers"],
  };
}
