import { contrast, hexToOklch, mix, oklchToHex, type Oklch } from "./color.ts";

type Scheme = "light" | "dark";
type Palette = Record<string, string>;
export type Palettes = Record<Scheme, Palette>;

/** The keys a brand's primary colour decides. Everything else is shared. */
export const BRAND_KEYS = [
  "primary",
  "onPrimary",
  "primaryPressed",
  "accent",
  "selected",
  "focus",
] as const;

const TEXT = 4.5;
const BOUNDARY = 3;

/**
 * Moves a colour's OKLCH lightness one small step at a time, in one
 * direction, until `ok` holds. Hue and chroma stay put, so the result still
 * reads as the brand colour, just lighter or darker. `null` if no lightness
 * in that direction works — the caller turns that into an error that names
 * the pair.
 */
function solve(
  start: Oklch,
  direction: 1 | -1,
  ok: (hex: string) => boolean,
): string | null {
  for (let l = start.l; l >= 0 && l <= 1; l += 0.005 * direction) {
    const hex = oklchToHex({ ...start, l });
    if (ok(hex)) return hex;
  }
  return null;
}

const shift = (hex: string, by: number): Oklch => {
  const color = hexToOklch(hex);
  return { ...color, l: Math.min(1, Math.max(0, color.l + by)) };
};

/**
 * One scheme's brand keys from the brand colour, each stepped only as far
 * as the contrast rules in src/features/theme/colors.test.ts need. A brand
 * colour that already passes is used exactly as given.
 */
function derive(base: Palette, brand: string, scheme: Scheme): Palette {
  const dark = scheme === "dark";
  // Lighter on dark, darker on light: the direction that gains contrast
  // against that scheme's surfaces.
  const away = dark ? 1 : -1;
  const onPrimary = "#FFFFFF";
  const reads = (hex: string, on: string[], minimum: number) =>
    on.every((surface) => contrast(hex, base[surface]!) >= minimum);

  const failed = (key: string): never => {
    throw new Error(
      `Can't derive a ${scheme} \`${key}\` from ${brand} that meets the contrast rules. ` +
        `Pick a different primary, or set palette.${scheme}.${key} in brand.json.`,
    );
  };

  // White label on the fill, and the fill visible on the page. On dark the
  // two pull opposite ways, so it starts a touch lighter than the brand and
  // darkens until the label reads.
  const primary =
    solve(
      shift(brand, dark ? 0.03 : 0),
      -1,
      (hex) =>
        contrast(onPrimary, hex) >= TEXT &&
        reads(hex, ["background", "backgroundElement"], BOUNDARY),
    ) ?? failed("primary");

  const primaryPressed =
    solve(
      shift(primary, dark ? -0.03 : -0.06),
      -1,
      (hex) => contrast(onPrimary, hex) >= TEXT,
    ) ?? failed("primaryPressed");

  const selected =
    solve(
      hexToOklch(mix(base.background!, primary, dark ? 0.22 : 0.12)),
      dark ? -1 : 1,
      (hex) =>
        contrast(base.text!, hex) >= TEXT &&
        contrast(base.border!, hex) >= BOUNDARY,
    ) ?? failed("selected");

  const surfaces: Palette = { ...base, selected };
  const readsOnSurfaces = (hex: string, on: string[], minimum: number) =>
    on.every((surface) => contrast(hex, surfaces[surface]!) >= minimum);

  const accent =
    solve(
      dark
        ? { ...hexToOklch(primary), l: Math.max(hexToOklch(primary).l, 0.72) }
        : hexToOklch(primary),
      away,
      (hex) =>
        readsOnSurfaces(
          hex,
          ["background", "backgroundElement", "selected"],
          TEXT,
        ),
    ) ?? failed("accent");

  const focus =
    solve(hexToOklch(accent), away, (hex) =>
      readsOnSurfaces(
        hex,
        [
          "background",
          "backgroundElement",
          "backgroundElementSelected",
          "selected",
        ],
        BOUNDARY,
      ),
    ) ?? failed("focus");

  return { primary, onPrimary, primaryPressed, accent, selected, focus };
}

/** Every pair colors.test.ts checks, so a bad override fails here first. */
export function check(palettes: Palettes): string[] {
  const problems: string[] = [];
  for (const scheme of ["light", "dark"] as const) {
    const p = palettes[scheme];
    const need = (fg: string, bg: string, minimum: number) => {
      const ratio = contrast(p[fg]!, p[bg]!);
      if (ratio < minimum) {
        problems.push(
          `${scheme}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
        );
      }
    };
    for (const surface of ["background", "backgroundElement", "selected"]) {
      need("text", surface, TEXT);
      need("accent", surface, TEXT);
    }
    for (const surface of ["background", "backgroundElement"]) {
      need("primary", surface, BOUNDARY);
    }
    need("onPrimary", "primary", TEXT);
    need("onPrimary", "primaryPressed", TEXT);
    for (const surface of [
      "background",
      "backgroundElement",
      "backgroundElementSelected",
      "selected",
    ]) {
      need("border", surface, BOUNDARY);
      need("focus", surface, BOUNDARY);
    }
  }
  return problems;
}

/**
 * The full palette for a brand: the shared base, the brand keys derived
 * from `primary`, then whatever the brand overrides by hand.
 */
export function buildPalette(
  base: Palettes,
  primary: string,
  overrides: Partial<Record<Scheme, Palette>> = {},
): Palettes {
  const result = {} as Palettes;
  for (const scheme of ["light", "dark"] as const) {
    result[scheme] = {
      ...base[scheme],
      ...derive(base[scheme], primary, scheme),
      ...overrides[scheme],
    };
  }

  const problems = check(result);
  if (problems.length > 0) {
    throw new Error(
      `The palette breaks the contrast rules:\n  ${problems.join("\n  ")}`,
    );
  }
  return result;
}
