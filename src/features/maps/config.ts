import brand from "@/constants/brand";

/**
 * OpenFreeMap — free, no account and no key, OpenStreetMap data in the
 * OpenMapTiles schema the app's style is written against. The default until
 * maps.tilesUrl / maps.glyphsUrl in assets/brand/brand.json point elsewhere.
 * The web security policy reads the same brand settings.
 */
const DEFAULT_TILES_URL = "https://tiles.openfreemap.org/planet";
const DEFAULT_GLYPHS_URL =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

export type MapTilesConfig = {
  /** TileJSON URL of an OpenMapTiles-schema vector source. */
  tilesUrl: string;
  /** Label fonts, with `{fontstack}` and `{range}` for the engine to fill in. */
  glyphsUrl: string;
};

export const mapTiles: MapTilesConfig = {
  tilesUrl: brand.mapTilesUrl ?? DEFAULT_TILES_URL,
  glyphsUrl: brand.mapGlyphsUrl ?? DEFAULT_GLYPHS_URL,
};

/**
 * The one font the style asks for. Every OpenMapTiles-compatible provider
 * serves it, so switching providers doesn't mean editing the style.
 */
export const MAP_FONT = "Noto Sans Regular";
