import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { Cell, Column, Row } from "./index";

const meta = {
  title: "components/Grid",
  component: Row,
};

export default meta;

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

const useStyles = createStyles(({ spacing, radius }) => ({
  tile: {
    borderRadius: radius.surface,
    paddingVertical: spacing.x16,
    alignItems: "center",
  },
}));

export const TwelveColumn = {
  render: () => (
    <Row>
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
  ),
};

export const TileGrid = {
  render: () => (
    <Row columns={3}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i}>
          <Tile label={String(i + 1)} />
        </Cell>
      ))}
    </Row>
  ),
};

export const ResponsiveColumns = {
  render: () => (
    <Row>
      {Array.from({ length: 4 }, (_, i) => (
        <Cell key={i} columns={{ phone: 12, foldable: 6, tablet: 3 }}>
          <Tile label="12 / 6 / 3" />
        </Cell>
      ))}
    </Row>
  ),
};

export const WideGap = {
  render: () => (
    <Row columns={2} gap={24}>
      {Array.from({ length: 4 }, (_, i) => (
        <Cell key={i}>
          <Tile label={String(i + 1)} />
        </Cell>
      ))}
    </Row>
  ),
};

export const ColumnOfRows = {
  render: () => (
    <Column gap={24}>
      <Row columns={2}>
        <Cell>
          <Tile label="a" />
        </Cell>
        <Cell>
          <Tile label="b" />
        </Cell>
      </Row>
      <Row columns={3}>
        <Cell>
          <Tile label="c" />
        </Cell>
        <Cell>
          <Tile label="d" />
        </Cell>
        <Cell>
          <Tile label="e" />
        </Cell>
      </Row>
    </Column>
  ),
};
