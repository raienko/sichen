/**
 * The colour maths ColorPicker needs: hex in and out, and HSV, the model
 * the picker is laid out in — hue along the bar, saturation across the
 * square and brightness (value) up it.
 *
 * Pure and split out so it can be tested without rendering anything.
 */

/** Hue in degrees (0–360), saturation and value as 0–1. */
export type Hsv = { h: number; s: number; v: number };

const SHORT_HEX = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const LONG_HEX = /^#?([0-9a-f]{6})$/i;

/**
 * A colour as the picker reports it — `#RRGGBB`, upper case — or `null` if
 * the text isn't a colour. Takes three or six digits, with or without the
 * `#`, so what someone types into the hex field can be read as they type
 * it. Eight-digit hex is refused for the same reason the brand colours
 * refuse it: `#RRGGBBAA` on the web and `#AARRGGBB` on Android are two
 * different colours for one string.
 */
export function normalizeHex(input: string): string | null {
  const text = input.trim();
  const short = SHORT_HEX.exec(text);
  if (short) {
    const [, r, g, b] = short;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const long = LONG_HEX.exec(text);
  return long ? `#${long[1]}`.toUpperCase() : null;
}

/** Where an unreadable value lands: colour data, not a UI colour. */
// eslint-disable-next-line no-restricted-syntax -- a value, not a style
export const BLACK = "#000000";

export function hexToHsv(hex: string): Hsv {
  const value = parseInt((normalizeHex(hex) ?? BLACK).slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;

  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }

  return {
    h: (h * 60 + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const hue = ((h % 360) + 360) % 360;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - chroma;

  const [r, g, b] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return `#${[r, g, b]
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

/** Keeps a 0–1 fraction (a drag can run past either end) in range. */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
