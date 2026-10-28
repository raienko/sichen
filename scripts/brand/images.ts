import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";

import sharp, { type Sharp } from "sharp";

import { parseHex } from "./color.ts";
import type { Brand } from "./resolve.ts";

/**
 * How much of each canvas the logo may fill. iOS masks the icon to a
 * rounded square and Android to whatever shape the launcher picks, so the logo
 * stays well inside: Android's adaptive icon only guarantees the central
 * 66 of its 108dp, and the iOS figure is the same proportion with a little
 * margin so the two read as the same icon side by side.
 */
const ICON_LOGO = 0.6;
// The safe zone is a 66dp *circle*, so a square-ish logo has to sit well
// inside it for its corners to survive a circular mask.
const ADAPTIVE_LOGO = (66 / 108) * 0.75;
// A maskable web icon is cropped to a circle 80% of its width, so the logo
// sits inside that circle the same way it does in Android's safe zone.
const MASKABLE_LOGO = 0.8 * 0.65;

/** Apple's Icon Composer bundle — a folder, despite the extension. */
const ICON_BUNDLE = "icon-ios.icon";

/** expo-splash-screen's `imageWidth` in app.config.ts, at @3x. */
export const SPLASH_WIDTH = 76;

type Output = {
  file: string;
  /**
   * Written to public/ instead of generated/: the web build serves that
   * folder as-is from the site root, which is where a browser looks for an
   * installed app's icons.
   */
  web?: true;
  /** Pixel size the file must be, when a brand supplies it by hand. */
  size?: [number, number];
  generate: (logo: Sharp, brand: Brand) => Promise<Sharp | null>;
};

/** The logo scaled to fit `side × side` (aspect kept), centred on a transparent square of `canvas`. */
async function placed(logo: Sharp, canvas: number, side: number) {
  const fitted = await logo
    .clone()
    .resize(Math.round(side), Math.round(side), {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: fitted, gravity: "centre" }]);
}

const OUTPUTS: Output[] = [
  {
    // Opaque on purpose: App Store Connect rejects an icon with alpha.
    file: "icon.png",
    size: [1024, 1024],
    generate: (logo, brand) => opaqueIcon(logo, brand, 1024, ICON_LOGO),
  },
  {
    file: "icon-android-foreground.png",
    size: [432, 432],
    generate: (logo) => placed(logo, 432, 432 * ADAPTIVE_LOGO),
  },
  {
    // Android 13+ themed icons: the launcher tints this itself, so only the
    // shape counts — every visible pixel of the foreground, in white.
    file: "icon-android-monochrome.png",
    size: [432, 432],
    generate: async (logo) => {
      // Composited first: a channel can't be extracted from a pipeline
      // that hasn't been rendered yet.
      const foreground = await (
        await placed(logo, 432, 432 * ADAPTIVE_LOGO)
      )
        .png()
        .toBuffer();
      const alpha = await sharp(foreground)
        .extractChannel("alpha")
        .raw()
        .toBuffer();
      return sharp({
        create: {
          width: 432,
          height: 432,
          channels: 3,
          background: "#FFFFFF",
        },
      }).joinChannel(alpha, { raw: { width: 432, height: 432, channels: 1 } });
    },
  },
  {
    // Not generated: the adaptive icon's background is `backgroundColor`, so a
    // flat-colour image here would only duplicate it. Used when a brand
    // ships a textured or gradient background by hand.
    file: "icon-android-background.png",
    size: [432, 432],
    generate: async () => null,
  },
  {
    file: "splash.png",
    generate: async (logo) => {
      const width = SPLASH_WIDTH * 3;
      return logo.clone().resize(width, width, {
        fit: "inside",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    },
  },
  {
    file: "favicon.png",
    size: [48, 48],
    generate: (logo, brand) => opaqueIcon(logo, brand, 48, 0.75),
  },
  // The installed web app's icons, listed in public/manifest.json. Opaque
  // like icon.png: iOS fills a transparent home-screen icon with black.
  {
    file: "icon-web-192.png",
    size: [192, 192],
    web: true,
    generate: (logo, brand) => opaqueIcon(logo, brand, 192, ICON_LOGO),
  },
  {
    file: "icon-web-512.png",
    size: [512, 512],
    web: true,
    generate: (logo, brand) => opaqueIcon(logo, brand, 512, ICON_LOGO),
  },
  {
    // Android crops this one to the launcher's shape, like the adaptive icon.
    file: "icon-web-maskable.png",
    size: [512, 512],
    web: true,
    generate: (logo, brand) => opaqueIcon(logo, brand, 512, MASKABLE_LOGO),
  },
];

/** The logo at `share` of a `size` square, on `iconBackground`, with no transparency. */
async function opaqueIcon(
  logo: Sharp,
  brand: Brand,
  size: number,
  share: number,
) {
  return sharp(
    await (await placed(logo, size, size * share)).png().toBuffer(),
  ).flatten({ background: brand.colors.iconBackground });
}

/**
 * Written as small as it goes without visibly changing: maximum zlib
 * effort, and an 8-bit palette when the image has few enough colours that
 * quantising it is lossless to the eye (icons and logos almost always do).
 */
function optimised(image: Sharp) {
  return image.png({
    compressionLevel: 9,
    effort: 10,
    palette: true,
    quality: 100,
  });
}

export type ImageReport = { file: string; source: "generated" | "brand" }[];

/**
 * Writes every brand image into `outDir`, which is emptied first so a file
 * the previous brand had and this one doesn't can't linger — and the web
 * app's icons into `publicDir`, which also holds hand-written files and so
 * is only ever overwritten, file by file.
 */
export async function writeImages(
  brand: Brand,
  outDir: string,
  publicDir: string,
): Promise<ImageReport> {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  // Rendered large once, so every output downsamples from the same pixels.
  const logo = sharp(brand.logoPath, { density: 600 }).resize(2048, 2048, {
    fit: "inside",
    withoutEnlargement: brand.logoPath.endsWith(".png"),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const logoPixels = sharp(await logo.png().toBuffer());

  const report: ImageReport = [];

  for (const output of OUTPUTS) {
    const override = join(brand.dir, output.file);
    const target = join(output.web ? publicDir : outDir, output.file);

    if (existsSync(override)) {
      await optimised(sharp(override)).toFile(target);
      report.push({ file: output.file, source: "brand" });
      continue;
    }

    const image = await output.generate(logoPixels, brand);
    if (image === null) continue;
    await optimised(image).toFile(target);
    report.push({ file: output.file, source: "generated" });
  }

  report.push(await writeIconBundle(brand, outDir));
  return report;
}

/**
 * Apple's Icon Composer bundle, which iOS 26+ uses in preference to
 * icon.png for its glass treatment. A hand-made one is copied as-is;
 * otherwise it's the logo as a single layer on `iconBackground`, scaled to
 * the same share of the canvas as icon.png so the two match.
 */
async function writeIconBundle(brand: Brand, outDir: string) {
  const target = join(outDir, ICON_BUNDLE);
  const override = join(brand.dir, ICON_BUNDLE);
  if (existsSync(override)) {
    cpSync(override, target, { recursive: true });
    return { file: ICON_BUNDLE, source: "brand" as const };
  }

  const layer = `logo${extname(brand.logoPath)}`;
  mkdirSync(join(target, "Assets"), { recursive: true });
  copyFileSync(brand.logoPath, join(target, "Assets", layer));

  // Icon Composer sizes a layer by its own dimensions in points on a
  // 1024pt canvas — an SVG's viewBox size, a PNG's pixels.
  const { width = 1024, height = 1024 } = await sharp(
    brand.logoPath,
  ).metadata();
  const scale = (1024 * ICON_LOGO) / Math.max(width, height);
  const [r, g, b] = parseHex(brand.colors.iconBackground).map((channel) =>
    (channel / 255).toFixed(5),
  );

  const icon = {
    fill: { "automatic-gradient": `extended-srgb:${r},${g},${b},1.00000` },
    groups: [
      {
        layers: [
          {
            "image-name": layer,
            name: "logo",
            position: { scale, "translation-in-points": [0, 0] },
          },
        ],
        shadow: { kind: "neutral", opacity: 0.5 },
        translucency: { enabled: true, value: 0.5 },
      },
    ],
    "supported-platforms": { circles: ["watchOS"], squares: "shared" },
  };
  writeFileSync(
    join(target, "icon.json"),
    `${JSON.stringify(icon, null, 2)}\n`,
  );
  return { file: ICON_BUNDLE, source: "generated" as const };
}

/** Checks a hand-made override is the size its slot needs. */
export async function checkOverrides(brand: Brand): Promise<string[]> {
  const problems: string[] = [];
  for (const output of OUTPUTS) {
    const override = join(brand.dir, output.file);
    if (!output.size || !existsSync(override)) continue;
    const { width, height, hasAlpha } = await sharp(override).metadata();
    const [w, h] = output.size;
    if (output.file === "icon.png" && hasAlpha) {
      // An alpha channel at all — even fully opaque — is what App Store
      // Connect rejects, so this checks the channel, not the pixels.
      problems.push(
        "icon.png must not have an alpha channel (App Store rejects it)",
      );
    }
    if (width !== w || height !== h) {
      problems.push(
        `${output.file} must be ${w}×${h}px, got ${width}×${height}`,
      );
    }
  }
  return problems;
}
