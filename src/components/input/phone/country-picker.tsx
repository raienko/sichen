import { useId, useRef, useState } from "react";
import {
  Pressable,
  View,
  type TextInput as TextInputHandle,
} from "react-native";
import type { CountryCode } from "libphonenumber-js";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import BaseInput from "../base";
import { getPhoneCountries, type PhoneCountry } from "./countries";
import CountryOption from "./country-option";

type Props = {
  value?: CountryCode;
  onChange: (country: CountryCode) => void;
  disabled?: boolean;
};

export default function CountryPicker({ value, onChange, disabled }: Props) {
  const { locale, t } = useLocale();
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const modalId = useId();
  const modal = useRef<ModalHandle>(null);
  const searchInput = useRef<TextInputHandle>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const countries = getPhoneCountries(locale);
  const selected = countries.find((country) => country.code === value);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visibleCountries = normalizedQuery
    ? countries.filter((country) => {
        const searchable = `${country.name} ${country.code} +${country.callingCode}`;
        return searchable.toLocaleLowerCase(locale).includes(normalizedQuery);
      })
    : countries;

  function show() {
    setQuery("");
    setOpen(true);
    modal.current?.show();
  }

  function pick(option: PhoneCountry) {
    onChange(option.code);
    modal.current?.hide();
  }

  const selection = selected
    ? `${selected.name}, +${selected.callingCode}`
    : undefined;

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          pressed && !disabled
            ? { backgroundColor: theme.colors.pressed }
            : null,
        ]}
        onPress={show}
        disabled={disabled}
        {...controlA11yProps({
          label: t("input.phone.countryPicker.label"),
          value: selection,
          disabled: disabled ?? false,
          expanded: open,
        })}
      >
        {selected ? (
          <Text value={selected.flag} type="body" allowFontScaling={false} />
        ) : (
          <Icon
            name="globe"
            size={spacing.x20}
            color={theme.colors.textSecondary}
          />
        )}
        {/* Not an `If`: its children are built whether or not the
            condition holds, and it does not narrow — `selected.callingCode`
            would be read on the undefined value. A ternary is the right
            spelling wherever the body reaches into what is being guarded. */}
        {selected ? (
          <Text value={`+${selected.callingCode}`} type="callout" />
        ) : null}
        <Icon
          name="chevron-down"
          size={spacing.x16}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      <Modal
        ref={modal}
        id={modalId}
        type="fullscreen"
        onShow={() => searchInput.current?.focus()}
        onClose={() => setOpen(false)}
      >
        <View style={styles.header}>
          <Text value={t("input.phone.countryPicker.title")} type="title3" />
          <IconButton
            label={t("common.close")}
            size="small"
            onPress={() => modal.current?.hide()}
          >
            <Icon name="x" />
          </IconButton>
        </View>
        <BaseInput
          ref={searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t("input.phone.countryPicker.search")}
          leftSlot={<Icon name="search" />}
        />
        {visibleCountries.length > 0 ? (
          visibleCountries.map((option) => (
            <CountryOption
              key={option.code}
              option={option}
              selected={option.code === value}
              onPress={pick}
            />
          ))
        ) : (
          <Text
            value={t("input.phone.countryPicker.empty")}
            style={{ color: theme.colors.textSecondary }}
          />
        )}
      </Modal>
    </>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  trigger: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing.x4,
    paddingEnd: spacing.x8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));
