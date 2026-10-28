type Brand = typeof import("./index").default;

const COLORS = { iconBackground: "#E6F4FE", splashBackground: "#208AEF" };

function load(maps?: unknown, colors: Record<string, unknown> = COLORS): Brand {
  let brand: Brand;
  jest.doMock("../../../assets/brand/brand.json", () => ({ maps, colors }));
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- reload the brand configuration for each provider fixture
      brand = require("./index") as Brand;
    });
  } finally {
    jest.dontMock("../../../assets/brand/brand.json");
  }
  return brand!;
}

describe("brand map provider", () => {
  it("allows the default provider when maps is absent or empty", () => {
    expect(load().mapTilesUrl).toBeUndefined();
    expect(load({}).mapGlyphsUrl).toBeUndefined();
  });

  it("reads and trims a custom HTTPS tile source and glyphs template", () => {
    const brand = load({
      tilesUrl: "  https://tiles.example.com/tiles.json  ",
      glyphsUrl: "https://fonts.example.com/{fontstack}/{range}.pbf",
    });
    expect(brand.mapTilesUrl).toBe("https://tiles.example.com/tiles.json");
    expect(brand.mapGlyphsUrl).toBe(
      "https://fonts.example.com/{fontstack}/{range}.pbf",
    );
  });

  it("rejects insecure tile sources", () => {
    expect(() => load({ tilesUrl: "http://tiles.example.com" })).toThrow(
      /maps.tilesUrl/,
    );
  });

  it.each(["{fontstack}", "{range}"])(
    "requires the %s glyph placeholder",
    (placeholder) => {
      const glyphsUrl =
        "https://fonts.example.com/{fontstack}/{range}.pbf".replace(
          placeholder,
          "missing",
        );
      expect(() => load({ glyphsUrl })).toThrow(placeholder);
    },
  );

  it.each([null, [], "invalid"])(
    "rejects a malformed maps object: %p",
    (maps) => {
      expect(() => load(maps)).toThrow(/maps must be an object/);
    },
  );
});

describe("brand launch colors", () => {
  it("reads icon and splash backgrounds without color environment variables", () => {
    expect(load().colors).toEqual({
      ...COLORS,
      splashBackgroundDark: undefined,
    });
  });

  it.each(["#fff", "#FFF", "#208AEF", "#208aef", "  #208AEF  "])(
    "accepts RGB color %s",
    (value) => {
      expect(
        load(undefined, { ...COLORS, splashBackground: value }).colors
          .splashBackground,
      ).toBe(value.trim());
    },
  );

  it.each([
    undefined,
    "",
    "blue",
    "208AEF",
    "rgb(32,138,239)",
    "#20",
    "#208AE",
    "#20ZZEF",
    "#208AEFFF",
  ])("rejects invalid color %p", (value) => {
    expect(() =>
      load(undefined, { ...COLORS, splashBackground: value }),
    ).toThrow(/colors.splashBackground.*3- or 6-digit/);
  });

  it("reads an optional dark splash color", () => {
    expect(
      load(undefined, { ...COLORS, splashBackgroundDark: "#123456" }).colors
        .splashBackgroundDark,
    ).toBe("#123456");
    expect(
      load(undefined, { ...COLORS, splashBackgroundDark: "" }).colors
        .splashBackgroundDark,
    ).toBeUndefined();
  });

  it("rejects invalid dark splash colors", () => {
    expect(() =>
      load(undefined, { ...COLORS, splashBackgroundDark: "#12345678" }),
    ).toThrow(/colors.splashBackgroundDark/);
  });
});
