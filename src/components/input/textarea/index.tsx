import { forwardRef } from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import { useLocale } from "@/features/localization";

import BaseInput from "../base";
import type { CommonInputProps, TextAreaInputTypeProps } from "../types";

type Props = Omit<TextAreaInputTypeProps, "type"> & CommonInputProps;

const DEFAULT_MIN_LINES = 3;
const DEFAULT_MAX_LINES = 6;

/**
 * Several lines of free text — a comment, a note, a message. The same
 * BaseInput shell as every other variation, told to be multiline: it starts
 * `minLines` tall, grows with what's typed up to `maxLines`, then scrolls.
 *
 * **Return inserts a new line; it never submits.** That's what a block of
 * text is for, and a form that submitted on the first Return would lose
 * every message longer than a sentence. Submitting stays the job of the
 * form's own button.
 *
 * With a `maxLength` it counts, under the field at the end of the helper
 * row: "120/500" to look at, "120 of 500 characters" to a screen reader.
 * The limit is hard — the keyboard stops at it — so the count never goes
 * over and needs no error state of its own.
 *
 * Capitalisation and correction are back on here, unlike the single-line
 * variations: this is prose, where both help, rather than a name, code or
 * address, where both get in the way.
 */
const TextAreaInput = forwardRef<RNTextInputInstance, Props>(
  function TextAreaInput(
    {
      value,
      onChange,
      maxLength,
      minLines = DEFAULT_MIN_LINES,
      maxLines = DEFAULT_MAX_LINES,
      autoCapitalize = "sentences",
      autoCorrect = true,
      ...props
    },
    ref,
  ) {
    const { t } = useLocale();

    const counted =
      maxLength === undefined
        ? null
        : {
            counter: `${value.length}/${maxLength}`,
            counterLabel: t("input.characterCount", {
              count: value.length,
              max: maxLength,
            }),
          };

    return (
      <BaseInput
        ref={ref}
        {...props}
        {...counted}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        multiline={{
          minLines,
          // A maximum below the minimum would shrink the field as it filled.
          maxLines: Math.max(minLines, maxLines),
        }}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
    );
  },
);

// forwardRef components have no .name — see ../text for why it's set here.
TextAreaInput.displayName = "TextAreaInput";

export default TextAreaInput;
