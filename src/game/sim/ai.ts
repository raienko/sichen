import { getSkill, RULES } from "../data";

import {
  apFor,
  EMPTY_DEFENSE,
  emptyPlan,
  hasStatus,
  living,
  type BattleState,
  type Combatant,
  type Plan,
  type PlannedAction,
} from "./battle";
import type { Rng } from "./rng";
import { DELIVERIES, type Delivery, type Skill } from "./types";

/**
 * Plans a round for any combatant: enemies always, the hero when auto-battle
 * is on. It spends most AP on attacks it can afford and puts the rest into
 * defence against what the other side mostly uses.
 */
export function planFor(
  state: BattleState,
  actor: Combatant,
  rng: Rng,
  available: readonly string[] = actor.skills,
): Plan {
  const plan = emptyPlan(rng.int(2, 10));
  if (hasStatus(actor, "stun")) return plan;
  const foes = living(state, actor.side === 0 ? 1 : 0);
  const allies = living(state, actor.side);
  if (foes.length === 0) return plan;

  let ap = apFor(actor);
  let mana = actor.mana;
  let stamina = actor.stamina;
  const potions = { ...actor.potions };
  const hpShare = actor.hp / actor.base.maxHp;
  const attacks: PlannedAction[] = [];
  const used = new Set<string>();

  const affordable = (skill: Skill) =>
    skill.ap <= ap &&
    (skill.potion
      ? potions[skill.potion] > 0
      : (skill.cost.mana ?? 0) <= mana && (skill.cost.stamina ?? 0) <= stamina);

  const take = (skill: Skill, targetId?: string) => {
    attacks.push({ skillId: skill.id, targetId });
    ap -= skill.ap;
    mana -= skill.cost.mana ?? 0;
    stamina -= skill.cost.stamina ?? 0;
    if (skill.potion) potions[skill.potion] -= 1;
    used.add(skill.id);
  };

  // Drink first when it matters.
  if (hpShare < 0.35 && available.includes("potion_hp")) {
    const potion = getSkill("potion_hp");
    if (affordable(potion)) take(potion);
  }
  if (
    actor.mana < actor.base.maxMana * 0.2 &&
    available.includes("potion_mana")
  ) {
    const potion = getSkill("potion_mana");
    if (affordable(potion)) take(potion);
  }

  // Keep one or two deliveries defended most rounds.
  const reserve = rng.weighted<number>([
    [0, 3],
    [1, 4],
    [2, 3],
    [3, 1],
  ]);
  const weakest = foes.reduce((low, f) => (f.hp < low.hp ? f : low));
  const hurtAlly = allies.find((a) => a.hp / a.base.maxHp < 0.6);

  while (ap > reserve && attacks.length < RULES.attackSlots) {
    const options: [Skill, number][] = [];
    for (const id of available) {
      const skill = getSkill(id);
      if (skill.potion || skill.flee || !affordable(skill)) continue;
      const isAttack = skill.effects.some((e) => e.type === "damage");
      const isSummon = skill.effects.some((e) => e.type === "summon");
      if (skill.target === "self" && used.has(skill.id)) continue;
      if (skill.target === "ally" && !hurtAlly) continue;
      if (skill.id === "retreat") continue;
      let weight = isAttack ? 2 + skill.ap * 2 : 2;
      if (skill.target === "ally") weight = 8;
      if (isSummon) weight = allies.length < 3 ? 5 : 0;
      if (skill.target === "allEnemies" || skill.target === "enemyRow") {
        weight += foes.length > 1 ? 3 : -2;
      }
      if (id === "throw_stone" || id === "strike") weight = 1.5;
      if (weight > 0) options.push([skill, weight]);
    }
    if (options.length === 0) break;
    const skill = rng.weighted(options);
    const target = rng.chance(60) ? weakest : rng.pick(foes);
    take(
      skill,
      skill.target === "enemy" || skill.target === "enemyRow"
        ? target.id
        : undefined,
    );
  }

  // The rest defends deliveries (one AP each, on or off), weighted by what
  // the foes can throw; any AP still left goes to basic strikes.
  const threat: Record<Delivery, number> = { melee: 1, ranged: 1, mental: 1 };
  for (const foe of foes) {
    for (const id of foe.skills) {
      for (const e of getSkill(id).effects) {
        if (e.type === "damage") threat[e.delivery] += 1;
      }
    }
  }
  const defense = { ...EMPTY_DEFENSE };
  while (ap > 0) {
    const open = DELIVERIES.filter((k) => defense[k] === 0);
    if (open.length === 0) break;
    const kind = rng.weighted<Delivery>(open.map((k) => [k, threat[k]]));
    defense[kind] = 1;
    ap -= 1;
  }
  for (const id of ["strike", "throw_stone"]) {
    if (!available.includes(id)) continue;
    const skill = getSkill(id);
    while (affordable(skill) && attacks.length < RULES.attackSlots)
      take(skill, rng.chance(60) ? weakest.id : rng.pick(foes).id);
  }
  return { ...plan, attacks, defense };
}
