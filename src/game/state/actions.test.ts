import { createBattle, emptyPlan } from "../sim/battle";
import { createHero, heroCombatant } from "../sim/hero";
import { Rng } from "../sim/rng";
import type { Look } from "../sim/types";

import {
  finishPlayback,
  ready,
  selectBattleTarget,
  setAttack,
} from "./actions";
import { store, type BattleSession } from "./store";

const LOOK: Look = {
  body: "kozak",
  face: 0,
  hair: 0,
  hairColor: 0,
  mustache: true,
};

it("keeps a plan edited during playback for the next round", () => {
  const hero = heroCombatant(createHero(new Rng(11), "Ostap", LOOK, "lytsar"));
  const state = createBattle(
    11,
    [hero],
    [
      { enemyId: "orc_grunt", level: 1 },
      { enemyId: "orc_grunt", level: 1 },
    ],
  );
  const enemies = state.actors.filter((a) => a.side === 1);
  // Leave the enemies idle so the test focuses on the plan transition.
  for (const enemy of enemies) enemy.controller = "player";
  const battle: BattleSession = {
    state,
    before: state,
    packId: null,
    plan: { ...emptyPlan(), attacks: [{ skillId: "strike" }] },
    enemyTargetId: null,
    allyTargetId: null,
    deadline: Date.now() + 15000,
    phase: "planning",
    events: [],
    rewards: null,
    returnTo: { x: 0, z: 0 },
  };
  store.set({ battle });
  try {
    selectBattleTarget(enemies[1].id);
    ready();
    const running = store.get().battle!;
    expect(running.phase).toBe("playing");
    expect(
      running.events.find(
        (event) => event.t === "action" && event.actor === "hero",
      ),
    ).toMatchObject({ targets: [enemies[1].id] });

    setAttack(0, "throw_stone");
    selectBattleTarget(enemies[0].id);
    expect(store.get().battle?.events).toBe(running.events);
    finishPlayback();
    const next = store.get().battle!;
    expect(next.phase).toBe("planning");
    expect(next.plan.attacks[0]).toEqual({ skillId: "throw_stone" });
    expect(next.enemyTargetId).toBe(enemies[0].id);
  } finally {
    store.set({ battle: null });
  }
});
