import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { content, NAMES } from "../data";
import { useT } from "../i18n";
import HeroPreview from "../render/hero-preview";
import * as actions from "../state/actions";
import type { Look } from "../sim/types";
import { DISPLAY_FONT } from "../ui/fonts";
import { GButton, GIcon, Label, Row } from "../ui/kit";
import { OrnamentRule } from "../ui/ornaments";
import { HAIR_COLORS, palette, SKIN_TONES } from "../ui/palette";

const NAME_RULE = /^[\p{L}][\p{L} '-]{2,15}$/u;
type Step = "look" | "class" | "name";
const STEPS: {
  id: Step;
  icon: string;
  key: "create.body" | "create.class" | "create.name";
}[] = [
  { id: "look", icon: "user", key: "create.body" },
  { id: "class", icon: "shield", key: "create.class" },
  { id: "name", icon: "feather", key: "create.name" },
];

function randomName(body: Look["body"]): string {
  const pick = <T,>(list: readonly T[]) =>
    list[Math.floor(Math.random() * list.length)]!;
  return `${pick(NAMES[body])} ${pick(NAMES.surnames)}`.slice(0, 16);
}

function Choice({
  label,
  count,
  value,
  onChange,
  swatches,
}: {
  label: string;
  count: number;
  value: number;
  onChange: (v: number) => void;
  swatches?: readonly string[];
}) {
  return (
    <View style={styles.choice}>
      <Label value={label} type="caption1" color={palette.muted} />
      <Row gap={7}>
        {Array.from({ length: count }, (_, i) => (
          <GButton
            key={i}
            compact
            label={swatches ? undefined : String(i + 1)}
            icon={swatches ? "circle" : undefined}
            tone={value === i ? "primary" : "default"}
            onPress={() => onChange(i)}
            accessibilityLabel={`${label} ${i + 1}`}
            style={
              swatches
                ? {
                    backgroundColor: swatches[i],
                    borderColor: value === i ? palette.amber : palette.lineSoft,
                  }
                : styles.choiceButton
            }
          />
        ))}
      </Row>
    </View>
  );
}

export default function CreateScreen({ slot }: { slot: number }) {
  const { t, tr } = useT();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const portrait = height > width;
  const [step, setStep] = useState<Step>("look");
  const [look, setLook] = useState<Look>({
    body: "kozak",
    face: 0,
    hair: 0,
    hairColor: 0,
    mustache: true,
  });
  const [name, setName] = useState(() => randomName("kozak"));
  const [classId, setClassId] = useState("lytsar");
  const valid = NAME_RULE.test(name.trim());
  const update = (patch: Partial<Look>) => setLook((l) => ({ ...l, ...patch }));
  const next = () => {
    if (step === "look") setStep("class");
    else if (step === "class") setStep("name");
    else if (valid) actions.createGame(slot, name.trim(), look, classId);
  };

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.preview,
          portrait
            ? { top: insets.top + 76, height: height * 0.57, left: 0, right: 0 }
            : {
                top: insets.top + 50,
                bottom: insets.bottom + 10,
                left: 0,
                width: "62%",
              },
        ]}
      >
        <HeroPreview look={look} classId={classId} />
      </View>
      <Row gap={12} style={[styles.header, { top: insets.top + 10 }]}>
        <GButton
          icon="chevron-left"
          tone="ghost"
          compact
          onPress={actions.goToTitle}
          accessibilityLabel={t("menu.close")}
        />
        <Label value={t("create.title")} type="title2" color={palette.ivory} />
      </Row>
      <View
        style={[
          styles.controlDock,
          portrait
            ? {
                left: 12,
                right: 12,
                bottom: insets.bottom + 70,
                height: Math.min(290, height * 0.39),
              }
            : {
                right: insets.right + 20,
                top: insets.top + 76,
                bottom: insets.bottom + 70,
                width: Math.min(360, width * 0.4),
              },
        ]}
      >
        <OrnamentRule />
        <ScrollView
          key={step}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.controls}
        >
          {step === "look" ? (
            <>
              <Row gap={7} wrap>
                {(["kozak", "kozachka"] as const).map((body) => (
                  <GButton
                    key={body}
                    icon={body === "kozak" ? "mars" : "venus"}
                    label={t(`create.${body}`)}
                    compact
                    tone={look.body === body ? "primary" : "default"}
                    onPress={() => {
                      update({ body, mustache: body === "kozak" });
                      setName(randomName(body));
                    }}
                  />
                ))}
              </Row>
              <Choice
                label={t("create.face")}
                count={3}
                value={look.face}
                onChange={(face) => update({ face })}
                swatches={SKIN_TONES}
              />
              <Choice
                label={t("create.hair")}
                count={3}
                value={look.hair}
                onChange={(hair) => update({ hair })}
              />
              <Choice
                label={t("create.hairColor")}
                count={4}
                value={look.hairColor}
                onChange={(hairColor) => update({ hairColor })}
                swatches={HAIR_COLORS}
              />
              {look.body === "kozak" ? (
                <Choice
                  label={t("create.mustache")}
                  count={2}
                  value={look.mustache ? 0 : 1}
                  onChange={(v) => update({ mustache: v === 0 })}
                />
              ) : null}
            </>
          ) : null}
          {step === "class" ? (
            <>
              <Label
                value={t("create.class")}
                type="headline"
                color={palette.ivory}
              />
              {content.classes.map((cls) => (
                <GButton
                  key={cls.id}
                  icon={cls.icon}
                  label={tr(cls.name)}
                  tone={classId === cls.id ? "primary" : "default"}
                  onPress={() => setClassId(cls.id)}
                  style={styles.classButton}
                />
              ))}
            </>
          ) : null}
          {step === "name" ? (
            <>
              <Label
                value={t("create.name")}
                type="headline"
                color={palette.ivory}
              />
              <Row gap={8}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={16}
                  style={styles.input}
                  accessibilityLabel={t("create.name")}
                />
                <GButton
                  icon="dice"
                  onPress={() => setName(randomName(look.body))}
                  accessibilityLabel={t("create.random")}
                />
              </Row>
              <Label
                value={t("create.nameRule")}
                type="caption2"
                color={valid ? palette.muted : palette.bad}
              />
            </>
          ) : null}
        </ScrollView>
        <GButton
          icon={step === "name" ? "check" : "chevron-right"}
          label={step === "name" ? t("create.start") : t("create.next")}
          tone="primary"
          disabled={step === "name" && !valid}
          onPress={next}
          style={styles.next}
        />
      </View>
      <Row gap={18} style={[styles.steps, { bottom: insets.bottom + 10 }]}>
        {STEPS.map(({ id, icon, key }) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityLabel={t(key)}
            accessibilityState={{ selected: step === id }}
            onPress={() => setStep(id)}
            style={[styles.step, step === id && styles.stepOn]}
          >
            <GIcon
              name={icon}
              size={21}
              color={step === id ? palette.amber : palette.muted}
            />
          </Pressable>
        ))}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0e1518" },
  header: { position: "absolute", start: 12, end: 12, alignItems: "center" },
  preview: { position: "absolute", overflow: "hidden" },
  controlDock: {
    position: "absolute",
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderColor: palette.bronze,
    backgroundColor: "rgba(12, 18, 20, 0.88)",
  },
  controls: { gap: 10, paddingBottom: 8 },
  choice: { gap: 5 },
  choiceButton: { minWidth: 44 },
  classButton: { justifyContent: "flex-start" },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 15,
    color: palette.ivory,
    fontFamily: DISPLAY_FONT,
    fontSize: 21,
    backgroundColor: "#211b16",
    borderColor: palette.bronze,
    borderWidth: 1,
    borderRadius: 4,
  },
  next: { alignSelf: "flex-end", minWidth: 72 },
  steps: { position: "absolute", alignSelf: "center", alignItems: "center" },
  step: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "transparent",
  },
  stepOn: { borderColor: palette.amber },
});
