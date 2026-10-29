import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { getSkill, RULES } from "../../data";
import { useT, type StringKey } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import type { SkillEffect } from "../../sim/types";
import { GButton, GIcon, Label, Row, Sheet } from "../../ui/kit";
import { palette } from "../../ui/palette";

/** "2 AP · 6 stamina · melee physical 3-5 + 130% weapon · stun 35%" */
export function useSkillSummary() {
  const { t } = useT();
  return (skillId: string, level: number): string => {
    const skill = getSkill(skillId);
    const parts: string[] = [t("skill.ap", { ap: skill.ap })];
    if (skill.cost.mana) parts.push(`${skill.cost.mana} ${t("stat.maxMana")}`);
    if (skill.cost.stamina)
      parts.push(`${skill.cost.stamina} ${t("stat.maxStamina")}`);
    const boost = 1 + ((skill.perLevel ?? 0) * (level - 1)) / 100;
    for (const e of skill.effects as SkillEffect[]) {
      if (e.type === "damage") {
        const min = Math.round(e.base[0] * boost);
        const max = Math.round(e.base[1] * boost);
        const weapon = e.weapon > 0 ? ` +${Math.round(e.weapon * 100)}%` : "";
        const hits = e.hits && e.hits > 1 ? ` ×${e.hits}` : "";
        parts.push(
          `${t(`delivery.${e.delivery}` as StringKey)} · ${t(`type.${e.damageType}` as StringKey)} ${min}-${max}${weapon}${hits}`,
        );
      } else if (e.type === "status") {
        parts.push(`${t(`status.${e.status}` as StringKey)} ${e.chance}%`);
      } else if (e.type === "heal") {
        parts.push(
          `+${e.percent ? `${e.percent}%` : e.amount} ${t("stat.maxHp")}`,
        );
      } else if (e.type === "buff") {
        parts.push(
          Object.entries(e.mods)
            .map(([k, v]) => `+${v} ${t(`stat.${k}` as StringKey)}`)
            .join(", "),
        );
      }
    }
    return parts.join(" · ");
  };
}

export function SkillLine({
  skillId,
  level,
}: {
  skillId: string;
  level: number;
}) {
  const { tr } = useT();
  const summary = useSkillSummary();
  const skill = getSkill(skillId);
  return (
    <Row gap={10} style={styles.flex}>
      <View style={styles.icon}>
        <GIcon name={skill.icon} size={18} color={palette.gold} />
      </View>
      <View style={styles.flex}>
        <Label value={tr(skill.name)} type="subheadline" />
        <Label
          value={summary(skillId, level)}
          type="caption2"
          color={palette.muted}
        />
      </View>
    </Row>
  );
}

export function SkillsPanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const [picked, setPicked] = useState<string | null>(null);
  const { hero } = save;
  return (
    <Sheet title={t("menu.skills")} icon="book-open" onClose={onClose}>
      <Label value={t("skills.bar")} type="caption1" color={palette.muted} />
      <Row gap={6} wrap>
        {Array.from({ length: RULES.skillSlots }, (_, i) => {
          const id = hero.bar[i] ?? null;
          return (
            <GButton
              key={i}
              icon={id ? getSkill(id).icon : "plus"}
              label={id ? tr(getSkill(id).name) : String(i + 1)}
              compact
              tone={picked ? "primary" : "default"}
              onPress={() => {
                if (picked) {
                  actions.setBarSlot(i, picked);
                  setPicked(null);
                } else if (id) {
                  actions.setBarSlot(i, null);
                }
              }}
            />
          );
        })}
      </Row>
      <Label value={t("skills.assign")} type="caption2" color={palette.faint} />
      <Label
        value={t("skills.learned")}
        type="caption1"
        color={palette.muted}
      />
      {hero.learned.map((id) => (
        <View key={id} style={[styles.learned, picked === id && styles.picked]}>
          <SkillLine skillId={id} level={hero.level} />
          <GButton
            icon={hero.bar.includes(id) ? "check" : "arrow-up"}
            compact
            tone={picked === id ? "primary" : "ghost"}
            accessibilityLabel={tr(getSkill(id).name)}
            onPress={() => setPicked(picked === id ? null : id)}
          />
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
    borderWidth: 1,
    borderColor: palette.line,
  },
  learned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
    borderRadius: 8,
  },
  picked: { backgroundColor: palette.panelHi },
});
