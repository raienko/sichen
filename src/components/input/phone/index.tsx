import { forwardRef } from "react";
import { Platform, type TextInput as RNTextInputInstance } from "react-native";

import BaseInput from "../base";
import type { CommonInputProps, PhoneInputTypeProps } from "../types";
import CountryPicker from "./country-picker";
import usePhoneText from "./use-phone-text";

type Props = Omit<PhoneInputTypeProps, "type"> & CommonInputProps;

/**
 * A phone number, grouped as it's typed and reported in E.164.
 *
 * `value`/`onChange` are `string | null` rather than the typed text — null
 * until the number is a valid one — so a caller gets a submittable number
 * without parsing anything, and can tell a finished number from a half-typed
 * one by whether it's null. The buffering and formatting live in
 * usePhoneText, mirroring `numeric`.
 *
 * The leading slot is reserved for its country picker. Picking a country
 * changes the numbering plan for national input; typing or autofilling an
 * international number moves the picker to the detected country.
 *
 * @example <Input type="phone" defaultCountry="US" value={phone} onChange={setPhone} />
 */
const PhoneInput = forwardRef<RNTextInputInstance, Props>(function PhoneInput(
  { value, onChange, defaultCountry, onCountryChange, disabled, ...props },
  ref,
) {
  const { text, country, onChangeText, selectCountry } = usePhoneText(
    value,
    onChange,
    defaultCountry,
    onCountryChange,
  );

  const autoComplete = Platform.select({
    android: "tel-device" as const,
    default: "tel" as const,
  });

  return (
    <BaseInput
      ref={ref}
      {...props}
      disabled={disabled}
      value={text}
      onChangeText={onChangeText}
      keyboardType="phone-pad"
      autoComplete={autoComplete}
      importantForAutofill="yes"
      leftSlot={
        <CountryPicker
          value={country}
          onChange={selectCountry}
          disabled={disabled}
        />
      }
    />
  );
});

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
