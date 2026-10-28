import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  TextInput as RNTextInput,
  View,
  type TextInput as RNTextInputInstance,
} from "react-native";

import Text from "@/components/text";
import { controlA11yProps, fieldA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import FormField from "@/components/form-field";
import { isWeb } from "@/utils";

import type { BaseInputProps } from "./types";
import useMultilineHeight from "./use-multiline-height";

export type { BaseInputProps } from "./types";

/**
 * The shared shell every input variation (Text, Numeric, Select, ...)
 * renders through — label, left/right slots, the actual value host,
 * focus/disabled styling, and error/helper text. A variation only needs to
 * resolve its own value/onChangeText (and whatever type-specific extras) and
 * hand the rest straight through here; none of that shared UI is duplicated
 * per variation.
 *
 * autoCapitalize/autoCorrect default off *here*, so every current and future
 * variation gets that default for free without having to remember it.
 *
 * Forwards its ref to the underlying RN TextInput, so a parent can call
 * `.focus()`/`.blur()` imperatively (e.g. focusing the next field on
 * submit) — every variation forwards its own ref through to here too. A
 * press-mode field has no TextInput to forward to, so its ref stays `null`;
 * there's nothing to focus in a field that can't be typed into.
 */
const BaseInput = forwardRef<RNTextInputInstance, BaseInputProps>(
  function BaseInput(
    {
      value,
      onChangeText,
      label,
      placeholder,
      disabled,
      leftSlot,
      rightSlot,
      style,
      keyboardType = "default",
      secureTextEntry,
      autoComplete = "off",
      importantForAutofill,
      autoCapitalize = "none",
      autoCorrect = false,
      error,
      helperText,
      required,
      onFocus,
      onBlur,
      onPress,
      expanded,
      multiline,
      maxLength,
      counter,
      counterLabel,
    },
    ref,
  ) {
    const theme = useTheme();
    const styles = useStyles();
    const { t } = useLocale();
    const [focused, setFocused] = useState(false);

    // The "Required" / "Optional" beside the label is text a screen reader
    // never reaches from inside the field, so it joins the field's own name.
    const name = label ?? placeholder;
    const accessibleName =
      name !== undefined && required
        ? `${name}, ${t("formField.required")}`
        : name;

    // Sized in lines of the field's own type step, so a taller OS text size
    // makes a taller field rather than fewer visible lines.
    //
    // The height follows the text explicitly rather than being left to the
    // platform: native TextInput grows between min and max on its own, but
    // react-native-web's textarea doesn't, and would scroll from the first
    // overflowing line.
    const input = useRef<RNTextInputInstance>(null);
    useImperativeHandle(ref, () => input.current as RNTextInputInstance, []);
    const autoHeight = useMultilineHeight(multiline, value);

    // Web only — see useMultilineHeight. Collapsing the textarea for one
    // synchronous read gives its content's real height, which the browser
    // otherwise never reports as smaller than the box; the next render
    // puts the height back.
    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      if (!isWeb || multiline === undefined) return;
      const node = input.current as unknown as HTMLTextAreaElement | null;
      if (!node) return;
      const previous = node.style.height;
      node.style.height = "0px";
      autoHeight.setContentHeight(node.scrollHeight);
      node.style.height = previous;
    };

    const fieldStyle = [
      styles.field,
      multiline === undefined ? null : styles.fieldMultiline,
      focused || error
        ? multiline === undefined
          ? styles.fieldEmphasised
          : styles.fieldMultilineEmphasised
        : null,
      {
        opacity: disabled ? 0.5 : 1,
        borderColor: error
          ? theme.colors.error
          : focused
            ? theme.colors.focus
            : theme.colors.border,
      },
    ];

    // A press-mode field renders its value as plain text rather than a
    // non-editable TextInput. Both look identical, but a TextInput announces
    // itself as an edit box and takes keyboard focus on web — wrong for a
    // control whose value can only be picked, not typed.
    const host: ReactNode = onPress ? (
      <Text
        value={value || placeholder || ""}
        type="callout"
        numberOfLines={1}
        style={[
          styles.text,
          { color: value ? theme.colors.text : theme.colors.textSecondary },
        ]}
      />
    ) : (
      <RNTextInput
        ref={input}
        style={[styles.input, autoHeight.style, { color: theme.colors.text }]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        editable={!disabled}
        multiline={multiline !== undefined}
        // Web only: react-native-web renders a multiline field as a
        // <textarea> with the browser's default two rows, and measures its
        // content size against that — so a one-line field reported two
        // lines' worth and never shrank to `minLines`. Native platforms
        // size from content alone (and on Android this prop would fix the
        // line count instead).
        {...(isWeb && multiline !== undefined
          ? { numberOfLines: multiline.minLines }
          : null)}
        onContentSizeChange={autoHeight.onContentSizeChange}
        // Android centres multiline text vertically by default; a block of
        // text reads from the top.
        textAlignVertical={multiline === undefined ? undefined : "top"}
        maxLength={maxLength}
        // A sibling <Text> label isn't auto-associated with a field the
        // way HTML's <label for> is, and an error needs announcing as
        // *why* the field is invalid — both handled by the shared helper.
        {...fieldA11yProps({
          label: accessibleName,
          disabled,
          error,
        })}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        importantForAutofill={importantForAutofill}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
    );

    return (
      <FormField
        label={label}
        required={required}
        error={error}
        helperText={helperText}
        counter={counter}
        counterLabel={counterLabel}
        style={style}
      >
        {onPress ? (
          <Pressable
            style={({ pressed }) => [
              ...fieldStyle,
              pressed && !disabled
                ? { backgroundColor: theme.colors.pressed }
                : null,
            ]}
            onPress={onPress}
            disabled={disabled}
            // The whole row is one control, so the announcement is built
            // here rather than left to RN deriving it from the children —
            // which would read out the placeholder as if it were a value.
            {...controlA11yProps({
              label: accessibleName,
              value: value || undefined,
              hint: error,
              disabled: disabled ?? false,
              expanded,
            })}
          >
            {leftSlot}
            {host}
            {rightSlot}
          </Pressable>
        ) : (
          <View style={fieldStyle}>
            {leftSlot}
            {host}
            {rightSlot}
          </View>
        )}
      </FormField>
    );
  },
);

// forwardRef components have no .name (unlike a plain function component) —
// set explicitly so `describe(\`${Component.displayName} smoke test\`, ...)`
// still works the same way it does for every non-forwardRef component here.
BaseInput.displayName = "BaseInput";

export default BaseInput;

// Label and helper text aren't styled here — they're <Text type="footnote">
// and <Text type="caption1">, so they get a *whole* type-scale entry rather
// than this file overriding only `fontSize` on top of `body`. That partial
// override was a real bug: an 11px label kept body's 19px line height.
const useStyles = createStyles(
  ({ isRTL, spacing, sizes, typography, radius }) => {
    const multilinePadding = Math.max(
      spacing.x4,
      (sizes.elementHeightMd - typography.callout.lineHeight) / 2 - spacing.x1,
    );

    return {
      field: {
        borderRadius: radius.control,
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        gap: spacing.x8,
        minHeight: sizes.elementHeightMd,
        paddingHorizontal: spacing.x12,
        // Reserved for the emphasised border below. A field is usually as tall
        // as `minHeight`, but one holding a full-size slot (Password's eye
        // button) is as tall as its content — there a thicker border would
        // grow the box and push the text down unless it has padding to eat.
        paddingVertical: spacing.x1,
        borderWidth: spacing.x1,
      },
      // Whatever the border gains comes out of the padding on every side, so
      // neither the field's size nor its text moves when it gains focus.
      // Written as the difference of the two widths rather than "one pixel":
      // both go through `units()`, and after rounding `x2` isn't always `x1`
      // plus one (2px and 3px on a wide window).
      fieldEmphasised: {
        borderWidth: spacing.x2,
        paddingHorizontal: spacing.x12 - (spacing.x2 - spacing.x1),
        paddingVertical: spacing.x1 - (spacing.x2 - spacing.x1),
      },
      // A block of text starts at the top rather than the single-line row's
      // centring. The padding is whatever makes *one* line exactly
      // `elementHeightMd` tall, so a one-line textarea (Chat's composer) sits
      // level with the buttons and single-line fields beside it, and only
      // grows from there. Never below x4, so very large text keeps a margin.
      fieldMultiline: {
        alignItems: "flex-start",
        paddingVertical: multilinePadding,
      },
      // The same focus compensation as above, from that padding.
      fieldMultilineEmphasised: {
        borderWidth: spacing.x2,
        paddingHorizontal: spacing.x12 - (spacing.x2 - spacing.x1),
        paddingVertical: multilinePadding - (spacing.x2 - spacing.x1),
      },
      // The RN TextInput host is not our Text component, so it takes the type
      // scale as a style rather than a `type` prop.
      input: {
        ...typography.callout,
        flex: 1,
        // Web inputs default to `min-width: auto`, so a long unbroken value
        // can force this flex child wider than the field. Zero lets it shrink
        // beside slots; the input itself then scrolls its text horizontally.
        minWidth: 0,
        padding: 0,
        // Browsers draw their own focus outline inside our styled field. The
        // field's focused border is the design-system focus treatment.
        outlineColor: "transparent",
        outlineStyle: "solid",
        outlineWidth: 0,
        writingDirection: isRTL ? "rtl" : "ltr",
      },
      // The press-mode host *is* our Text component, so it only needs the
      // layout half of the above — `type="callout"` carries the type scale.
      text: {
        flex: 1,
        minWidth: 0,
        writingDirection: isRTL ? "rtl" : "ltr",
      },
    };
  },
);
