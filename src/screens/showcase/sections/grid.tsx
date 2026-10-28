import { View } from "react-native";

import { Cell, Column, Row } from "@/components/grid";
import Text from "@/components/text";
import { createStyles, useBreakpoint, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/** Something visible to put in a cell — not part of the grid system. */
function Tile({ label }: { label: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: theme.colors.backgroundElementSelected },
      ]}
    >
      <Text value={label} type="caption1" />
    </View>
  );
}

/**
 * Three shapes of the same `Row`. The middle one is the point of the whole
 * system: its `columns` is a per-breakpoint map, so narrowing the window
 * re-flows it from four-up to two-up to stacked — the breakpoint readout at
 * the top moves with it.
 *
 * The three rows are stacked by a `Column`, which is the other half of the
 * vocabulary: `Row` places cells across, `Column` stacks blocks down.
 */
export default function GridSection() {
  const breakpoint = useBreakpoint();
  const { spacing } = useSizes();

  return (
    <Column gap={spacing.x8}>
      <Readout label="breakpoint" value={breakpoint} />

      <Text value="Fixed column spans" type="headline" />
      <Row gap={spacing.x8}>
        <Cell columns={12}>
          <Tile label="12" />
        </Cell>
        <Cell columns={6}>
          <Tile label="6" />
        </Cell>
        <Cell columns={6}>
          <Tile label="6" />
        </Cell>
        <Cell columns={4}>
          <Tile label="4" />
        </Cell>
        <Cell columns={4}>
          <Tile label="4" />
        </Cell>
        <Cell columns={4}>
          <Tile label="4" />
        </Cell>
      </Row>

      <Text value="Responsive spans — resize to reflow" type="headline" />
      <Row gap={spacing.x8}>
        {Array.from({ length: 4 }, (_, index) => (
          <Cell key={index} columns={{ phone: 12, foldable: 6, tablet: 3 }}>
            <Tile label="12 / 6 / 3" />
          </Cell>
        ))}
      </Row>

      <Text value="Tile grid — columns, no spans" type="headline" />
      <Row columns={{ phone: 3, tablet: 6 }} gap={spacing.x8}>
        {Array.from({ length: 6 }, (_, index) => (
          <Cell key={index}>
            <Tile label={String(index + 1)} />
          </Cell>
        ))}
      </Row>
    </Column>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  tile: {
    borderRadius: radius.surface,
    paddingVertical: spacing.x12,
    alignItems: "center",
  },
}));
