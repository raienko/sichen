import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneCountry = {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

const cache = new Map<string, PhoneCountry[]>();

export function countryFlag(code: CountryCode): string {
  return [...code]
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}

/** Localized, alphabetized country data derived from libphonenumber itself. */
export function getPhoneCountries(locale: string): PhoneCountry[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  let names: Intl.DisplayNames | undefined;
  try {
    names = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    // Older JS runtimes still get a usable ISO-code picker.
  }

  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const countries = getCountries()
    .map((code) => ({
      code,
      name: names?.of(code) ?? code,
      callingCode: getCountryCallingCode(code),
      flag: countryFlag(code),
    }))
    .sort((left, right) => collator.compare(left.name, right.name));

  cache.set(locale, countries);
  return countries;
}
