import { View } from "react-native";

import Button from "@/components/button";
import If from "@/components/if";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { openDirections } from "@/features/maps";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { MapMarker } from "./types";

/**
 * The selected place, over the bottom of the map: its name, its subtitle,
 * and Directions — which hands off to the platform's own map app rather
 * than navigating here (see `openDirections`).
 *
 * Shared by both renderers: it's ordinary app UI, not part of the map
 * engine, so it looks and behaves the same everywhere.
 */
export default function MapCallout({
  marker,
  onHeight,
  testID,
}: {
  marker?: MapMarker;
  testID?: string;
  /** How much of the map the card covers, including its offset from the bottom. */
  onHeight?: (height: number) => void;
}) {
  const { t } = useLocale();
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();

  if (marker === undefined) return null;

  return (
    <View
      testID={testID}
      onLayout={(event) =>
        onHeight?.(event.nativeEvent.layout.height + spacing.x12)
      }
      style={[
        styles.callout,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.divider,
        },
      ]}
    >
      <View style={styles.text}>
        <Text value={marker.title} type="headline" numberOfLines={1} />
        <If condition={marker.subtitle}>
          <Text
            value={marker.subtitle ?? ""}
            type="footnote"
            numberOfLines={2}
            style={{ color: theme.colors.textSecondary }}
          />
        </If>
      </View>
      <Button
        value={t("map.directions")}
        type="primary"
        onPress={() => void openDirections(marker.coordinate, marker.title)}
      />
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, radius }) => ({
  callout: {
    position: "absolute",
    left: spacing.x12,
    right: spacing.x12,
    bottom: spacing.x12,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x12,
    padding: spacing.x12,
    borderWidth: spacing.x1,
    borderRadius: radius.surface,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.x2,
  },
}));
