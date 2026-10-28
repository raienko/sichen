/**
 * Applies the brand in assets/brand (brand.json + logo) to the app:
 *
 *   yarn brand
 *
 * Writes the generated, gitignored outputs — assets/brand/generated/*,
 * the web app's manifest and icons in public/, src/features/theme/palette.json
 * — and initializes a missing .env from .env.example. Runs on
 * every `yarn install` (postinstall), so a fresh clone or a CI runner always
 * has a complete brand. Rebranding is replacing assets/brand and running it
 * again. See assets/brand/README.md.
 *
 * The brand is only how the app looks. Its name, which the web manifest
 * carries, comes from the env files like the rest of its identity, so
 * `yarn env:pull` runs this again after pulling.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { parseProjectEnv } from "@expo/env";

import { contrast } from "./color.ts";
import { checkOverrides, writeImages } from "./images.ts";
import { buildPalette, type Palettes } from "./palette.ts";
import { type Brand, BrandError, loadBrand } from "./resolve.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const paths = {
  brand: join(root, "assets", "brand"),
  env: join(root, ".env"),
  envExample: join(root, ".env.example"),
  generated: join(root, "assets", "brand", "generated"),
  public: join(root, "public"),
  paletteBase: join(root, "src", "features", "theme", "palette.base.json"),
  palette: join(root, "src", "features", "theme", "palette.json"),
};

async function main() {
  const brand = await loadBrand(paths.brand);

  const sizeProblems = await checkOverrides(brand);
  if (sizeProblems.length > 0) {
    throw new BrandError(
      `assets/brand has problems:\n  ${sizeProblems.join("\n  ")}`,
    );
  }

  const base = JSON.parse(readFileSync(paths.paletteBase, "utf8")) as Palettes;
  const palette = buildPalette(base, brand.colors.primary, brand.palette);

  if (!existsSync(paths.env)) copyFileSync(paths.envExample, paths.env);
  const name = appName();

  const images = await writeImages(brand, paths.generated, paths.public);
  writeFileSync(paths.palette, `${JSON.stringify(palette, null, 2)}\n`);
  writeManifest(name, brand, palette, join(paths.public, "manifest.json"));

  const ratio = (fg: string, bg: string) => contrast(fg, bg).toFixed(1);
  console.log(`Brand: ${name}`);
  for (const { file, source } of images) {
    console.log(`  ${source === "brand" ? "override " : "generated"}  ${file}`);
  }
  for (const scheme of ["light", "dark"] as const) {
    const p = palette[scheme];
    console.log(
      `  ${scheme.padEnd(5)} primary ${p.primary} (label ${ratio(p.onPrimary!, p.primary!)}:1)` +
        `  accent ${p.accent} (on page ${ratio(p.accent!, p.background!)}:1)`,
    );
  }
  console.log(
    `  wrote ${relative(root, paths.generated)}/, ${relative(root, paths.public)}/, ${relative(root, paths.palette)}, .env`,
  );

  const nativeDirs = ["ios", "android"].filter((dir) =>
    existsSync(join(root, dir)),
  );
  if (nativeDirs.length > 0) {
    console.log(
      `\n  Icons and splash are baked into ${nativeDirs.join("/")} at prebuild — run \`npx expo prebuild --clean\` to pick up changes.`,
    );
  }
}

/**
 * The app's name as a build sees it: the shell's (or CI's) value, else the
 * env files in Expo's order — .env.local, from `yarn env:pull`, over .env.
 */
function appName(): string {
  const name = (
    process.env.EXPO_PUBLIC_APP_NAME ??
    parseProjectEnv(root, { silent: true }).env.EXPO_PUBLIC_APP_NAME
  )?.trim();
  if (!name) {
    throw new BrandError(
      "EXPO_PUBLIC_APP_NAME is missing — set it in .env, or run `yarn env:pull`.",
    );
  }
  return name;
}

/**
 * What a browser needs to install the web build as an app: its name, the
 * icons writeImages put in public/, and the colours of the window it opens
 * in. `background_color` is the splash Chrome shows while the app loads, so
 * it matches the native splash; `theme_color` is the title bar, so it
 * matches the app's own light background. The page keeps the latter in step
 * with the active theme at runtime — see @/features/web-app.
 */
function writeManifest(
  name: string,
  brand: Brand,
  palette: Palettes,
  file: string,
) {
  const manifest = {
    id: "/",
    name,
    short_name: name,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: brand.colors.splashBackground,
    theme_color: palette.light.background,
    icons: [
      { src: "/icon-web-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-web-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-web-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof BrandError || error instanceof Error
      ? `\nyarn brand: ${error.message}\n`
      : error,
  );
  process.exit(1);
});
