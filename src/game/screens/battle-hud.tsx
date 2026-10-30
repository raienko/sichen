import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

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
import { arcLayout } from "../ui/arc";
import { Glyph } from "../ui/glyphs";
import { Bar, GIcon, Label, RoundButton, Row } from "../ui/kit";
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
  compact,
}: {
  actor: Combatant | undefined;
  /** For a foe: colours its level badge by danger. */
  heroLevel?: number;
  align?: "start" | "end";
  /** Short screens: no name line and a smaller portrait. */
  compact?: boolean;
}) {
  const { t, tr } = useT();
  const type = useTypography();
  // Bars that print their numbers are as tall as that text, at any scale.
  const textBar = type.caption2.lineHeight + 2;
  // Both sides share one shape, so the two panels line up: a two-line name
  // box, three bar rows (an empty row where a fighter has no such
  // resource) and a status row.
  const nameBox = type.subheadline.lineHeight * 2;
  const statusRow = 14;
  const bodyHeight =
    (compact ? 0 : nameBox + 3) + 3 * textBar + 2 * 3 + 3 + statusRow;
  if (!actor) {
    return (
      <View
        style={[
          styles.panel,
          styles.panelEmpty,
          { minHeight: bodyHeight + 16 },
          align === "end" && styles.panelEnd,
        ]}
      >
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
  const end = align === "end";
  const ring = foe ? (actor.boss ? "#b04ae8" : palette.bad) : palette.ivory;
  const portrait = (
    <View>
      <View
        style={[
          styles.panelPortrait,
          compact && styles.panelPortraitCompact,
          { borderColor: ring },
        ]}
      >
        <GIcon
          name={actor.hp > 0 ? actor.icon : "skull"}
          size={compact ? 16 : 22}
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
  const bar = (value: number, max: number, color: string) =>
    max > 0 ? (
      <Bar value={value} max={max} color={color} height={textBar} showText />
    ) : (
      <View style={{ height: textBar }} />
    );
  return (
    <View
      style={[
        styles.panel,
        compact && styles.panelCompact,
        end && styles.panelEnd,
      ]}
      accessibilityLabel={tr(actor.name)}
    >
      {portrait}
      <View style={[styles.panelBody, { height: bodyHeight }]}>
        {compact ? null : (
          <View style={[styles.panelName, { height: nameBox }]}>
            <Label
              value={tr(actor.name)}
              type="subheadline"
              display
              color={palette.ivory}
              numberOfLines={2}
              style={end && styles.textEnd}
            />
          </View>
        )}
        {bar(actor.hp, actor.base.maxHp, palette.hp)}
        {bar(actor.mana, actor.base.maxMana, palette.mana)}
        {bar(actor.stamina, actor.base.maxStamina, palette.stamina)}
        <Row gap={4} style={[{ height: statusRow }, end && styles.rowEnd]}>
          {actor.statuses.map((s) => (
            <GIcon
              key={s.kind}
              name={STATUS_ICON[s.kind]}
              size={11}
              color={palette.status[s.kind]}
            />
          ))}
        </Row>
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
  // Never below zero: during playback the plan shown is the round being
  // played, while a fresh freeze may already have cut this round's AP.
  const ap = Math.max(0, apFor(hero) - planCost({ ...battle.plan, attacks }));
  return { hero, mana, stamina, potions, ap };
}

/** One line glyph per delivery: what the defence button guards against. */
const DELIVERY_GLYPH = {
  melee: "sabre",
  ranged: "bow",
  mental: "eye",
} as const;

/**
 * The left thumb group, top to bottom: round and AP pips, the three saved
 * tactics with Save and Clear, and exactly five action slots in one row.
 * Every row is five `size` circles with 4-point gaps, so the group is as
 * wide as the slot row.
 */
export function ActionSlots({
  battle,
  size,
  onOpen,
}: {
  battle: BattleSession;
  /** Diameter of a slot, and of a tactics button. */
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
      <Row gap={8}>
        <Label
          value={t("battle.round", { round: battle.state.round })}
          type="caption1"
          color={palette.muted}
        />
        <Row gap={3} style={styles.pips}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.pip, i < ap && styles.pipOn]} />
          ))}
        </Row>
        <Label
          value={t("battle.ap", { left: ap, total })}
          type="caption1"
          color={ap > 0 ? palette.amber : palette.faint}
        />
        {stunned || frozen ? (
          <Label
            value={stunned ? t("battle.stunned") : t("battle.frozen")}
            type="caption1"
            color={stunned ? palette.status.stun : palette.status.freeze}
          />
        ) : null}
      </Row>
      <TacticsBar battle={battle} size={size} />
      <View style={styles.slotRow}>
        {Array.from({ length: RULES.attackSlots }, (_, i) => {
          const action = battle.plan.attacks[i];
          const skill = action ? getSkill(action.skillId) : null;
          return (
            <View key={i} style={styles.slotCell}>
              <Label
                value={String(i + 1)}
                type="caption2"
                color={palette.muted}
              />
              <RoundButton
                size={size}
                accessibilityLabel={
                  skill
                    ? `${t("battle.slot", { n: i + 1 })}: ${tr(skill.name)}`
                    : t("battle.slot", { n: i + 1 })
                }
                disabled={!planning || stunned}
                onPress={() => onOpen(i)}
              >
                {skill ? (
                  <>
                    <GIcon
                      name={skill.icon}
                      size={size * 0.4}
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
                  <GIcon name="plus" size={size * 0.36} color={palette.ivory} />
                )}
              </RoundButton>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function skillColor(skill: Skill): string {
  if (skill.potion === "hp") return palette.hp;
  if (skill.potion === "mana") return palette.mana;
  return palette.text;
}

/** The three defence shields, on or off, 1 AP each. */
function DefenseToggles({ battle }: { battle: BattleSession }) {
  const { t } = useT();
  const planning = battle.phase === "planning";
  const { hero, ap } = resourcesLeft(battle);
  const stunned = hasStatus(hero, "stun");
  return (
    <Row gap={6}>
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
              size={14}
              color={on ? palette.delivery[kind] : palette.faint}
            />
            <Glyph
              name={DELIVERY_GLYPH[kind]}
              size={16}
              color={on ? palette.delivery[kind] : palette.muted}
            />
          </Pressable>
        );
      })}
    </Row>
  );
}

// ---------------------------------------------------------------- picker

type Tab = "attacks" | "skills" | "items" | "other";
const TABS: readonly Tab[] = ["attacks", "skills", "items", "other"];
const TAB_ICON: Record<Tab, string> = {
  attacks: "hand-fist",
  skills: "wand-magic-sparkles",
  items: "flask",
  other: "person-running",
};

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

  // Names always take two lines, so tiles and costs line up.
  const nameBox = useTypography().caption2.lineHeight * 2;

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
        <Row gap={8} wrap style={styles.pickerHead}>
          <Label
            value={t("battle.slot", { n: index + 1 })}
            type="headline"
            color={palette.gold}
          />
          <Label
            value={t("battle.ap", { left: ap, total: apFor(hero) })}
            type="caption1"
            color={palette.muted}
          />
          {/* The shields again, to free or spend AP without leaving. */}
          <View style={styles.flex} />
          <DefenseToggles battle={battle} />
          <Pressable
            onPress={onClose}
            accessibilityLabel={t("menu.close")}
            style={styles.pickerClose}
          >
            <GIcon name="xmark" size={16} color={palette.muted} />
          </Pressable>
        </Row>
        <View style={styles.pickerBody}>
          <View style={styles.flex}>
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
                    <View style={[styles.optionNameBox, { height: nameBox }]}>
                      <Label
                        value={tr(skill.name)}
                        type="caption2"
                        numberOfLines={2}
                        style={styles.optionName}
                      />
                    </View>
                    <Row gap={5}>
                      <Cost
                        icon="circle"
                        value={skill.ap}
                        color={palette.gold}
                      />
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
          </View>
          {/* Tabs down the right edge, as icons. */}
          <View style={styles.tabs}>
            {TABS.map((id) => {
              const count = all.filter((s) => tabOf(s) === id).length;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityLabel={t(`battle.tab.${id}` as StringKey)}
                  accessibilityState={{ selected: tab === id }}
                  disabled={count === 0}
                  onPress={() => setTab(id)}
                  style={[
                    styles.tab,
                    tab === id && styles.tabOn,
                    count === 0 && styles.off,
                  ]}
                >
                  <GIcon
                    name={TAB_ICON[id]}
                    size={18}
                    color={tab === id ? palette.gold : palette.muted}
                  />
                </Pressable>
              );
            })}
            {/* Emptying the slot: always here, at the column's foot. */}
            <View style={styles.flex} />
            <Pressable
              accessibilityLabel={t("battle.emptySlot")}
              accessibilityState={{ disabled: !current }}
              disabled={!current}
              onPress={() => {
                actions.removeAttack(index);
                onClose();
              }}
              style={[styles.tab, styles.clearTab, !current && styles.off]}
            >
              <GIcon name="eraser" size={18} color={palette.bad} />
            </Pressable>
          </View>
        </View>
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

/**
 * The three saved plans, Save and Clear. Tap a preset to switch to it, Save
 * (or a long press) stores the current plan in the selected preset, and
 * Clear empties the current plan without touching saved ones.
 */
export function TacticsBar({
  battle,
  size,
}: {
  battle: BattleSession;
  size: number;
}) {
  const { t } = useT();
  const save = useSave();
  const planning = battle.phase === "planning";
  const empty =
    battle.plan.attacks.length +
      DELIVERIES.reduce((n, k) => n + battle.plan.defense[k], 0) ===
    0;
  return (
    <View style={styles.slotRow}>
      {save.tactics.map((tactic, i) => {
        const active = save.settings.tactic === i;
        return (
          <RoundButton
            key={i}
            size={size}
            accessibilityLabel={t("battle.tactic", { n: i + 1 })}
            selected={active}
            dim={!tactic && !active}
            disabled={!planning}
            onPress={() => actions.pickTactic(i)}
            onLongPress={() => actions.saveTactic(i)}
          >
            <Label
              value={String(i + 1)}
              type="title3"
              color={active ? palette.amber : palette.ivory}
            />
          </RoundButton>
        );
      })}
      <RoundButton
        size={size}
        accessibilityLabel={t("battle.saveTactic")}
        disabled={!planning}
        onPress={() => actions.saveTactic(save.settings.tactic)}
      >
        <GIcon name="floppy-disk" size={size * 0.36} color={palette.ivory} />
      </RoundButton>
      <RoundButton
        size={size}
        accessibilityLabel={t("battle.clear")}
        disabled={!planning || empty}
        onPress={actions.clearPlan}
      >
        <GIcon name="eraser" size={size * 0.36} color={palette.ivory} />
      </RoundButton>
    </View>
  );
}

// ---------------------------------------------------------------- ready arc

/** The clock turns red for the last seconds of planning. */
const URGENT_SECONDS = 5;

/**
 * The right thumb group: Ready, with the round's clock draining around its
 * ring, and Auto plus the three defences curving around it.
 */
export function ReadyArc({
  battle,
  slot,
  ready,
  msLeft,
  secondsLeft,
  auto,
  onReady,
}: {
  battle: BattleSession;
  /** Diameter of Auto and the defences: the action slot's. */
  slot: number;
  /** Diameter of Ready. */
  ready: number;
  msLeft: number;
  secondsLeft: number;
  auto: boolean;
  onReady: () => void;
}) {
  const { t } = useT();
  const planning = battle.phase === "planning";
  const { hero, ap } = resourcesLeft(battle);
  const stunned = hasStatus(hero, "stun");
  const layout = arcLayout(slot, ready);
  const at = (p: { x: number; y: number }, size: number) => ({
    position: "absolute" as const,
    left: layout.centre.x + p.x - size / 2,
    top: layout.centre.y + p.y - size / 2,
  });
  const urgent = planning && secondsLeft <= URGENT_SECONDS;
  const share = planning
    ? Math.max(0, Math.min(1, msLeft / (RULES.roundSeconds * 1000)))
    : 0;
  const ring = ready - 6;
  const circumference = Math.PI * ring;
  return (
    <View
      pointerEvents="box-none"
      style={{ width: layout.width, height: layout.height }}
    >
      <RoundButton
        size={slot}
        accessibilityLabel={t("battle.auto")}
        selected={auto}
        onPress={actions.toggleAuto}
        style={at(layout.points[0], slot)}
      >
        <Label
          value="A"
          type="title3"
          display
          color={auto ? palette.amber : palette.ivory}
        />
      </RoundButton>
      {DELIVERIES.map((kind, i) => {
        const on = battle.plan.defense[kind] > 0;
        return (
          <RoundButton
            key={kind}
            size={slot}
            accessibilityLabel={`${t("battle.defense")}: ${t(`delivery.${kind}`)}`}
            selected={on}
            disabled={!planning || stunned || (!on && ap <= 0)}
            onPress={() => actions.toggleDefense(kind)}
            style={at(layout.points[i + 1], slot)}
          >
            <Glyph
              name={DELIVERY_GLYPH[kind]}
              size={slot * 0.48}
              color={on ? palette.amber : palette.ivory}
            />
          </RoundButton>
        );
      })}
      <RoundButton
        size={ready}
        accessibilityLabel={`${t("battle.ready")}, ${t("battle.round", { round: battle.state.round })}`}
        disabled={!planning}
        onPress={onReady}
        style={[at({ x: 0, y: 0 }, ready), styles.ready]}
      >
        <Svg width={ready} height={ready} style={StyleSheet.absoluteFill}>
          <Circle
            cx={ready / 2}
            cy={ready / 2}
            r={ring / 2}
            stroke={urgent ? palette.bad : palette.amber}
            strokeWidth={3}
            fill="none"
            strokeDasharray={`${circumference * share} ${circumference}`}
            strokeLinecap="round"
            // Drains clockwise from twelve o'clock.
            transform={`rotate(-90 ${ready / 2} ${ready / 2})`}
          />
        </Svg>
        <Glyph name="check" size={ready * 0.42} weight={2.6} />
        <Label
          value={planning ? `${secondsLeft}s` : "…"}
          type="caption1"
          color={urgent ? palette.bad : palette.ivory}
        />
      </RoundButton>
    </View>
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
    borderRadius: 32,
    // No frame: a soft local shade is enough to read the bars on the scene.
    backgroundColor: "rgba(10, 8, 6, 0.4)",
  },
  panelEnd: { flexDirection: "row-reverse" },
  panelCompact: { paddingVertical: 5, gap: 8 },
  panelPortraitCompact: { width: 34, height: 34, borderRadius: 17 },
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
  panelName: { justifyContent: "flex-end" },
  textEnd: { textAlign: "right" },
  rowEnd: { justifyContent: "flex-end" },
  defense: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: GLASS,
  },
  pickerHead: { alignItems: "center" },
  pickerBody: { flexDirection: "row", gap: 10 },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignContent: "flex-start",
  },
  optionNameBox: { justifyContent: "center", alignSelf: "stretch" },
  optionName: { textAlign: "center" },
  clearTab: { borderStyle: "dashed", borderColor: palette.bad },
  tabs: {
    gap: 6,
    paddingStart: 8,
    borderStartWidth: 1,
    borderColor: palette.lineSoft,
  },
  tab: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabOn: { borderColor: palette.gold, backgroundColor: palette.panelHi },
  slotsWrap: { gap: 6 },
  slotRow: { flexDirection: "row", gap: 4 },
  slotCell: { alignItems: "center" },
  pips: { alignItems: "center" },
  pip: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.bronze,
  },
  pipOn: { backgroundColor: palette.amber, borderColor: palette.amber },
  ready: { borderWidth: 2, gap: 0 },
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
});
