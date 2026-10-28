import { forwardRef, useId, useRef, useState } from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";

import Button from "@/components/button";
import ColorPicker, { normalizeHex } from "@/components/color-picker";
import Icon from "@/components/icon";
import If from "@/components/if";
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import BaseInput from "../base";
import TextInput from "../text";
import type { ColorInputTypeProps, CommonInputProps } from "../types";

type Props = Omit<ColorInputTypeProps, "type"> & CommonInputProps;

/** What the sheet starts from when there's no value yet — a mid grey, so
 * neither end of the square is where it starts. Colour data, not a style. */
// eslint-disable-next-line no-restricted-syntax -- a value, not a style
const FALLBACK = "#808080";

/**
 * A colour field: shows a swatch and the hex value, and opens a bottom
 * sheet with `ColorPicker`, the preset swatches and a hex field to type a
 * value in. Like `datetime`, every change in the sheet goes into a draft
 * and only "Done" reports it; a backdrop tap, a drag down, the Android
 * back button or "Cancel" leave the value as it was.
 *
 * The hex field accepts three or six digits, with or without `#`, and only
 * moves the picker once what's typed is a whole colour — half a value
 * mid-typing is left alone rather than snapping the picker somewhere.
 *
 * @example <Input type="color" value={accent} onChange={setAccent} label="Accent" />
 * @example <Input type="color" value={accent} onChange={setAccent} presets={["#3F5BD9", "#E4002B"]} />
 */
const ColorInput = forwardRef<RNTextInputInstance, Props>(function ColorInput(
  {
    value,
    onChange,
    presets,
    label,
    placeholder,
    leftSlot,
    rightSlot,
    testID = "color-input",
    ...props
  },
  ref,
) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t } = useLocale();
  const modalId = useId();
  const modal = useRef<ModalHandle>(null);
  const [open, setOpen] = useState(false);

  const current = value === null ? null : normalizeHex(value);
  // Reset from `value` every time the sheet opens, so a cancelled edit
  // leaves nothing behind.
  const [draft, setDraft] = useState(current ?? FALLBACK);
  // What's in the hex field, which may be half-typed and not a colour yet.
  const [typed, setTyped] = useState(draft);

  function openPicker() {
    const start = current ?? FALLBACK;
    setDraft(start);
    setTyped(start);
    setOpen(true);
    modal.current?.show();
  }

  function pick(hex: string) {
    setDraft(hex);
    setTyped(hex);
  }

  function type(text: string) {
    setTyped(text);
    const hex = normalizeHex(text);
    if (hex !== null) setDraft(hex);
  }

  function confirm() {
    onChange(draft);
    modal.current?.hide();
  }

  return (
    <>
      <BaseInput
        ref={ref}
        {...props}
        testID={testID}
        label={label}
        placeholder={placeholder}
        value={current ?? ""}
        onPress={openPicker}
        expanded={open}
        leftSlot={
          leftSlot ?? (
            <If condition={current !== null}>
              <View
                testID={testId(testID, "swatch")}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: current ?? undefined,
                    borderColor: theme.colors.divider,
                  },
                ]}
              />
            </If>
          )
        }
        rightSlot={
          rightSlot ?? (
            <Icon
              name="droplet"
              size={spacing.x20}
              color={theme.colors.textSecondary}
            />
          )
        }
      />
      <Modal
        ref={modal}
        id={modalId}
        type="bottomSheet"
        onClose={() => setOpen(false)}
      >
        <View style={styles.sheet}>
          <If condition={label}>
            <Text value={label ?? ""} type="title3" />
          </If>

          {/* No preview row: the hex field below already shows the value,
              with the swatch in its slot, and every row counts on a short
              screen, where the sheet's buttons have to stay in view. */}
          <ColorPicker
            testID={testId(testID, "picker")}
            value={draft}
            onChange={pick}
            presets={presets}
            preview={false}
          />

          <TextInput
            value={typed}
            onChange={type}
            label={t("colorPicker.hex")}
            leftSlot={
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: draft, borderColor: theme.colors.divider },
                ]}
              />
            }
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <View style={styles.actions}>
            <Button
              value={t("common.cancel")}
              type="tertiary"
              onPress={() => modal.current?.hide()}
              style={styles.action}
            />
            <Button
              value={t("common.done")}
              type="primary"
              onPress={confirm}
              style={styles.action}
              testID={testId(testID, "done")}
            />
          </View>
        </View>
      </Modal>
    </>
  );
});

ColorInput.displayName = "ColorInput";

export default ColorInput;

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  swatch: {
    width: spacing.x20,
    height: spacing.x20,
    borderRadius: radius.indicator,
    borderWidth: spacing.x1,
  },
  sheet: {
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    alignSelf: "center",
    gap: spacing.x16,
  },
  actions: {
    flexDirection: isRTL ? "row-reverse" : "row",
    gap: spacing.x8,
  },
  action: {
    flex: 1,
  },
}));
