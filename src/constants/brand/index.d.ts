declare const brand: {
  readonly colors: {
    readonly iconBackground: string;
    readonly splashBackground: string;
    readonly splashBackgroundDark: string | undefined;
  };
  /** Optional TileJSON URL; unset uses OpenFreeMap. */
  readonly mapTilesUrl: string | undefined;
  /** Optional glyphs URL with `{fontstack}` and `{range}` placeholders. */
  readonly mapGlyphsUrl: string | undefined;
};

export default brand;
