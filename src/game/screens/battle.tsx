import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/features/haptics";

import { getBase, getSkill, getZone, RULES } from "../data";
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

import BattleStage, { type UnitSpot } from "../render/battle-scene";

import {
  ActionPicker,
  ActionSlots,
  ActorPanel,
  arcLayout,
  ReadyArc,
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

/**
 * What floats over a fighter in the 3D scene: level, statuses, marks and
 * bars above the head, a ring at the feet, and the tap area between. It
 * sits at the screen point the scene projected for the unit.
 */
function UnitTag({
  actor,
  spot,
  floaters,
  marked,
  heroLevel,
  onPress,
}: {
  actor: Combatant;
  spot: UnitSpot;
  floaters: Floater[];
  marked: number;
  heroLevel: number;
  onPress?: () => void;
}) {
  const { tr } = useT();
  const dead = actor.hp <= 0;
  const tall = Math.max(40, spot.feet - spot.head);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr(actor.name)}
        disabled={!onPress}
        onPress={onPress}
        style={[
          styles.hitArea,
          // The figure's whole box and a margin: easy to hit, and the
          // staggered formation keeps neighbours' boxes apart.
          { left: spot.x - 38, top: spot.head - 10, height: tall + 22 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.tag, { left: spot.x - 40, top: spot.head - 30 }]}
      >
        {dead ? null : (
          <>
            <Row gap={3}>
              <LevelBadge
                level={actor.level}
                heroLevel={actor.side === 0 ? undefined : heroLevel}
              />
              {actor.statuses.map((st) => (
                <GIcon
                  key={st.kind}
                  name={
                    st.kind === "burn"
                      ? "fire"
                      : st.kind === "freeze"
                        ? "snowflake"
                        : "star"
                  }
                  size={11}
                  color={palette.status[st.kind]}
                />
              ))}
              {actor.buffs.length > 0 ? (
                <GIcon name="arrow-up" size={11} color={palette.good} />
              ) : null}
              {marked > 0 ? (
                <View style={styles.mark}>
                  <Label
                    value={String(marked)}
                    type="caption2"
                    color={palette.night}
                  />
                </View>
              ) : null}
            </Row>
            <Bar
              value={actor.hp}
              max={actor.base.maxHp}
              color={palette.hp}
              height={6}
              style={styles.tagBar}
            />
            {/* Foes with a token mana pool (growth only) don't need the bar. */}
            {actor.side === 0 || actor.base.maxMana >= 20 ? (
              <Bar
                value={actor.mana}
                max={actor.base.maxMana}
                color={palette.mana}
                height={3}
                style={styles.tagBar}
              />
            ) : null}
          </>
        )}
        {floaters.map((f) => (
          <FloatText key={f.id} text={f.text} color={f.color} />
        ))}
      </View>
    </>
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
  const battle = useGame((s) => s.battle);
  const auto = useGame((s) => s.save?.settings.autoBattle ?? false);
  const zoneId = useGame((s) => s.save?.world.zoneId ?? "kyiv");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [now, setNow] = useState(() => Date.now());
  // The slot whose action picker is open, and the foe actions aim at.
  const [picking, setPicking] = useState<number | null>(null);
  const [chosenFoe, setChosenFoe] = useState<string | null>(null);
  // Where the 3D scene drew each fighter, for the overlay.
  const [spots, setSpots] = useState<Record<string, UnitSpot>>({});
  // The middle band's top and height in the page, measured.
  const [band, setBand] = useState<{ y: number; h: number } | null>(null);
  const heroSave = useGame((s) => s.save?.hero);
  const heroLook = useMemo(() => {
    const weapon = heroSave?.equipment.weapon;
    return {
      look: heroSave?.look ?? {
        body: "kozak" as const,
        face: 0,
        hair: 0,
        hairColor: 0,
        mustache: true,
      },
      classId: heroSave?.classId ?? "lytsar",
      weapon: weapon ? getBase(weapon.baseId).kind : undefined,
      helmet: !!heroSave?.equipment.helmet,
    };
  }, [heroSave]);

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
  // The five slots, Auto and Ready share the bottom row: the largest slot
  // (40-54 points; Ready half as large again, at least 68) whose two groups
  // still fit side by side.
  const room = width - insets.left - insets.right - 16 - 8;
  let slotSize = 54;
  const readySize = (s: number) => Math.max(68, Math.round(s * 1.5));
  while (
    slotSize > 40 &&
    5 * slotSize + 16 + arcLayout(slotSize, readySize(slotSize)).width > room
  )
    slotSize -= 1;

  // The hero's shadow glows gold, the selected foe's white (while planning).
  const highlights: Record<string, number> = { hero: 0xd4a94e };
  if (planning && foe) highlights[foe.id] = 0xffffff;
  // Short (landscape phone) screens get slimmer panels, more room to fight.
  const short = height < 500;
  const ally = <ActorPanel actor={hero} compact={short} />;
  const enemy = (
    <ActorPanel
      actor={foe}
      heroLevel={hero?.level ?? 1}
      align="end"
      compact={short}
    />
  );
  // Where the fighters must stand on screen. Portrait: between the panels
  // and the controls, which span the width. Landscape: down to the bottom
  // edge too, since the controls keep to the corners and the hero stands in
  // the open middle.
  const fightBand = band
    ? {
        top: band.y,
        height: width > height ? height - band.y - insets.bottom : band.h,
      }
    : null;
  const slots = (
    <ActionSlots battle={battle} size={slotSize} onOpen={setPicking} />
  );
  const ready = (
    <ReadyArc
      battle={battle}
      slot={slotSize}
      ready={readySize(slotSize)}
      msLeft={battle.deadline - now}
      secondsLeft={secondsLeft}
      auto={auto}
      onReady={() => {
        setPicking(null);
        actions.ready();
      }}
    />
  );

  return (
    <View style={styles.page}>
      <BattleBackdrop zone={getZone(zoneId)} />
      {/* The scene fills the screen behind the HUD, as in the world. */}
      <View style={StyleSheet.absoluteFill}>
        <BattleStage
          actors={shown.actors}
          hero={heroLook}
          motion={playback}
          highlights={highlights}
          band={fightBand}
          onProject={setSpots}
        />
      </View>
      {/* Tags, rings and tap areas over the 3D fighters. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {shown.actors.map((a) => {
          const spot = spots[a.id];
          if (!spot) return null;
          const isFoe = a.side === 1;
          return (
            <UnitTag
              key={a.id}
              actor={a}
              spot={spot}
              floaters={playback.floaters.filter((f) => f.actor === a.id)}
              marked={planning ? (marks[a.id] ?? 0) : 0}
              heroLevel={hero?.level ?? 1}
              onPress={isFoe && a.hp > 0 ? () => setChosenFoe(a.id) : undefined}
            />
          );
        })}
      </View>
      {/* The HUD: what you read at the top, what you press at the bottom
          corners (thumbs; the middle stays clear for foldables). */}
      <View
        pointerEvents="box-none"
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
        <View pointerEvents="box-none" style={styles.topBar}>
          <View style={styles.panelSide}>{ally}</View>
          <View style={styles.panelSide}>{enemy}</View>
        </View>
        {/* The free band between the panels and the controls: the camera
            frames the fighters into it. */}
        <View
          pointerEvents="box-none"
          style={styles.middle}
          onLayout={(e) => {
            const { y, height: h } = e.nativeEvent.layout;
            setBand((b) => (b?.y === y && b.h === h ? b : { y, h }));
          }}
        >
          {playback.banner ? (
            <View style={styles.banner} pointerEvents="none">
              <Label value={playback.banner} type="title2" color="#d9a0ff" />
            </View>
          ) : null}
        </View>
        {/* Two outer thumb groups, bottoms level; the middle stays open. */}
        <View pointerEvents="box-none" style={styles.hudRowEnd}>
          {slots}
          {ready}
        </View>
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
  panelSide: { flex: 1, maxWidth: 260 },
  middle: { flex: 1, justifyContent: "center" },
  hudRowEnd: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  hitArea: { position: "absolute", width: 76 },
  tag: { position: "absolute", width: 80, alignItems: "center", gap: 2 },
  tagBar: { width: 56 },
  flex: { flex: 1 },
  /** Overhangs the portrait's bottom corner, like a badge on an avatar. */
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
