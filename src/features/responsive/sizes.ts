import type { Units } from "./units";

/**
 * The sizes styleguide's generic scale — named steps for the Figma px
 * values components pass to `units()`, so two components that mean the
 * same thing (e.g. "the standard gap between stacked fields") share one
 * named value instead of each separately hardcoding `units(12)` and
 * drifting out of sync later.
 *
 * Keyed `x<value>` (`spacing.x8`, not `spacing[8]` or `spacing.sm`) — a
 * numeric-value key says exactly what step you're getting without a name
 * to look up first (`spacing.x10`, not a step in the scale, is a `tsc`
 * error instead of a silent typo), and the `x` prefix is only there
 * because a bare number can't be a dot-accessible property name.
 *
 * Not exported — every consumer goes through the scaled `spacing` from
 * `useSizes()`/`createStyles()`. Handing out the raw table would let a
 * call site use an unscaled value by accident, silently skipping the
 * device scaling every other size in the app gets.
 */
const RAW_SPACING = {
  x1: 1,
  x2: 2,
  x4: 4,
  x8: 8,
  x12: 12,
  x16: 16,
  x20: 20,
  x24: 24,
  x28: 28,
  x32: 32,
  x36: 36,
  x40: 40,
} as const;

/**
 * Every corner in the app, by the role of the thing it rounds — the one
 * place that decides the kit's shape. Unlike `RAW_SPACING` these are named
 * by purpose rather than keyed by value, because the value is exactly what
 * a redesign changes: the Graphite kit is square, so three of the four are
 * `0`, and rounding it later is an edit to this table rather than a hunt
 * through every component for a `borderRadius`.
 *
 * Reach for one of these for *any* corner, including a zero one — a
 * component that simply omits `borderRadius` can't be rounded from here.
 */
const RAW_RADIUS = {
  /** Things you press or type into: buttons, fields, segmented controls, tags, checkboxes, switches. */
  control: 0,
  /** Things that hold content: cards, modals, toasts, media, code blocks, avatars. */
  surface: 0,
  /** Small marks that carry a state rather than content: badges, dots, progress tracks, swatches. */
  indicator: 0,
  /**
   * A true circle or capsule at any size — radio buttons, the sheet grabber.
   * Large enough to exceed half of anything it rounds, which is all RN needs
   * to draw a full curve.
   */
  full: 9999,
} as const;

/**
 * Named, purpose-specific sizes — where the generic scale above means
 * nothing beyond its own number (many components share step 16 without
 * meaning the same thing by it), each of these means exactly one thing, so
 * it gets a name instead of a step.
 *
 * Named by what the size *is for*, not by which component happens to use it
 * first — `elementHeightMd`, not `inputHeight`, because a future Button or
 * Select sized to match Input's touch target is reusing the same concept,
 * not borrowing Input's own measurement. Same for `elementWidthLg`:
 * Modal's content cap isn't "Modal's width", it's one tier of "how wide
 * should a self-contained element be", and the next component to want that
 * tier should reach for the same value.
 * A size that's genuinely specific to one element's own shape (the drag
 * handle's exact grabber-pill dimensions, say) still gets a specific name —
 * genericizing a name doesn't make the measurement itself any more general.
 *
 * Add an entry here once a measurement has a clear, reusable purpose worth
 * naming — not for every bespoke number a component happens to have. A
 * value that's genuinely one component's own business (padding tuned to
 * that component's own visual balance, say) still belongs local to it.
 */
const RAW_NAMED_SIZES = {
  /** Compact interactive-element height, for dense or secondary controls (below the 44pt target, so reserve it for non-primary actions). */
  elementHeightSm: 32,
  /** Standard interactive-element touch-target height — the 44pt minimum, shared by Input and Button's default size. */
  elementHeightMd: 44,
  /** Prominent interactive-element height, for primary calls to action. */
  elementHeightLg: 56,
  /** Modal's bottom-sheet/actions drag handle grabber pill — specific to that one element's own shape, not a reusable step (see the doc comment above). */
  grabberWidth: 36,
  grabberHeight: 4,
  /** Cap on a readable content column, so a screen's body doesn't stretch edge-to-edge on a tablet or desktop window. */
  contentMaxWidth: 720,
  /** How wide a self-contained overlay element gets — currently Modal's `popup`/`bottomSheet`/`actions` content, capped so it doesn't stretch edge-to-edge on a wide screen. */
  elementWidthLg: 360,
  /** A screen's side column — `Screen`'s `aside`, e.g. section navigation on a tablet or the web. */
  asideWidth: 280,
  /** Side padding inside a full-width row — ListItem, Accordion, Select and country options — so their text, icons, pressed fill and focus ring all sit the same distance from the edge. */
  rowInset: 16,
} as const;

type Scaled<T extends Record<string, number>> = { [K in keyof T]: number };

function scale<T extends Record<string, number>>(
  units: Units,
  raw: T,
): Scaled<T> {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, units(value)]),
  ) as Scaled<T>;
}

/**
 * The spacing scale's step names (`"x8"`, `"x16"`, ...). Exported so a
 * component can take a step *by name* as a prop — `Spacer` does — and get
 * the same typo-is-a-tsc-error guarantee a `spacing.x8` lookup already has,
 * instead of accepting a bare number that skips the scale entirely.
 */
export type SpacingToken = keyof typeof RAW_SPACING;

export type Sizes = {
  spacing: Scaled<typeof RAW_SPACING>;
  radius: Scaled<typeof RAW_RADIUS>;
  sizes: Scaled<typeof RAW_NAMED_SIZES>;
};

/**
 * Pure — takes a `units` function and returns the whole sizes styleguide
 * already scaled through it. The hook wrapper (`useSizes()`, in
 * use-responsive.ts) is what components call; keeping the computation
 * itself hook-free is what lets `useResponsive()` build sizes, typography,
 * and breakpoint from a *single* `useWindowDimensions()` read instead of
 * one per styleguide.
 */
export function createSizes(units: Units): Sizes {
  return {
    spacing: scale(units, RAW_SPACING),
    radius: scale(units, RAW_RADIUS),
    sizes: scale(units, RAW_NAMED_SIZES),
  };
}
