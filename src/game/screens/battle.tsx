import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/features/haptics";
import { useTypography } from "@/features/responsive";

import { getSkill, getZone, RULES } from "../data";
import { useT, type StringKey } from "../i18n";
import * as actions from "../state/actions";
import { useGame, type BattleSession } from "../state/store";
import {
  hasStatus,
  living,
  type BattleEvent,
  type BattleState,
  type Combatant,
} from "../sim/battle";
import { BattleBackdrop } from "../ui/backdrop";
import { nextHint } from "../state/tutorial";
import { HintCard } from "../ui/hint";
import { LevelBadge } from "../ui/level-badge";
import { ItemRow } from "../ui/items";
import { Bar, GButton, GIcon, Label, Row } from "../ui/kit";
import { palette } from "../ui/palette";

import {
  ActionPicker,
  ActionSlots,
  ActorPanel,
  TacticsBar,
} from "./battle-hud";
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

/** Lines a unit's name may wrap to; its box is always this tall. */
const NAME_LINES = 2;

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
  narrow,
  heroLevel,
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
  /** Slimmer units for narrow (portrait phone) screens. */
  narrow: boolean;
  /** Foes' level badges are coloured by danger against this. */
  heroLevel: number;
}) {
  const { tr } = useT();
  const typography = useTypography();
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
        narrow && styles.unitNarrow,
        dead && styles.dead,
        dimmed && styles.dimmed,
      ]}
    >
      <Animated.View style={[styles.unitInner, moveStyle]}>
        <View>
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
          <LevelBadge
            level={actor.level}
            heroLevel={actor.side === 0 ? undefined : heroLevel}
            style={styles.level}
          />
        </View>
        {/* Two lines tall whatever the name, so units line up in a row. */}
        <View
          style={[
            styles.name,
            { height: typography.caption2.lineHeight * NAME_LINES },
          ]}
        >
          <Label
            value={tr(actor.name)}
            type="caption2"
            numberOfLines={NAME_LINES}
            style={styles.nameText}
          />
        </View>
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
  selected,
  onSelect,
  marks,
}: {
  state: BattleState;
  side: 0 | 1;
  playback: ReturnType<typeof usePlayback>;
  /** The unit shown in the HUD's panel for this side. */
  selected?: string;
  onSelect?: (id: string) => void;
  marks: Record<string, number>;
}) {
  const window = useWindowDimensions();
  const compact = window.height < 520;
  // Four unit columns plus the gap must fit a phone held upright.
  const narrow = window.width < 440;
  const heroLevel = state.actors.find((a) => a.id === "hero")?.level ?? 1;
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
                  style={[
                    styles.unit,
                    compact && styles.unitCompact,
                    narrow && styles.unitNarrow,
                  ]}
                />
              );
            const can = !!onSelect && actor.hp > 0;
            return (
              <Unit
                key={actor.id}
                actor={actor}
                floaters={playback.floaters.filter((f) => f.actor === actor.id)}
                acting={playback.acting === actor.id}
                hitAt={playback.hitAt[actor.id]}
                targetable={selected === actor.id}
                dimmed={false}
                onPress={can ? () => onSelect(actor.id) : undefined}
                marked={marks[actor.id] ?? 0}
                compact={compact}
                narrow={narrow}
                heroLevel={heroLevel}
              />
            );
          })}
        </View>
      ))}
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

/** The clock turns red for the last seconds of planning. */
const URGENT_SECONDS = 5;
const URGENT_BG = "#3a1410";

/**
 * Ready, the round number and the planning clock in one button: its fill
 * drains as time runs out and turns red near the end, and pressing it ends
 * planning early.
 */
function ReadyButton({
  round,
  planning,
  msLeft,
  secondsLeft,
  onPress,
  style,
}: {
  round: number;
  planning: boolean;
  msLeft: number;
  secondsLeft: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const urgent = planning && secondsLeft <= URGENT_SECONDS;
  const share = planning
    ? Math.max(0, Math.min(1, msLeft / (RULES.roundSeconds * 1000)))
    : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("battle.ready")}, ${t("battle.round", { round })}`}
      disabled={!planning}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.readyButton,
        {
          borderColor: urgent ? palette.bad : palette.gold,
          backgroundColor: urgent ? URGENT_BG : palette.panelHi,
          opacity: !planning ? 0.6 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.readyFill,
          {
            width: `${share * 100}%`,
            backgroundColor: urgent ? palette.bad : palette.line,
          },
        ]}
      />
      <Label
        value={t("battle.round", { round })}
        type="caption2"
        color={palette.muted}
      />
      <Label value={t("battle.ready")} type="subheadline" />
      <Label
        value={planning ? `${secondsLeft}s` : "…"}
        type="headline"
        color={urgent ? palette.white : palette.gold}
      />
    </Pressable>
  );
}

export default function BattleScreen() {
  const { t } = useT();
  const battle = useGame((s) => s.battle);
  const auto = useGame((s) => s.save?.settings.autoBattle ?? false);
  const zoneId = useGame((s) => s.save?.world.zoneId ?? "kyiv");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const [now, setNow] = useState(() => Date.now());
  // The slot whose action picker is open, and the foe actions aim at.
  const [picking, setPicking] = useState<number | null>(null);
  const [chosenFoe, setChosenFoe] = useState<string | null>(null);

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
  // A tutorial hint pauses the clock; dismissing it restarts the round's.
  const hinting = useGame((s) =>
    s.save && s.battle
      ? nextHint(s.save, "battle", s.battle.state.round) !== null
      : false,
  );
  useEffect(() => {
    if (phase !== "planning" || hinting || picking !== null) return;
    if (now >= deadline) actions.ready();
  }, [now, deadline, phase, hinting, picking]);
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
  // `now` ticks every 200 ms, so right after a new deadline it can lag.
  const secondsLeft = Math.min(
    RULES.roundSeconds,
    Math.max(0, Math.ceil((battle.deadline - now) / 1000)),
  );
  const hero = shown.actors.find((a) => a.id === "hero");
  // The selected foe: the one tapped, while it stands; else the front one.
  const foes = living(shown, 1);
  const foe =
    foes.find((f) => f.id === chosenFoe) ??
    foes.find((f) => f.row === 0) ??
    foes[0];
  const planning = battle.phase === "planning";
  const slotSize = portrait
    ? Math.min(58, Math.floor((width - 24 - insets.left - insets.right) / 6))
    : height < 420
      ? 50
      : 58;

  const ally = <ActorPanel actor={hero} />;
  const enemy = (
    <ActorPanel actor={foe} heroLevel={hero?.level ?? 1} align="end" />
  );
  const slots = (
    <ActionSlots battle={battle} size={slotSize} onOpen={setPicking} />
  );

  return (
    <View style={styles.page}>
      <BattleBackdrop zone={getZone(zoneId)} />
      <View
        style={[
          styles.frame,
          {
            paddingTop: insets.top + 6,
            paddingBottom: insets.bottom + 6,
            paddingStart: insets.left + 8,
            paddingEnd: insets.right + 8,
          },
        ]}
      >
        <View style={styles.topBar}>
          <TacticsBar battle={battle} />
          <Row gap={6}>
            <GButton
              label={t("battle.auto")}
              icon="robot"
              compact
              tone={auto ? "primary" : "default"}
              onPress={actions.toggleAuto}
              style={styles.auto}
            />
            <ReadyButton
              round={battle.state.round}
              planning={planning}
              msLeft={battle.deadline - now}
              secondsLeft={secondsLeft}
              onPress={() => {
                setPicking(null);
                actions.ready();
              }}
              style={styles.ready}
            />
          </Row>
        </View>
        {/* The fighters stand in the middle, between the HUD's edges. */}
        <View style={styles.stage}>
          <SideGrid
            state={shown}
            side={0}
            playback={playback}
            selected={hero?.id}
            marks={{}}
          />
          <View style={styles.versus}>
            <GIcon name="horse-head" size={22} color={palette.lineSoft} />
          </View>
          <SideGrid
            state={shown}
            side={1}
            playback={playback}
            selected={planning ? foe?.id : undefined}
            onSelect={setChosenFoe}
            marks={planning ? marks : {}}
          />
          {playback.banner ? (
            <View style={styles.banner} pointerEvents="none">
              <Label value={playback.banner} type="title2" color="#d9a0ff" />
            </View>
          ) : null}
        </View>
        {portrait ? (
          <View style={styles.hudPortrait}>
            <Row gap={8} style={styles.panels}>
              <View style={styles.flex}>{ally}</View>
              <View style={styles.flex}>{enemy}</View>
            </Row>
            {slots}
          </View>
        ) : (
          <View style={styles.hud}>
            <View style={styles.panelSide}>{ally}</View>
            {slots}
            <View style={styles.panelSide}>{enemy}</View>
          </View>
        )}
      </View>
      {picking !== null && planning ? (
        <ActionPicker
          battle={battle}
          index={picking}
          targetId={foe?.id}
          onClose={() => setPicking(null)}
        />
      ) : null}
      {planning && picking === null ? (
        <HintCard where="battle" round={battle.state.round} />
      ) : null}
      {battle.phase === "over" ? <Results battle={battle} /> : null}
      <Toasts />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#120e0b" },
  /** Everything over the full-screen backdrop: top bar, stage, HUD. */
  frame: { ...StyleSheet.absoluteFill, gap: 6 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  stage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  hud: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  hudPortrait: { gap: 8, alignItems: "center" },
  panels: { alignSelf: "stretch" },
  panelSide: { flex: 1, maxWidth: 240 },
  flex: { flex: 1 },
  side: { flex: 1, flexDirection: "row", justifyContent: "space-evenly" },
  column: { justifyContent: "space-evenly", gap: 4 },
  versus: { width: 30, alignItems: "center" },
  unit: { width: 92, minHeight: 64, alignItems: "center" },
  unitCompact: { width: 84, minHeight: 44 },
  unitNarrow: { width: 80 },
  unitInner: { alignItems: "center", gap: 1, width: "100%" },
  name: { width: "100%", justifyContent: "center" },
  nameText: { textAlign: "center" },
  /** Overhangs the portrait's bottom corner, like a badge on an avatar. */
  level: { position: "absolute", bottom: -4, end: -12 },
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
  readyButton: {
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: palette.panelHi,
  },
  readyFill: { position: "absolute", top: 0, bottom: 0, start: 0 },
  auto: { minHeight: 62 },
  ready: { minWidth: 110 },
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
