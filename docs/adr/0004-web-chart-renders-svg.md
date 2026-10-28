[Docs](../index.md) › [Decisions](README.md)

# 0004. The web chart renders SVG, not Skia

<sub>Status: **Accepted** · 2026-09-26</sub>

## Context

`Chart` uses Victory Native XL on Skia. On the web that needed CanvasKit, which is 8.1 MB of WebAssembly: more than half of a 15 MB web export, for one component. CanvasKit also has no system font manager, so web charts had no axis labels unless a `.ttf` was bundled as well. Keeping it working also took two Storybook Vite plugins and a `postinstall` step.

## Decision

- `index.web.tsx` renders the shared `ChartFrame` around `svg-plot.tsx`, which draws line, area and bar charts with `react-native-svg` (already shipped for Icon and Barcode).
- Geometry lives in the pure [`scale.ts`](../../src/components/chart/scale.ts): nice y-ticks, band/point x positions, label thinning, and line/area/bar paths. Mark constants match the native plot.
- Native keeps Victory Native and Skia unchanged.
- `web.test.tsx` fails if the web entry's module graph imports Skia or Victory.
- Removed: `setup-skia-web` and its `postinstall` hook, `public/canvaskit.wasm`, and the Storybook Skia asset-registry alias and Victory worklets transform.

## Consequences

- The web export went from 15 MB to 6.1 MB. JavaScript went from 5.4 MB to 4.4 MB (1.37 MB to 1.15 MB gzipped), with no wasm. Web charts draw on first paint and now have axis labels in the system font.
- The two renderers can drift apart visually. Shared constants and the shared frame limit that, and visual regression (roadmap step 03) will catch the rest.
