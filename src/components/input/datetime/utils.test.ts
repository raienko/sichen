import { clamp, fromPickerDate, toDate, toPickerDate } from "./utils";

describe("clamp", () => {
  const min = new Date(2026, 7, 10, 9, 30);
  const max = new Date(2026, 7, 20, 17, 0);

  it("pulls an out-of-range value onto the nearest bound", () => {
    expect(clamp(new Date(2026, 7, 1), min, max)).toEqual(min);
    expect(clamp(new Date(2026, 7, 25), min, max)).toEqual(max);
  });

  it("leaves an in-range value alone", () => {
    const inside = new Date(2026, 7, 15, 12, 0);

    expect(clamp(inside, min, max)).toEqual(inside);
  });

  it("treats an absent bound as unbounded", () => {
    const early = new Date(1900, 0, 1);
    const late = new Date(2200, 0, 1);

    expect(clamp(early, undefined, max)).toEqual(early);
    expect(clamp(late, min, undefined)).toEqual(late);
    expect(clamp(late)).toEqual(late);
  });

  it("does not mutate the date it was given", () => {
    const original = new Date(2026, 7, 1);
    const snapshot = original.getTime();

    clamp(original, min, max);

    expect(original.getTime()).toBe(snapshot);
  });
});

describe("toDate", () => {
  it("passes a Date straight through", () => {
    const date = new Date(2026, 7, 27, 14, 30);

    expect(toDate(date)).toEqual(date);
  });

  // The library's own prop type allows these even though `single` mode only
  // ever emits a Date, so the conversion has to cover them rather than cast.
  it("converts the other shapes its type allows", () => {
    const date = new Date(2026, 7, 27, 14, 30);

    expect(toDate(date.getTime())).toEqual(date);
    expect(toDate(date.toISOString())).toEqual(date);
    // A dayjs-like object is recognised by its toDate().
    expect(toDate({ toDate: () => date } as never)).toEqual(date);
    expect(toDate("2026-08-27 14:30")).toEqual(new Date(2026, 7, 27, 14, 30));
    expect(toDate("2026-08-27T14:30:00+03:00")?.toISOString()).toBe(
      "2026-08-27T11:30:00.000Z",
    );
  });

  it("reports an absent or unusable value as null", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    // Reported now rather than becoming an Invalid Date that only surfaces
    // once something tries to format it.
    expect(toDate("not a date")).toBeNull();
    expect(toDate("2026-02-31")).toBeNull();
    expect(toDate("2026-02-01T10:30+24:00")).toBeNull();
    expect(toDate("2026-02-01T10:30+02:60")).toBeNull();
  });
});

/**
 * The picker is run in UTC because that is the only zone its internal date
 * maths gets right on Hermes (see the note on `toPickerDate`). These are
 * what keep that invisible from the outside.
 */
describe("picker boundary", () => {
  const LOCAL = new Date(2026, 7, 27, 17, 6, 32, 417);

  it("hands the picker a date whose UTC fields read as the local wall clock", () => {
    const forPicker = toPickerDate(LOCAL);

    expect(forPicker.isUTC()).toBe(true);
    expect(forPicker.year()).toBe(LOCAL.getFullYear());
    expect(forPicker.month()).toBe(LOCAL.getMonth());
    expect(forPicker.date()).toBe(LOCAL.getDate());
    expect(forPicker.hour()).toBe(LOCAL.getHours());
    expect(forPicker.minute()).toBe(LOCAL.getMinutes());
    expect(forPicker.millisecond()).toBe(LOCAL.getMilliseconds());
  });

  it("round-trips exactly, whatever the machine's offset", () => {
    expect(fromPickerDate(toPickerDate(LOCAL))).toEqual(LOCAL);
  });

  it("round-trips years below 100 without JavaScript's 1900 offset", () => {
    const early = new Date(0);
    early.setFullYear(42, 7, 27);
    early.setHours(14, 30, 0, 0);

    expect(fromPickerDate(toPickerDate(early))).toEqual(early);
  });

  // Midnight and the end of a day are where an off-by-one-offset conversion
  // would land on the wrong calendar day, not merely the wrong time.
  it.each([
    ["midnight", new Date(2026, 7, 27, 0, 0, 0)],
    ["one minute to midnight", new Date(2026, 7, 27, 23, 59, 0)],
    ["a DST boundary", new Date(2025, 9, 26, 2, 30, 0)],
  ])("round-trips %s onto the same calendar day", (_name, local) => {
    const back = fromPickerDate(toPickerDate(local));

    expect(back?.getDate()).toBe(local.getDate());
    expect(back?.getHours()).toBe(local.getHours());
    expect(back?.getMinutes()).toBe(local.getMinutes());
  });

  it("reports an absent value from the picker as null", () => {
    expect(fromPickerDate(null)).toBeNull();
    expect(fromPickerDate(undefined)).toBeNull();
  });
});
