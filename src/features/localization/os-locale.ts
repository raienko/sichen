import { useEffect, useMemo } from "react";
import { useLocales } from "expo-localization";

import { LocalValue } from "@/features/storage";

import { LOCALES, type LocaleCode } from "./types";

/** The last OS locale this app saw, persisted across launches. */
const osLocaleValue = new LocalValue<LocaleCode>("os-locale");

const supportedCodes = new Set(LOCALES.map((locale) => locale.code));

/**
 * The device's preferred language, narrowed to one this app actually ships.
 * The OS hands back an ordered list, so a user whose first language isn't
 * supported still gets their second choice before falling back to English.
 */
function resolveSupported(
  deviceLocales: { languageCode: string | null }[],
): LocaleCode {
  for (const device of deviceLocales) {
    if (
      device.languageCode &&
      supportedCodes.has(device.languageCode as LocaleCode)
    ) {
      return device.languageCode as LocaleCode;
    }
  }
  return "en";
}

/** Read the stored OS locale outside React (startup code, diagnostics). */
export function getStoredOsLocale(): LocaleCode | undefined {
  return osLocaleValue.getValue();
}

/**
 * Tracks the device language *live* — via `useLocales()`, which re-renders
 * on an OS language change, rather than the one-shot `getLocales()` — and
 * persists whatever it resolves to.
 *
 * The persisted copy is deliberately not what's returned: the live value is
 * always at least as correct, and reading it directly avoids a first-render
 * gap on a genuinely first launch, when nothing is stored yet. What storage
 * buys is a record that outlives the process — readable synchronously
 * before React mounts (see `getStoredOsLocale`), and enough to answer
 * "did the device language change since last launch?" if that's ever needed.
 *
 * This is only ever *consulted* while the user's preference is `"system"`.
 * The moment they pick a language in `LocaleSwitcher`, that choice is the
 * stored preference and wins — a later OS language change does not
 * override it. See `LocaleProvider`.
 */
export default function useOsLocale(): LocaleCode {
  const deviceLocales = useLocales();
  const stored = osLocaleValue.useValue();

  const osLocale = useMemo(
    () => resolveSupported(deviceLocales),
    [deviceLocales],
  );

  useEffect(() => {
    if (stored !== osLocale) {
      osLocaleValue.setValue(osLocale);
    }
  }, [stored, osLocale]);

  return osLocale;
}
