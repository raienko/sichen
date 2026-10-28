import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Card from "@/components/card";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component, { SKELETON_COLORS } from "./index";

const meta = {
  title: "components/Skeleton",
  component: Component,
};

export default meta;

const CARD = require("@/assets/images/skeleton-card.svg");
const ROW = require("@/assets/images/skeleton-row.svg");

/** A file exported from Figma, recoloured, with the highlight inside its shapes. */
export const FromAFile = () => {
  const styles = useStyles();

  return <Component source={CARD} style={styles.card} />;
};

export const Static = () => {
  const styles = useStyles();

  return <Component source={CARD} animated={false} style={styles.card} />;
};

export const AListOfRows = () => {
  const styles = useStyles();

  return (
    <Card padded={false}>
      <View style={styles.rows}>
        {[0, 1, 2].map((row) => (
          <Component key={row} source={ROW} style={styles.row} />
        ))}
      </View>
    </Card>
  );
};

/** Children the caller draws — with no file to light up, they dim as a whole. */
export const FromChildren = () => {
  const theme = useTheme();
  const styles = useStyles();
  const fill = { backgroundColor: theme.colors[SKELETON_COLORS.base] };

  return (
    <Component>
      <View style={styles.drawn}>
        <View style={[styles.circle, fill]} />
        <View style={styles.lines}>
          <View style={[styles.line, fill]} />
          <View style={[styles.lineShort, fill]} />
        </View>
      </View>
    </Component>
  );
};

/** What it is actually for: standing in until the content arrives. */
export const StandingIn = () => {
  const theme = useTheme();
  const styles = useStyles();
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.stack}>
      <Button
        value={loading ? "Finish loading" : "Load again"}
        onPress={() => setLoading((current) => !current)}
      />
      {loading ? (
        <Component
          source={ROW}
          label="Loading the profile"
          style={styles.row}
        />
      ) : (
        <View style={styles.loaded}>
          <Text value="Ada Lovelace" />
          <Text
            value="ada@example.com"
            type="footnote"
            style={{ color: theme.colors.textSecondary }}
          />
        </View>
      )}
    </View>
  );
};

const useStyles = createStyles(({ spacing, units, radius }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x16,
  },
  card: {
    alignSelf: "stretch",
    width: "100%",
    aspectRatio: 480 / 352,
  },
  rows: {
    padding: spacing.x12,
    gap: spacing.x12,
  },
  row: {
    alignSelf: "stretch",
    width: "100%",
    aspectRatio: 480 / 64,
  },
  loaded: {
    gap: spacing.x2,
  },
  drawn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.x12,
    padding: spacing.x4,
  },
  circle: {
    borderRadius: radius.surface,
    width: units(48),
    height: units(48),
  },
  lines: {
    gap: spacing.x8,
  },
  line: {
    borderRadius: radius.indicator,
    width: units(200),
    height: units(16),
  },
  lineShort: {
    borderRadius: radius.indicator,
    width: units(120),
    height: units(16),
  },
}));
