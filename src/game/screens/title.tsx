import { useEffect } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import env from "@/constants/env";

import { getClass, getZone } from "../data";
import { useT } from "../i18n";
import * as actions from "../state/actions";
import { useGame } from "../state/store";
import { GButton, GIcon, Label } from "../ui/kit";
import { palette } from "../ui/palette";

/** Three live character places around the fire; the forest art has no UI baked in. */
export default function TitleScreen() {
  const { t, tr } = useT();
  const slots = useGame((s) => s.slots);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const portrait = height > width;
  const spotWidth = portrait ? 116 : 172;
  const positions = portrait
    ? [
        { x: 0.18, y: 0.45 },
        { x: 0.82, y: 0.45 },
        { x: 0.5, y: 0.65 },
      ]
    : [
        { x: 0.39, y: 0.51 },
        { x: 0.61, y: 0.51 },
        { x: 0.5, y: 0.72 },
      ];
  useEffect(() => actions.refreshSlots(), []);

  return (
    <View style={styles.page}>
      <Image
        source={
          portrait
            ? require("../assets/campfire-portrait.png")
            : require("../assets/campfire-landscape.png")
        }
        resizeMode="cover"
        style={styles.sceneImage}
        accessibilityIgnoresInvertColors
      />
      <View style={[styles.titleBlock, { top: insets.top + 18 }]}>
        <Label
          value={env.appName}
          type="largeTitle"
          color={palette.ivory}
          style={styles.title}
        />
      </View>
      {slots.map((slot, i) => {
        const spot = positions[i]!;
        return (
          <View
            key={i}
            style={[
              styles.spot,
              {
                width: spotWidth,
                left: `${spot.x * 100}%`,
                top: `${spot.y * 100}%`,
                marginLeft: -spotWidth / 2,
                marginTop: slot ? -52 : -35,
              },
            ]}
          >
            {slot ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t("title.continue")}: ${slot.hero.name}`}
                  onPress={() => actions.continueGame(i)}
                  style={({ pressed }) => [
                    styles.occupied,
                    { width: spotWidth },
                    pressed && styles.pressed,
                  ]}
                >
                  <GIcon
                    name={getClass(slot.hero.classId).icon}
                    size={24}
                    color={palette.ivory}
                  />
                  <Label
                    value={slot.hero.name}
                    type="headline"
                    color={palette.ivory}
                    numberOfLines={portrait ? 2 : 1}
                    style={[
                      styles.heroName,
                      portrait && styles.heroNamePortrait,
                    ]}
                  />
                  <Label
                    value={`${t("title.level", { level: slot.hero.level })} · ${tr(getZone(slot.world.zoneId).name)}`}
                    type="caption2"
                    color={palette.muted}
                    numberOfLines={1}
                    style={styles.heroMeta}
                  />
                </Pressable>
                <GButton
                  icon="trash"
                  tone="ghost"
                  compact
                  accessibilityLabel={`${t("title.delete")}: ${slot.hero.name}`}
                  onPress={() => actions.deleteSlot(i)}
                  style={styles.delete}
                />
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("title.new")}
                onPress={() => actions.goToCreate(i)}
                style={({ pressed }) => [
                  styles.empty,
                  pressed && styles.pressed,
                ]}
              >
                <Label
                  value="+"
                  type="largeTitle"
                  color={palette.ivory}
                  style={styles.plus}
                />
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0a1013" },
  sceneImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  titleBlock: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(7, 13, 16, 0.35)",
  },
  title: { letterSpacing: 3, textShadowColor: "#030709", textShadowRadius: 14 },
  spot: { position: "absolute", alignItems: "center" },
  empty: {
    minWidth: 82,
    minHeight: 82,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 12, 13, 0.35)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.bronze,
  },
  plus: { fontSize: 36, lineHeight: 36, marginTop: -5 },
  occupied: {
    minHeight: 86,
    padding: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "rgba(8, 12, 13, 0.58)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.bronze,
  },
  heroName: {
    width: "100%",
    fontSize: 21,
    lineHeight: 25,
    textAlign: "center",
  },
  heroNamePortrait: { fontSize: 16, lineHeight: 19 },
  heroMeta: { textAlign: "center" },
  delete: { marginTop: 2 },
  pressed: { opacity: 0.7 },
});
