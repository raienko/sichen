import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";
import DateTimePicker, { type DateType } from "react-native-ui-datepicker";

import Button from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import BaseInput from "../base";
import type { CommonInputProps, DateTimeInputTypeProps } from "../types";
import { formatValue, numeralsFor } from "./format";
import usePickerStyles from "./picker-styles";
import { clamp, fromPickerDate, toPickerDate } from "./utils";

type Props = Omit<DateTimeInputTypeProps, "type"> & CommonInputProps;

/**
 * The picker's 12-hour mode is off, permanently, and named rather than
 * written as a bare `false` so it can't be flipped back without reading
 * this. Two independent defects live behind that flag, both in
 * react-native-ui-datepicker 3.3.0:
 *
 * 1. **Noon and midnight are inverted.** Its hour handler maps a picked
 *    "12" to 0 when the period is PM and leaves it at 12 when the period is
 *    AM — so choosing 12 PM sets 00:xx and choosing 12 AM sets 12:xx.
 * 2. **It throws outright in some locales.** The AM/PM wheel's options are
 *    the literal strings "AM"/"PM" while the value matched against them is
 *    the locale's own day period, so Arabic raises
 *    `Selected index -1 is out of bounds [0, 1]`.
 *
 * With the flag off the period wheel never renders, which removes both.
 * Every locale gets 24-hour wheels, and ./format pins the field to the same
 * clock so the two always agree.
 */
const TWELVE_HOUR_UNSUPPORTED = false;

/**
 * The picker is run in UTC and converted at its boundary — see
 * `toPickerDate` in ./utils for the measurements behind that. Everything
 * crossing into `DateTimePicker` below goes through the conversion, and
 * everything coming back out comes through it the other way.
 */
const PICKER_TIME_ZONE = "UTC";

/**
 * A date and/or time picked from a Modal, wrapping
 * react-native-ui-datepicker's calendar.
 *
 * That library rather than `@react-native-community/datetimepicker` because
 * the latter renders the real OS control —
 * an iOS wheel, an Android Material dialog, a browser `<input>` — three
 * different shapes, none of which takes this app's type scale. This one is
 * plain React Native views with every style slot exposed, so one
 * implementation renders identically on all three platforms and takes its
 * colours and typography from our own styleguides (see ./picker-styles).
 * The native picker remains a development-only Storybook peer dependency.
 *
 * Picking is staged: taps update a *draft* and only "Done" reports upward.
 * A datetime needs several taps to express one value, and committing each
 * separately would fire `onChange` with half-finished values (the right day
 * at the wrong time) and leave a cancel with nothing to undo.
 *
 * Everything handed to the picker is memoized. That isn't tidiness: the
 * library re-syncs its internal date whenever any of those props change
 * identity, and each re-sync runs the date through the conversion described
 * in ./utils — so an unstable prop turns a one-off conversion into a
 * repeated one, and the error compounds.
 *
 * @example <Input type="datetime" value={when} onChange={setWhen} label="Starts" />
 * @example <Input type="datetime" mode="date" value={birthday} onChange={setBirthday} max={new Date()} />
 * @example <Input type="datetime" mode="time" value={alarm} onChange={setAlarm} />
 */
const DateTimeInput = forwardRef<RNTextInputInstance, Props>(
  function DateTimeInput(
    {
      value,
      onChange,
      mode = "datetime",
      min,
      max,
      label,
      placeholder,
      rightSlot,
      ...props
    },
    ref,
  ) {
    const { locale, isRTL, weekStartsOn, t } = useLocale();
    const theme = useTheme();
    const { spacing } = useSizes();
    const styles = useStyles();
    const pickerStyles = usePickerStyles();
    const modalId = useId();
    const modal = useRef<ModalHandle>(null);
    const [open, setOpen] = useState(false);
    // Only ever read while the sheet is up, and reset from `value` every
    // time it opens — so a cancelled edit leaves nothing behind.
    const [draft, setDraft] = useState(() => value ?? new Date());
    const draftRef = useRef(draft);

    const showsDate = mode !== "time";
    const showsTime = mode !== "date";

    const pickerDate = useMemo(() => toPickerDate(draft), [draft]);
    const pickerMin = useMemo(
      () => (min ? toPickerDate(min) : undefined),
      [min],
    );
    const pickerMax = useMemo(
      () => (max ? toPickerDate(max) : undefined),
      [max],
    );

    const handleChange = useCallback(
      ({ date }: { date: DateType }) => {
        const converted = fromPickerDate(date);
        if (converted === null) return;

        // The calendar library constrains days but its time wheels ignore
        // min/max. Keep our controlled draft and the value eventually
        // committed by Done inside the public input contract.
        const next = mode === "date" ? converted : clamp(converted, min, max);
        draftRef.current = next;
        setDraft(next);
      },
      [max, min, mode],
    );

    // The step arrows as the app's own glyphs rather than the library's
    // bundled PNGs: those are `require()`d images that only Metro turns into
    // something `Image` can draw (under Vite they render as empty boxes), and
    // they'd never match the kit's icon set anyway. Picked by the locale's
    // direction because the header row is mirrored in RTL, putting "previous"
    // on the right, where it has to point right.
    const pickerIcons = useMemo(
      () => ({
        IconPrev: (
          <Icon
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={spacing.x20}
            color={theme.colors.text}
          />
        ),
        IconNext: (
          <Icon
            name={isRTL ? "chevron-left" : "chevron-right"}
            size={spacing.x20}
            color={theme.colors.text}
          />
        ),
      }),
      [isRTL, spacing.x20, theme.colors.text],
    );

    const directionStyle = useMemo(
      () => ({ direction: isRTL ? ("rtl" as const) : ("ltr" as const) }),
      [isRTL],
    );

    function openPicker() {
      const next = clamp(value ?? new Date(), min, max);
      draftRef.current = next;
      setDraft(next);
      setOpen(true);
      modal.current?.show();
    }

    function confirm() {
      const next =
        mode === "date" ? draftRef.current : clamp(draftRef.current, min, max);
      draftRef.current = next;
      onChange(next);
      modal.current?.hide();
    }

    return (
      <>
        <BaseInput
          ref={ref}
          {...props}
          label={label}
          placeholder={placeholder}
          value={value ? formatValue(value, locale, mode) : ""}
          onPress={openPicker}
          expanded={open}
          rightSlot={
            rightSlot ?? (
              <Icon
                name={showsDate ? "calendar" : "clock"}
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
          // Backdrop tap, drag-down and the Android back button all close
          // without going through `confirm`, so the draft is simply dropped
          // — the same as Cancel.
          onClose={() => setOpen(false)}
        >
          {/* A bottom sheet is as wide as the window, and the calendar's day
              cells divide that width by seven — so on a tablet or a desktop
              browser they'd grow into tiles. The picker caps itself at the
              same width the other self-contained overlay content uses and
              centres in whatever is left. */}
          <View style={styles.sheet}>
            <If condition={label}>
              <Text value={label ?? ""} type="title3" />
            </If>

            {/* The library decides its own RTL-ness from `I18nManager.isRTL`,
                which this app never sets — it drives direction from the
                active locale instead, precisely because I18nManager only
                updates after a native reload (see features/localization's
                useIsRtl). Left alone the calendar would stay an LTR island
                inside an otherwise mirrored screen, so the direction is
                imposed here as a layout style, which Yoga and
                react-native-web both honour. */}
            <View style={directionStyle}>
              <DateTimePicker
                mode="single"
                timeZone={PICKER_TIME_ZONE}
                date={pickerDate}
                onChange={handleChange}
                minDate={pickerMin}
                maxDate={pickerMax}
                timePicker={showsTime}
                use12Hours={TWELVE_HOUR_UNSUPPORTED}
                // Time-only means there is no calendar to come back to, so
                // the header — which is what switches between the day and
                // time views — would only offer a dead end.
                initialView={showsDate ? "day" : "time"}
                hideHeader={!showsDate}
                locale={locale}
                // Kept in step with the field's own digits — see numeralsFor.
                numerals={numeralsFor(locale)}
                firstDayOfWeek={weekStartsOn}
                showOutsideDays
                styles={pickerStyles}
                components={pickerIcons}
              />
            </View>

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
              />
            </View>
          </View>
        </Modal>
      </>
    );
  },
);

DateTimeInput.displayName = "DateTimeInput";

export default DateTimeInput;

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
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
