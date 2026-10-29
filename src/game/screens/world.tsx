import { useCallback } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getNpc, getZone } from "../data";
import { useT } from "../i18n";
import WorldScene from "../render/world-scene";
import * as actions from "../state/actions";
import { store, useGame, useSave, type Panel } from "../state/store";
import { xpToNext } from "../sim/hero";
import { questTarget, trackedQuests } from "../sim/quests";
import { heroStats } from "../sim/stats";
import { useKeyboardMovement } from "../ui/input";
import { HintCard } from "../ui/hint";
import { Bar, GButton, GIcon, Label, Row } from "../ui/kit";
import { Minimap } from "../ui/minimap";
import { palette } from "../ui/palette";

import { InventoryPanel } from "./panels/inventory";
import {
  CharacterPanel,
  InspectPanel,
  MenuPanel,
  QuestsPanel,
} from "./panels/misc";
import { InteractPanel, NpcPanel } from "./panels/npc";
import { SkillsPanel } from "./panels/skills";
import { TreePanel } from "./panels/tree";

const MENU: {
  panel: Panel["name"];
  icon: string;
  key: Parameters<ReturnType<typeof useT>["t"]>[0];
  hotkey: string;
}[] = [
  {
    panel: "inventory",
    icon: "box-open",
    key: "menu.inventory",
    hotkey: "KeyI",
  },
  { panel: "character", icon: "user", key: "menu.character", hotkey: "KeyC" },
  { panel: "skills", icon: "book-open", key: "menu.skills", hotkey: "KeyK" },
  { panel: "tree", icon: "sitemap", key: "menu.tree", hotkey: "KeyP" },
  { panel: "quests", icon: "scroll", key: "menu.quests", hotkey: "KeyJ" },
  { panel: "menu", icon: "bars", key: "menu.menu", hotkey: "Escape" },
];

function Hud() {
  const { t, tr } = useT();
  const save = useSave();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Portrait puts the menu buttons in one row along the bottom.
  const portrait = height > width;
  const stats = heroStats(save.hero);
  const { hero } = save;
  const tracked = trackedQuests(save.quests).slice(0, 3);
  const zone = getZone(save.world.zoneId);
  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        {
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          paddingStart: insets.left + 8,
          paddingEnd: insets.right + 8,
        },
      ]}
    >
      <View pointerEvents="box-none" style={styles.top}>
        <View style={styles.status}>
          <Row gap={6}>
            <Label
              value={hero.name}
              type="subheadline"
              color={palette.gold}
              numberOfLines={1}
              style={styles.flex}
            />
            <Label
              value={t("hud.level", { level: hero.level })}
              type="caption1"
            />
          </Row>
          <Bar
            value={hero.hp}
            max={stats.maxHp}
            color={palette.hp}
            height={13}
            showText
          />
          <Bar
            value={hero.mana}
            max={stats.maxMana}
            color={palette.mana}
            height={9}
          />
          <Bar
            value={hero.stamina}
            max={stats.maxStamina}
            color={palette.stamina}
            height={7}
          />
          <Bar
            value={hero.xp}
            max={xpToNext(hero.level)}
            color={palette.xp}
            height={4}
          />
          <Row gap={10}>
            <Row gap={4}>
              <GIcon name="coins" size={12} color={palette.gold} />
              <Label
                value={String(save.gold)}
                type="caption1"
                color={palette.gold}
              />
            </Row>
            <Row gap={4}>
              <GIcon name="flask" size={12} color={palette.hp} />
              <Label value={String(hero.potions.hp)} type="caption1" />
            </Row>
            <Row gap={4}>
              <GIcon name="vial" size={12} color={palette.mana} />
              <Label value={String(hero.potions.mana)} type="caption1" />
            </Row>
          </Row>
        </View>
        <View
          pointerEvents="box-none"
          style={[styles.topRight, portrait && styles.topRightPortrait]}
        >
          <Minimap save={save} size={portrait ? 104 : 120} />
          <Label value={tr(zone.name)} type="caption2" color={palette.muted} />
          {tracked.map((q) => {
            const st = save.quests[q.id]!;
            return (
              <View
                key={q.id}
                style={[styles.tracker, portrait && styles.trackerPortrait]}
              >
                <GIcon
                  name={st.status === "ready" ? "check" : q.icon}
                  size={12}
                  color={st.status === "ready" ? palette.good : palette.gold}
                />
                <Label
                  value={
                    st.status === "ready"
                      ? t("quests.ready", { name: getNpc(q.giver).name })
                      : q.objective.type === "kill"
                        ? `${tr(q.name)} ${st.progress}/${questTarget(q)}`
                        : tr(q.name)
                  }
                  type="caption2"
                  numberOfLines={2}
                  style={styles.flex}
                />
              </View>
            );
          })}
        </View>
      </View>
      <View
        pointerEvents="box-none"
        style={portrait ? styles.bottomPortrait : styles.bottom}
      >
        <View style={portrait ? styles.menuPortrait : styles.menu}>
          {MENU.map((m) => (
            <GButton
              key={m.panel}
              icon={m.icon}
              compact
              accessibilityLabel={t(m.key)}
              onPress={() => actions.openPanel({ name: m.panel } as Panel)}
              style={styles.menuButton}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function Toasts() {
  const { t } = useT();
  const toasts = useGame((s) => s.toasts);
  const { width, height } = useWindowDimensions();
  // In portrait, below the top HUD so they don't cover the status card.
  return (
    <View
      pointerEvents="none"
      style={[styles.toasts, height > width && styles.toastsPortrait]}
    >
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[
            styles.toast,
            toast.tone === "good" && styles.toastGood,
            toast.tone === "bad" && styles.toastBad,
          ]}
        >
          <GIcon name={toast.icon} size={13} color={palette.gold} />
          <Label value={t(toast.key, toast.vars)} type="footnote" />
        </View>
      ))}
    </View>
  );
}

function Panels() {
  const save = useSave();
  const panel = useGame((s) => s.panel);
  const close = () => actions.openPanel(null);
  if (!panel) return null;
  switch (panel.name) {
    case "inventory":
      return <InventoryPanel save={save} onClose={close} />;
    case "character":
      return <CharacterPanel save={save} onClose={close} />;
    case "skills":
      return <SkillsPanel save={save} onClose={close} />;
    case "tree":
      return <TreePanel save={save} onClose={close} />;
    case "quests":
      return <QuestsPanel save={save} onClose={close} />;
    case "menu":
      return <MenuPanel save={save} onClose={close} />;
    case "npc":
      return <NpcPanel save={save} npcId={panel.npcId} onClose={close} />;
    case "interact":
      return (
        <InteractPanel
          save={save}
          interactableId={panel.interactableId}
          onClose={close}
        />
      );
    case "inspect":
      return <InspectPanel save={save} packId={panel.packId} onClose={close} />;
  }
}

export default function WorldScreen() {
  const save = useSave();
  const version = useGame((s) => s.worldVersion);
  const onKey = useCallback((code: string) => {
    const entry = MENU.find((m) => m.hotkey === code);
    if (!entry) return;
    const current = store.get().panel;
    actions.openPanel(
      current?.name === entry.panel || (code === "Escape" && current)
        ? null
        : ({ name: entry.panel } as Panel),
    );
  }, []);
  useKeyboardMovement(onKey);
  return (
    <View style={styles.page}>
      <WorldScene save={save} version={version} />
      <Hud />
      <HintCard where="world" />
      <Panels />
      <Toasts />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.night },
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  status: {
    width: 220,
    flexShrink: 1,
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(15, 12, 9, 0.72)",
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
  topRight: { alignItems: "flex-end", gap: 4, width: 170 },
  topRightPortrait: { width: 112, marginStart: 8 },
  tracker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 170,
    padding: 5,
    borderRadius: 6,
    backgroundColor: "rgba(15, 12, 9, 0.72)",
  },
  trackerPortrait: { width: 112 },
  bottom: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  // One row in the bottom corner; the stick floats under the finger now.
  menu: { flexDirection: "row", gap: 6 },
  bottomPortrait: { flex: 1, justifyContent: "flex-end" },
  menuPortrait: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-start",
  },
  menuButton: { minWidth: 40, minHeight: 40 },
  toasts: {
    position: "absolute",
    top: 12,
    start: 0,
    end: 0,
    alignItems: "center",
    gap: 6,
  },
  toastsPortrait: { top: "22%" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.overlay,
    borderWidth: 1,
    borderColor: palette.line,
  },
  toastGood: { borderColor: palette.good },
  toastBad: { borderColor: palette.bad },
});
