import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import type { DateType } from "react-native-ui-datepicker";

dayjs.extend(utc);

/**
 * What's left of this picker's own date handling now that
 * react-native-ui-datepicker owns the calendar: the grid, the
 * out-of-range disabling and the month arithmetic all live in the library.
 *
 * Neither function mutates its argument — `Date`'s own setters do, which is
 * exactly the kind of shared-object edit that would surprise a caller
 * holding the same value in state.
 */

/** Pulls a value into [min, max]; either bound may be absent. */
export function clamp(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

/**
 * Narrows the library's `DateType` to a real `Date`.
 *
 * In `single` mode it always hands back a `Date` (or `null` once cleared),
 * but the prop type it's declared with covers dayjs objects, timestamps and
 * ISO strings as well — so this converts rather than casting, and reports
 * an unusable value as `null` instead of an `Invalid Date` that would only
 * surface later.
 */
export function toDate(value: DateType): Date | null {
  if (value === null || value === undefined) return null;

  const parsed =
    typeof value === "string"
      ? parseISO8601(value)
      : value instanceof Date || typeof value === "number"
        ? dayjs(value)
        : dayjs(value.toDate());

  return parsed?.isValid() ? parsed.toDate() : null;
}

/**
 * Day.js deliberately accepts and normalizes loose date strings. DateType's
 * string case is narrower: accept ISO 8601 only, and reject impossible
 * calendar dates before Day.js can turn them into a different valid day.
 */
function parseISO8601(value: string): Dayjs | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:Z|[+-](\d{2}):?(\d{2}))?)?$/,
  );
  if (!match) return null;

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    fractionText,
    offsetHourText,
    offsetMinuteText,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText ?? 0);
  const minute = Number(minuteText ?? 0);
  const second = Number(secondText ?? 0);
  const millisecond = Number(`${fractionText ?? ""}000`.slice(0, 3));
  const calendarDate = dayjs
    .utc(0)
    .year(year)
    .month(month - 1)
    .date(day);

  if (
    calendarDate.year() !== year ||
    calendarDate.month() !== month - 1 ||
    calendarDate.date() !== day
  ) {
    return null;
  }

  if (
    hour > 24 ||
    (hour === 24 && (minute > 0 || second > 0 || millisecond > 0)) ||
    minute > 59 ||
    second > 59 ||
    (offsetHourText !== undefined && Number(offsetHourText) > 23) ||
    (offsetMinuteText !== undefined && Number(offsetMinuteText) > 59)
  ) {
    return null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/**
 * The picker is run in UTC, and these convert at its boundary.
 *
 * Not a preference — a workaround with a measured cause. The library does
 * all of its internal date maths through dayjs's timezone plugin, which
 * asks `Intl` for a zone's offset. Hermes cannot answer, so every
 * conversion against a real zone comes back wrong: on device, opening the
 * sheet at 17:06 rendered 17:10, and one day-tap moved the time by nearly
 * an hour in one direction while our own copy moved three minutes in the
 * other. Pinned to `"UTC"` the same code is exact to the second, because
 * UTC needs no offset lookup at all.
 *
 * So the picker is handed a UTC-aware dayjs value whose fields read as the
 * local wall clock, and what it hands back is read the same way round. The
 * timezone-aware value matters on the first render: the library clones its
 * input with `dayjs(value)` before its timezone sync effect runs. A plain
 * Date loses the UTC interpretation in that clone and shifts the initial
 * wheel by the device offset. Copying the wall-clock fields directly keeps
 * the trip exact and independent of whatever `Intl` can or cannot do.
 */
/** Local wall clock in, the same wall clock as UTC out. */
export function toPickerDate(value: Date): Dayjs {
  return dayjs
    .utc(0)
    .year(value.getFullYear())
    .month(value.getMonth())
    .date(value.getDate())
    .hour(value.getHours())
    .minute(value.getMinutes())
    .second(value.getSeconds())
    .millisecond(value.getMilliseconds());
}

/** The picker's UTC wall clock in, the same wall clock as local out. */
export function fromPickerDate(value: DateType): Date | null {
  const date = toDate(value);
  if (date === null) return null;

  return dayjs(0)
    .year(date.getUTCFullYear())
    .month(date.getUTCMonth())
    .date(date.getUTCDate())
    .hour(date.getUTCHours())
    .minute(date.getUTCMinutes())
    .second(date.getUTCSeconds())
    .millisecond(date.getUTCMilliseconds())
    .toDate();
}
