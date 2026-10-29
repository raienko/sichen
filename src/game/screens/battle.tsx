import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/features/haptics";

import { getSkill, RULES } from "../data";
import { useT, type StringKey } from "../i18n";
import * as actions from "../state/actions";
import { useGame, useSave, type BattleSession } from "../state/store";
import {
  apFor,
  fleeChance,
  hasStatus,
  living,
  planCost,
  type BattleEvent,
  type BattleState,
  type Combatant,
} from "../sim/battle";
import { battleActions } from "../sim/hero";
import { DELIVERIES } from "../sim/types";
import { ItemRow } from "../ui/items";
import { Bar, GButton, GIcon, Label, Row } from "../ui/kit";
import { palette } from "../ui/palette";

import { Toasts } from "./world";

// ---------------------------------------------------------------- playback

type Floater = { id: number; actor: string; text: string; color: string };

/** How long each kind of event holds the screen, in ms. */
const PACE: Partial<Record<BattleEvent["t"], number>> = {
  action: 360,
  hit: 380,
  miss: 300,
  block: 320,
  heal: 300,
  mana: 200,
  status: 180,
  buff: 240,
  tick: 320,
  death: 380,
  phase: 1100,
  summon: 450,
  flee: 700,
  skip: 320,
  end: 500,
};

function applyEvent(state: BattleState, e: BattleEvent): BattleState {
  const next = { ...state, actors: state.actors.map((a) => ({ ...a })) };
  const find = (id: string) => next.actors.find((a) => a.id === id);
  switch (e.t) {
    case "hit":
    case "tick": {
      const a = find(e.target);
      if (a) a.hp = e.hp;
      break;
    }
    case "heal": {
      const a = find(e.target);
      if (a) a.hp = e.hp;
      break;
    }
    case "status": {
      const a = find(e.target);
      if (a && !a.statuses.some((s) => s.kind === e.status)) {
        a.statuses = [
          ...a.statuses,
          { kind: e.status, turns: 1, power: 0, fresh: true },
        ];
      }
      break;
    }
    case "summon":
      next.actors.push(e.actor);
      break;
    case "action": {
      const a = find(e.actor);
      const skill = getSkill(e.skill);
      if (a) {
        a.mana -= skill.cost.mana ?? 0;
        a.stamina -= skill.cost.stamina ?? 0;
      }
      break;
    }
  }
  return next;
}

function usePlayback(battle: BattleSession) {
  const { t, tr } = useT();
  const [shown, setShown] = useState<BattleState>(battle.state);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [hitAt, setHitAt] = useState<Record<string, number>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const floaterId = useRef(0);

  useEffect(() => {
    if (battle.phase !== "playing") return;
    let cancelled = false;
    // The previous round ended on this state, so the screen already shows it.
    let current = battle.before;
    const float = (actor: string, text: string, color: string) => {
      floaterId.current += 1;
      const id = floaterId.current;
      setFloaters((f) => [...f, { id, actor, text, color }]);
      setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1000);
    };
    const run = async () => {
      for (const e of battle.events) {
        if (cancelled) return;
        current = applyEvent(current, e);
        setShown(current);
        switch (e.t) {
          case "action":
            setActing(e.actor);
            break;
          case "hit":
            float(
              e.target,
              `${e.crit ? "!" : ""}-${e.amount}`,
              e.crit ? palette.ember : palette.white,
            );
            setHitAt((h) => ({ ...h, [e.target]: Date.now() }));
            if (e.target === "hero") haptics.impact(e.crit ? "heavy" : "light");
            break;
          case "tick":
            float(e.target, `-${e.amount}`, palette.status[e.status]);
            setHitAt((h) => ({ ...h, [e.target]: Date.now() }));
            break;
          case "miss":
            float(e.target, t("battle.miss"), palette.muted);
            break;
          case "block":
            float(e.target, t("battle.block"), palette.delivery[e.delivery]);
            break;
          case "heal":
            if (e.amount > 0) float(e.target, `+${e.amount}`, palette.good);
            break;
          case "mana":
            float(e.target, `+${e.amount}`, palette.mana);
            break;
          case "status":
            float(
              e.target,
              t(`status.${e.status}` as StringKey),
              palette.status[e.status],
            );
            break;
          case "phase":
            setBanner(tr(e.name));
            break;
          case "summon":
            float(e.actor.id, t("battle.summon"), "#b04ae8");
            break;
          case "skip":
            if (e.reason === "stun")
              float(e.actor, t("battle.stunned"), palette.status.stun);
            break;
          case "flee":
            float(
              e.actor,
              e.ok ? t("battle.fled") : "✕",
              e.ok ? palette.good : palette.bad,
            );
            break;
        }
        await new Promise((r) => setTimeout(r, PACE[e.t] ?? 0));
        if (e.t === "phase") setBanner(null);
      }
      setActing(null);
      if (!cancelled) actions.finishPlayback();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [battle.phase, battle.events, battle.before, battle.state, t, tr]);

  return { shown, floaters, acting, hitAt, banner };
}

// ---------------------------------------------------------------- units

function FloatText({ text, color }: { text: string; color: string }) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    y.value = withTiming(-34, { duration: 900 });
    o.value = withTiming(0, { duration: 900 });
  }, [y, o]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: o.value,
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.float, style]}>
      <Label value={text} type="headline" color={color} />
    </Animated.View>
  );
}

function Unit({
  actor,
  floaters,
  acting,
  hitAt,
  targetable,
  dimmed,
  onPress,
  marked,
  compact,
}: {
  actor: Combatant;
  floaters: Floater[];
  acting: boolean;
  hitAt?: number;
  targetable: boolean;
  dimmed: boolean;
  onPress?: () => void;
  marked: number;
  /** Smaller portraits for short (landscape phone) screens. */
  compact: boolean;
}) {
  const { tr } = useT();
  const blink = useSharedValue(0);
  const shake = useSharedValue(0);
  const lunge = useSharedValue(0);
  useEffect(() => {
    if (!hitAt) return;
    blink.value = withSequence(
      withTiming(0.9, { duration: 40 }),
      withTiming(0, { duration: 260 }),
    );
    shake.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 70 }),
      withTiming(0, { duration: 60 }),
    );
  }, [hitAt, blink, shake]);
  useEffect(() => {
    if (!acting) return;
    const dir = actor.side === 0 ? 1 : -1;
    lunge.value = withSequence(
      withTiming(18 * dir, { duration: 140 }),
      withTiming(0, { duration: 180 }),
    );
  }, [acting, actor.side, lunge]);
  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value + lunge.value }],
  }));
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));
  const dead = actor.hp <= 0;
  const boss = actor.boss;
  const ring = actor.side === 0 ? palette.gold : boss ? "#b04ae8" : palette.bad;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={tr(actor.name)}
      style={[
        styles.unit,
        compact && styles.unitCompact,
        dead && styles.dead,
        dimmed && styles.dimmed,
      ]}
    >
      <Animated.View style={[styles.unitInner, moveStyle]}>
        <View
          style={[
            styles.portrait,
            boss && styles.bossPortrait,
            compact &&
              (boss ? styles.bossPortraitCompact : styles.portraitCompact),
            { borderColor: targetable ? palette.white : ring },
            acting && styles.actingPortrait,
          ]}
        >
          <GIcon
            name={dead ? "skull" : actor.icon}
            size={compact ? (boss ? 26 : 18) : boss ? 40 : 28}
            color={dead ? palette.faint : ring}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.blink, blinkStyle]}
          />
          {marked > 0 ? (
            <View style={styles.mark}>
              <Label
                value={String(marked)}
                type="caption2"
                color={palette.night}
              />
            </View>
          ) : null}
        </View>
        <Label
          value={
            compact ? `${tr(actor.name)} · ${actor.level}` : tr(actor.name)
          }
          type="caption2"
          numberOfLines={1}
        />
        {compact ? null : (
          <Label
            value={`Lv ${actor.level}`}
            type="caption2"
            color={palette.muted}
          />
        )}
        <Bar
          value={actor.hp}
          max={actor.base.maxHp}
          color={palette.hp}
          height={compact ? 6 : 8}
          style={styles.unitBar}
        />
        {/* Foes with a token mana pool (growth only) don't need the bar. */}
        {actor.side === 0 || actor.base.maxMana >= 20 ? (
          <Bar
            value={actor.mana}
            max={actor.base.maxMana}
            color={palette.mana}
            height={4}
            style={styles.unitBar}
          />
        ) : null}
        <Row gap={3}>
          {actor.statuses.map((s) => (
            <GIcon
              key={s.kind}
              name={
                s.kind === "burn"
                  ? "fire"
                  : s.kind === "freeze"
                    ? "snowflake"
                    : "star"
              }
              size={11}
              color={palette.status[s.kind]}
            />
          ))}
          {actor.buffs.length > 0 ? (
            <GIcon name="arrow-up" size={11} color={palette.good} />
          ) : null}
        </Row>
      </Animated.View>
      {floaters.map((f) => (
        <FloatText key={f.id} text={f.text} color={f.color} />
      ))}
    </Pressable>
  );
}

function SideGrid({
  state,
  side,
  playback,
  pick,
  marks,
}: {
  state: BattleState;
  side: 0 | 1;
  playback: ReturnType<typeof usePlayback>;
  pick: { reachable: Set<string>; onPick: (id: string) => void } | null;
  marks: Record<string, number>;
}) {
  const compact = useWindowDimensions().height < 520;
  // Front rows face each other in the middle of the field.
  const rows: (0 | 1)[] = side === 0 ? [1, 0] : [0, 1];
  return (
    <View style={styles.side}>
      {rows.map((row) => (
        <View key={row} style={styles.column}>
          {[0, 1, 2].map((slot) => {
            const actor = state.actors
              .filter(
                (a) => a.side === side && a.row === row && a.slot === slot,
              )
              .sort((a, b) => b.hp - a.hp)[0];
            if (!actor)
              return (
                <View
                  key={slot}
                  style={[styles.unit, compact && styles.unitCompact]}
                />
              );
            const can = !!pick && pick.reachable.has(actor.id);
            return (
              <Unit
                key={actor.id}
                actor={actor}
                floaters={playback.floaters.filter((f) => f.actor === actor.id)}
                acting={playback.acting === actor.id}
                hitAt={playback.hitAt[actor.id]}
                targetable={can}
                dimmed={!!pick && side === 1 && !can && actor.hp > 0}
                onPress={can ? () => pick.onPick(actor.id) : undefined}
                marked={marks[actor.id] ?? 0}
                compact={compact}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- planning

function usePlanResources(battle: BattleSession) {
  const hero = battle.state.actors.find((a) => a.id === "hero")!;
  let mana = hero.mana;
  let stamina = hero.stamina;
  const potions = { ...hero.potions };
  for (const a of battle.plan.attacks) {
    const s = getSkill(a.skillId);
    mana -= s.cost.mana ?? 0;
    stamina -= s.cost.stamina ?? 0;
    if (s.potion) potions[s.potion] -= 1;
  }
  return {
    hero,
    mana,
    stamina,
    potions,
    ap: apFor(hero) - planCost(battle.plan),
  };
}

function planDefense(battle: BattleSession): number {
  return DELIVERIES.reduce((n, k) => n + battle.plan.defense[k], 0);
}

function Planner({
  battle,
  pending,
  setPending,
}: {
  battle: BattleSession;
  pending: string | null;
  setPending: (id: string | null) => void;
}) {
  const { t, tr } = useT();
  const save = useSave();
  const { hero, mana, stamina, potions, ap } = usePlanResources(battle);
  const planning = battle.phase === "planning";
  const foes = living(battle.state, 1);
  const stunned = hasStatus(hero, "stun");
  const frozen = hasStatus(hero, "freeze");

  const choose = (skillId: string) => {
    const skill = getSkill(skillId);
    if (skill.target === "enemy" || skill.target === "enemyRow") {
      if (foes.length === 1) actions.addAttack(skillId, foes[0]!.id);
      else setPending(pending === skillId ? null : skillId);
    } else {
      actions.addAttack(skillId);
    }
  };

  return (
    <View style={styles.planner}>
      <Row gap={10} wrap>
        <Row gap={4}>
          {Array.from({ length: RULES.ap }, (_, i) => (
            <View
              key={i}
              style={[
                styles.pip,
                i < ap ? styles.pipOn : null,
                frozen && i >= RULES.ap - 2 ? styles.pipFrozen : null,
              ]}
            />
          ))}
        </Row>
        <View style={styles.slots}>
          {Array.from({ length: RULES.attackSlots }, (_, i) => {
            const action = battle.plan.attacks[i];
            const skill = action ? getSkill(action.skillId) : null;
            return (
              <Pressable
                key={i}
                accessibilityLabel={skill ? tr(skill.name) : `${i + 1}`}
                disabled={!action || !planning}
                onPress={() => actions.removeAttack(i)}
                style={[styles.slot, skill && styles.slotFull]}
              >
                {skill ? (
                  <GIcon name={skill.icon} size={15} color={palette.gold} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Row gap={6}>
          {DELIVERIES.map((kind) => {
            const on = battle.plan.defense[kind] > 0;
            return (
              <Pressable
                key={kind}
                accessibilityLabel={`${t("battle.defense")}: ${t(`delivery.${kind}`)}`}
                accessibilityState={{ selected: on }}
                disabled={!planning || (!on && ap <= 0)}
                onPress={() => actions.toggleDefense(kind)}
                style={[
                  styles.defense,
                  on && {
                    borderColor: palette.delivery[kind],
                    backgroundColor: palette.panelHi,
                  },
                  !on && planning && ap <= 0 && styles.actionOff,
                ]}
              >
                <GIcon
                  name="shield-halved"
                  size={12}
                  color={on ? palette.delivery[kind] : palette.faint}
                />
                <GIcon
                  name={
                    kind === "melee"
                      ? "hand-fist"
                      : kind === "ranged"
                        ? "crosshairs"
                        : "brain"
                  }
                  size={14}
                  color={on ? palette.delivery[kind] : palette.muted}
                />
              </Pressable>
            );
          })}
        </Row>
      </Row>
      <Row gap={6} wrap>
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
                type="headline"
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
          <GIcon name="floppy-disk" size={14} color={palette.muted} />
        </Pressable>
        <Pressable
          accessibilityLabel={t("battle.clear")}
          disabled={
            !planning || battle.plan.attacks.length + planDefense(battle) === 0
          }
          onPress={actions.clearPlan}
          style={styles.tacticTool}
        >
          <GIcon name="eraser" size={14} color={palette.muted} />
        </Pressable>
      </Row>
      {stunned ? (
        <Label
          value={t("battle.stunned")}
          type="subheadline"
          color={palette.status.stun}
        />
      ) : null}
      {frozen ? (
        <Label
          value={t("battle.frozen")}
          type="caption1"
          color={palette.status.freeze}
        />
      ) : null}
      {pending ? (
        <Label
          value={t("battle.pickTarget")}
          type="caption1"
          color={palette.white}
        />
      ) : null}
      <View style={styles.bar}>
        {battleActions(save.hero).map((id) => {
          const skill = getSkill(id);
          const ok =
            planning &&
            !stunned &&
            skill.ap <= ap &&
            battle.plan.attacks.length < RULES.attackSlots &&
            (skill.potion
              ? potions[skill.potion] > 0
              : (skill.cost.mana ?? 0) <= mana &&
                (skill.cost.stamina ?? 0) <= stamina);
          return (
            <Pressable
              key={id}
              accessibilityLabel={
                skill.flee
                  ? `${tr(skill.name)}, ${t("battle.fleeChance", { chance: fleeChance(battle.state, hero) })}`
                  : tr(skill.name)
              }
              disabled={!ok}
              onPress={() => choose(id)}
              style={[
                styles.action,
                pending === id && styles.actionPending,
                !ok && styles.actionOff,
              ]}
            >
              <GIcon
                name={skill.icon}
                size={18}
                color={
                  skill.potion === "hp"
                    ? palette.hp
                    : skill.potion === "mana"
                      ? palette.mana
                      : palette.text
                }
              />
              <Label
                value={
                  skill.potion
                    ? String(potions[skill.potion])
                    : skill.flee
                      ? `${fleeChance(battle.state, hero)}%`
                      : String(skill.ap)
                }
                type="caption2"
                color={palette.muted}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- screen

function Results({ battle }: { battle: BattleSession }) {
  const { t } = useT();
  const r = battle.rewards;
  const won = battle.state.result === "won";
  return (
    <View style={styles.resultsBackdrop}>
      <View style={styles.results}>
        <GIcon
          name={won ? "trophy" : "person-running"}
          size={30}
          color={palette.gold}
        />
        <Label
          value={won ? t("battle.victory") : t("battle.fled")}
          type="title2"
          color={palette.gold}
        />
        {r ? (
          <>
            <Row gap={14}>
              <Label value={`+${r.xp} XP`} type="headline" color={palette.xp} />
              <Row gap={4}>
                <GIcon name="coins" size={13} color={palette.gold} />
                <Label
                  value={`+${r.gold}`}
                  type="headline"
                  color={palette.gold}
                />
              </Row>
              {r.potions.hp > 0 ? (
                <GIcon name="flask" color={palette.hp} />
              ) : null}
              {r.potions.mana > 0 ? (
                <GIcon name="vial" color={palette.mana} />
              ) : null}
            </Row>
            {r.items.map((item) => (
              <ItemRow key={item.uid} item={item} />
            ))}
            {Object.entries(r.relics).map(([relic, n]) => (
              <Label
                key={relic}
                value={`${t(`relic.${relic}` as StringKey)} ×${n}`}
                type="footnote"
                color={palette.ember}
              />
            ))}
            {r.salvaged > 0 ? (
              <Label
                value={t("battle.salvaged", { gold: r.salvaged })}
                type="caption1"
                color={palette.muted}
              />
            ) : null}
            {r.levels > 0 ? (
              <Label
                value={t("toast.levelUp", {
                  level:
                    battle.state.actors.find((a) => a.id === "hero")!.level +
                    r.levels,
                })}
                type="headline"
                color={palette.good}
              />
            ) : null}
          </>
        ) : null}
        <GButton
          label={t("battle.continue")}
          icon="check"
          tone="primary"
          onPress={actions.leaveBattle}
        />
      </View>
    </View>
  );
}

export default function BattleScreen() {
  const { t } = useT();
  const battle = useGame((s) => s.battle);
  const auto = useGame((s) => s.save?.settings.autoBattle ?? false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const [pending, setPending] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const phase = battle?.phase;
  const deadline = battle?.deadline ?? 0;
  const heroStunned = battle
    ? hasStatus(
        battle.state.actors.find((a) => a.id === "hero")!,
        "stun",
      )
    : false;

  // The planning timer, auto-battle and stunned rounds.
  useEffect(() => {
    if (phase !== "planning") return;
    if (now >= deadline) actions.ready();
  }, [now, deadline, phase]);
  useEffect(() => {
    if (phase !== "planning" || !(auto || heroStunned)) return;
    const id = setTimeout(() => {
      if (auto && !heroStunned) actions.autoPlan();
      actions.ready();
    }, 700);
    return () => clearTimeout(id);
  }, [phase, auto, heroStunned, deadline]);

  const playback = usePlayback(battle!);
  const marks = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of battle?.plan.attacks ?? [])
      if (a.targetId) out[a.targetId] = (out[a.targetId] ?? 0) + 1;
    return out;
  }, [battle?.plan.attacks]);

  if (!battle) return null;
  const shown = battle.phase === "playing" ? playback.shown : battle.state;
  const secondsLeft = Math.max(0, Math.ceil((battle.deadline - now) / 1000));
  const pendingSkill = pending ? getSkill(pending) : null;
  const melee = pendingSkill?.effects.some(
    (e) => e.type === "damage" && e.delivery === "melee",
  );
  const foes = living(battle.state, 1);
  const front = foes.filter((f) => f.row === 0);
  const reachable = new Set(
    (melee && front.length > 0 ? front : foes).map((f) => f.id),
  );

  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 6,
          paddingStart: insets.left + 8,
          paddingEnd: insets.right + 8,
        },
      ]}
    >
      <Row gap={10} style={styles.topBar}>
        <Label
          value={t("battle.round", { round: battle.state.round })}
          type="headline"
          color={palette.gold}
        />
        <View style={styles.timer}>
          <Bar
            value={battle.phase === "planning" ? battle.deadline - now : 0}
            max={RULES.roundSeconds * 1000}
            color={secondsLeft <= 5 ? palette.bad : palette.gold}
            height={8}
          />
        </View>
        <Label
          value={battle.phase === "planning" ? `${secondsLeft}s` : "…"}
          type="headline"
        />
      </Row>
      <View style={styles.field}>
        <SideGrid
          state={shown}
          side={0}
          playback={playback}
          pick={null}
          marks={{}}
        />
        <View style={styles.versus}>
          <GIcon name="horse-head" size={22} color={palette.lineSoft} />
        </View>
        <SideGrid
          state={shown}
          side={1}
          playback={playback}
          marks={battle.phase === "planning" ? marks : {}}
          pick={
            pending && battle.phase === "planning"
              ? {
                  reachable,
                  onPick: (id) => {
                    actions.addAttack(pending, id);
                    setPending(null);
                  },
                }
              : null
          }
        />
        {playback.banner ? (
          <View style={styles.banner} pointerEvents="none">
            <Label value={playback.banner} type="title2" color="#d9a0ff" />
          </View>
        ) : null}
      </View>
      <View style={portrait ? styles.bottomPortrait : styles.bottom}>
        <View style={portrait ? null : styles.flex}>
          <Planner battle={battle} pending={pending} setPending={setPending} />
        </View>
        <View style={styles.readyColumn}>
          <GButton
            label={t("battle.auto")}
            icon="robot"
            compact
            tone={auto ? "primary" : "default"}
            onPress={actions.toggleAuto}
          />
          <GButton
            label={t("battle.ready")}
            icon="check"
            tone="primary"
            disabled={battle.phase !== "planning"}
            onPress={() => {
              setPending(null);
              actions.ready();
            }}
            style={portrait ? styles.readyPortrait : styles.ready}
          />
        </View>
      </View>
      {battle.phase === "over" ? <Results battle={battle} /> : null}
      <Toasts />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#120e0b" },
  flex: { flex: 1 },
  topBar: { minHeight: 40 },
  timer: { flex: 1 },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#1b1611",
    borderWidth: 1,
    borderColor: palette.lineSoft,
    overflow: "hidden",
  },
  side: { flex: 1, flexDirection: "row", justifyContent: "space-evenly" },
  column: { justifyContent: "space-evenly", gap: 4 },
  versus: { width: 30, alignItems: "center" },
  unit: { width: 92, minHeight: 64, alignItems: "center" },
  unitCompact: { width: 84, minHeight: 44 },
  unitInner: { alignItems: "center", gap: 1, width: "100%" },
  dead: { opacity: 0.35 },
  dimmed: { opacity: 0.4 },
  portrait: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
    overflow: "hidden",
  },
  bossPortrait: { width: 74, height: 74, borderRadius: 37 },
  portraitCompact: { width: 34, height: 34, borderRadius: 17 },
  bossPortraitCompact: { width: 46, height: 46, borderRadius: 23 },
  actingPortrait: { borderWidth: 3, borderColor: palette.white },
  blink: { ...StyleSheet.absoluteFill, backgroundColor: palette.white },
  mark: {
    position: "absolute",
    top: 2,
    end: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  unitBar: { width: 70 },
  float: { position: "absolute", top: 6, alignSelf: "center" },
  banner: {
    position: "absolute",
    top: "40%",
    start: 0,
    end: 0,
    alignItems: "center",
    padding: 10,
    backgroundColor: palette.overlay,
  },
  bottom: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  bottomPortrait: { gap: 8 },
  planner: {
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
  pip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: palette.night,
  },
  pipOn: { backgroundColor: palette.gold },
  pipFrozen: { borderColor: palette.status.freeze, backgroundColor: "#1a2a3a" },
  slots: { flexDirection: "row", gap: 4 },
  slot: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  slotFull: {
    borderStyle: "solid",
    borderColor: palette.gold,
    backgroundColor: palette.panelHi,
  },
  defense: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: palette.night,
  },
  tactic: {
    width: 34,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tacticFilled: { borderStyle: "solid", backgroundColor: palette.panelHi },
  tacticActive: { borderColor: palette.gold, borderWidth: 2 },
  tacticTool: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  readyColumn: { gap: 6 },
  bar: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  action: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panelHi,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPending: { borderColor: palette.white, borderWidth: 2 },
  actionOff: { opacity: 0.35 },
  ready: { minHeight: 64, minWidth: 110 },
  readyPortrait: { minHeight: 52 },
  resultsBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.shade,
    alignItems: "center",
    justifyContent: "center",
  },
  results: {
    minWidth: 280,
    maxWidth: 420,
    gap: 8,
    padding: 18,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: palette.panel,
  },
});
