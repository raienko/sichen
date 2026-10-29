import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { content, NAMES } from "../data";
import { useT } from "../i18n";
import * as actions from "../state/actions";
import HeroPreview from "../render/hero-preview";
import type { Look } from "../sim/types";
import { GButton, Label, Row } from "../ui/kit";
import { HAIR_COLORS, palette, SKIN_TONES } from "../ui/palette";

const NAME_RULE = /^[\p{L}][\p{L} '-]{2,15}$/u;

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
      <Row gap={6}>
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
                    borderColor: value === i ? palette.gold : palette.lineSoft,
                  }
                : undefined
            }
          />
        ))}
      </Row>
    </View>
  );
}

export default function CreateScreen({ slot }: { slot: number }) {
  const { t, tr } = useT();
  const insets = useSafeAreaInsets();
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

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom },
      ]}
    >
      <Row>
        <GButton
          icon="chevron-left"
          tone="ghost"
          compact
          onPress={actions.goToTitle}
          accessibilityLabel="Back"
        />
        <Label value={t("create.title")} type="title2" color={palette.gold} />
      </Row>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Label
            value={t("create.name")}
            type="caption1"
            color={palette.muted}
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
            color={valid ? palette.faint : palette.bad}
          />
          <View style={styles.choice}>
            <Label
              value={t("create.body")}
              type="caption1"
              color={palette.muted}
            />
            <Row gap={8}>
              {(["kozak", "kozachka"] as const).map((body) => (
                <GButton
                  key={body}
                  icon={body === "kozak" ? "mars" : "venus"}
                  label={t(`create.${body}`)}
                  tone={look.body === body ? "primary" : "default"}
                  onPress={() => {
                    update({ body, mustache: body === "kozak" });
                    setName(randomName(body));
                  }}
                />
              ))}
            </Row>
          </View>
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
        </View>
        <View style={styles.column}>
          <Label
            value={t("create.class")}
            type="caption1"
            color={palette.muted}
          />
          {content.classes.map((cls) => (
            <GButton
              key={cls.id}
              icon={cls.icon}
              label={`${tr(cls.name)} · ${tr(cls.role)}`}
              tone={classId === cls.id ? "primary" : "default"}
              onPress={() => setClassId(cls.id)}
              style={styles.classButton}
            />
          ))}
          <View style={styles.preview}>
            <HeroPreview look={look} classId={classId} />
          </View>
          <GButton
            label={t("create.start")}
            icon="horse"
            tone="primary"
            disabled={!valid}
            onPress={() => actions.createGame(slot, name.trim(), look, classId)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.bg },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  column: { flex: 1, minWidth: 280, gap: 10 },
  choice: { gap: 6 },
  input: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    color: palette.text,
    backgroundColor: palette.night,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 6,
  },
  classButton: { justifyContent: "flex-start" },
  preview: {
    height: 190,
    overflow: "hidden",
    backgroundColor: palette.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
});
