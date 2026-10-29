import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useT } from "../i18n";

import { Label } from "./kit";
import { levelTone, palette } from "./palette";

/**
 * A level number in a pill, coloured by danger next to the hero's level, or
 * gold for the hero and allies (no `heroLevel`). It grows with its text, so
 * three-digit levels fit.
 */
export function LevelBadge({
  level,
  heroLevel,
  style,
}: {
  level: number;
  heroLevel?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const own = heroLevel === undefined;
  return (
    <View
      accessibilityLabel={t("title.level", { level })}
      style={[
        styles.badge,
        {
          backgroundColor: own ? palette.panelHi : levelTone(level, heroLevel),
          borderColor: own ? palette.gold : palette.night,
        },
        style,
      ]}
    >
      <Label
        value={String(level)}
        type="caption2"
        numberOfLines={1}
        color={own ? palette.gold : palette.white}
        style={styles.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "700", textAlign: "center" },
});
