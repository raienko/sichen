import { useWindowDimensions, View } from "react-native";

import Text from "@/components/text";
import { createStyles, useResponsive } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/**
 * What `useResponsive()` currently resolves to. Resize the window (or
 * rotate / unfold a device) and every row here moves at once — which is
 * also the clearest way to see that the whole styleguide is derived from
 * one measurement rather than a pile of independent constants.
 */
export default function ResponsiveSection() {
  const { width, height } = useWindowDimensions();
  const { units, breakpoint, spacing, radius, sizes } = useResponsive();
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Readout
        label="window"
        value={`${Math.round(width)} × ${Math.round(height)}`}
      />
      <Readout label="breakpoint" value={breakpoint} />
      <Readout label="units(16)" value={String(units(16))} />

      <Text
        value="spacing"
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.bars}>
        {(["x4", "x8", "x16", "x24", "x32", "x40"] as const).map((token) => (
          <View key={token} style={styles.bar}>
            <View
              style={{
                width: spacing[token],
                height: spacing.x8,
                borderRadius: radius.indicator,
                backgroundColor: theme.colors.backgroundElementSelected,
              }}
            />
            <Text value={`${token} · ${spacing[token]}`} type="caption2" />
          </View>
        ))}
      </View>

      <Readout
        label="sizes.elementHeightMd"
        value={String(sizes.elementHeightMd)}
      />
      <Readout
        label="sizes.contentMaxWidth"
        value={String(sizes.contentMaxWidth)}
      />
      <Readout label="radius.surface" value={String(radius.surface)} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  bars: {
    gap: spacing.x4,
  },
  bar: {
    gap: spacing.x2,
  },
}));
