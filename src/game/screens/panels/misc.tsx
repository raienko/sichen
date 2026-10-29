import { StyleSheet, View } from "react-native";

import { useLocale } from "@/features/localization";

import { getClass, getEnemy, getQuest, getNpc, content } from "../../data";
import { useT, type StringKey } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { xpToNext } from "../../sim/hero";
import { questTarget } from "../../sim/quests";
import { heroStats, setCounts } from "../../sim/stats";
import { RARITIES, type StatKey } from "../../sim/types";
import { Bar, Divider, GButton, GIcon, Label, Row, Sheet } from "../../ui/kit";
import { palette, rarityColor } from "../../ui/palette";
import { startPackAttack } from "../../render/world-scene";
import { runtime } from "../../state/runtime";

const GROUPS: { title: StringKey; keys: StatKey[] }[] = [
  {
    title: "char.attributes",
    keys: ["str", "dex", "int", "maxHp", "maxMana", "maxStamina", "speed"],
  },
  {
    title: "char.offense",
    keys: [
      "accuracy",
      "incPhysical",
      "incMagical",
      "incChaos",
      "addedPhysical",
      "critChance",
      "critMulti",
    ],
  },
  {
    title: "char.defense",
    keys: [
      "evasion",
      "resPhysical",
      "resMagical",
      "resChaos",
      "hpRegen",
      "manaRegen",
      "staminaRegen",
    ],
  },
];

export function CharacterPanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const stats = heroStats(save.hero);
  const cls = getClass(save.hero.classId);
  const sets = [...setCounts(save.hero).entries()];
  return (
    <Sheet title={save.hero.name} icon={cls.icon} onClose={onClose}>
      <Label
        value={`${tr(cls.name)} · ${t("title.level", { level: save.hero.level })}`}
        type="subheadline"
        color={palette.gold}
      />
      <Bar
        value={save.hero.xp}
        max={xpToNext(save.hero.level)}
        color={palette.xp}
        showText
        height={14}
      />
      <View style={styles.columns}>
        {GROUPS.map((g) => (
          <View key={g.title} style={styles.column}>
            <Label value={t(g.title)} type="caption1" color={palette.muted} />
            {g.keys.map((key) => (
              <Row key={key} gap={6} style={styles.statRow}>
                <Label
                  value={t(`stat.${key}` as StringKey)}
                  type="caption1"
                  color={palette.text}
                  style={styles.flex}
                />
                <Label
                  value={String(Math.round(stats[key]))}
                  type="caption1"
                  color={palette.gold}
                />
              </Row>
            ))}
          </View>
        ))}
      </View>
      {sets.map(([id, count]) => {
        const set = content.sets.find((s) => s.id === id)!;
        return (
          <Label
            key={id}
            value={`${tr(set.name)} ${t("inv.set", { count, total: set.pieces.length })}`}
            type="caption1"
            color={rarityColor.set}
          />
        );
      })}
    </Sheet>
  );
}

export function QuestsPanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const entries = Object.entries(save.quests).map(([id, st]) => ({
    quest: getQuest(id),
    st,
  }));
  return (
    <Sheet title={t("menu.quests")} icon="scroll" onClose={onClose}>
      {entries.length === 0 ? (
        <Label value={t("quests.none")} type="footnote" color={palette.muted} />
      ) : null}
      {(["main", "side"] as const).map((kind) => {
        const list = entries.filter((e) => e.quest.kind === kind);
        if (list.length === 0) return null;
        return (
          <View key={kind} style={styles.group}>
            <Label
              value={t(`quests.${kind}`)}
              type="caption1"
              color={palette.muted}
            />
            {list.map(({ quest, st }) => (
              <View
                key={quest.id}
                style={[styles.quest, st.status === "done" && styles.done]}
              >
                <Row gap={8}>
                  <GIcon
                    name={st.status === "done" ? "check" : quest.icon}
                    color={st.status === "ready" ? palette.good : palette.gold}
                  />
                  <Label
                    value={tr(quest.name)}
                    type="subheadline"
                    style={styles.flex}
                  />
                  {quest.objective.type === "kill" ? (
                    <Label
                      value={`${st.progress}/${questTarget(quest)}`}
                      type="caption1"
                      color={palette.muted}
                    />
                  ) : null}
                </Row>
                <Label
                  value={
                    st.status === "ready"
                      ? t("quests.ready", { name: getNpc(quest.giver).name })
                      : tr(quest.goal)
                  }
                  type="caption1"
                  color={st.status === "ready" ? palette.good : palette.muted}
                />
              </View>
            ))}
          </View>
        );
      })}
    </Sheet>
  );
}

export function MenuPanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t } = useT();
  const { locale, setPreference } = useLocale();
  return (
    <Sheet title={t("menu.menu")} icon="bars" onClose={onClose}>
      <Label value={t("menu.language")} type="caption1" color={palette.muted} />
      <Row gap={8}>
        {(["uk", "en"] as const).map((code) => (
          <GButton
            key={code}
            label={code === "uk" ? "Українська" : "English"}
            tone={locale === code ? "primary" : "default"}
            compact
            onPress={() => setPreference(code)}
          />
        ))}
      </Row>
      <Label
        value={t("menu.lootFilter")}
        type="caption1"
        color={palette.muted}
      />
      <Row gap={6} wrap>
        {RARITIES.slice(0, 3).map((r) => (
          <GButton
            key={r}
            label={t(`rarity.${r}`)}
            compact
            tone={save.settings.lootFilter === r ? "primary" : "default"}
            onPress={() => actions.setLootFilter(r)}
          />
        ))}
      </Row>
      <GButton
        label={t("menu.tutorial")}
        icon="comment"
        compact
        tone={save.settings.tutorial ? "primary" : "default"}
        onPress={() => actions.setTutorial(!save.settings.tutorial)}
      />
      <Divider />
      <GButton
        label={t("menu.save")}
        icon="floppy-disk"
        onPress={() => {
          actions.saveGame();
          actions.toast("floppy-disk", "menu.saved", undefined, "good");
        }}
      />
      <GButton
        label={t("menu.quit")}
        icon="right-from-bracket"
        tone="danger"
        onPress={() => {
          actions.saveGame();
          actions.goToTitle();
        }}
      />
    </Sheet>
  );
}

/** Tapped a mob: what it is, and attack or look away. */
export function InspectPanel({
  save,
  packId,
  onClose,
}: {
  save: SaveData;
  packId: string;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const zone = content.zones.find((z) => z.id === save.world.zoneId)!;
  const pack = zone.packs.find((p) => p.id === packId);
  if (!pack) return null;
  return (
    <Sheet
      title={tr(getEnemy(pack.enemies[0]!.enemyId).name)}
      icon="eye"
      onClose={onClose}
    >
      {pack.enemies.map((e, i) => {
        const def = getEnemy(e.enemyId);
        const danger = e.level - save.hero.level;
        return (
          <Row key={i} gap={10}>
            <GIcon
              name={def.icon}
              size={20}
              color={def.boss ? "#b04ae8" : palette.text}
            />
            <Label
              value={tr(def.name)}
              type="subheadline"
              style={styles.flex}
            />
            <Label
              value={t("mob.level", { level: e.level })}
              type="caption1"
              color={
                danger >= 3
                  ? palette.bad
                  : danger <= -3
                    ? palette.faint
                    : palette.gold
              }
            />
          </Row>
        );
      })}
      {pack.aggressive ? (
        <Label
          value={t("mob.aggressive")}
          type="caption1"
          color={palette.bad}
        />
      ) : null}
      <Row gap={8}>
        <GButton
          label={t("mob.attack")}
          icon="slash"
          tone="danger"
          style={styles.flex}
          onPress={() => {
            onClose();
            const mob = runtime.mobs.get(pack.id);
            startPackAttack(pack.id, mob?.x ?? pack.x, mob?.z ?? pack.z);
          }}
        />
        <GButton label={t("menu.close")} tone="ghost" onPress={onClose} />
      </Row>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  column: { flex: 1, minWidth: 150, gap: 3 },
  statRow: { justifyContent: "space-between" },
  group: { gap: 6 },
  quest: {
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: palette.panelHi,
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
  done: { opacity: 0.5 },
});
