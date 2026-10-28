import qrcodeGenerator from "qrcode-generator";

/**
 * How much damage a code can take and still read. Higher levels spend more
 * modules on redundancy, so the same string needs a denser grid.
 *
 * `"M"` is the default for the same reason most printers use it: `"L"` is
 * fine on a screen and fragile the moment a code is printed, photographed
 * at an angle, or partly covered; `"H"` costs about a third more modules
 * for damage tolerance a screen does not need. `"Q"`/`"H"` earn their keep
 * when something is drawn *over* the code — a logo in the middle.
 */
export type QrErrorCorrection = "L" | "M" | "Q" | "H";

/**
 * The blank border a QR code needs around it, in modules.
 *
 * Four is what the spec requires, and it is not decoration: a scanner finds
 * the symbol by looking for that quiet border, so a code drawn flush to the
 * edge of its container frequently will not read at all. It is the single
 * most common way a hand-rolled QR renderer fails, which is why it is
 * baked in here rather than left to a caller's padding.
 */
export const QR_QUIET_ZONE = 4;

export type QrMatrix = {
  /** Modules per side, excluding the quiet zone. */
  size: number;
  /** The full side including the quiet zone on both sides. */
  extent: number;
  /** SVG path data for every dark module, in one path. */
  path: string;
};

/**
 * A string as a QR matrix, ready to draw.
 *
 * **One path, not one rect per module.** A modest code is 29×29 and a dense
 * one 57×57 — up to three thousand modules, and roughly half of them dark.
 * That many `<Rect>` elements is a lot of nodes to reconcile on every
 * render; the same shapes as subpaths of a single `<Path>` is one node.
 *
 * Returns `null` for input that cannot be encoded — an empty string, or one
 * past what the largest symbol holds — so a caller renders nothing rather
 * than a code that scans as gibberish.
 */
export function encodeQr(
  value: string,
  errorCorrection: QrErrorCorrection = "M",
): QrMatrix | null {
  if (value === "") return null;

  let qr;
  try {
    // Type 0 asks the library to pick the smallest symbol the data fits in,
    // which is what keeps a short URL from being drawn at 57 modules.
    qr = qrcodeGenerator(0, errorCorrection);
    qr.addData(value);
    qr.make();
  } catch {
    // Thrown for data too long for any symbol at this correction level.
    return null;
  }

  const size = qr.getModuleCount();
  const parts: string[] = [];

  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (!qr.isDark(row, column)) continue;
      // Drawn in module units; the caller scales the whole path instead of
      // multiplying every coordinate here.
      parts.push(`M${column + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`);
    }
  }

  return { size, extent: size + QR_QUIET_ZONE * 2, path: parts.join("") };
}
