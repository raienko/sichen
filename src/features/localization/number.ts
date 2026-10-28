/**
 * Locale-aware number formatting, in one place because more than one
 * component needs it: `Badge` renders a count, `Stepper` renders a value,
 * and neither should be the one that owns the `Intl` cache.
 */

// One formatter per locale, built on first use. `Intl.NumberFormat`'s
// constructor is the expensive half; a control that re-renders on every
// change shouldn't pay it again each time.
const formatters = new Map<string, Intl.NumberFormat | null>();

/**
 * A number as digits in the given locale.
 *
 * More than cosmetic: a thousands separator is a comma in `en` and a full
 * stop in `de`, and a locale that asks for its own numbering system gets
 * its own digits (`ar-EG` → ٩٩).
 *
 * Falls back to plain digits where the runtime can't honour the tag at all,
 * rather than throwing — Hermes' `Intl` coverage varies by platform, so
 * that path is load-bearing rather than defensive.
 */
export function formatNumber(value: number, locale: string): string {
  if (!formatters.has(locale)) {
    try {
      formatters.set(locale, new Intl.NumberFormat(locale));
    } catch {
      formatters.set(locale, null);
    }
  }
  return formatters.get(locale)?.format(value) ?? String(value);
}
