import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import env from "@/constants/env";

import { getClass, getZone } from "../data";
import { useT } from "../i18n";
import * as actions from "../state/actions";
import { useGame } from "../state/store";
import { GButton, GIcon, Label, Row } from "../ui/kit";
import { palette } from "../ui/palette";

export default function TitleScreen() {
  const { t, tr } = useT();
  const slots = useGame((s) => s.slots);
  useEffect(() => actions.refreshSlots(), []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.titleBlock}>
        <GIcon name="horse-head" size={34} color={palette.gold} />
        <Label
          value={env.appName}
          type="largeTitle"
          color={palette.gold}
          style={styles.title}
        />
        <View style={styles.ornament} />
        <Label
          value={t("title.tagline")}
          type="subheadline"
          color={palette.muted}
        />
      </View>
      <View style={styles.slots}>
        {slots.map((slot, i) => (
          <View key={i} style={styles.slot}>
            {slot ? (
              <>
                <Row gap={10}>
                  <GIcon
                    name={getClass(slot.hero.classId).icon}
                    size={22}
                    color={palette.gold}
                  />
                  <View style={styles.flex}>
                    <Label value={slot.hero.name} type="headline" />
                    <Label
                      value={`${tr(getClass(slot.hero.classId).name)} · ${t("title.level", { level: slot.hero.level })} · ${tr(getZone(slot.world.zoneId).name)}`}
                      type="caption1"
                      color={palette.muted}
                    />
                  </View>
                </Row>
                <Row gap={8}>
                  <GButton
                    label={t("title.continue")}
                    icon="play"
                    tone="primary"
                    style={styles.flex}
                    onPress={() => actions.continueGame(i)}
                  />
                  <GButton
                    icon="trash"
                    tone="ghost"
                    accessibilityLabel={t("title.delete")}
                    onPress={() => actions.deleteSlot(i)}
                  />
                </Row>
              </>
            ) : (
              <>
                <Label
                  value={t("title.empty")}
                  type="callout"
                  color={palette.faint}
                />
                <GButton
                  label={t("title.new")}
                  icon="plus"
                  onPress={() => actions.goToCreate(i)}
                />
              </>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.bg },
  content: {
    padding: 20,
    gap: 24,
    alignItems: "center",
    minHeight: "100%",
    justifyContent: "center",
  },
  titleBlock: { alignItems: "center", gap: 8 },
  title: { letterSpacing: 4 },
  ornament: {
    width: 180,
    height: 4,
    backgroundColor: palette.embroidery,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.gold,
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  slot: {
    width: 260,
    minHeight: 120,
    gap: 12,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 10,
  },
  flex: { flex: 1 },
});
