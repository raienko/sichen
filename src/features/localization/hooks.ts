import { useContext } from "react";

import LocaleContext from "./context";
import type { Locale } from "./types";

export function useLocale(): Locale {
  const locale = useContext(LocaleContext);
  if (!locale) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return locale;
}

/**
 * Just the RTL-ness of the current locale, for callers (like createStyles)
 * that don't need the rest of what useLocale() returns (t, preference,
 * setPreference, ...). Derived from LOCALES' hand-authored `rtl` flag for
 * the resolved locale — not from I18nManager.isRTL, which only updates
 * after a native reload (see rtl.ts) and would make styles built from it
 * lag a full reload behind an actual locale switch.
 */
export function useIsRtl(): boolean {
  return useLocale().isRTL;
}
