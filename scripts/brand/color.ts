/**
 * The colour maths the brand script needs, and nothing else: hex parsing,
 * WCAG contrast, and OKLCH so a brand hue can be stepped lighter or darker
 * without drifting the way an RGB or HSL step does.
 *
 * Kept apart from src/features/theme on purpose. colors.test.ts checks the
 * palette this script writes with its own contrast code, so the two are
 * independent: a bug here can't also hide itself there.
 */

export type Rgb = [number, number, number];
export type Oklch = { l: number; c: number; h: number };

/** Three- or six-digit hex — the same rule src/constants/env enforces. */
export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): Rgb {
  let value = hex.slice(1);
  if (value.length === 3)
    value = [...value].map((char) => char + char).join("");
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

const toLinear = (channel: number) => {
  const ratio = channel / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (value: number) =>
  255 *
  (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055);

export function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = parseHex(hex).map(toLinear) as Rgb;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = parseHex(hex).map(toLinear) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/**
 * Back to hex, giving up chroma (never lightness or hue) until the colour
 * fits in sRGB — a saturated brand blue stepped much lighter otherwise
 * lands outside the gamut and clips to a different hue.
 */
export function oklchToHex(color: Oklch): string {
  let { c } = color;
  for (;;) {
    const rgb = oklchToLinear({ ...color, c });
    const inGamut = rgb.every((value) => value >= -1e-4 && value <= 1 + 1e-4);
    if (inGamut || c <= 0.001) return toHex(rgb.map(fromLinear) as Rgb);
    c *= 0.95;
  }
}

/** `amount` of `b` mixed into `a`, in OKLab, so the hue stays put. */
export function mix(a: string, b: string, amount: number): string {
  const [x, y] = [hexToOklch(a), hexToOklch(b)];
  const ax = x.c * Math.cos(x.h);
  const bx = x.c * Math.sin(x.h);
  const ay = y.c * Math.cos(y.h);
  const by = y.c * Math.sin(y.h);
  const A = ax + (ay - ax) * amount;
  const B = bx + (by - bx) * amount;
  return oklchToHex({
    l: x.l + (y.l - x.l) * amount,
    c: Math.hypot(A, B),
    h: Math.atan2(B, A),
  });
}
