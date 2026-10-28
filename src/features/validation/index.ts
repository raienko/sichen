import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { z } from "zod";

import type { TranslationKey } from "@/features/localization";

/**
 * A rule's message: a translation key, plus the values it interpolates.
 * zod only carries a string, so the params ride along as JSON after a `?`
 * (`validation.tooShort?{"min":2}`) and `errorText()` turns the pair into
 * text in the active language. Rules stay language-free; the form shows
 * them in whatever language is current when it renders.
 */
function message(key: TranslationKey, params?: Record<string, unknown>) {
  return params ? `${key}?${JSON.stringify(params)}` : key;
}

/** The text for a validation message, in the active language. */
export function errorText(
  raw: string | undefined,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string | undefined {
  if (!raw) return undefined;
  const at = raw.indexOf("?");
  if (at === -1) return t(raw as TranslationKey);
  try {
    return t(
      raw.slice(0, at) as TranslationKey,
      JSON.parse(raw.slice(at + 1)) as Record<string, string | number>,
    );
  } catch {
    return t(raw.slice(0, at) as TranslationKey);
  }
}

// Practical rather than RFC-complete: something@something.tld, no spaces.
// The server is the real judge; this only catches typos early.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Digits and symbols other than the ones real names use (' - . space).
const NOT_A_NAME = /[\d!@#$%^&*()_+=[\]{};:"\\|,<>/?~`]/;

type PasswordOptions = {
  /** Default 8. */
  min?: number;
  /** At least one letter. Default true. */
  letter?: boolean;
  /** At least one digit. Default true. */
  digit?: boolean;
  /** At least one character that's neither a letter nor a digit. Default false. */
  symbol?: boolean;
};

/**
 * Field rules for zod schemas. Each one trims what's typed (except the
 * password, where spaces are significant) and reports a message
 * `errorText()` can translate.
 *
 * @example
 * const schema = z.object({
 *   name: rules.name(),
 *   email: rules.email(),
 *   password: rules.password({ min: 10, symbol: true }),
 *   website: rules.optional(rules.url()),
 * });
 */
export const rules = {
  /** Anything, as long as it isn't blank. */
  required: () => z.string().trim().min(1, message("validation.required")),

  email: () =>
    z
      .string()
      .trim()
      .min(1, message("validation.required"))
      .regex(EMAIL, message("validation.email")),

  password: ({
    min = 8,
    letter = true,
    digit = true,
    symbol = false,
  }: PasswordOptions = {}) => {
    let schema = z
      .string()
      .min(1, message("validation.required"))
      .min(min, message("validation.passwordMin", { min }));
    if (letter) {
      schema = schema.regex(/\p{L}/u, message("validation.passwordLetter"));
    }
    if (digit) schema = schema.regex(/\d/, message("validation.passwordDigit"));
    if (symbol) {
      schema = schema.regex(
        /[^\p{L}\d]/u,
        message("validation.passwordSymbol"),
      );
    }
    return schema;
  },

  /** A person's name: letters in any script, spaces, `'`, `-` and `.`. */
  name: ({ min = 2, max = 50 }: { min?: number; max?: number } = {}) =>
    z
      .string()
      .trim()
      .min(1, message("validation.required"))
      .min(min, message("validation.tooShort", { min }))
      .max(max, message("validation.tooLong", { max }))
      .refine((value) => !NOT_A_NAME.test(value), message("validation.name")),

  /**
   * A phone number valid for its country. Expects international format
   * (`+380…`), which is what the phone input stores; `country` lets a
   * national number through too.
   */
  phone: (country?: CountryCode) =>
    z
      .string()
      .trim()
      .min(1, message("validation.required"))
      .refine(
        (value) => isValidPhoneNumber(value, country),
        message("validation.phone"),
      ),

  /** An http(s) address. */
  url: () =>
    z
      .string()
      .trim()
      .min(1, message("validation.required"))
      .regex(/^https?:\/\/[^\s.]+\.\S+$/i, message("validation.url")),

  /** Text between `min` and `max` characters, after trimming. */
  length: ({ min = 0, max }: { min?: number; max?: number }) => {
    let schema = z.string().trim();
    if (min > 0) {
      schema = schema
        .min(1, message("validation.required"))
        .min(min, message("validation.tooShort", { min }));
    }
    if (max !== undefined) {
      schema = schema.max(max, message("validation.tooLong", { max }));
    }
    return schema;
  },

  /** Makes a rule optional: an empty field passes, anything typed is checked. */
  optional: <T extends z.ZodType<string>>(rule: T) =>
    z.union([z.literal(""), rule]).optional(),
};

/**
 * Adds a "must match" check between two fields — confirm password, confirm
 * email — reported on the second one, which is where the user looks.
 *
 * @example
 * const schema = matches(
 *   z.object({ password: rules.password(), confirm: z.string() }),
 *   "password",
 *   "confirm",
 * );
 */
export function matches<
  Shape extends z.ZodRawShape,
  A extends keyof Shape & string,
  B extends keyof Shape & string,
>(schema: z.ZodObject<Shape>, field: A, confirm: B) {
  return schema.refine(
    (values) =>
      (values as Record<string, unknown>)[field] ===
      (values as Record<string, unknown>)[confirm],
    { message: message("validation.mismatch"), path: [confirm] },
  );
}

export { z };
