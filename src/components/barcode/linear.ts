import barcodes from "jsbarcode/bin/barcodes";

/**
 * The linear symbologies this exposes, and what each is for. Deliberately a
 * short list out of the twenty `jsbarcode` implements: every one added is
 * one more thing to have an opinion about, and these cover what an app
 * actually prints.
 *
 * - `CODE128` — any ASCII, variable length. The general-purpose default.
 * - `CODE39` — older, letters and digits, widely readable by cheap scanners.
 * - `EAN13` / `EAN8` / `UPC` — retail product codes, fixed length with a
 *   check digit the encoder validates.
 * - `ITF14` — shipping cartons.
 * - `codabar` — libraries, blood banks, and older logistics.
 */
export type LinearFormat =
  "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "ITF14" | "codabar";

/** One run of adjacent dark modules. */
export type Bar = { x: number; width: number };

export type LinearBars = {
  /** Bars in module units — the caller scales, nothing is multiplied here. */
  bars: Bar[];
  /** Total width in modules. */
  extent: number;
  /** What the encoder decided the human-readable line should say. */
  text: string;
};

/**
 * A value as bars, or `null` when this format cannot encode it.
 *
 * **Invalid input is `null`, not a thrown error and never a drawn code.**
 * Each symbology has rules — `EAN13` is twelve digits plus a computed
 * check, `CODE39` has no lower case — and a renderer that drew something
 * anyway would produce a barcode that scans as the wrong thing, or as
 * nothing, with no sign on screen that it is wrong. `jsbarcode` knows the
 * rules; this asks it before drawing.
 *
 * **Runs, not one rect per module.** The encoder returns a string of `1`s
 * and `0`s, and adjacent `1`s are one bar. Collapsing them is what makes a
 * hundred-module code a couple of dozen rects.
 */
export function encodeLinear(
  value: string,
  format: LinearFormat,
): LinearBars | null {
  if (value === "") return null;

  const Encoder = barcodes[format];
  if (!Encoder) return null;

  let encoded;
  try {
    // `flat` is not optional here. Without it the EAN/UPC family returns a
    // *segmented* encoding — guard bars and halves as separate pieces for a
    // renderer that positions them — and the top-level `data` is the three
    // modules of the first guard. Drawing that produces three bars where a
    // barcode should be, which is exactly what happened until a test
    // checked EAN13's check digit and found the text missing too.
    const encoder = new Encoder(value, { flat: true });
    if (!encoder.valid()) return null;
    encoded = encoder.encode();
  } catch {
    return null;
  }

  // EAN with an add-on encodes to several segments; the first is the
  // symbol itself, which is the one worth drawing here.
  const { data, text } = Array.isArray(encoded) ? encoded[0]! : encoded;
  if (typeof data !== "string" || data === "") return null;

  const bars: Bar[] = [];
  let index = 0;

  while (index < data.length) {
    if (data[index] !== "1") {
      index++;
      continue;
    }
    const start = index;
    while (index < data.length && data[index] === "1") index++;
    bars.push({ x: start, width: index - start });
  }

  return { bars, extent: data.length, text: text ?? value };
}
