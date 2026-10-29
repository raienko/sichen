import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useTypography } from "@/features/responsive";

import { getSkill, RULES } from "../data";
import { useT, type StringKey } from "../i18n";
import * as actions from "../state/actions";
import { useSave, type BattleSession } from "../state/store";
import {
  apFor,
  fleeChance,
  hasStatus,
  planCost,
  type Combatant,
} from "../sim/battle";
import { battleActions } from "../sim/hero";
import { DELIVERIES, type Skill, type StatusKind } from "../sim/types";
import { Bar, GIcon, Label, Row } from "../ui/kit";
import { LevelBadge } from "../ui/level-badge";
import { palette } from "../ui/palette";

/**
 * The battle HUD in Taern's shape: the selected ally's and foe's panels at
 * the sides, five action slots between them, and a popup that lists every
 * action by tab when a slot is tapped. It overlays a full-screen scene.
 */

// ---------------------------------------------------------------- panels

const STATUS_ICON: Record<StatusKind, string> = {
  burn: "fire",
  freeze: "snowflake",
  stun: "star",
};

/** An ally's or a foe's portrait, name, level and resource bars. */
export function ActorPanel({
  actor,
  heroLevel,
  align = "start",
}: {
  actor: Combatant | undefined;
  /** For a foe: colours its level badge by danger. */
  heroLevel?: number;
  align?: "start" | "end";
}) {
  const { t, tr } = useT();
  // Bars that print their numbers are as tall as that text, at any scale.
  const textBar = useTypography().caption2.lineHeight + 2;
  if (!actor) {
    return (
      <View style={[styles.panel, styles.panelEmpty]}>
        <Label
          value={t("battle.noTarget")}
          type="caption2"
          color={palette.faint}
          numberOfLines={2}
        />
      </View>
    );
  }
  const foe = actor.side === 1;
  const ring = foe ? (actor.boss ? "#b04ae8" : palette.bad) : palette.gold;
  const portrait = (
    <View>
      <View style={[styles.panelPortrait, { borderColor: ring }]}>
        <GIcon
          name={actor.hp > 0 ? actor.icon : "skull"}
          size={22}
          color={ring}
        />
      </View>
      <LevelBadge
        level={actor.level}
        heroLevel={foe ? heroLevel : undefined}
        style={styles.panelLevel}
      />
    </View>
  );
  return (
    <View
      style={[styles.panel, align === "end" && styles.panelEnd]}
      accessibilityLabel={tr(actor.name)}
    >
      {portrait}
      <View style={styles.panelBody}>
        <Label
          value={tr(actor.name)}
          type="caption1"
          color={palette.text}
          numberOfLines={1}
        />
        <Bar
          value={actor.hp}
          max={actor.base.maxHp}
          color={palette.hp}
          height={textBar}
          showText
        />
        {actor.base.maxMana > 0 ? (
          <Bar
            value={actor.mana}
            max={actor.base.maxMana}
            color={palette.mana}
            height={foe ? 6 : textBar}
            showText={!foe}
          />
        ) : null}
        {!foe ? (
          <Bar
            value={actor.stamina}
            max={actor.base.maxStamina}
            color={palette.stamina}
            height={textBar}
            showText
          />
        ) : null}
        {actor.statuses.length > 0 ? (
          <Row gap={4}>
            {actor.statuses.map((s) => (
              <GIcon
                key={s.kind}
                name={STATUS_ICON[s.kind]}
                size={11}
                color={palette.status[s.kind]}
              />
            ))}
          </Row>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- slots

/** Mana, stamina, potions and AP left once every slot but `except` is paid. */
function resourcesLeft(battle: BattleSession, except?: number) {
  const hero = battle.state.actors.find((a) => a.id === "hero")!;
  const attacks = battle.plan.attacks.filter((_, i) => i !== except);
  let mana = hero.mana;
  let stamina = hero.stamina;
  const potions = { ...hero.potions };
  for (const a of attacks) {
    const s = getSkill(a.skillId);
    mana -= s.cost.mana ?? 0;
    stamina -= s.cost.stamina ?? 0;
    if (s.potion) potions[s.potion] -= 1;
  }
  const ap = apFor(hero) - planCost({ ...battle.plan, attacks });
  return { hero, mana, stamina, potions, ap };
}

const DELIVERY_ICON = {
  melee: "hand-fist",
  ranged: "crosshairs",
  mental: "brain",
} as const;

/** AP left, the three defence toggles, and the five action slots. */
export function ActionSlots({
  battle,
  size,
  onOpen,
}: {
  battle: BattleSession;
  /** Diameter of a slot. */
  size: number;
  onOpen: (index: number) => void;
}) {
  const { t, tr } = useT();
  const planning = battle.phase === "planning";
  const { hero, ap } = resourcesLeft(battle);
  const stunned = hasStatus(hero, "stun");
  const frozen = hasStatus(hero, "freeze");
  const total = apFor(hero);
  return (
    <View style={styles.slotsWrap}>
      <Row gap={6} style={styles.slotsTop}>
        <Label
          value={t("battle.ap", { left: ap, total })}
          type="caption1"
          color={ap > 0 ? palette.gold : palette.faint}
        />
        {DELIVERIES.map((kind) => {
          const on = battle.plan.defense[kind] > 0;
          return (
            <Pressable
              key={kind}
              accessibilityLabel={`${t("battle.defense")}: ${t(`delivery.${kind}`)}`}
              accessibilityState={{ selected: on }}
              disabled={!planning || stunned || (!on && ap <= 0)}
              onPress={() => actions.toggleDefense(kind)}
              style={[
                styles.defense,
                on && {
                  borderColor: palette.delivery[kind],
                  backgroundColor: "rgba(42, 34, 27, 0.95)",
                },
                !on && planning && ap <= 0 && styles.off,
              ]}
            >
              <GIcon
                name="shield-halved"
                size={11}
                color={on ? palette.delivery[kind] : palette.faint}
              />
              <GIcon
                name={DELIVERY_ICON[kind]}
                size={12}
                color={on ? palette.delivery[kind] : palette.muted}
              />
            </Pressable>
          );
        })}
      </Row>
      {stunned || frozen ? (
        <Label
          value={stunned ? t("battle.stunned") : t("battle.frozen")}
          type="caption1"
          color={stunned ? palette.status.stun : palette.status.freeze}
        />
      ) : null}
      <Row gap={Math.round(size * 0.14)}>
        {Array.from({ length: RULES.attackSlots }, (_, i) => {
          const action = battle.plan.attacks[i];
          const skill = action ? getSkill(action.skillId) : null;
          return (
            <Pressable
              key={i}
              accessibilityLabel={
                skill
                  ? `${t("battle.slot", { n: i + 1 })}: ${tr(skill.name)}`
                  : t("battle.slot", { n: i + 1 })
              }
              disabled={!planning || stunned}
              onPress={() => onOpen(i)}
              style={({ pressed }) => [
                styles.slot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderColor: skill ? palette.gold : palette.line,
                  opacity: pressed ? 0.7 : !planning || stunned ? 0.6 : 1,
                },
              ]}
            >
              {skill ? (
                <>
                  <GIcon
                    name={skill.icon}
                    size={size * 0.42}
                    color={skillColor(skill)}
                  />
                  <View style={styles.slotCost}>
                    <Label
                      value={String(skill.ap)}
                      type="caption2"
                      color={palette.night}
                    />
                  </View>
                </>
              ) : (
                <GIcon name="plus" size={size * 0.3} color={palette.faint} />
              )}
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}

function skillColor(skill: Skill): string {
  if (skill.potion === "hp") return palette.hp;
  if (skill.potion === "mana") return palette.mana;
  return palette.text;
}

// ---------------------------------------------------------------- picker

type Tab = "attacks" | "skills" | "items" | "other";
const TABS: readonly Tab[] = ["attacks", "skills", "items", "other"];

function tabOf(skill: Skill): Tab {
  if (skill.potion) return "items";
  if (skill.flee || skill.id === "retreat") return "other";
  if (skill.effects.some((e) => e.type === "damage")) return "attacks";
  return "skills";
}

/**
 * Every action the hero can put in slot `index`, by tab. An enemy-targeted
 * action goes at `targetId`, the foe selected in the scene.
 */
export function ActionPicker({
  battle,
  index,
  targetId,
  onClose,
}: {
  battle: BattleSession;
  index: number;
  targetId: string | undefined;
  onClose: () => void;
}) {
  const { t, tr } = useT();
  const save = useSave();
  const current = battle.plan.attacks[index];
  const currentSkill = current ? getSkill(current.skillId) : null;
  const [tab, setTab] = useState<Tab>(
    currentSkill ? tabOf(currentSkill) : "attacks",
  );
  const { hero, mana, stamina, potions, ap } = resourcesLeft(battle, index);
  const all = battleActions(save.hero).map((id) => getSkill(id));
  const listed = all.filter((s) => tabOf(s) === tab);

  const pick = (skill: Skill) => {
    const aimed = skill.target === "enemy" || skill.target === "enemyRow";
    actions.setAttack(index, skill.id, aimed ? targetId : undefined);
    onClose();
  };

  return (
    <View style={styles.pickerBackdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={t("menu.close")}
      />
      <View style={styles.picker}>
        <Row gap={8}>
          <Label
            value={t("battle.slot", { n: index + 1 })}
            type="headline"
            color={palette.gold}
            style={styles.flex}
          />
          <Label
            value={t("battle.ap", { left: ap, total: apFor(hero) })}
            type="caption1"
            color={palette.muted}
          />
          <Pressable
            onPress={onClose}
            accessibilityLabel={t("menu.close")}
            style={styles.pickerClose}
          >
            <GIcon name="xmark" size={14} color={palette.muted} />
          </Pressable>
        </Row>
        <Row gap={4} style={styles.tabs}>
          {TABS.map((id) => {
            const count = all.filter((s) => tabOf(s) === id).length;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === id }}
                disabled={count === 0}
                onPress={() => setTab(id)}
                style={[
                  styles.tab,
                  tab === id && styles.tabOn,
                  count === 0 && styles.off,
                ]}
              >
                <Label
                  value={t(`battle.tab.${id}` as StringKey)}
                  type="caption1"
                  color={tab === id ? palette.gold : palette.muted}
                />
              </Pressable>
            );
          })}
        </Row>
        <View style={styles.options}>
          {listed.map((skill) => {
            const ok =
              skill.ap <= ap &&
              (skill.potion
                ? potions[skill.potion] > 0
                : (skill.cost.mana ?? 0) <= mana &&
                  (skill.cost.stamina ?? 0) <= stamina);
            const chosen = currentSkill?.id === skill.id;
            return (
              <Pressable
                key={skill.id}
                accessibilityLabel={tr(skill.name)}
                accessibilityState={{ disabled: !ok, selected: chosen }}
                disabled={!ok}
                onPress={() => pick(skill)}
                style={[styles.option, !ok && styles.off]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    chosen && { borderColor: palette.gold, borderWidth: 2 },
                  ]}
                >
                  <GIcon
                    name={skill.icon}
                    size={22}
                    color={skillColor(skill)}
                  />
                </View>
                <Label
                  value={tr(skill.name)}
                  type="caption2"
                  numberOfLines={2}
                  style={styles.optionName}
                />
                <Row gap={5}>
                  <Cost icon="circle" value={skill.ap} color={palette.gold} />
                  {skill.cost.mana ? (
                    <Cost
                      icon="droplet"
                      value={skill.cost.mana}
                      color={palette.mana}
                    />
                  ) : null}
                  {skill.cost.stamina ? (
                    <Cost
                      icon="bolt"
                      value={skill.cost.stamina}
                      color={palette.stamina}
                    />
                  ) : null}
                  {skill.potion ? (
                    <Label
                      value={`×${potions[skill.potion]}`}
                      type="caption2"
                      color={palette.muted}
                    />
                  ) : null}
                  {skill.flee ? (
                    <Label
                      value={`${fleeChance(battle.state, hero)}%`}
                      type="caption2"
                      color={palette.good}
                    />
                  ) : null}
                </Row>
              </Pressable>
            );
          })}
        </View>
        {current ? (
          <Pressable
            onPress={() => {
              actions.removeAttack(index);
              onClose();
            }}
            style={styles.emptySlot}
          >
            <GIcon name="eraser" size={12} color={palette.muted} />
            <Label
              value={t("battle.emptySlot")}
              type="caption1"
              color={palette.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** One cost of an action: AP (a pip), mana (a drop) or stamina (a bolt). */
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
    <Row gap={2}>
      <GIcon name={icon} size={8} color={color} />
      <Label value={String(value)} type="caption2" color={color} />
    </Row>
  );
}

// ---------------------------------------------------------------- tactics

/** The three saved plans, a save button and a clear button. */
export function TacticsBar({ battle }: { battle: BattleSession }) {
  const { t } = useT();
  const save = useSave();
  const planning = battle.phase === "planning";
  const empty =
    battle.plan.attacks.length +
      DELIVERIES.reduce((n, k) => n + battle.plan.defense[k], 0) ===
    0;
  return (
    <Row gap={5}>
      {save.tactics.map((tactic, i) => {
        const active = save.settings.tactic === i;
        return (
          <Pressable
            key={i}
            accessibilityLabel={t("battle.tactic", { n: i + 1 })}
            accessibilityState={{ selected: active }}
            disabled={!planning}
            onPress={() => actions.pickTactic(i)}
            onLongPress={() => actions.saveTactic(i)}
            style={[
              styles.tactic,
              tactic ? styles.tacticFilled : null,
              active ? styles.tacticActive : null,
            ]}
          >
            <Label
              value={String(i + 1)}
              type="subheadline"
              color={
                active ? palette.gold : tactic ? palette.text : palette.faint
              }
            />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityLabel={t("battle.saveTactic")}
        disabled={!planning}
        onPress={() => actions.saveTactic(save.settings.tactic)}
        style={styles.tacticTool}
      >
        <GIcon name="floppy-disk" size={13} color={palette.muted} />
      </Pressable>
      <Pressable
        accessibilityLabel={t("battle.clear")}
        disabled={!planning || empty}
        onPress={actions.clearPlan}
        style={[styles.tacticTool, empty && styles.off]}
      >
        <GIcon name="eraser" size={13} color={palette.muted} />
      </Pressable>
    </Row>
  );
}

const GLASS = "rgba(18, 14, 10, 0.82)";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  off: { opacity: 0.35 },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: GLASS,
  },
  panelEnd: { flexDirection: "row-reverse" },
  panelEmpty: { justifyContent: "center", minHeight: 64 },
  panelPortrait: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
  },
  panelLevel: { position: "absolute", bottom: -5, end: -8 },
  panelBody: { flex: 1, gap: 3, minWidth: 0 },
  slotsWrap: { alignItems: "center", gap: 6 },
  slotsTop: { alignItems: "center" },
  defense: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: GLASS,
  },
  slot: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS,
  },
  slotCost: {
    position: "absolute",
    top: -3,
    end: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gold,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: palette.shade,
  },
  picker: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: palette.panel,
  },
  pickerClose: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    borderBottomWidth: 1,
    borderColor: palette.lineSoft,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  tabOn: { borderColor: palette.gold },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { width: 76, alignItems: "center", gap: 3 },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.panelHi,
  },
  optionName: { textAlign: "center" },
  emptySlot: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
  },
  tactic: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.lineSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS,
  },
  tacticFilled: { borderStyle: "solid" },
  tacticActive: { borderColor: palette.gold, borderWidth: 2 },
  tacticTool: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS,
  },
});
