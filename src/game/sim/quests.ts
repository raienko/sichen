import { content, getQuest } from "../data";

import type { QuestDef, QuestState } from "./types";

export type QuestLog = Record<string, QuestState>;

/** Quests this NPC can give now: prerequisites done, not yet taken. */
export function offeredBy(log: QuestLog, npcId: string): QuestDef[] {
  return content.quests.filter(
    (q) =>
      q.giver === npcId &&
      !log[q.id] &&
      (!q.requires || log[q.requires]?.status === "done"),
  );
}

/** Quests this NPC will pay out for. */
export function readyFor(log: QuestLog, npcId: string): QuestDef[] {
  return content.quests.filter(
    (q) => q.giver === npcId && log[q.id]?.status === "ready",
  );
}

export function accept(log: QuestLog, questId: string): QuestLog {
  if (log[questId]) return log;
  return { ...log, [questId]: { status: "active", progress: 0 } };
}

export function questTarget(quest: QuestDef): number {
  return quest.objective.type === "kill" ? quest.objective.count : 1;
}

function update(
  log: QuestLog,
  match: (q: QuestDef) => number,
): { log: QuestLog; changed: string[] } {
  const next = { ...log };
  const changed: string[] = [];
  for (const [id, state] of Object.entries(log)) {
    if (state.status !== "active") continue;
    const quest = getQuest(id);
    const gain = match(quest);
    if (gain <= 0) continue;
    const progress = Math.min(questTarget(quest), state.progress + gain);
    next[id] = {
      ...state,
      progress,
      status: progress >= questTarget(quest) ? "ready" : "active",
    };
    changed.push(id);
  }
  return { log: next, changed };
}

export function onKills(log: QuestLog, tags: readonly string[][]) {
  return update(log, (q) =>
    q.objective.type === "kill"
      ? tags.filter((t) => t.includes((q.objective as { tag: string }).tag))
          .length
      : 0,
  );
}

export function onExplore(log: QuestLog, interactableId: string) {
  return update(log, (q) =>
    q.objective.type === "explore" &&
    q.objective.interactableId === interactableId
      ? 1
      : 0,
  );
}

export function onPackDefeated(log: QuestLog, packId: string) {
  return update(log, (q) =>
    q.objective.type === "defeat" && q.objective.packId === packId ? 1 : 0,
  );
}

/** Picks up a deliver quest's cargo: the quest is ready to hand in. */
export function onPickup(log: QuestLog, interactableId: string) {
  const next = { ...log };
  const changed: string[] = [];
  for (const [id, state] of Object.entries(log)) {
    const quest = getQuest(id);
    if (
      state.status !== "active" ||
      quest.objective.type !== "deliver" ||
      quest.objective.pickupId !== interactableId
    )
      continue;
    next[id] = { ...state, status: "ready", progress: 1, carrying: true };
    changed.push(id);
  }
  return { log: next, changed };
}

/** On death: carried cargo is lost, and those quests need a new pickup. */
export function dropCargo(log: QuestLog) {
  const next = { ...log };
  const changed: string[] = [];
  for (const [id, state] of Object.entries(log)) {
    if (!state.carrying || state.status !== "ready") continue;
    next[id] = { status: "active", progress: 0 };
    changed.push(id);
  }
  return { log: next, changed };
}

/** Records a branching choice; its own reward is paid by the caller. */
export function choose(
  log: QuestLog,
  questId: string,
  choiceId: string,
): QuestLog {
  const state = log[questId];
  if (!state || state.status !== "active") return log;
  return {
    ...log,
    [questId]: { status: "done", progress: 1, choice: choiceId },
  };
}

export function turnIn(log: QuestLog, questId: string): QuestLog {
  if (log[questId]?.status !== "ready") return log;
  return {
    ...log,
    [questId]: { ...log[questId]!, status: "done", carrying: false },
  };
}

/** The quest a tracker should show first: ready ones, then main, then side. */
export function trackedQuests(log: QuestLog): QuestDef[] {
  const order = { ready: 0, active: 1, done: 2 } as const;
  return Object.entries(log)
    .filter(([, s]) => s.status !== "done")
    .map(([id]) => getQuest(id))
    .sort((a, b) => {
      const sa = order[log[a.id]!.status];
      const sb = order[log[b.id]!.status];
      if (sa !== sb) return sa - sb;
      return a.kind === b.kind ? 0 : a.kind === "main" ? -1 : 1;
    });
}
