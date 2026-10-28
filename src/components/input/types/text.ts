import type { CountryCode } from "libphonenumber-js";

/** Free-text variations: text, textarea, numeric, email, code, phone, password. */

export type TextInputTypeProps = {
  type?: "text";
  value: string;
  onChange: (value: string) => void;
};

export type TextAreaInputTypeProps = {
  type: "textarea";
  value: string;
  onChange: (value: string) => void;
  /**
   * A hard limit, and the moment a count appears under the field. Without
   * one there is nothing to count against, and a running total on its own
   * is a number nobody asked for.
   */
  maxLength?: number;
  /** How tall the field starts, in lines of text. Defaults to 3. */
  minLines?: number;
  /**
   * How tall it may grow as the text does before it scrolls instead.
   * Defaults to 6 — past that a growing field pushes the rest of the form
   * off screen, and whatever follows it (the submit button, usually) with it.
   */
  maxLines?: number;
  /**
   * The row is for one line of text; these have nowhere to go in a block of
   * several.
   */
  leftSlot?: never;
  rightSlot?: never;
};

export type NumericInputTypeProps = {
  type: "numeric";
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
};

export type EmailInputTypeProps = {
  type: "email";
  value: string;
  onChange: (value: string) => void;
};

export type CodeCharset = "numeric" | "alphanumeric";

export type CodeInputTypeProps = {
  type: "code";
  /**
   * What's been entered so far — shorter than `length` while it's being
   * filled. Only ever characters from `charset`: anything else the OS or a
   * paste supplies is dropped, the same way `numeric` strips as you type.
   */
  value: string;
  onChange: (value: string) => void;
  /** How many characters the code has. Defaults to 6. */
  length?: number;
  /**
   * Fires once the last character lands, with the finished code — the moment
   * a verification screen wants to submit, and the reason a caller doesn't
   * have to watch `value.length` themselves.
   */
  onComplete?: (value: string) => void;
  /**
   * What the code is made of. Defaults to `"numeric"`, which is what a
   * texted code almost always is and what gets the number pad;
   * `"alphanumeric"` takes letters too and asks for the normal keyboard.
   *
   * Either way anything outside the set is dropped, so a pasted code
   * arrives clean whatever the keyboard allowed.
   */
  charset?: CodeCharset;
  /**
   * The rest of `CommonInputProps` that this variation has no use for, made
   * unpassable rather than quietly ignored.
   *
   * There is nowhere to put a slot in a row of boxes, empty boxes already
   * are the placeholder, and capitalisation and correction follow from
   * `charset` rather than being the caller's to set.
   */
  placeholder?: never;
  leftSlot?: never;
  rightSlot?: never;
  autoCapitalize?: never;
  autoCorrect?: never;
};

export type PhoneInputTypeProps = {
  type: "phone";
  /**
   * The number in E.164 (`+12133734253`) once it's a valid one, and `null`
   * until then — so a caller can tell a finished number from a half-typed
   * one without parsing anything itself.
   */
  value: string | null;
  onChange: (value: string | null) => void;
  /**
   * Initial region for national input, as an ISO 3166-1 alpha-2 code. The
   * built-in picker and international-number detection own it after mount.
   * Without a default, the picker starts unselected and only international
   * input can be understood until the user chooses a country.
   */
  defaultCountry?: CountryCode;
  /** Fires for both an explicit picker choice and a detected international number. */
  onCountryChange?: (country: CountryCode) => void;
  /** Reserved for the built-in country calling-code picker. */
  leftSlot?: never;
};

export type PhoneCountryCode = CountryCode;

export type PasswordInputTypeProps = {
  type: "password";
  value: string;
  onChange: (value: string) => void;
  /**
   * Marks this as the field a *new* password is being chosen in, rather than
   * an existing one being entered.
   *
   * It only changes what the OS and password managers are told
   * (`autoComplete`), but getting it wrong is the difference between being
   * offered the saved password and being offered a generated one. Defaults
   * to false — signing in is much the commoner case.
   */
  newPassword?: boolean;
};
