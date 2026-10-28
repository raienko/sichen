import { colors } from "@/features/theme/colors";

import { MAP_FONT } from "./config";
import { mapStyle } from "./style";

const TILES = {
  tilesUrl: "https://tiles.example.com/planet",
  glyphsUrl: "https://tiles.example.com/fonts/{fontstack}/{range}.pbf",
};

function layer(style: ReturnType<typeof mapStyle>, id: string) {
  const found = style.layers.find((entry) => entry.id === id);
  if (!found) throw new Error(`no layer ${id}`);
  return found as {
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
  };
}

describe("mapStyle", () => {
  it("reads tiles and fonts from the configured provider", () => {
    const style = mapStyle(colors.light, TILES);

    expect(style.glyphs).toBe(TILES.glyphsUrl);
    expect(style.sources.openmaptiles).toEqual({
      type: "vector",
      url: TILES.tilesUrl,
    });
  });

  it.each(["light", "dark"] as const)(
    "paints the %s scheme from the theme's own tokens",
    (scheme) => {
      const palette = colors[scheme];
      const style = mapStyle(palette, TILES);

      expect(layer(style, "background").paint?.["background-color"]).toBe(
        palette.background,
      );
      expect(layer(style, "water").paint?.["fill-color"]).toBe(
        palette.selected,
      );
      expect(layer(style, "road-minor").paint?.["line-color"]).toBe(
        palette.divider,
      );
      expect(layer(style, "place-label").paint?.["text-color"]).toBe(
        palette.text,
      );
      expect(layer(style, "place-label").paint?.["text-halo-color"]).toBe(
        palette.background,
      );
    },
  );

  it("labels places in the app's language, falling back to English", () => {
    const field = layer(mapStyle(colors.light, TILES, "uk"), "place-label")
      .layout?.["text-field"];

    expect(field).toEqual([
      "coalesce",
      ["get", "name:uk"],
      ["get", "name_en"],
      ["get", "name"],
    ]);
  });

  it("asks every label for the one font all providers serve", () => {
    const style = mapStyle(colors.light, TILES);
    const fonts = style.layers
      .filter((entry) => entry.type === "symbol")
      .map(
        (entry) =>
          (entry as { layout: Record<string, unknown> }).layout["text-font"],
      );

    expect(fonts.length).toBeGreaterThan(0);
    for (const font of fonts) expect(font).toEqual([MAP_FONT]);
  });
});
