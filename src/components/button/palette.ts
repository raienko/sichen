/**
 * The visual vocabulary shared by every button-shaped control: `Button` and
 * `IconButton` both read it, so a change to what `secondary` means lands on
 * both at once.
 *
 * It sits beside them rather than inside either, and both ship from this
 * folder for the same reason `grid` ships Row and Cell together — a sibling
 * folder would have to reach across into another component's internals to
 * get at it.
 */
import type { ThemeColors } from "@/features/theme";

export type ButtonSize = "small" | "medium" | "large" | "auto";
export type ButtonType = "primary" | "secondary" | "tertiary";

/**
 * Which palette entries each type draws from. Two backgrounds per type —
 * resting and `selected` — so a segmented control reads as picked in every
 * type, not just the one that happens to have a darker token.
 *
 * `null` means "no fill": `secondary` is an outlined button and `tertiary`
 * a text-only one, so neither paints anything at rest; both pick up the
 * `selected` tint once chosen, never a solid inverted block.
 *
 * **`secondary`'s border is the control, not decoration.** With no fill, the
 * outline is the only thing marking where the button is, so it is the
 * semantic `border` token — which clears WCAG 1.4.11's 3:1 against every
 * surface a button can sit on, including `backgroundElement` and the
 * `selected` tint it takes on when picked. *
 * **Every type answers a press.** `backgroundPressed` is the solid fill a
 * type switches to while held; `null` means the type has no fill worth
 * shading, so the translucent `pressed` overlay is laid over whatever it
 * shows instead — the page, a raised surface, or its `selected` tint.
 */
export const TYPE_COLORS: Record<
  ButtonType,
  {
    background: keyof ThemeColors | null;
    backgroundSelected: keyof ThemeColors;
    backgroundPressed: keyof ThemeColors | null;
    border: keyof ThemeColors | null;
    label: keyof ThemeColors;
    labelSelected?: keyof ThemeColors;
  }
> = {
  primary: {
    background: "primary",
    backgroundSelected: "primary",
    backgroundPressed: "primaryPressed",
    border: null,
    label: "onPrimary",
  },
  secondary: {
    background: null,
    backgroundSelected: "selected",
    backgroundPressed: null,
    border: "border",
    label: "text",
  },
  tertiary: {
    background: null,
    backgroundSelected: "selected",
    backgroundPressed: null,
    border: null,
    label: "accent",
  },
};
