import { useMemo } from "react";

import { useLocale } from "@/features/localization";
import { SECOND, TIME_UNITS } from "@/utils";

/** Anything that names a moment: a `Date`, epoch milliseconds, or an ISO string. */
export type DateInput = Date | number | string;

/**
 * Which clock to show a moment on. `"local"` (the default) is the device's
 * timezone; `"utc"` is UTC; anything else is an IANA zone (`"Europe/Kyiv"`).
 */
export type TimeZone = "local" | "utc" | (string & {});

export type DateStyle = "short" | "medium" | "long" | "full";

type DateOptions = { style?: DateStyle; timeZone?: TimeZone };
type TimeOptions = { seconds?: boolean; timeZone?: TimeZone };

// `Intl` constructors are the expensive part, so one per locale + options.
const cache = new Map<string, unknown>();

function cached<T>(key: string, create: () => T): T | null {
  if (!cache.has(key)) {
    try {
      cache.set(key, create());
    } catch {
      // A locale or zone this engine doesn't know: fall back, don't crash.
      cache.set(key, null);
    }
  }
  return cache.get(key) as T | null;
}

function zone(timeZone: TimeZone | undefined): string | undefined {
  if (timeZone === undefined || timeZone === "local") return undefined;
  return timeZone === "utc" ? "UTC" : timeZone;
}

/** A valid `Date`, or `null` for anything that isn't a moment. */
export function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat | null {
  return cached(`dt|${locale}|${JSON.stringify(options)}`, () => {
    return new Intl.DateTimeFormat(locale, options);
  });
}

function formatWith(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (date === null) return "";
  return dateTimeFormat(locale, options)?.format(date) ?? date.toISOString();
}

/** `16 Oct 2026` — a day, in the locale's own order and words. */
export function formatDate(
  value: DateInput,
  locale: string,
  { style = "medium", timeZone }: DateOptions = {},
): string {
  return formatWith(value, locale, {
    dateStyle: style,
    timeZone: zone(timeZone),
  });
}

/** `14:30` / `2:30 PM` — following the locale's own 12/24-hour convention. */
export function formatTime(
  value: DateInput,
  locale: string,
  { seconds = false, timeZone }: TimeOptions = {},
): string {
  return formatWith(value, locale, {
    timeStyle: seconds ? "medium" : "short",
    timeZone: zone(timeZone),
  });
}

/** `16 Oct 2026, 14:30`. */
export function formatDateTime(
  value: DateInput,
  locale: string,
  { style = "medium", timeZone }: DateOptions = {},
): string {
  return formatWith(value, locale, {
    dateStyle: style,
    timeStyle: "short",
    timeZone: zone(timeZone),
  });
}

/**
 * `5 minutes ago`, `in 2 days`, `yesterday`. Falls back to the plain date
 * on an engine without `Intl.RelativeTimeFormat`, rather than English.
 */
export function formatRelative(
  value: DateInput,
  locale: string,
  now: DateInput = Date.now(),
): string {
  const date = toDate(value);
  const reference = toDate(now);
  if (date === null || reference === null) return "";

  const relative =
    typeof Intl.RelativeTimeFormat === "function"
      ? cached(
          `rt|${locale}`,
          () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
        )
      : null;
  if (relative === null) return formatDate(date, locale);

  const difference = date.getTime() - reference.getTime();
  const [unit, size] =
    TIME_UNITS.find(([, length]) => Math.abs(difference) >= length) ??
    TIME_UNITS[TIME_UNITS.length - 1]!;
  return relative.format(Math.round(difference / size), unit);
}

function numberFormat(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat | null {
  return cached(`nf|${locale}|${JSON.stringify(options)}`, () => {
    return new Intl.NumberFormat(locale, options);
  });
}

/** `1,234.5` / `1 234,5`. `decimals` fixes the number of fraction digits. */
export function formatNumber(
  value: number,
  locale: string,
  { decimals }: { decimals?: number } = {},
): string {
  const options =
    decimals === undefined
      ? {}
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  return numberFormat(locale, options)?.format(value) ?? String(value);
}

/** `€1,234.50` — `currency` is an ISO 4217 code: `"EUR"`, `"UAH"`. */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string,
): string {
  return (
    numberFormat(locale, { style: "currency", currency })?.format(value) ??
    `${value} ${currency}`
  );
}

/** `42%` from `0.42`. */
export function formatPercent(
  value: number,
  locale: string,
  { decimals = 0 }: { decimals?: number } = {},
): string {
  return (
    numberFormat(locale, {
      style: "percent",
      maximumFractionDigits: decimals,
    })?.format(value) ?? `${Math.round(value * 100)}%`
  );
}

/** `1.2K`, `3.4M` — for counts where precision doesn't matter. */
export function formatCompact(value: number, locale: string): string {
  return (
    numberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    })?.format(value) ?? String(value)
  );
}

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];

/** `1.2 MB` — powers of 1024, the way file managers show it. */
export function formatFileSize(bytes: number, locale: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const exponent = Math.min(
    SIZE_UNITS.length - 1,
    bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const size = bytes / 1024 ** exponent;
  const decimals = exponent === 0 || size >= 100 ? 0 : 1;
  return `${formatNumber(Number(size.toFixed(decimals)), locale)} ${SIZE_UNITS[exponent]}`;
}

/** `4:09`, `1:05:09` — a length of time, as a media player shows it. */
export function formatDuration(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / SECOND));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** `AL` from `Ada Lovelace` — at most two letters, first and last word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = [...words[0]!][0] ?? "";
  const last = words.length > 1 ? ([...words[words.length - 1]!][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** `2026-10-16` — a calendar day for an API, in the device's own timezone. */
export function toIsoDate(value: DateInput): string {
  const date = toDate(value);
  if (date === null) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `2026-10-16T11:30:00.000Z` — an exact moment for an API, always UTC. */
export function toIsoDateTime(value: DateInput): string {
  return toDate(value)?.toISOString() ?? "";
}

/**
 * Every formatter, bound to the active locale — the way components use
 * them, so text follows a language switch without passing the locale around.
 *
 * @example
 * const format = useFormat();
 * format.relative(message.sentAt); // "5 minutes ago"
 * format.currency(total, "EUR"); // "€1,234.50"
 */
export function useFormat() {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      date: (value: DateInput, options?: DateOptions) =>
        formatDate(value, locale, options),
      time: (value: DateInput, options?: TimeOptions) =>
        formatTime(value, locale, options),
      dateTime: (value: DateInput, options?: DateOptions) =>
        formatDateTime(value, locale, options),
      relative: (value: DateInput, now?: DateInput) =>
        formatRelative(value, locale, now),
      number: (value: number, options?: { decimals?: number }) =>
        formatNumber(value, locale, options),
      currency: (value: number, currency: string) =>
        formatCurrency(value, currency, locale),
      percent: (value: number, options?: { decimals?: number }) =>
        formatPercent(value, locale, options),
      compact: (value: number) => formatCompact(value, locale),
      fileSize: (bytes: number) => formatFileSize(bytes, locale),
      duration: formatDuration,
      initials,
    }),
    [locale],
  );
}
