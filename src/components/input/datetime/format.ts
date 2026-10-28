import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/ja";
import "dayjs/locale/pt";
import "dayjs/locale/uk";
import "dayjs/locale/zh-cn";
import type { DatePickerBaseProps } from "react-native-ui-datepicker";

import type { LocaleCode } from "@/features/localization";

import type { DateTimeMode } from "../types";

/**
 * How the *collapsed field* renders its value, via Day.js.
 *
 * Day.js carries its own locale data rather than leaning on `Intl`, which
 * matters here beyond preference: asking `Intl` for a 24-hour time through
 * `timeStyle` silently lost the clock on Hermes, so the field read
 * "2:32 PM" on device above wheels reading 14. `HH:mm` is a literal token
 * with no locale opinion to override, so the same string comes out on every
 * engine.
 *
 * English is built into Day.js; every other locale's data has to be
 * imported for its side effect, which is what the imports above are for.
 */

/**
 * Day.js locale ids are not simply our codes: it ships no plain
 * `zh` (only the regional variants), so Chinese has to name one.
 */
const DAYJS_LOCALE: Record<LocaleCode, string> = {
  en: "en",
  uk: "uk",
  es: "es",
  fr: "fr",
  pt: "pt",
  de: "de",
  it: "it",
  zh: "zh-cn",
  ja: "ja",
  ar: "ar",
};

/**
 * Explicit localized date patterns preserve the field's established output
 * while reusing the Day.js instance the picker already needs. The time is
 * deliberately the literal `HH:mm`: localized clocks in several supported
 * locales are 12-hour while the picker can only be trusted with 24-hour
 * wheels (see TWELVE_HOUR_UNSUPPORTED in ./index).
 */
const DATE_FORMAT: Record<LocaleCode, string> = {
  en: "MMM D, YYYY",
  uk: "D MMM YYYY [р.]",
  es: "D [de] MMM[.] [de] YYYY",
  fr: "D MMM YYYY",
  pt: "D [de] MMM [de] YYYY",
  de: "D. MMM YYYY",
  it: "D MMM YYYY",
  zh: "YYYY年M月D日",
  ja: "YYYY年M月D日",
  ar: "D MMMM YYYY",
};

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function localizeDigits(value: string, locale: LocaleCode): string {
  if (locale !== "ar") return value;

  // Keep this conversion local. Day.js's preParsePostFormat plugin mutates
  // the shared Day.js singleton, and react-native-ui-datepicker also uses
  // that instance internally. Applying the plugin globally makes the picker
  // feed Arabic-Indic years through Number(), resulting in NaN.
  return value.replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

export function formatValue(
  value: Date,
  locale: LocaleCode,
  mode: DateTimeMode,
): string {
  // `.locale()` on the instance rather than `dayjs.locale()`, which would
  // set it globally for everything else in the app as a side effect.
  const localized = dayjs(value).locale(DAYJS_LOCALE[locale]);
  const dateFormat = DATE_FORMAT[locale];

  const format: Record<DateTimeMode, string> = {
    date: dateFormat,
    time: "HH:mm",
    datetime: `${dateFormat} HH:mm`,
  };

  return localizeDigits(localized.format(format[mode]), locale);
}

/**
 * Which digits the picker should draw, matched to the ones our Day.js
 * formatter writes in the field above it. Arabic is the case that forces
 * the question: the field renders "٢٧ أغسطس ٢٠٢٦" while the picker defaults
 * to Latin, and the two sitting together reads like a rendering fault.
 */
export function numeralsFor(
  locale: LocaleCode,
): NonNullable<DatePickerBaseProps["numerals"]> {
  return locale === "ar" ? "arab" : "latn";
}
