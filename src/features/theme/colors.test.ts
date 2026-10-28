import { colors, type ColorScheme, type ThemeColors } from "./colors";

/**
 * WCAG relative luminance. Deliberately reimplemented here rather than
 * imported from anywhere: the whole point of the test is to catch a palette
 * edit, so it must not share code with what it is checking.
 */
function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];

  const [r, g, b] = channels.map((channel) => {
    const ratio = channel / 255;
    return ratio <= 0.04045
      ? ratio / 12.92
      : Math.pow((ratio + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  const [light, dark] = x! > y! ? [x!, y!] : [y!, x!];
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG 2.1 AA for body text. */
const TEXT_MINIMUM = 4.5;
/** WCAG 2.1 AA (1.4.11) for a non-text boundary that identifies a control. */
const BOUNDARY_MINIMUM = 3;

const SCHEMES: ColorScheme[] = ["light", "dark"];

/**
 * The surfaces the app actually paints text on. `backgroundElement` is the
 * one that keeps getting missed by eye: it's both the Accordion/Modal
 * surface and `tertiary`'s selected fill, so a label only ever checked
 * against `background` can still be unreadable in practice.
 *
 * `backgroundElementSelected` is absent on purpose — it's a pressed/selected
 * *fill*, and the only type that uses it (`secondary`) labels itself in
 * `text`, which is checked against it below as a boundary anyway. Requiring
 * every foreground to clear 4.5:1 against it too would force the accent
 * several steps paler than any surface in the app needs.
 */
const TEXT_SURFACES: (keyof ThemeColors)[] = [
  "background",
  "backgroundElement",
];

/** Where a chosen item's label sits — `text` and `accent` must read on it. */
const SELECTED_SURFACES: (keyof ThemeColors)[] = [...TEXT_SURFACES, "selected"];

/** Fills a control's outline may have to separate itself from. */
const BOUNDARY_SURFACES: (keyof ThemeColors)[] = [
  "background",
  "backgroundElement",
  "backgroundElementSelected",
  "selected",
];

const STATUS_COLORS: (keyof ThemeColors)[] = [
  "error",
  "success",
  "warning",
  "info",
];

describe("palette contrast", () => {
  describe.each(SCHEMES)("%s", (scheme) => {
    const palette = colors[scheme];

    it.each(SELECTED_SURFACES)("reads `text` on %s", (surface) => {
      expect(contrast(palette.text, palette[surface])).toBeGreaterThanOrEqual(
        TEXT_MINIMUM,
      );
    });

    // Button's `tertiary` type and every accent label in the app.
    it.each(SELECTED_SURFACES)("reads `accent` as a label on %s", (surface) => {
      expect(contrast(palette.accent, palette[surface])).toBeGreaterThanOrEqual(
        TEXT_MINIMUM,
      );
    });

    // A `primary` fill is a control's only boundary when it's a switch or a
    // checked box, so it must stand off the surfaces it sits on.
    it.each(TEXT_SURFACES)("shows a `primary` fill on %s", (surface) => {
      expect(
        contrast(palette.primary, palette[surface]),
      ).toBeGreaterThanOrEqual(BOUNDARY_MINIMUM);
    });

    it("reads `onPrimary` on a `primary` fill", () => {
      expect(
        contrast(palette.onPrimary, palette.primary),
      ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
    });

    // The label must stay legible for the whole press, not just at rest.
    it("reads `onPrimary` on a pressed `primary` fill", () => {
      expect(
        contrast(palette.onPrimary, palette.primaryPressed),
      ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
    });

    it.each(STATUS_COLORS)("reads `%s` on app surfaces", (color) => {
      for (const surface of TEXT_SURFACES) {
        expect(
          contrast(palette[color], palette[surface]),
        ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
      }
    });

    /**
     * `border` is Button's `secondary` border. On a
     * `backgroundElement` surface that outline is the only thing separating
     * the control from what's behind it, since its fill is that same token.
     */
    it.each(BOUNDARY_SURFACES)("shows a `border` boundary on %s", (surface) => {
      expect(contrast(palette.border, palette[surface])).toBeGreaterThanOrEqual(
        BOUNDARY_MINIMUM,
      );
    });

    it.each(BOUNDARY_SURFACES)("shows a `focus` indicator on %s", (surface) => {
      expect(contrast(palette.focus, palette[surface])).toBeGreaterThanOrEqual(
        BOUNDARY_MINIMUM,
      );
    });
  });
});
