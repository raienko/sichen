import { useRef, useState } from "react";
import { View, type TextInput as RNTextInputInstance } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import Input from "@/components/input";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import Readout from "./readout";

// Values are stable codes; the visible labels come from the translations,
// so the list follows the app's language like every other string here.
const COUNTRY_CODES = ["uk", "ua", "es", "jp", "cn"] as const;
const INTEREST_CODES = ["design", "engineering", "research"] as const;
const NOTIFICATION_CODES = ["product", "security", "marketing"] as const;
const PLAN_CODES = ["free", "pro", "business"] as const;

// Swatches offered in the colour sheet: colour data, not UI colours.
// eslint-disable-next-line no-restricted-syntax -- values, not styles
const COLOR_PRESETS = ["#3F5BD9", "#E4002B", "#00A86B", "#FFD400", "#1F2023"];

// Hoisted out of render: a fresh `new Date()` every render is a new
// `maxDate` for the picker on every render, which keeps it re-syncing.
const TODAY = new Date();

/**
 * Every input variation at once, each showing what's specific to it:
 * `text` with a label, slot and helper text; `numeric` with min/max
 * clamping and its own number keyboard; `email` with live validation
 * driving the error state; `select` picking from a list in a Modal instead
 * of being typed into; `password` masked behind an eye that unmasks it;
 * `code` as a row of boxes over one real field, so the OS can autofill it;
 * `datetime` in all three of its modes, one of them bounded so the disabled
 * days are visible. One field is
 * disabled, and "Focus email" exercises ref forwarding through the
 * variation to the RN TextInput.
 */
export default function InputsSection() {
  const { t } = useLocale();
  const styles = useStyles();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>(["design"]);
  const [notificationSettings, setNotificationSettings] = useState<string[]>([
    "security",
  ]);
  const [plan, setPlan] = useState<string | null>("pro");
  const [budget, setBudget] = useState([20, 80]);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [alarm, setAlarm] = useState<Date | null>(null);
  const [accent, setAccent] = useState<string | null>(null);
  const emailRef = useRef<RNTextInputInstance>(null);

  const countries = COUNTRY_CODES.map((code) => ({
    value: code,
    label: t(`input.country.options.${code}`),
  }));
  const interestOptions = [
    ...INTEREST_CODES.map((code) => ({
      value: code,
      label: t(`input.checklist.options.${code}`),
    })),
    {
      value: "unavailable",
      label: t("input.checklist.options.unavailable"),
      disabled: true,
    },
  ];
  const notificationOptions = [
    ...NOTIFICATION_CODES.map((code) => ({
      value: code,
      label: t(`input.switchGroup.options.${code}`),
    })),
    {
      value: "managed",
      label: t("input.switchGroup.options.managed"),
      disabled: true,
    },
  ];
  const planOptions = [
    ...PLAN_CODES.map((code) => ({
      value: code,
      label: t(`input.radioGroup.options.${code}`),
    })),
    {
      value: "enterprise",
      label: t("input.radioGroup.options.enterprise"),
      disabled: true,
    },
  ];

  const emailError =
    email && !email.includes("@") ? t("input.email.error") : undefined;

  return (
    <View style={styles.container}>
      <Input
        label={t("input.name.label")}
        placeholder={t("input.name.placeholder")}
        value={name}
        onChange={setName}
        leftSlot={<Icon name="user" />}
        helperText={t("input.name.helper")}
      />
      <Input
        type="textarea"
        label={t("input.notes.label")}
        placeholder={t("input.notes.placeholder")}
        value={notes}
        onChange={setNotes}
        maxLength={200}
        helperText={t("input.notes.helper")}
      />
      <Input
        type="numeric"
        label={t("input.age.label")}
        placeholder={t("input.age.placeholder")}
        value={age}
        onChange={setAge}
        min={0}
        max={120}
        leftSlot={<Icon name="hash" />}
        helperText={t("input.age.helper")}
      />
      <Input
        ref={emailRef}
        type="email"
        label={t("input.email.label")}
        placeholder={t("input.email.placeholder")}
        value={email}
        onChange={setEmail}
        leftSlot={<Icon name="mail" />}
        error={emailError}
      />
      <Input
        type="password"
        label={t("input.password.label")}
        placeholder="••••••••"
        value={secret}
        onChange={setSecret}
        leftSlot={<Icon name="lock" />}
      />
      <Input
        type="phone"
        defaultCountry="US"
        label={t("input.phone.label")}
        placeholder={t("input.phone.placeholder")}
        value={phone}
        onChange={setPhone}
        helperText={t("input.phone.helper")}
      />
      <Input
        type="code"
        label={t("input.code.label")}
        value={code}
        onChange={setCode}
        helperText={t("input.code.helper")}
      />
      <Input
        type="select"
        label={t("input.country.label")}
        placeholder={t("input.country.placeholder")}
        value={country}
        onChange={setCountry}
        options={countries}
        leftSlot={<Icon name="globe" />}
        helperText={t("input.country.helper")}
      />
      <Input
        type="checklist"
        label={t("input.checklist.label")}
        value={interests}
        onChange={setInterests}
        options={interestOptions}
        helperText={t("input.checklist.helper")}
      />
      <Input
        type="switchGroup"
        label={t("input.switchGroup.label")}
        value={notificationSettings}
        onChange={setNotificationSettings}
        options={notificationOptions}
        groupSwitch
        helperText={t("input.switchGroup.helper")}
        switchType="expo"
      />
      <Input
        type="radioGroup"
        label={t("input.radioGroup.label")}
        value={plan}
        onChange={setPlan}
        options={planOptions}
        helperText={t("input.radioGroup.helper")}
        radioType="expo"
      />
      <Input
        type="range"
        label={t("input.range.label")}
        value={budget}
        onChange={setBudget}
        min={0}
        max={100}
        step={5}
        thumbLabels={[t("input.range.minimum"), t("input.range.maximum")]}
        helperText={t("input.range.helper")}
      />
      <Input
        type="datetime"
        label={t("input.startsAt.label")}
        placeholder={t("input.startsAt.placeholder")}
        value={startsAt}
        onChange={setStartsAt}
        leftSlot={<Icon name="calendar" />}
        helperText={t("input.startsAt.helper")}
      />
      <Input
        type="datetime"
        mode="date"
        label={t("input.birthday.label")}
        placeholder={t("input.birthday.placeholder")}
        value={birthday}
        onChange={setBirthday}
        max={TODAY}
        leftSlot={<Icon name="gift" />}
        helperText={t("input.birthday.helper")}
      />
      <Input
        type="datetime"
        mode="time"
        label={t("input.alarm.label")}
        placeholder={t("input.alarm.placeholder")}
        value={alarm}
        onChange={setAlarm}
        leftSlot={<Icon name="clock" />}
        helperText={t("input.alarm.helper")}
      />
      <Input
        type="color"
        label={t("input.color.label")}
        placeholder={t("input.color.placeholder")}
        value={accent}
        onChange={setAccent}
        presets={COLOR_PRESETS}
        helperText={t("input.color.helper")}
      />
      <Input
        label={t("input.disabled.label")}
        placeholder={t("input.disabled.placeholder")}
        value=""
        onChange={() => {}}
        disabled
        leftSlot={<Icon name="slash" />}
      />

      <Button
        value={t("input.focusEmail")}
        onPress={() => emailRef.current?.focus()}
      />

      {/* Readout labels stay untranslated on purpose: each one names the
          piece of state above it (`name`, `startsAt`, ...), so it's an
          identifier being echoed back, not copy. */}
      <Readout label="name" value={name || "—"} />
      <Readout label="age" value={age === null ? "—" : String(age)} />
      <Readout label="email" value={email || "—"} />
      {/* The stored value, not the label — the point of an option's `value`
          being separate from what it displays. */}
      <Readout label="country" value={country ?? "—"} />
      <Readout label="interests" value={interests.join(", ") || "—"} />
      <Readout
        label="notificationSettings"
        value={notificationSettings.join(", ") || "—"}
      />
      <Readout label="plan" value={plan ?? "—"} />
      <Readout label="budget" value={budget.join("–")} />
      <Readout label="phone" value={phone ?? "—"} />
      <Readout
        label="startsAt"
        value={startsAt ? startsAt.toISOString() : "—"}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
