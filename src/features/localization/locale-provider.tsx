import { useCallback, useMemo, type ReactNode } from "react";

import { LocalValue } from "@/features/storage";
import { isE2E } from "@/utils";

import LocaleContext from "./context";
import useOsLocale from "./os-locale";
import {
  composeTranslations,
  translate,
  type AppTranslationKey,
  type TranslationKey,
  type TranslationOverrides,
} from "./translations";
import { LOCALES, type Locale, type LocalePreference } from "./types";

const localePreference = new LocalValue<LocalePreference>("locale-preference");

export type LocaleProviderConfig = {
  /** App translations layered over the built-in catalog for matching locales. */
  translations?: TranslationOverrides;
};

type Props = {
  children: ReactNode;
  config?: LocaleProviderConfig;
};

/**
 * Resolves the active locale from two inputs, in priority order:
 *
 * 1. **The user's explicit choice.** Once they pick a language in
 *    `LocaleSwitcher`, that's stored and wins — a later OS language change
 *    does not override a deliberate selection.
 * 2. **The device language**, while the preference is `"system"` (the
 *    default, so this is what a first launch uses). Tracked live and
 *    persisted by `useOsLocale`.
 *
 * Same shape as `ThemeProvider`: a stored preference of
 * `<concrete value> | "system"`, with `"system"` deferring to the OS.
 */
export default function LocaleProvider({ children, config }: Props) {
  const preference = localePreference.useValue() ?? "system";
  const osLocale = useOsLocale();
  // An end-to-end run reads "system" as English, so flows can match on
  // visible text whatever language the simulator is set to. Picking a
  // language explicitly still works — that's something a flow may test.
  const locale =
    preference === "system" ? (isE2E ? "en" : osLocale) : preference;
  const info = LOCALES.find((entry) => entry.code === locale);
  const isRTL = info?.rtl ?? false;
  const weekStartsOn = info?.weekStartsOn ?? 1;

  const catalog = useMemo(
    () => composeTranslations(config?.translations),
    [config?.translations],
  );
  const t = useCallback(
    (
      key: TranslationKey | AppTranslationKey,
      params?: Record<string, string | number>,
    ) => translate(locale, key, params, catalog),
    [catalog, locale],
  );

  const setPreference = useCallback((next: LocalePreference) => {
    localePreference.setValue(next);
  }, []);

  const value = useMemo<Locale>(
    () => ({ locale, isRTL, weekStartsOn, preference, setPreference, t }),
    [locale, isRTL, weekStartsOn, preference, setPreference, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
