import { getEnemy, getSkill, RULES } from "../data";

import { Rng } from "./rng";
import { addMods, emptyStats, enemyStats, RES_CAP } from "./stats";
import type {
  DamageType,
  Delivery,
  Localized,
  Skill,
  SkillEffect,
  StatMods,
  Stats,
  StatusKind,
} from "./types";

/**
 * The battle engine. Pure and deterministic: the same state, plans and seed
 * always resolve to the same events, so a server can run it for coop or PvP
 * and the client only animates what it returns.
 *
 * A round is: every side plans (attacks + defence + when it pressed Ready),
 * then `resolveRound` interleaves the actions by initiative and returns the
 * new state plus the events for the UI to play.
 */

export type Side = 0 | 1;

export type StatusInstance = {
  kind: StatusKind;
  turns: number;
  power: number;
  /** Applied this round; does not count down until the next one. */
  fresh: boolean;
};

export type Buff = { mods: StatMods; turns: number; source: string };

export type Combatant = {
  id: string;
  side: Side;
  row: 0 | 1;
  slot: number;
  name: Localized;
  kind: string;
  icon: string;
  level: number;
  base: Stats;
  hp: number;
  mana: number;
  stamina: number;
  statuses: StatusInstance[];
  buffs: Buff[];
  skills: string[];
  skillLevel: number;
  potions: { hp: number; mana: number };
  controller: "player" | "ai";
  enemyId?: string;
  boss?: boolean;
  phase: number;
  summoned?: boolean;
  /** A player's hero (this one or, later, another player's); not a monster. */
  player?: boolean;
  /** Joined after the fight began: another player's hero, or a protector. */
  joined?: boolean;
  /** The warden that stands with a much weaker side (see guardSides). */
  protector?: boolean;
  xp: number;
};

export type PlannedAction = { skillId: string; targetId?: string };

export type Plan = {
  attacks: PlannedAction[];
  defense: Record<Delivery, number>;
  /** Seconds left on the timer when Ready was pressed. */
  readyAt: number;
};

/** A saved plan the player can switch to in one tap; targets aren't kept. */
export type Tactic = Pick<Plan, "attacks" | "defense">;

export type BattleResult = "won" | "lost" | "fled";

export type BattleState = {
  rng: number;
  round: number;
  actors: Combatant[];
  result: BattleResult | null;
  /** Ids of every enemy defeated so far, for quest and reward bookkeeping. */
  defeated: string[];
};

export type BattleEvent =
  | { t: "round"; round: number }
  | { t: "action"; actor: string; skill: string; targets: string[] }
  | {
      t: "hit";
      actor: string;
      target: string;
      amount: number;
      crit: boolean;
      damageType: DamageType;
      hp: number;
    }
  | { t: "miss"; actor: string; target: string }
  | { t: "block"; actor: string; target: string; delivery: Delivery }
  | { t: "heal"; target: string; amount: number; hp: number }
  | { t: "mana"; target: string; amount: number }
  | { t: "status"; target: string; status: StatusKind }
  | { t: "buff"; target: string; skill: string }
  | {
      t: "tick";
      target: string;
      status: StatusKind;
      amount: number;
      hp: number;
    }
  | { t: "skip"; actor: string; reason: "stun" | "cost" | "potion" }
  | { t: "death"; target: string }
  | { t: "phase"; actor: string; name: Localized }
  | { t: "summon"; actor: Combatant }
  | { t: "join"; actor: Combatant }
  | { t: "flee"; actor: string; ok: boolean }
  | { t: "end"; result: BattleResult };

export const EMPTY_DEFENSE: Record<Delivery, number> = {
  melee: 0,
  ranged: 0,
  mental: 0,
};

export function emptyPlan(readyAt = 0): Plan {
  return { attacks: [], defense: { ...EMPTY_DEFENSE }, readyAt };
}

// ---------------------------------------------------------------- setup

export type EnemySpec = { enemyId: string; level: number };

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}${uid}`;
}

export function enemyCombatant(
  spec: EnemySpec,
  side: Side,
  row: 0 | 1,
  slot: number,
): Combatant {
  const def = getEnemy(spec.enemyId);
  const base = enemyStats(def, spec.level);
  return {
    id: nextId("e"),
    side,
    row,
    slot,
    name: def.name,
    kind: def.kind,
    icon: def.icon,
    level: spec.level,
    base,
    hp: base.maxHp,
    mana: base.maxMana,
    stamina: base.maxStamina,
    statuses: [],
    buffs: [],
    skills: [...def.skills],
    skillLevel: 1,
    potions: { hp: 0, mana: 0 },
    controller: "ai",
    enemyId: def.id,
    boss: def.boss,
    phase: 0,
    xp: def.xp,
  };
}

/** Places a side's line-up: melee in front, casters behind, the middle first. */
export function formation(
  specs: readonly EnemySpec[],
  side: Side,
): Combatant[] {
  const order = [1, 0, 2];
  const used = { 0: 0, 1: 0 };
  return specs.map((spec) => {
    const wantsBack = getEnemy(spec.enemyId).backRow ?? false;
    let row: 0 | 1 = wantsBack ? 1 : 0;
    if (used[row] >= 3) row = row === 0 ? 1 : 0;
    const slot = order[used[row]] ?? 0;
    used[row] += 1;
    return enemyCombatant(spec, side, row, slot);
  });
}

export function createBattle(
  seed: number,
  heroes: Combatant[],
  enemies: readonly EnemySpec[],
): BattleState {
  return {
    rng: seed,
    round: 1,
    actors: [...heroes, ...formation(enemies, 1)],
    result: null,
    defeated: [],
  };
}

// ---------------------------------------------------------------- queries

export function effectiveStats(actor: Combatant): Stats {
  const stats = addMods(emptyStats(), actor.base);
  for (const buff of actor.buffs) addMods(stats, buff.mods);
  for (const key of ["resPhysical", "resMagical", "resChaos"] as const) {
    stats[key] = Math.min(RES_CAP, stats[key]);
  }
  return stats;
}

export function hasStatus(actor: Combatant, kind: StatusKind): boolean {
  return actor.statuses.some((s) => s.kind === kind);
}

/** Action points this round: frozen actors lose two. */
export function apFor(actor: Combatant): number {
  return hasStatus(actor, "freeze") ? RULES.ap - 2 : RULES.ap;
}

export function planCost(plan: Plan): number {
  const attacks = plan.attacks.reduce(
    (sum, a) => sum + getSkill(a.skillId).ap,
    0,
  );
  const defense =
    plan.defense.melee + plan.defense.ranged + plan.defense.mental;
  return attacks + defense;
}

export function living(state: BattleState, side?: Side): Combatant[] {
  return state.actors.filter(
    (a) => a.hp > 0 && (side === undefined || a.side === side),
  );
}

export function canAfford(actor: Combatant, skill: Skill): boolean {
  if (skill.potion) return actor.potions[skill.potion] > 0;
  return (
    (skill.cost.hp ?? 0) < actor.hp &&
    (skill.cost.mana ?? 0) <= actor.mana &&
    (skill.cost.stamina ?? 0) <= actor.stamina
  );
}

function deliveryOf(skill: Skill): Delivery | undefined {
  for (const e of skill.effects) if (e.type === "damage") return e.delivery;
  return undefined;
}

/** Trims a plan to what the actor can do this round. */
export function sanitizePlan(actor: Combatant, plan: Plan): Plan {
  if (hasStatus(actor, "stun")) return emptyPlan(plan.readyAt);
  let budget = apFor(actor);
  const attacks: PlannedAction[] = [];
  for (const action of plan.attacks.slice(0, RULES.attackSlots)) {
    const skill = getSkill(action.skillId);
    if (skill.ap <= budget) {
      attacks.push(action);
      budget -= skill.ap;
    }
  }
  // A delivery is either defended (1 AP) or not.
  const defense = { ...EMPTY_DEFENSE };
  for (const kind of ["melee", "ranged", "mental"] as const) {
    if (plan.defense[kind] > 0 && budget > 0) {
      defense[kind] = 1;
      budget -= 1;
    }
  }
  return { attacks, defense, readyAt: plan.readyAt };
}

/**
 * Fits a plan (last round's, or a saved tactic) to the actor's AP,
 * resources and living foes: actions it can't pay for are dropped, and
 * attacks whose target is gone pick the weakest foe they can reach.
 */
export function fitPlan(
  state: BattleState,
  actor: Combatant,
  plan: Pick<Plan, "attacks" | "defense">,
): Plan {
  if (hasStatus(actor, "stun")) return emptyPlan();
  let ap = apFor(actor);
  let mana = actor.mana;
  let stamina = actor.stamina;
  const potions = { ...actor.potions };
  const foes = living(state, actor.side === 0 ? 1 : 0);
  const attacks: PlannedAction[] = [];
  for (const action of plan.attacks.slice(0, RULES.attackSlots)) {
    const skill = getSkill(action.skillId);
    const fits =
      skill.ap <= ap &&
      (skill.potion
        ? potions[skill.potion] > 0
        : (skill.cost.mana ?? 0) <= mana &&
          (skill.cost.stamina ?? 0) <= stamina &&
          (skill.cost.hp ?? 0) < actor.hp);
    if (!fits) continue;
    ap -= skill.ap;
    mana -= skill.cost.mana ?? 0;
    stamina -= skill.cost.stamina ?? 0;
    if (skill.potion) potions[skill.potion] -= 1;
    let targetId: string | undefined;
    if (skill.target === "enemy" || skill.target === "enemyRow") {
      const melee = deliveryOf(skill) === "melee";
      const front = foes.filter((f) => f.row === 0);
      const pool = melee && front.length > 0 ? front : foes;
      targetId = pool.some((f) => f.id === action.targetId)
        ? action.targetId
        : pool.reduce<Combatant | undefined>(
            (low, f) => (!low || f.hp < low.hp ? f : low),
            undefined,
          )?.id;
    }
    attacks.push({ skillId: skill.id, targetId });
  }
  const defense = { ...EMPTY_DEFENSE };
  for (const kind of ["melee", "ranged", "mental"] as const) {
    if (plan.defense[kind] > 0 && ap > 0) {
      defense[kind] = 1;
      ap -= 1;
    }
  }
  return { attacks, defense, readyAt: 0 };
}

// ---------------------------------------------------------------- resolution

type Ctx = {
  rng: Rng;
  state: BattleState;
  events: BattleEvent[];
  defense: Map<string, Record<Delivery, number>>;
};

function byId(state: BattleState, id: string): Combatant | undefined {
  return state.actors.find((a) => a.id === id);
}

function opponentsOf(ctx: Ctx, actor: Combatant): Combatant[] {
  return living(ctx.state, actor.side === 0 ? 1 : 0);
}

function reachable(
  ctx: Ctx,
  actor: Combatant,
  delivery: Delivery | undefined,
): Combatant[] {
  const foes = opponentsOf(ctx, actor);
  if (delivery !== "melee") return foes;
  const front = foes.filter((f) => f.row === 0);
  return front.length > 0 ? front : foes;
}

function resolveTargets(
  ctx: Ctx,
  actor: Combatant,
  skill: Skill,
  wanted?: string,
): Combatant[] {
  switch (skill.target) {
    case "self":
      return [actor];
    case "ally": {
      const allies = living(ctx.state, actor.side);
      return allies.length === 0
        ? []
        : [
            allies.reduce((low, a) =>
              a.hp / a.base.maxHp < low.hp / low.base.maxHp ? a : low,
            ),
          ];
    }
    case "allEnemies":
      return opponentsOf(ctx, actor);
    default: {
      const pool = reachable(ctx, actor, deliveryOf(skill));
      if (pool.length === 0) return [];
      const chosen = pool.find((p) => p.id === wanted) ?? ctx.rng.pick(pool);
      if (skill.target === "enemyRow") {
        return opponentsOf(ctx, actor).filter((f) => f.row === chosen.row);
      }
      return [chosen];
    }
  }
}

function resistance(stats: Stats, type: DamageType): number {
  if (type === "physical") return stats.resPhysical;
  if (type === "magical") return stats.resMagical;
  return stats.resChaos;
}

function increased(stats: Stats, type: DamageType): number {
  if (type === "physical") return stats.incPhysical;
  if (type === "magical") return stats.incMagical;
  return stats.incChaos;
}

/** Percent to hit before the defence pool is counted, and after. */
export function hitChance(
  attacker: Stats,
  defender: Stats,
  defensePoints: number,
): number {
  const base = 70 + (attacker.accuracy - defender.evasion) * 0.5;
  const adjusted = defensePoints > 0 ? base - 25 : base + 15;
  return Math.max(5, Math.min(95, adjusted));
}

function damage(
  ctx: Ctx,
  actor: Combatant,
  target: Combatant,
  skill: Skill,
  effect: Extract<SkillEffect, { type: "damage" }>,
): number | null {
  const { rng } = ctx;
  const a = effectiveStats(actor);
  const d = effectiveStats(target);
  const pools = ctx.defense.get(target.id) ?? { ...EMPTY_DEFENSE };
  const points = pools[effect.delivery];
  const chance = hitChance(a, d, points);
  const roll = rng.next() * 100;
  if (roll >= chance) {
    // It would have landed with an empty pool: the defence took it.
    if (points > 0 && roll < hitChance(a, d, 0)) {
      pools[effect.delivery] = points - 1;
      ctx.defense.set(target.id, pools);
      ctx.events.push({
        t: "block",
        actor: actor.id,
        target: target.id,
        delivery: effect.delivery,
      });
    } else {
      ctx.events.push({ t: "miss", actor: actor.id, target: target.id });
    }
    return null;
  }
  let amount = rng.int(effect.base[0], effect.base[1]);
  if (effect.weapon > 0) {
    amount +=
      effect.weapon * rng.int(a.weaponMin, Math.max(a.weaponMin, a.weaponMax));
  }
  if (effect.damageType === "physical") amount += a.addedPhysical;
  amount *= 1 + increased(a, effect.damageType) / 100;
  amount *= 1 + ((skill.perLevel ?? 0) * (actor.skillLevel - 1)) / 100;
  const crit = rng.chance(a.critChance);
  if (crit) amount *= a.critMulti / 100;
  amount *= 1 - resistance(d, effect.damageType) / 100;
  const dealt = Math.max(1, Math.round(amount));
  target.hp = Math.max(0, target.hp - dealt);
  ctx.events.push({
    t: "hit",
    actor: actor.id,
    target: target.id,
    amount: dealt,
    crit,
    damageType: effect.damageType,
    hp: target.hp,
  });
  return dealt;
}

function heal(ctx: Ctx, target: Combatant, amount: number) {
  const before = target.hp;
  target.hp = Math.min(target.base.maxHp, target.hp + Math.round(amount));
  ctx.events.push({
    t: "heal",
    target: target.id,
    amount: target.hp - before,
    hp: target.hp,
  });
}

function freeSlot(ctx: Ctx, side: Side): { row: 0 | 1; slot: number } | null {
  return openSlot(ctx.state, side);
}

function openSlot(
  state: BattleState,
  side: Side,
): { row: 0 | 1; slot: number } | null {
  for (const row of [0, 1] as const) {
    for (const slot of [1, 0, 2]) {
      const taken = living(state, side).some(
        (a) => a.row === row && a.slot === slot,
      );
      if (!taken) return { row, slot };
    }
  }
  return null;
}

function summon(ctx: Ctx, actor: Combatant, enemyId: string, count: number) {
  for (let i = 0; i < count; i++) {
    const summons = living(ctx.state, actor.side).filter((a) => a.summoned);
    if (summons.length >= RULES.maxSummons) return;
    const place = freeSlot(ctx, actor.side);
    if (!place) return;
    const minion = enemyCombatant(
      { enemyId, level: Math.max(1, actor.level - 2) },
      actor.side,
      place.row,
      place.slot,
    );
    minion.summoned = true;
    minion.xp = 0;
    ctx.state.actors.push(minion);
    ctx.events.push({ t: "summon", actor: minion });
  }
}

function checkPhase(ctx: Ctx, actor: Combatant) {
  if (!actor.enemyId || actor.hp <= 0) return;
  const phases = getEnemy(actor.enemyId).phases ?? [];
  const next = phases[actor.phase];
  if (!next || (actor.hp / actor.base.maxHp) * 100 > next.atHpPercent) return;
  actor.phase += 1;
  if (next.skills) actor.skills = [...next.skills];
  if (next.mods)
    actor.buffs.push({ mods: next.mods, turns: 999, source: "phase" });
  ctx.events.push({ t: "phase", actor: actor.id, name: next.name });
  if (next.summon) summon(ctx, actor, next.summon.enemyId, next.summon.count);
}

function applyStatus(
  ctx: Ctx,
  target: Combatant,
  kind: StatusKind,
  turns: number,
  power: number,
) {
  const existing = target.statuses.find((s) => s.kind === kind);
  if (existing) {
    existing.turns = Math.max(existing.turns, turns);
    existing.power = Math.max(existing.power, power);
    existing.fresh = true;
  } else {
    target.statuses.push({ kind, turns, power, fresh: true });
  }
  ctx.events.push({ t: "status", target: target.id, status: kind });
}

function noteDeath(ctx: Ctx, target: Combatant) {
  if (target.hp > 0 || ctx.state.defeated.includes(target.id)) return;
  target.statuses = [];
  target.buffs = [];
  ctx.state.defeated.push(target.id);
  ctx.events.push({ t: "death", target: target.id });
}

function perform(ctx: Ctx, actor: Combatant, action: PlannedAction) {
  if (actor.hp <= 0) return;
  const skill = getSkill(action.skillId);
  if (skill.flee) {
    const ok = ctx.rng.chance(fleeChance(ctx.state, actor));
    ctx.events.push({ t: "flee", actor: actor.id, ok });
    if (ok) ctx.state.result = "fled";
    return;
  }
  if (!canAfford(actor, skill)) {
    ctx.events.push({
      t: "skip",
      actor: actor.id,
      reason: skill.potion ? "potion" : "cost",
    });
    return;
  }
  const targets = resolveTargets(ctx, actor, skill, action.targetId);
  if (targets.length === 0) return;
  actor.hp -= skill.cost.hp ?? 0;
  actor.mana -= skill.cost.mana ?? 0;
  actor.stamina -= skill.cost.stamina ?? 0;
  if (skill.potion) actor.potions[skill.potion] -= 1;
  ctx.events.push({
    t: "action",
    actor: actor.id,
    skill: skill.id,
    targets: targets.map((t) => t.id),
  });

  if (skill.potion === "mana") {
    const before = actor.mana;
    actor.mana = Math.min(
      actor.base.maxMana,
      actor.mana + 20 + actor.base.maxMana * 0.4,
    );
    actor.mana = Math.round(actor.mana);
    ctx.events.push({
      t: "mana",
      target: actor.id,
      amount: actor.mana - before,
    });
  }

  for (const target of targets) {
    let lastHit = 0;
    let landed = false;
    for (const effect of skill.effects) {
      if (target.hp <= 0 && effect.type !== "summon") break;
      switch (effect.type) {
        case "damage": {
          for (let h = 0; h < (effect.hits ?? 1); h++) {
            if (target.hp <= 0) break;
            const dealt = damage(ctx, actor, target, skill, effect);
            if (dealt !== null) {
              landed = true;
              lastHit = dealt;
              checkPhase(ctx, target);
            }
          }
          noteDeath(ctx, target);
          break;
        }
        case "status": {
          const hasDamage = skill.effects.some((e) => e.type === "damage");
          if ((!hasDamage || landed) && ctx.rng.chance(effect.chance)) {
            applyStatus(
              ctx,
              target,
              effect.status,
              effect.turns,
              Math.max(2, Math.round(lastHit * 0.3) || actor.level * 2),
            );
          }
          break;
        }
        case "heal": {
          // A heal on an attack (a drain) goes to the attacker.
          const who = skill.target === "enemy" ? actor : target;
          if (skill.target === "enemy" && !landed) break;
          heal(
            ctx,
            who,
            effect.amount + ((effect.percent ?? 0) / 100) * who.base.maxHp,
          );
          break;
        }
        case "buff":
          target.buffs.push({
            mods: effect.mods,
            turns: effect.turns,
            source: skill.id,
          });
          ctx.events.push({ t: "buff", target: target.id, skill: skill.id });
          break;
        case "summon":
          summon(ctx, actor, effect.enemyId, effect.count);
          break;
      }
    }
  }
}

function initiative(ctx: Ctx, actor: Combatant, plan: Plan): number {
  const ready = Math.min(5, Math.max(0, plan.readyAt) / 3);
  return effectiveStats(actor).speed + ready + ctx.rng.next() * 4;
}

/** Percent for one Flee attempt: speed against the foes', worse vs bosses. */
export function fleeChance(state: BattleState, actor: Combatant): number {
  const foes = living(state, actor.side === 0 ? 1 : 0);
  const foeSpeed =
    foes.reduce((sum, f) => sum + effectiveStats(f).speed, 0) /
    Math.max(1, foes.length);
  const boss = foes.some((f) => f.boss) ? 20 : 0;
  return Math.round(
    Math.max(
      10,
      Math.min(75, 35 + (effectiveStats(actor).speed - foeSpeed) * 3 - boss),
    ),
  );
}

function endOfRound(ctx: Ctx) {
  for (const actor of living(ctx.state)) {
    for (const status of actor.statuses) {
      if (status.kind === "burn") {
        actor.hp = Math.max(0, actor.hp - status.power);
        ctx.events.push({
          t: "tick",
          target: actor.id,
          status: "burn",
          amount: status.power,
          hp: actor.hp,
        });
      }
    }
    noteDeath(ctx, actor);
    if (actor.hp <= 0) continue;
    actor.statuses = actor.statuses
      .map((s) =>
        s.fresh ? { ...s, fresh: false } : { ...s, turns: s.turns - 1 },
      )
      .filter((s) => s.turns > 0);
    actor.buffs = actor.buffs
      .map((b) => ({ ...b, turns: b.turns - 1 }))
      .filter((b) => b.turns > 0);
    const stats = effectiveStats(actor);
    actor.hp = Math.min(stats.maxHp, actor.hp + Math.round(stats.hpRegen));
    actor.mana = Math.min(
      stats.maxMana,
      actor.mana + Math.round(stats.manaRegen),
    );
    actor.stamina = Math.min(
      stats.maxStamina,
      actor.stamina + Math.round(stats.staminaRegen),
    );
  }
}

function settle(ctx: Ctx): boolean {
  if (living(ctx.state, 1).length === 0) ctx.state.result = "won";
  else if (living(ctx.state, 0).length === 0) ctx.state.result = "lost";
  if (ctx.state.result) {
    ctx.events.push({ t: "end", result: ctx.state.result });
    return true;
  }
  return false;
}

export function resolveRound(
  previous: BattleState,
  plans: Record<string, Plan>,
): { state: BattleState; events: BattleEvent[] } {
  const state: BattleState = structuredClone(previous);
  const ctx: Ctx = {
    rng: new Rng(state.rng),
    state,
    events: [],
    defense: new Map(),
  };
  ctx.events.push({ t: "round", round: state.round });

  const order: { actor: Combatant; plan: Plan; init: number }[] = [];
  for (const actor of living(state)) {
    const plan = sanitizePlan(actor, plans[actor.id] ?? emptyPlan());
    ctx.defense.set(actor.id, { ...plan.defense });
    if (hasStatus(actor, "stun")) {
      ctx.events.push({ t: "skip", actor: actor.id, reason: "stun" });
      continue;
    }
    order.push({ actor, plan, init: initiative(ctx, actor, plan) });
  }
  order.sort((a, b) => b.init - a.init);

  for (let slot = 0; slot < RULES.attackSlots && !state.result; slot++) {
    for (const { actor, plan } of order) {
      const action = plan.attacks[slot];
      if (!action) continue;
      perform(ctx, actor, action);
      if (settle(ctx)) break;
    }
  }
  if (!state.result) {
    endOfRound(ctx);
    if (!settle(ctx)) state.round += 1;
  }
  state.rng = ctx.rng.seed;
  return { state, events: ctx.events };
}

/** Looks an actor up in a state, for UI code that only has ids. */
export function findActor(
  state: BattleState,
  id: string,
): Combatant | undefined {
  return byId(state, id);
}

// ---------------------------------------------------------------- joining

/** One side's player heroes' levels, or null if it has none. */
function playerLevels(state: BattleState, side: Side): number[] | null {
  const levels = living(state, side)
    .filter((a) => a.player)
    .map((a) => a.level);
  return levels.length > 0 ? levels : null;
}

/**
 * Griefing protection. When one side's strongest player hero is above
 * RULES.protector.ratio times the sum of the other side's player levels
 * (2: two level-2 heroes can be attacked up to level 8, from 9 the
 * protector comes), a protector joins the weaker side: an NPC far out of balance that ends the
 * fight in a round or two. Only fights with players on both sides count
 * (monsters never call one), and a side gets at most one.
 */
export function guardSides(state: BattleState): {
  state: BattleState;
  events: BattleEvent[];
} {
  const next: BattleState = structuredClone(state);
  const events: BattleEvent[] = [];
  for (const side of [0, 1] as const) {
    const other: Side = side === 0 ? 1 : 0;
    const mine = playerLevels(next, side);
    const theirs = playerLevels(next, other);
    if (mine === null || theirs === null) continue;
    const top = Math.max(...theirs);
    const sum = mine.reduce((a, b) => a + b, 0);
    if (top <= sum * RULES.protector.ratio) continue;
    if (living(next, side).some((a) => a.protector)) continue;
    const place = openSlot(next, side);
    if (!place) continue;
    const warden = enemyCombatant(
      { enemyId: RULES.protector.enemyId, level: top + 5 },
      side,
      place.row,
      place.slot,
    );
    warden.protector = true;
    warden.joined = true;
    warden.xp = 0;
    next.actors.push(warden);
    events.push({ t: "join", actor: warden });
  }
  return { state: next, events };
}

/**
 * Another player's hero joins a fight in progress, on `side`, from the next
 * round. Monsters never join; a side is full at six. Joining can bring a
 * protector to the other side when the newcomer far outlevels it.
 */
export function joinBattle(
  state: BattleState,
  hero: Combatant,
  side: Side,
): { state: BattleState; events: BattleEvent[] } | null {
  if (!hero.player || state.result) return null;
  const place = openSlot(state, side);
  if (!place) return null;
  const next: BattleState = structuredClone(state);
  const joiner: Combatant = {
    ...structuredClone(hero),
    side,
    row: place.row,
    slot: place.slot,
    joined: true,
  };
  next.actors.push(joiner);
  const guarded = guardSides(next);
  return {
    state: guarded.state,
    events: [{ t: "join", actor: joiner }, ...guarded.events],
  };
}
