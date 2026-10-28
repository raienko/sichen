/**
 * Copies maplibre-gl's web worker into public/, where the web app and the
 * web Storybook serve it as a plain file. Since maplibre-gl 6 the worker is
 * a separate module found next to the library's own file — a path neither
 * Metro nor Vite's dependency bundle keeps — so the Map component points
 * maplibre at this copy instead (src/components/map/index.web.tsx).
 *
 * Runs on every `yarn install` (postinstall); the copy is gitignored.
 */
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
copyFileSync(
  "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
  "public/maplibre-gl-worker.mjs",
);
