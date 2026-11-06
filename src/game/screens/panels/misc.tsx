import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { useLocale } from "@/features/localization";

import { getEnemy, getQuest, getNpc, content } from "../../data";
import { useT, type StringKey } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { questTarget } from "../../sim/quests";
import { heroStats, setCounts } from "../../sim/stats";
import { RARITIES, type StatKey } from "../../sim/types";
import { Glyph } from "../../ui/glyphs";
import {
  GButton,
  GIcon,
  GSelect,
  Label,
  RoundButton,
  Row,
  Sheet,
} from "../../ui/kit";
import {
  canFullscreen,
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  needsHomeScreen,
} from "../../ui/fullscreen";
import { fpsMeterSetting } from "../../ui/fps-meter";
import { LevelBadge } from "../../ui/level-badge";
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

export function CharacterStats({ save }: { save: SaveData }) {
  const { t, tr } = useT();
  const stats = heroStats(save.hero);
  const sets = [...setCounts(save.hero).entries()];
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.statsBody}>
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
    </ScrollView>
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
    <Sheet title={t("menu.quests")} icon="scroll" hideTitle onClose={onClose}>
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
                style={[
                  styles.quest,
                  st.status === "ready" && styles.questReady,
                  st.status === "done" && styles.done,
                ]}
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
  const { width, height } = useWindowDimensions();
  const shortLandscape = width > height && height < 500;
  const fpsMeter = fpsMeterSetting.useValue() === true;
  const destinations = [
    ["inventory", "bag-shopping", "menu.inventory"],
    ["skills", "book-open", "menu.skills"],
    ["character", "user", "menu.character"],
    ["tree", "sitemap", "menu.tree"],
    ["quests", "scroll", "menu.quests"],
  ] as const;
  return (
    <Sheet
      title={t("menu.menu")}
      headerIcon={
        <Glyph name="menu" size={20} color={palette.gold} weight={1.5} />
      }
      hideTitle
      onClose={onClose}
      fill
      footer={
        <Row style={styles.menuDestinations}>
          {destinations.map(([name, icon, key]) => (
            <RoundButton
              key={name}
              size={48}
              accessibilityLabel={t(key)}
              onPress={() => actions.openPanel({ name })}
              style={styles.menuDestination}
            >
              <GIcon name={icon} size={20} color={palette.ivory} />
            </RoundButton>
          ))}
        </Row>
      }
    >
      <Row gap={8} style={styles.menuActions}>
        {canFullscreen() ? (
          <GButton
            icon="expand"
            accessibilityLabel={t("menu.fullscreen")}
            compact
            style={styles.menuAction}
            onPress={() =>
              isFullscreen() ? exitFullscreen() : enterFullscreen()
            }
          />
        ) : null}
        <GButton
          icon="comment"
          accessibilityLabel={t("menu.tutorial")}
          compact
          tone={save.settings.tutorial ? "primary" : "default"}
          style={styles.menuAction}
          onPress={() => actions.setTutorial(!save.settings.tutorial)}
        />
        <GButton
          icon="gauge-high"
          accessibilityLabel={t("menu.fps")}
          compact
          tone={fpsMeter ? "primary" : "default"}
          style={styles.menuAction}
          onPress={() => fpsMeterSetting.setValue(!fpsMeter)}
        />
        <GButton
          icon="floppy-disk"
          accessibilityLabel={t("menu.save")}
          compact
          style={styles.menuAction}
          onPress={() => {
            actions.saveGame();
            actions.toast("floppy-disk", "menu.saved", undefined, "good");
          }}
        />
        <GButton
          icon="right-from-bracket"
          accessibilityLabel={t("menu.quit")}
          tone="danger"
          compact
          style={styles.menuAction}
          onPress={() => {
            actions.saveGame();
            actions.goToTitle();
          }}
        />
      </Row>
      {needsHomeScreen() ? (
        <Label
          value={t("menu.homeScreen")}
          type="caption1"
          color={palette.muted}
        />
      ) : null}
      <View
        style={[
          styles.menuSelects,
          shortLandscape && styles.menuSelectsLandscape,
        ]}
      >
        <GSelect
          label={t("menu.language")}
          value={locale}
          style={shortLandscape ? styles.menuSelectLandscape : undefined}
          onChange={(value) => {
            if (value === "uk" || value === "en") setPreference(value);
          }}
          options={[
            { value: "uk", label: "Українська" },
            { value: "en", label: "English" },
          ]}
        />
        <GSelect
          label={t("menu.lootFilter")}
          value={save.settings.lootFilter}
          style={shortLandscape ? styles.menuSelectLandscape : undefined}
          onChange={(value) => {
            const rarity = RARITIES.slice(0, 3).find((item) => item === value);
            if (rarity) actions.setLootFilter(rarity);
          }}
          options={RARITIES.slice(0, 3).map((rarity) => ({
            value: rarity,
            label: t(`rarity.${rarity}`),
          }))}
        />
      </View>
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
            <LevelBadge level={e.level} heroLevel={save.hero.level} />
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
  statsBody: { padding: 18, paddingBottom: 36, gap: 20 },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  column: { flexGrow: 1, flexBasis: 240, minWidth: 240, gap: 6 },
  statRow: { justifyContent: "space-between" },
  group: { gap: 6 },
  quest: {
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderStartWidth: 2,
    borderStartColor: palette.bronze,
    borderBottomWidth: 1,
    borderColor: palette.lineSoft,
  },
  questReady: { borderStartColor: palette.good },
  done: { opacity: 0.55, borderStartColor: palette.lineSoft },
  menuActions: { justifyContent: "space-between" },
  menuAction: { flex: 1, paddingHorizontal: 0 },
  menuSelects: { gap: 14 },
  menuSelectsLandscape: { flexDirection: "row" },
  menuSelectLandscape: { flex: 1 },
  menuDestinations: { justifyContent: "space-between" },
  menuDestination: { borderWidth: 0, backgroundColor: "transparent" },
});
