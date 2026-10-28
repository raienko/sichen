import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  createStyles,
  useGridMetrics,
  type ResponsiveValue,
} from "@/features/responsive";

import RowContext from "./context";

type Props = {
  /**
   * How many columns to divide into — a number, or a per-breakpoint map
   * that cascades upward (see `resolveResponsive`). Defaults to 12.
   *
   * This is the row's own subdivision; a `<Cell>` then says how many of
   * these it occupies with its own `columns`.
   */
  columns?: ResponsiveValue<number>;
  /**
   * Gap between cells, in already-scaled pixels — pass a `spacing`
   * token. Defaults to `spacing.x8`.
   */
  gap?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * A horizontal band of `<Cell>`s, divided into `columns`. Cells wrap onto
 * new lines on their own once they've filled the row, so a single `<Row>`
 * can hold a whole grid — the same auto-placement CSS Grid does, and one
 * less level of nesting than a container/row/cell hierarchy.
 *
 * **`gap` is the prop, but not the implementation.** A cell occupying half
 * a 12-column row is `width: "50%"`. Set RN's own `gap` style between cells
 * and two of them no longer fit on one line — 50% + 50% + the gap overflows
 * — so everything wraps one-per-line and the grid silently stops being a
 * grid. The usual fixes are to measure the row and compute exact pixel
 * widths (an extra layout pass, and a visible reflow before the first
 * measurement) or to express the width as a `calc()` RN doesn't have.
 *
 * Instead each cell carries half the gap as *padding* on every side, and
 * this row cancels the resulting outer edge with a matching negative
 * margin. Widths then sum to exactly 100%, wrapping is exact, and adjacent
 * cells end up a full gap apart — with no measurement and nothing to
 * reflow. It works because RN lays out border-box, so padding is inside the
 * declared width rather than added to it.
 *
 * The arithmetic itself lives in `useGridMetrics` (features/responsive), so
 * a component that wants to size itself on the same grid without being
 * inside a `<Row>` can reach for it directly.
 *
 * @example
 * <Row gap={spacing.x12}>
 *   <Cell columns={{ phone: 12, tablet: 6 }}><Card /></Cell>
 *   <Cell columns={{ phone: 12, tablet: 6 }}><Card /></Cell>
 * </Row>
 *
 * @example
 * // A uniform tile grid: 2 up on phones, 4 up from tablet.
 * <Row columns={{ phone: 2, tablet: 4 }}>
 *   {tiles.map((t) => <Cell key={t.id}><Tile {...t} /></Cell>)}
 * </Row>
 */
export default function Row({ columns, gap, style, children }: Props) {
  const metrics = useGridMetrics(columns, gap);
  const styles = useStyles();

  return (
    <RowContext.Provider value={metrics}>
      <View style={[styles.row, { margin: metrics.edgeOffset }, style]}>
        {children}
      </View>
    </RowContext.Provider>
  );
}

const useStyles = createStyles(({ isRTL }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
}));
