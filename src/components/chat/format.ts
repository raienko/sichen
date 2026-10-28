import { formatNumber, type Locale } from "@/features/localization";
import { DAY } from "@/utils";

import { startOfDay } from "./rows";
import type { ChatActivity, ChatActivityKind, ChatParticipant } from "./types";

type Translate = Locale["t"];

// One formatter per locale and shape, built on first use — the constructor
// is the expensive half, and a long thread formats a time on every row.
const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat | null {
  const key = `${locale}|${JSON.stringify(options)}`;
  if (!formatters.has(key)) {
    try {
      formatters.set(key, new Intl.DateTimeFormat(locale, options));
    } catch {
      formatters.set(key, null);
    }
  }
  return formatters.get(key) ?? null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "14:05" or "2:05 PM", whichever the locale uses. */
export function formatMessageTime(time: number, locale: string): string {
  const date = new Date(time);
  return (
    formatter(locale, { hour: "numeric", minute: "2-digit" })?.format(date) ??
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * The label for a day separator: "Today", "Yesterday", the weekday within
 * the last week, then the date — with the year only once it isn't this one.
 */
export function formatDay(
  day: number,
  now: number,
  locale: string,
  t: Translate,
): string {
  const today = startOfDay(now);
  // Rounded, not floored: a day across a DST change is 23 or 25 hours.
  const daysAgo = Math.round((today - startOfDay(day)) / DAY);
  if (daysAgo === 0) return t("chat.today");
  if (daysAgo === 1) return t("chat.yesterday");

  const date = new Date(day);
  const options: Intl.DateTimeFormatOptions =
    daysAgo > 1 && daysAgo < 7
      ? { weekday: "long" }
      : date.getFullYear() === new Date(now).getFullYear()
        ? { day: "numeric", month: "long" }
        : { day: "numeric", month: "long", year: "numeric" };

  return (
    formatter(locale, options)?.format(date) ??
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  );
}

const SIZE_UNITS = ["b", "kb", "mb", "gb"] as const;

/** "12 KB", "3.4 MB" — binary steps, one decimal under ten. */
export function formatFileSize(
  bytes: number,
  locale: string,
  t: Translate,
): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded =
    unit > 0 && value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return t(`chat.fileSize.${SIZE_UNITS[unit]}`, {
    size: formatNumber(rounded, locale),
  });
}

const ACTIVITY_KEYS = {
  typing: [
    "chat.activity.typingOne",
    "chat.activity.typingTwo",
    "chat.activity.typingMany",
  ],
  recording: [
    "chat.activity.recordingOne",
    "chat.activity.recordingTwo",
    "chat.activity.recordingMany",
  ],
  uploading: [
    "chat.activity.uploadingOne",
    "chat.activity.uploadingTwo",
    "chat.activity.uploadingMany",
  ],
} as const satisfies Record<ChatActivityKind, readonly string[]>;

/** The order a mixed activity is reported in: the most "live" one wins. */
const ACTIVITY_PRIORITY: ChatActivityKind[] = [
  "recording",
  "typing",
  "uploading",
];

/**
 * One sentence for what others are doing: "Ada is typing…", "Ada and Grace
 * are recording audio…", "4 people are typing…". When people are doing
 * different things, the most live activity is the one reported — one line
 * under a thread, not a list.
 *
 * Empty when nobody else is doing anything; the current user is left out,
 * since nobody needs telling that they are typing.
 */
export function activitySentence(
  activity: readonly ChatActivity[],
  participants: ReadonlyMap<string, ChatParticipant>,
  currentUserId: string,
  locale: string,
  t: Translate,
): string {
  const others = activity.filter((entry) => entry.userId !== currentUserId);
  const kind = ACTIVITY_PRIORITY.find((candidate) =>
    others.some((entry) => entry.kind === candidate),
  );
  if (kind === undefined) return "";

  const names = [
    ...new Set(
      others
        .filter((entry) => entry.kind === kind)
        .map((entry) => participants.get(entry.userId)?.name ?? entry.userId),
    ),
  ];
  const [one, two, many] = ACTIVITY_KEYS[kind];

  if (names.length === 1) return t(one, { name: names[0] });
  if (names.length === 2) {
    return t(two, { first: names[0], second: names[1] });
  }
  return t(many, { count: formatNumber(names.length, locale) });
}
