import { useMemo } from "react";

import { useBreakpoint } from "./breakpoint";
import { resolveResponsive, type ResponsiveValue } from "./responsive-value";
import { useSizes } from "./use-responsive";

/** How many columns a grid divides into when nothing else is asked for. */
export const DEFAULT_COLUMNS = 12;

export type GridMetrics = {
  /** Column count, already resolved for the current breakpoint. */
  columns: number;
  /** Gap between cells, in already-scaled pixels. */
  gap: number;
  /**
   * What each cell puts on every side — half the gap, so two adjacent
   * cells end up a full gap apart.
   */
  cellPadding: number;
  /**
   * The margin a container applies to cancel the half-gap its edge cells
   * would otherwise add, keeping the grid flush with whatever contains it.
   * Negative by construction.
   */
  edgeOffset: number;
  /**
   * The percentage width of a cell occupying `columns` of the grid, clamped
   * into `[1, columns]` so an over-wide request becomes a full line instead
   * of overflowing.
   *
   * A percentage rather than a pixel value on purpose: widths then sum to
   * exactly 100% regardless of the container's size, so flex wrapping lands
   * cleanly with nothing measured. See `Row` for the whole argument.
   */
  widthFor: (columns: number) => `${number}%`;
};

/**
 * Pure — the whole grid layout calculation, given a resolved column count
 * and gap. Kept hook-free (and outside `components/grid`) so anything
 * that wants to size itself in grid columns can, without being inside a
 * `<Row>`: a standalone card that should be a third of the screen, a media
 * tile that should match the grid's rhythm, a modal sized to eight columns.
 *
 * @example
 * const { widthFor } = createGridMetrics(12, spacing.x8);
 * const style = { width: widthFor(4) }; // "33.33333333333333%"
 */
export function createGridMetrics(columns: number, gap: number): GridMetrics {
  const safeColumns = Math.max(1, Math.round(columns));

  return {
    columns: safeColumns,
    gap,
    cellPadding: gap / 2,
    edgeOffset: -gap / 2,
    widthFor: (requested) => {
      const clamped = Math.min(Math.max(Math.round(requested), 1), safeColumns);
      return `${(clamped / safeColumns) * 100}%`;
    },
  };
}

/**
 * `createGridMetrics` wired to the current breakpoint, so `columns` can be
 * a per-breakpoint map and `gap` defaults to the `spacing.x8` step.
 *
 * `Row` uses this and shares the result with its cells through context —
 * but any component can call it directly to size itself on the same grid.
 */
export function useGridMetrics(
  columns: ResponsiveValue<number> = DEFAULT_COLUMNS,
  gap?: number,
): GridMetrics {
  const breakpoint = useBreakpoint();
  const { spacing } = useSizes();

  const resolvedColumns = resolveResponsive(
    columns,
    breakpoint,
    DEFAULT_COLUMNS,
  );
  const resolvedGap = gap ?? spacing.x8;

  return useMemo(
    () => createGridMetrics(resolvedColumns, resolvedGap),
    [resolvedColumns, resolvedGap],
  );
}
