import { useSyncExternalStore } from "react";

import type { StringKey, Vars } from "../i18n";
import type { BattleEvent, BattleState, Plan } from "../sim/battle";
import type { DeathCard } from "../sim/death";
import type { Drops } from "../sim/loot";

import type { SaveData } from "./save";

export type Scene =
  | { name: "title" }
  | { name: "create"; slot: number }
  | { name: "world" }
  | { name: "battle" }
  | { name: "death"; cards: DeathCard[]; picked: number | null };

export type Panel =
  | { name: "inventory" }
  | { name: "character" }
  | { name: "skills" }
  | { name: "tree" }
  | { name: "quests" }
  | { name: "menu" }
  | { name: "npc"; npcId: string }
  | { name: "interact"; interactableId: string }
  | { name: "inspect"; packId: string };

export type Rewards = Drops & {
  xp: number;
  levels: number;
  salvaged: number;
  questsUpdated: string[];
};

export type BattleSession = {
  state: BattleState;
  packId: string | null;
  questChoice?: { questId: string; choiceId: string };
  plan: Plan;
  /** When the planning timer runs out (ms since epoch). */
  deadline: number;
  phase: "planning" | "playing" | "over";
  /** The last resolved round, for the UI to play back. */
  events: BattleEvent[];
  /** The state before that round, so playback can start from it. */
  before: BattleState;
  rewards: Rewards | null;
  /** Where the hero was standing, to go back to after the battle. */
  returnTo: { x: number; z: number };
};

export type Toast = {
  id: number;
  icon: string;
  key: StringKey;
  vars?: Vars;
  tone?: "good" | "bad" | "loot";
};

export type GameState = {
  scene: Scene;
  slots: (SaveData | null)[];
  slot: number | null;
  save: SaveData | null;
  panel: Panel | null;
  battle: BattleSession | null;
  toasts: Toast[];
  /** Bumps when the world must re-read zone data (zone change, battle end). */
  worldVersion: number;
};

type Listener = () => void;

/**
 * One immutable state object for the whole game, the minimum a React app
 * needs: get, set, subscribe. Rendering and input never write to it per
 * frame; the 3D world keeps its own mutable runtime and reports discrete
 * events (an encounter, a zone exit) through the actions.
 */
class Store {
  private state: GameState = {
    scene: { name: "title" },
    slots: [],
    slot: null,
    save: null,
    panel: null,
    battle: null,
    toasts: [],
    worldVersion: 0,
  };
  private listeners = new Set<Listener>();

  get = (): GameState => this.state;

  set = (
    update: Partial<GameState> | ((s: GameState) => Partial<GameState>),
  ) => {
    const patch = typeof update === "function" ? update(this.state) : update;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const store = new Store();

export function useGame<T>(selector: (state: GameState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

/** The loaded save; screens that render it only mount when there is one. */
export function useSave(): SaveData {
  const save = useGame((s) => s.save);
  if (!save) throw new Error("No game loaded");
  return save;
}
