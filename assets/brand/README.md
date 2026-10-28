[Docs](../../docs/index.md) › Brand

# Brand

Everything that identifies the app lives in this folder. In the minimal case that's two files:

```
assets/brand/
  brand.json   colours, palette overrides, map provider
  logo.svg     the logo (or logo.png: square, ≥1024px, transparent)
```

Running the script turns them into everything the app needs:

```bash
yarn brand
```

It also runs on every `yarn install`, so a fresh clone or a CI runner always has a complete brand. After changing this folder's contents, run it again.

| Output                                                            | From                                                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `generated/`: every icon, the splash and the favicon (gitignored) | `logo.*`, or a hand-made override below                                                        |
| `src/features/theme/palette.json` (gitignored)                    | `palette.base.json` + colours derived from `colors.primary` + `palette` overrides              |
| `public/manifest.json` and the web icons (gitignored)             | `brand.json`, `logo.*`, `EXPO_PUBLIC_APP_NAME` — what a browser needs to install the web build |

Icons and the splash are baked into `ios/` and `android/` at prebuild. After a rebrand, run `npx expo prebuild --clean`; the script reminds you when those folders exist.

## Files

Every file has one name, used both for the generated output in `generated/` and for a hand-made override here. An override is used as-is instead of the generated file:

| File                          | Size                       | Generated as                                                                |
| ----------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `icon.png`                    | 1024×1024, no transparency | the logo at 60% on `colors.iconBackground`                                  |
| `icon-ios.icon/`              | Icon Composer bundle       | the logo as one layer on `colors.iconBackground`, used by iOS 26+           |
| `icon-android-foreground.png` | 432×432                    | the logo inside Android's adaptive-icon safe zone                           |
| `icon-android-monochrome.png` | 432×432                    | the foreground's shape in white, for Android 13+ themed icons               |
| `icon-android-background.png` | 432×432                    | not generated: the background is `colors.iconBackground` unless you add one |
| `splash.png`                  | any; shown 76pt wide       | the logo                                                                    |
| `favicon.png`                 | 48×48                      | the logo on `colors.iconBackground`                                         |
| `icon-web-192.png`            | 192×192                    | like `icon.png`, for the installed web app; written to `public/`            |
| `icon-web-512.png`            | 512×512                    | like `icon.png`, for the installed web app; written to `public/`            |
| `icon-web-maskable.png`       | 512×512                    | the logo inside the circle Android crops web icons to; written to `public/` |

The logo is used as drawn, in its own colours. So a white logo wants a coloured `iconBackground`/`splashBackground`, and a coloured logo a light one.

## brand.json

```jsonc
{
  "maps": {
    // Optional: omit either URL to use its OpenFreeMap default.
    "tilesUrl": "https://tiles.example.com/tiles.json",
    "glyphsUrl": "https://fonts.example.com/{fontstack}/{range}.pbf",
  },
  "colors": {
    "primary": "#3F5BD9", // the brand hue; the palette is derived from it
    "iconBackground": "#208AEF", // background behind the logo
    "splashBackground": "#208AEF",
    "splashBackgroundDark": "#1B1C1F", // optional
  },
  "palette": {
    // optional, per-key overrides after derivation
    "light": { "accent": "#2F49C0" },
    "dark": {},
  },
}
```

### How the palette is derived

Only the brand family is derived: `primary`, `onPrimary`, `primaryPressed`, `accent`, `selected`, `focus`, for light and dark. Neutrals, status and chart colours stay shared, from `src/features/theme/palette.base.json`.

Each colour keeps the brand's hue and only moves lighter or darker, in OKLCH, as far as the contrast rules in `src/features/theme/colors.test.ts` require. A primary that already passes is used exactly as given. A pale brand colour like a bright yellow is darkened until a white label reads on it.

If no lightness works, or an override breaks a rule, the script stops and names the pair and its ratio. The current `brand.json` pins its hand-tuned values in `palette`, which is also how to keep a designer's exact choices.

The brand is only how the app looks. Who the app is — `EXPO_PUBLIC_APP_NAME`,
`EXPO_PUBLIC_APP_SLUG`, `EXPO_PUBLIC_APP_SCHEME`, `EXPO_PUBLIC_APP_BUNDLE_ID`,
`EXPO_PUBLIC_APP_LINK_DOMAINS`, `EXPO_OWNER` and `EXPO_PUBLIC_EAS_PROJECT_ID` — comes from
the env files and `yarn env:pull`; see [App builds](../../docs/development-builds.md).
The script only creates a missing `.env` from `.env.example`, and reads
`EXPO_PUBLIC_APP_NAME` for the web manifest.

### Map provider

Set `maps.tilesUrl` and `maps.glyphsUrl` in `brand.json` to use a custom
OpenMapTiles-compatible provider. An empty `maps` object uses OpenFreeMap.
Both URLs must use HTTPS; the glyphs template must contain `{fontstack}` and
`{range}` and serve `Noto Sans Regular`. Native maps and web security headers
read these settings directly. No Expo, GitHub or local environment variables
are needed. Provider URLs and any included public keys ship in the app.

Native icon and splash backgrounds are read directly from `colors.iconBackground`,
`colors.splashBackground` and optional `colors.splashBackgroundDark` in `brand.json`.
No corresponding environment variables are needed. Colors must be 3- or 6-digit
hex; omit the dark color to reuse the light splash background.
