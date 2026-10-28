import { minutes } from "@/utils";

import type { ChatMessage } from "./types";

/**
 * Where a message sits in a run of messages from the same sender. Decides
 * which one carries the name and avatar (`first`/`single`) and which one
 * the timestamp and receipt (`last`/`single`), and how much space follows.
 */
export type GroupPosition = "single" | "first" | "middle" | "last";

export type ChatRow =
  | { type: "date"; key: string; day: number }
  | {
      type: "message";
      key: string;
      message: ChatMessage;
      position: GroupPosition;
    };

/** Two messages further apart than this start a new group. */
export const GROUP_WINDOW_MS = minutes(5);

export function toTime(value: Date | number): number {
  return typeof value === "number" ? value : value.getTime();
}

/** Local midnight of the day `time` falls on — the key a separator is drawn for. */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function sameGroup(a: ChatMessage, b: ChatMessage): boolean {
  return (
    a.senderId === b.senderId &&
    !a.deleted &&
    !b.deleted &&
    Math.abs(toTime(b.createdAt) - toTime(a.createdAt)) <= GROUP_WINDOW_MS &&
    startOfDay(toTime(a.createdAt)) === startOfDay(toTime(b.createdAt))
  );
}

/**
 * Flattens a thread (oldest first) into what the list draws: a date row at
 * the start of each day, then each message with its place in its group.
 *
 * Pure and separate from the list, so the grouping rules are tested without
 * rendering anything — and so the list sees one flat array it can recycle,
 * rather than sections inside sections.
 *
 * A group breaks on a new sender, a new day, a gap over `GROUP_WINDOW_MS`,
 * or a deleted message (a tombstone stands on its own).
 */
export function buildRows(messages: readonly ChatMessage[]): ChatRow[] {
  const rows: ChatRow[] = [];
  let lastDay: number | undefined;

  messages.forEach((message, index) => {
    const day = startOfDay(toTime(message.createdAt));
    if (day !== lastDay) {
      rows.push({ type: "date", key: `date:${day}`, day });
      lastDay = day;
    }

    const previous = messages[index - 1];
    const next = messages[index + 1];
    const joinsPrevious =
      previous !== undefined && sameGroup(previous, message);
    const joinsNext = next !== undefined && sameGroup(message, next);

    const position: GroupPosition =
      joinsPrevious && joinsNext
        ? "middle"
        : joinsPrevious
          ? "last"
          : joinsNext
            ? "first"
            : "single";

    rows.push({ type: "message", key: message.id, message, position });
  });

  return rows;
}

/** True for the positions that open a group — where the sender is shown. */
export function startsGroup(position: GroupPosition): boolean {
  return position === "first" || position === "single";
}

/** True for the positions that close a group — where time and receipt go. */
export function endsGroup(position: GroupPosition): boolean {
  return position === "last" || position === "single";
}
