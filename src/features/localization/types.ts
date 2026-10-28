import {
  translations,
  type AppTranslationKey,
  type LocaleCode,
  type TranslationKey,
} from "./translations";

export type { LocaleCode, TranslationKey };

export type LocalePreference = LocaleCode | "system";

export type LocaleInfo = {
  code: LocaleCode;
  /** English name, for contexts describing the locale rather than switching to it. */
  englishName: string;
  /** The language's own name for itself — what a LocaleSwitcher should actually show. */
  nativeName: string;
  rtl: boolean;
  /**
   * Which day a calendar week starts on, as a `Date.getDay()` index
   * (0 = Sunday). Hand-authored for the same reason `rtl` is: `Intl` has no
   * portable way to ask (`Intl.Locale.prototype.getWeekInfo` isn't
   * available everywhere this app runs), and the answer is a property of
   * the locale rather than of whatever component happens to draw a
   * calendar.
   */
  weekStartsOn: number;
};

// Hand-authored (native names/rtl-ness aren't derivable from translations.ts),
// but cross-checked against it below so a locale can't drift out of sync —
// same fail-fast-on-load idea as theme/types.ts's THEME_PREFERENCES.
export const LOCALES: LocaleInfo[] = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    rtl: false,
    weekStartsOn: 0,
  },
  {
    code: "uk",
    englishName: "Ukrainian",
    nativeName: "Українська",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "es",
    englishName: "Spanish",
    nativeName: "Español",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "fr",
    englishName: "French",
    nativeName: "Français",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "pt",
    englishName: "Portuguese",
    nativeName: "Português",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "de",
    englishName: "German",
    nativeName: "Deutsch",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "it",
    englishName: "Italian",
    nativeName: "Italiano",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "zh",
    englishName: "Chinese",
    nativeName: "中文",
    rtl: false,
    weekStartsOn: 1,
  },
  {
    code: "ja",
    englishName: "Japanese",
    nativeName: "日本語",
    rtl: false,
    weekStartsOn: 0,
  },
  {
    code: "ar",
    englishName: "Arabic",
    nativeName: "العربية",
    rtl: true,
    weekStartsOn: 6,
  },
];

const localeCodes = new Set(LOCALES.map((locale) => locale.code));
const translationCodes = new Set(Object.keys(translations) as LocaleCode[]);
if (
  localeCodes.size !== translationCodes.size ||
  [...localeCodes].some((code) => !translationCodes.has(code))
) {
  throw new Error(
    "locale/types.ts's LOCALES is out of sync with locale/translations.ts's locale files",
  );
}

export const LOCALE_PREFERENCES: LocalePreference[] = [
  ...LOCALES.map((locale) => locale.code),
  "system",
];

export type Locale = {
  /** The resolved locale actually in effect (preference "system" resolved against the device). */
  locale: LocaleCode;
  isRTL: boolean;
  /** The active locale's `LocaleInfo.weekStartsOn` — 0 = Sunday. */
  weekStartsOn: number;
  preference: LocalePreference;
  setPreference: (preference: LocalePreference) => void;
  t: (
    key: TranslationKey | AppTranslationKey,
    params?: Record<string, string | number>,
  ) => string;
};
