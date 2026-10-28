import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { createStyles, useSizes } from "@/features/responsive";

type Props = {
  /**
   * Space between stacked children, in already-scaled pixels — pass a
   * `spacing` token. Defaults to `spacing.x8`, the same default `Row` uses,
   * so a column of rows is evenly spaced in both axes without either being
   * told twice.
   */
  gap?: number;
  /** How children line up across the column. Defaults to filling its width. */
  align?: ViewStyle["alignItems"];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Stacks its children vertically with a consistent gap — `Row`'s
 * transpose, and the other half of the layout vocabulary.
 *
 * **`Column` is a vertical arrangement, not one of the columns a `Row` is
 * divided into.** Those are a unit of measure rather than a component, and
 * they're counted by the `columns` prop on `Row` and `Cell`. The word does
 * double duty in every grid system that has both; the rule here is that the
 * *component* always means the direction, and the *count* always appears as
 * a prop.
 *
 * Unlike `Row`, its `gap` really is RN's `gap` style: children are stacked,
 * not sized as percentages of the container, so there's no width arithmetic
 * for a gap to break (see Row for why that matters there).
 *
 * @example
 * <Column gap={spacing.x16}>
 *   <Row>…</Row>
 *   <Row>…</Row>
 * </Column>
 */
export default function Column({ gap, align, style, children }: Props) {
  const { spacing } = useSizes();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.column,
        { gap: gap ?? spacing.x8 },
        align === undefined ? null : { alignItems: align },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const useStyles = createStyles(() => ({
  column: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));
