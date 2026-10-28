import { translate } from "@/features/localization/translations";
import { DAY } from "@/utils";

import { activitySentence, formatDay, formatFileSize } from "./format";
import type { ChatParticipant } from "./types";

const t = ((key: string, params?: Record<string, string | number>) =>
  translate("en", key as never, params)) as Parameters<typeof formatDay>[3];

const NOW = new Date(2026, 9, 15, 12, 0).getTime();

const people = new Map<string, ChatParticipant>(
  [
    { id: "me", name: "You" },
    { id: "ada", name: "Ada" },
    { id: "grace", name: "Grace" },
    { id: "alan", name: "Alan" },
  ].map((person) => [person.id, person]),
);

describe("formatDay", () => {
  it("says Today and Yesterday", () => {
    expect(formatDay(NOW - 1000, NOW, "en", t)).toBe("Today");
    expect(formatDay(NOW - DAY, NOW, "en", t)).toBe("Yesterday");
  });

  it("drops the year only within the current one", () => {
    expect(formatDay(new Date(2026, 0, 2).getTime(), NOW, "en", t)).not.toMatch(
      /2026/,
    );
    expect(formatDay(new Date(2025, 0, 2).getTime(), NOW, "en", t)).toMatch(
      /2025/,
    );
  });
});

describe("formatFileSize", () => {
  it("steps through binary units with one decimal under ten", () => {
    expect(formatFileSize(512, "en", t)).toBe("512 B");
    expect(formatFileSize(1536, "en", t)).toBe("1.5 KB");
    expect(formatFileSize(482_000, "en", t)).toBe("471 KB");
    expect(formatFileSize(5 * 1024 * 1024, "en", t)).toBe("5 MB");
  });
});

describe("activitySentence", () => {
  it("is empty when nobody else is doing anything", () => {
    expect(
      activitySentence(
        [{ userId: "me", kind: "typing" }],
        people,
        "me",
        "en",
        t,
      ),
    ).toBe("");
  });

  it("names one or two people, and counts more", () => {
    expect(
      activitySentence(
        [{ userId: "ada", kind: "typing" }],
        people,
        "me",
        "en",
        t,
      ),
    ).toBe("Ada is typing…");
    expect(
      activitySentence(
        [
          { userId: "ada", kind: "typing" },
          { userId: "grace", kind: "typing" },
        ],
        people,
        "me",
        "en",
        t,
      ),
    ).toBe("Ada and Grace are typing…");
    expect(
      activitySentence(
        ["ada", "grace", "alan"].map((userId) => ({
          userId,
          kind: "typing" as const,
        })),
        people,
        "me",
        "en",
        t,
      ),
    ).toBe("3 people are typing…");
  });

  it("reports the most live activity when they're mixed", () => {
    expect(
      activitySentence(
        [
          { userId: "ada", kind: "typing" },
          { userId: "grace", kind: "recording" },
        ],
        people,
        "me",
        "en",
        t,
      ),
    ).toBe("Grace is recording audio…");
  });
});
