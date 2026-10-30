import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { content, getSkill, RULES } from "../../data";
import { useT, type StringKey } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import type { SkillEffect } from "../../sim/types";
import { GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { palette } from "../../ui/palette";

import { CornerAction, Workspace } from "./workspace";

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

/** One cost of a skill: AP as a gold pip, mana as a drop, stamina a bolt. */
function Cost({
  icon,
  value,
  color,
}: {
  icon: string;
  value: number;
  color: string;
}) {
  return (
    <Row gap={4}>
      <View style={[styles.costPip, { borderColor: color }]}>
        <GIcon name={icon} size={9} color={color} />
      </View>
      <Label value={String(value)} type="subheadline" color={palette.ivory} />
    </Row>
  );
}

function Costs({ skillId }: { skillId: string }) {
  const skill = getSkill(skillId);
  return (
    <Row gap={12}>
      <Cost icon="circle" value={skill.ap} color={palette.gold} />
      {skill.cost.mana ? (
        <Cost icon="droplet" value={skill.cost.mana} color={palette.mana} />
      ) : null}
      {skill.cost.stamina ? (
        <Cost icon="bolt" value={skill.cost.stamina} color={palette.stamina} />
      ) : null}
    </Row>
  );
}

/**
 * Active skills, after the approved composition: the selected skill's
 * details at the top, the library of known and still-to-learn class skills
 * in the middle, and the six loadout slots in a row below it. Tap a skill,
 * then a slot; tap a filled slot with nothing picked to select it for
 * Remove. (Drag and drop can come on top of the same two taps.)
 */
export function SkillsPanel({
  save,
  onClose,
}: {
  save: SaveData;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const summary = useSkillSummary();
  const { hero } = save;
  // Wide screens: library on the left, loadout on the right.
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const [picked, setPicked] = useState<string | null>(
    hero.bar.find((id) => id) ?? hero.learned[0] ?? null,
  );
  const [slot, setSlot] = useState<number | null>(null);
  // A library tap arms that skill: the next slot tap places it.
  const [armed, setArmed] = useState(false);
  // Class skills not learned yet: shown locked with the level they open at.
  const locked = content.skills.filter(
    (s) =>
      s.classId === hero.classId &&
      s.learn &&
      !s.learn.hiddenBy &&
      !hero.learned.includes(s.id),
  );
  const focus = picked ? getSkill(picked) : null;
  return (
    <Workspace save={save} tab="skills" onClose={onClose}>
      <View style={wide ? styles.wide : styles.page}>
        <View style={styles.library}>
          {focus ? (
            <Row gap={14} style={styles.focus}>
              <View style={styles.bigIcon}>
                <GIcon name={focus.icon} size={40} color={palette.ivory} />
              </View>
              <View style={styles.flex}>
                <Label
                  value={tr(focus.name)}
                  type="title2"
                  display
                  color={palette.ivory}
                />
                <Costs skillId={focus.id} />
                <Label
                  value={summary(focus.id, hero.level)}
                  type="footnote"
                  color={palette.muted}
                />
              </View>
            </Row>
          ) : null}
          <View style={styles.rule} />
          <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
            {hero.learned.map((id) => {
              const s = getSkill(id);
              const on = picked === id && armed;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={tr(s.name)}
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setPicked(id);
                    setArmed(true);
                    setSlot(null);
                  }}
                  style={[styles.row, on && styles.rowOn]}
                >
                  <View
                    style={[styles.icon, styles.rowIcon, on && styles.iconOn]}
                  >
                    <GIcon name={s.icon} size={22} color={palette.ivory} />
                  </View>
                  <View style={styles.flex}>
                    <Label
                      value={tr(s.name)}
                      type="headline"
                      display
                      color={palette.ivory}
                    />
                    <Costs skillId={id} />
                  </View>
                  {hero.bar.includes(id) ? (
                    <GIcon name="check" size={14} color={palette.amber} />
                  ) : null}
                </Pressable>
              );
            })}
            {locked.map((s) => (
              <View key={s.id} style={[styles.row, styles.locked]}>
                <View style={[styles.icon, styles.rowIcon]}>
                  <GIcon name={s.icon} size={22} color={palette.faint} />
                </View>
                <Label
                  value={tr(s.name)}
                  type="headline"
                  display
                  color={palette.faint}
                  style={styles.flex}
                />
                <GIcon name="lock" size={13} color={palette.faint} />
                <Label
                  value={String(s.learn!.level)}
                  type="subheadline"
                  color={palette.faint}
                />
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={wide ? styles.loadoutSide : styles.loadoutBottom}>
          <View style={styles.rule} />
          <Row gap={8}>
            <Label
              value={t("skills.bar")}
              type="title3"
              display
              color={palette.ivory}
              style={styles.flex}
            />
            <GIcon name="hand-pointer" size={13} color={palette.muted} />
            <Label
              value={t("skills.assign")}
              type="caption1"
              color={palette.muted}
            />
          </Row>
          <Row gap={6} style={styles.loadout}>
            {Array.from({ length: RULES.skillSlots }, (_, i) => {
              const id = hero.bar[i] ?? null;
              return (
                <View key={i} style={styles.slotCell}>
                  <RoundButton
                    size={50}
                    accessibilityLabel={
                      id
                        ? `${t("skills.slot", { n: i + 1 })}: ${tr(getSkill(id).name)}`
                        : t("skills.slot", { n: i + 1 })
                    }
                    selected={slot === i}
                    onPress={() => {
                      if (armed && picked) {
                        actions.setBarSlot(i, picked);
                        setArmed(false);
                        setSlot(null);
                      } else if (id) {
                        setPicked(id);
                        setSlot(slot === i ? null : i);
                      }
                    }}
                  >
                    <GIcon
                      name={id ? getSkill(id).icon : "plus"}
                      size={id ? 20 : 16}
                      color={palette.ivory}
                    />
                  </RoundButton>
                  <Label
                    value={String(i + 1)}
                    type="caption1"
                    color={palette.muted}
                  />
                </View>
              );
            })}
          </Row>
          {slot !== null && hero.bar[slot] ? (
            <View style={styles.remove}>
              <CornerAction
                icon="minus"
                label={t("skills.remove")}
                onPress={() => {
                  actions.setBarSlot(slot, null);
                  setSlot(null);
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Workspace>
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
  page: { flex: 1, gap: 10 },
  wide: { flex: 1, flexDirection: "row", gap: 20 },
  library: { flex: 1, gap: 10 },
  loadoutBottom: { gap: 10 },
  loadoutSide: { width: 360, gap: 10, justifyContent: "flex-end" },
  rowIcon: { width: 50, height: 50, borderRadius: 25 },
  focus: { alignItems: "center" },
  bigIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: palette.amber,
    boxShadow: `0 0 14px 1px ${palette.amber}`,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3a1410",
  },
  rule: { height: 1, backgroundColor: palette.bronze, opacity: 0.6 },
  list: { gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowOn: {
    borderColor: palette.amber,
    backgroundColor: "rgba(240, 160, 64, 0.08)",
  },
  locked: { opacity: 0.7 },
  iconOn: { borderColor: palette.amber, borderWidth: 2 },
  costPip: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  loadout: { justifyContent: "space-between" },
  slotCell: { alignItems: "center", gap: 2 },
  remove: { alignSelf: "flex-end" },
});
