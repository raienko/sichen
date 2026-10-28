import { forwardRef, useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  type TextInput as RNTextInputInstance,
} from "react-native";

import { fieldA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";

import FormField from "@/components/form-field";
import { testId } from "@/utils";
import type {
  CodeCharset,
  CodeInputTypeProps,
  CommonInputProps,
} from "../types";
import CodeCell from "./cell";

type Props = Omit<CodeInputTypeProps, "type"> & CommonInputProps;

const DEFAULT_LENGTH = 6;

/** One entry per charset, rather than three scattered conditionals. */
const CHARSET = {
  numeric: {
    strip: /[^0-9]/g,
    keyboardType: "number-pad" as const,
    autoCapitalize: "none" as const,
  },
  alphanumeric: {
    strip: /[^0-9a-zA-Z]/g,
    keyboardType: "default" as const,
    // The keyboard starts in capitals; the value is left as typed, since
    // whether a code is case-sensitive is the service's call.
    autoCapitalize: "characters" as const,
  },
} satisfies Record<CodeCharset, unknown>;

/** The platforms spell this differently and each ignores the other's value. */
const OTP_AUTOCOMPLETE = Platform.select({
  ios: "one-time-code" as const,
  android: "sms-otp" as const,
  default: "one-time-code" as const,
});

/**
 * A row of boxes for a verification code, backed by exactly one text input.
 *
 * That single input is the whole design: iOS offers a texted code into *one*
 * field, so the usual one-`TextInput`-per-box approach takes the entire code
 * into the first box and loses the feature. Here the real input is stretched
 * invisibly across the row and the boxes only draw what it holds.
 *
 * Tapping a filled box selects its character in that input, so the next one
 * typed replaces it and backspace removes it — a single digit can be fixed
 * without deleting everything after it. The input never sees the tap itself
 * (it can't be hit-tested reliably at zero opacity), so the caret is this
 * component's state rather than the platform's.
 *
 * @example <Input type="code" value={code} onChange={setCode} onComplete={verify} />
 * @example <Input type="code" charset="alphanumeric" value={code} onChange={setCode} />
 */
const CodeInput = forwardRef<RNTextInputInstance, Props>(function CodeInput(
  {
    value,
    onChange,
    length = DEFAULT_LENGTH,
    onComplete,
    charset = "numeric",
    label,
    error,
    helperText,
    required,
    disabled,
    style,
    onFocus,
    onBlur,
    testID = "code",
  },
  ref,
) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  // Captured rather than forwarded straight through, because the row needs
  // it to focus on tap as well as handing it to whoever passed a `ref`.
  const inputRef = useRef<RNTextInputInstance | null>(null);
  const captureInput = useCallback(
    (node: RNTextInputInstance | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Where the next character goes: a filled box's index while one is being
  // corrected, otherwise the end. Clamped on read, so a value shortened from
  // outside (a reset) can't leave it pointing past the code.
  const [caret, setCaret] = useState(value.length);
  const position = Math.min(caret, value.length);

  const rules = CHARSET[charset];
  const characters = Array.from({ length }, (_, index) => value[index] ?? "");
  const complete = value.length >= length;
  // Clamped, so a full code highlights its last box rather than one that
  // doesn't exist.
  const cursor = Math.min(position, length - 1);

  function focusAt(index: number) {
    setCaret(Math.min(index, value.length));
    inputRef.current?.focus();
  }

  function handleChangeText(next: string) {
    const cleaned = next.replace(rules.strip, "").slice(0, length);
    if (cleaned === value) {
      // The selected character retyped as itself: still a step forward.
      if (next === value) setCaret(position + 1);
      return;
    }

    setCaret(caretAfter(value, cleaned, position));
    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  // A filled box is selected, so typing replaces it and backspace removes
  // it. At the end the caret is pinned there, since a tap lands somewhere in
  // the invisible field and takes the real caret with it. A full code at the
  // end is released, so it can still be selected and cleared.
  const selection =
    position < value.length
      ? { start: position, end: position + 1 }
      : complete
        ? undefined
        : { start: value.length, end: value.length };

  return (
    <FormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      style={style}
    >
      {/* A tap on a box puts the caret there; one between the boxes
          carries on from the end. The invisible input takes no taps at
          all, so focus never depends on hit-testing a zero-opacity view. */}
      <Pressable
        testID={testId(testID, "row")}
        onPress={() => focusAt(value.length)}
        disabled={disabled}
        // Left accessible, a Pressable wrapping a TextInput gives a screen
        // reader two competing stops for one field.
        accessible={false}
        style={[styles.row, disabled ? styles.disabled : null]}
      >
        {characters.map((character, index) => (
          <CodeCell
            key={index}
            testID={testId(testID, "cell", index)}
            index={index}
            character={character}
            active={focused && !disabled && index === cursor}
            invalid={error !== undefined}
            onPress={disabled ? undefined : () => focusAt(index)}
          />
        ))}

        {/* Invisible rather than unmounted: it has to stay focusable and on
            screen for the OS to offer a code into it. */}
        <RNTextInput
          ref={captureInput}
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          editable={!disabled}
          keyboardType={rules.keyboardType}
          autoCapitalize={rules.autoCapitalize}
          autoCorrect={false}
          maxLength={length}
          selection={selection}
          autoComplete={OTP_AUTOCOMPLETE}
          // iOS reads this rather than `autoComplete`; it's what puts the
          // code on the QuickType bar.
          textContentType="oneTimeCode"
          caretHidden
          {...fieldA11yProps({ label, disabled, error })}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
      </Pressable>
    </FormField>
  );
});

CodeInput.displayName = "CodeInput";

export default CodeInput;

const useStyles = createStyles(({ spacing }) => ({
  row: {
    // Codes read left to right in every locale, so this row never mirrors.
    // Nothing sets Yoga's own direction here (see useIsRtl), so plain `row`
    // is all it takes.
    flexDirection: "row",
    gap: spacing.x8,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    // Taps belong to the boxes, which know which character they mean; the
    // field only ever needs focus, and gets it from them.
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Invisible, not hidden: zero size or `display: none` would take it out
    // of the layout and the OS would have nothing to offer the code to.
    opacity: 0,
  },
}));

/**
 * Where the caret belongs after an edit: just past what changed.
 *
 * With a box selected the edit is almost always to that box — its character
 * replaced or removed — and is checked for first, because in a run of the
 * same digit (`1111`) comparing the values alone can't tell which one went.
 * Otherwise everything the two values share at the start and the end is
 * untouched and what lies between is the edit: a character typed at the
 * end, or a whole pasted or autofilled code, which leaves it at the end.
 */
export function caretAfter(
  previous: string,
  next: string,
  position: number = previous.length,
): number {
  if (position < previous.length) {
    const before = previous.slice(0, position);
    const after = previous.slice(position + 1);
    if (next === before + after) return position;
    if (
      next.length === previous.length &&
      next.startsWith(before) &&
      next.endsWith(after)
    )
      return position + 1;
  }

  const shortest = Math.min(previous.length, next.length);

  let start = 0;
  while (start < shortest && previous[start] === next[start]) start += 1;

  let end = 0;
  while (
    end < shortest - start &&
    previous[previous.length - 1 - end] === next[next.length - 1 - end]
  )
    end += 1;

  return next.length - end;
}
