import { DAY } from "@/utils";

import { buildRows, GROUP_WINDOW_MS, startOfDay } from "./rows";
import type { ChatMessage } from "./types";

const NOON = new Date(2026, 9, 15, 12, 0).getTime();

const message = (
  id: string,
  senderId: string,
  createdAt: number,
  extra: Partial<ChatMessage> = {},
): ChatMessage => ({ id, senderId, createdAt, text: id, ...extra });

const positions = (messages: ChatMessage[]) =>
  buildRows(messages).flatMap((row) =>
    row.type === "message" ? [`${row.key}:${row.position}`] : [],
  );

describe("buildRows", () => {
  it("opens each local day with a date row", () => {
    const rows = buildRows([
      message("a", "ada", NOON - DAY),
      message("b", "ada", NOON),
      message("c", "ada", NOON + 60_000),
    ]);

    expect(rows.map((row) => row.type)).toEqual([
      "date",
      "message",
      "date",
      "message",
      "message",
    ]);
    expect(rows[2]).toMatchObject({ type: "date", day: startOfDay(NOON) });
  });

  it("groups a run from one sender into first, middle and last", () => {
    expect(
      positions([
        message("a", "ada", NOON),
        message("b", "ada", NOON + 1000),
        message("c", "ada", NOON + 2000),
        message("d", "grace", NOON + 3000),
      ]),
    ).toEqual(["a:first", "b:middle", "c:last", "d:single"]);
  });

  it("breaks a run on a gap longer than the window", () => {
    expect(
      positions([
        message("a", "ada", NOON),
        message("b", "ada", NOON + GROUP_WINDOW_MS + 1),
      ]),
    ).toEqual(["a:single", "b:single"]);
  });

  it("breaks a run at midnight", () => {
    const midnight = startOfDay(NOON) + DAY;
    expect(
      positions([
        message("a", "ada", midnight - 1000),
        message("b", "ada", midnight + 1000),
      ]),
    ).toEqual(["a:single", "b:single"]);
  });

  it("stands a deleted message on its own", () => {
    expect(
      positions([
        message("a", "ada", NOON),
        message("b", "ada", NOON + 1000, { deleted: true }),
        message("c", "ada", NOON + 2000),
      ]),
    ).toEqual(["a:single", "b:single", "c:single"]);
  });
});
