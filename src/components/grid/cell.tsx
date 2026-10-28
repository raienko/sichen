import { useContext, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  resolveResponsive,
  useBreakpoint,
  type ResponsiveValue,
} from "@/features/responsive";

import RowContext from "./context";

type Props = {
  /**
   * How many of the row's columns this cell occupies — a number, or a
   * per-breakpoint map that cascades upward (see `resolveResponsive`).
   * Defaults to 1, which makes a `columns={4}` row a plain 4-up tile grid
   * with no per-cell props at all.
   *
   * Deliberately the same word as `Row`'s own `columns`, read one level
   * down: a row *has* twelve columns, a cell *takes* six of them. They're
   * separate components, so there's no ambiguity at a call site —
   * `<Row columns={12}><Cell columns={6}>` says the whole relationship in
   * two props.
   *
   * Clamped to the row's column count, so a cell asking for more columns
   * than exist becomes a full-width line rather than overflowing.
   */
  columns?: ResponsiveValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * One cell of a `<Row>`. All of its sizing comes from the row's
 * `GridMetrics` — see `useGridMetrics` (features/responsive) for the
 * arithmetic, and Row's comment for why the row's `gap` becomes padding
 * here instead of RN's `gap` style on the row itself.
 *
 * There's deliberately no row-spanning counterpart: this grid gets its rows
 * from flex wrapping, and a wrapped flex line has no concept of a cell
 * reaching into the line below. True two-dimensional spanning needs
 * absolute positioning off a measured row height, which is a different (and
 * much heavier) component than this one.
 */
export default function Cell({ columns = 1, style, children }: Props) {
  const metrics = useContext(RowContext);
  const breakpoint = useBreakpoint();

  if (!metrics) {
    throw new Error("Cell must be used within a Row");
  }

  const resolved = resolveResponsive(columns, breakpoint, 1);

  return (
    <View
      style={[
        {
          width: metrics.widthFor(resolved),
          padding: metrics.cellPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
