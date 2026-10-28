import Input, { type SelectOption } from "@/components/input";
import {
  LOCALES,
  LOCALE_PREFERENCES,
  useLocale,
  type LocalePreference,
} from "@/features/localization";

const localeByCode = new Map(LOCALES.map((locale) => [locale.code, locale]));

/**
 * `Input`'s select reports a plain `string`, since it can't know the union
 * a given call site draws its options from. Every option here comes from
 * LOCALE_PREFERENCES, so anything it reports back *is* a LocalePreference —
 * but that's an invariant of this file, not something the types carry, so
 * it's checked rather than asserted.
 */
function isLocalePreference(value: string): value is LocalePreference {
  return (LOCALE_PREFERENCES as string[]).includes(value);
}

/**
 * One field, not a row of buttons: the list is already past what a
 * segmented control reads as, and it only grows as translations are added —
 * so the choice goes in a Modal (via `<Input type="select">`) and the
 * switcher itself stays one line high however many languages ship.
 *
 * Each language is listed in its own name rather than translated, so
 * someone who can't read the current locale can still find theirs. Only
 * "System" is translated — it names a behaviour, not a language.
 */
export default function LocaleSwitcher() {
  const locale = useLocale();

  const options: SelectOption[] = LOCALE_PREFERENCES.map((preference) => ({
    value: preference,
    label:
      preference === "system"
        ? locale.t("locale.system")
        : localeByCode.get(preference)!.nativeName,
  }));

  return (
    <Input
      type="select"
      label={locale.t("locale.label")}
      value={locale.preference}
      onChange={(value) => {
        if (isLocalePreference(value)) locale.setPreference(value);
      }}
      options={options}
    />
  );
}
