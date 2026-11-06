import { useCallback, useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getClass, getEnemy, getNpc, getZone } from "../data";
import { useT } from "../i18n";
import FacePortrait from "../render/face-portrait";
import WorldScene from "../render/world-scene";
import * as actions from "../state/actions";
import { runtime } from "../state/runtime";
import type { SaveData } from "../state/save";
import { store, useGame, useSave, type Panel } from "../state/store";
import { heroStats } from "../sim/stats";
import { useKeyboardMovement } from "../ui/input";
import { HintCard } from "../ui/hint";
import { Glyph } from "../ui/glyphs";
import { ActorResourceHud } from "../ui/actor-resource-hud";
import { GIcon, Label, RoundButton, Row } from "../ui/kit";
import { Minimap } from "../ui/minimap";
import { palette } from "../ui/palette";

import { CharacterScreen } from "./panels/character";
import { InspectPanel, MenuPanel, QuestsPanel } from "./panels/misc";
import { InteractPanel, NpcPanel } from "./panels/npc";
import { SkillsPanel } from "./panels/skills";
import { TreePanel } from "./panels/tree";

/** The panels the HUD opens, with their keyboard shortcuts. */
const MENU: {
  panel: Panel["name"];
  icon: string;
  key: Parameters<ReturnType<typeof useT>["t"]>[0];
  hotkey: string;
}[] = [
  {
    panel: "inventory",
    icon: "bag-shopping",
    key: "menu.inventory",
    hotkey: "KeyI",
  },
  { panel: "character", icon: "user", key: "menu.character", hotkey: "KeyC" },
  { panel: "skills", icon: "book-open", key: "menu.skills", hotkey: "KeyK" },
  { panel: "tree", icon: "sitemap", key: "menu.tree", hotkey: "KeyP" },
  { panel: "quests", icon: "scroll", key: "menu.quests", hotkey: "KeyJ" },
  { panel: "menu", icon: "bars", key: "menu.menu", hotkey: "Escape" },
];
/** How near, in tiles, a person, a thing or a pack offers the context action. */
const TALK_RANGE = 2.5;
const INSPECT_RANGE = 5;

type Nearby =
  | { kind: "npc"; id: string; name: string }
  | { kind: "thing"; id: string; name: string }
  | { kind: "pack"; id: string; name: string };

/**
 * The nearest thing the context button acts on: a person or a shrine in
 * talking range, else a pack in sight. Polled, since the hero moves in the
 * scene's frame loop, not in React state.
 */
function useNearby(save: SaveData): Nearby | null {
  const { tr } = useT();
  const [near, setNear] = useState<Nearby | null>(null);
  useEffect(() => {
    const zone = getZone(save.world.zoneId);
    const nearest = (list: { d: number; at: Nearby }[], range: number) =>
      list.filter((c) => c.d <= range).sort((a, b) => a.d - b.d)[0]?.at ?? null;
    const find = (): Nearby | null => {
      const d = (x: number, z: number) =>
        Math.hypot(x - runtime.x, z - runtime.z);
      const talk = nearest(
        [
          ...zone.npcs.map((n) => ({
            d: d(n.x, n.z),
            at: {
              kind: "npc" as const,
              id: n.npcId,
              name: tr(getNpc(n.npcId).name),
            },
          })),
          ...zone.interactables.map((it) => ({
            d: d(it.x, it.z),
            at: { kind: "thing" as const, id: it.id, name: tr(it.name) },
          })),
        ],
        TALK_RANGE,
      );
      if (talk) return talk;
      const packs = zone.packs
        .filter((p) => !p.quest && !(p.id in save.world.cleared))
        .map((p) => {
          const mob = runtime.mobs.get(p.id) ?? { x: p.x, z: p.z };
          const lead = getEnemy(p.enemies[0]!.enemyId);
          return {
            d: d(mob.x, mob.z),
            at: {
              kind: "pack" as const,
              id: p.id,
              name: `${tr(lead.name)} ${p.enemies.map((e) => e.level).join(" · ")}`,
            },
          };
        });
      return nearest(packs, INSPECT_RANGE);
    };
    const tick = () =>
      setNear((prev) => {
        const next = find();
        return prev?.id === next?.id && prev?.name === next?.name ? prev : next;
      });
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [save.world.zoneId, save.world.cleared, tr]);
  return near;
}

/** Lower right: the context action and one entry to the remaining panels. */
function ActionArc({ save }: { save: SaveData }) {
  const { t } = useT();
  const near = useNearby(save);
  const act = () => {
    if (!near) return;
    if (near.kind === "npc") actions.openPanel({ name: "npc", npcId: near.id });
    else if (near.kind === "thing") actions.examine(near.id);
    else actions.openPanel({ name: "inspect", packId: near.id });
  };
  const label = !near
    ? t("hud.nothingNear")
    : near.kind === "npc"
      ? t("hud.talk", { name: near.name })
      : near.kind === "thing"
        ? t("hud.examine", { name: near.name })
        : t("hud.inspect", { name: near.name });
  return (
    <Row gap={14} style={styles.footerActions}>
      <RoundButton
        size={52}
        accessibilityLabel={label}
        disabled={!near}
        onPress={act}
        style={styles.footerButton}
      >
        {near?.kind === "pack" ? (
          <Glyph name="eye" size={31} color={palette.ivory} />
        ) : (
          <GIcon name="hand" size={25} color={palette.ivory} />
        )}
      </RoundButton>
      <View style={styles.footerDivider} />
      <RoundButton
        size={52}
        accessibilityLabel={t("menu.menu")}
        onPress={() => actions.openPanel({ name: "menu" })}
        style={styles.footerButton}
      >
        <Glyph name="menu" size={31} color={palette.ivory} weight={1.5} />
      </RoundButton>
    </Row>
  );
}

/** Upper left: the same portrait pendant used for the battle hero. */
function HeroStatus({ save }: { save: SaveData }) {
  const { hero } = save;
  const stats = heroStats(hero);
  return (
    <ActorResourceHud
      icon={getClass(hero.classId).icon}
      portrait={
        <FacePortrait
          subject={{
            hero: {
              look: hero.look,
              classId: hero.classId,
              helmet: !!hero.equipment.helmet,
            },
          }}
        />
      }
      level={hero.level}
      hp={{ value: hero.hp, max: stats.maxHp }}
      mana={{ value: hero.mana, max: stats.maxMana }}
      stamina={{ value: hero.stamina, max: stats.maxStamina }}
    />
  );
}

function Hud() {
  const { t, tr } = useT();
  const save = useSave();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
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
        <HeroStatus save={save} />
        <View pointerEvents="box-none" style={styles.topRight}>
          <View
            style={styles.minimap}
            accessible
            accessibilityLabel={`${tr(zone.name)}. ${t(`danger.${zone.danger}`)}`}
          >
            <Minimap save={save} size={portrait ? 104 : 120} />
          </View>
        </View>
      </View>
      <View pointerEvents="box-none" style={styles.bottom}>
        <ActionArc save={save} />
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
      return <CharacterScreen save={save} onClose={close} />;
    case "character":
      return <CharacterScreen save={save} onClose={close} showStats />;
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
  const workspace = useGame(
    (s) =>
      s.panel !== null &&
      ["inventory", "character", "skills", "tree"].includes(s.panel.name),
  );
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
      {/* The workspace screens bring their own header and navigation. */}
      {workspace ? null : <Hud />}
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
    gap: 8,
  },
  topRight: { alignItems: "flex-end", gap: 4 },
  minimap: {
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: palette.bronze,
    overflow: "hidden",
  },
  bottom: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  footerActions: { alignItems: "center", padding: 3 },
  footerButton: { borderWidth: 0, backgroundColor: "transparent" },
  footerDivider: { width: 1, height: 30, backgroundColor: palette.bronze },
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
    borderRadius: 4,
    backgroundColor: "rgba(12, 17, 19, 0.9)",
    borderStartWidth: 2,
    borderColor: palette.bronze,
  },
  toastGood: { borderColor: palette.good },
  toastBad: { borderColor: palette.bad },
});
