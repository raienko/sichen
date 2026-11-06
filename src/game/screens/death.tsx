import { Pressable, StyleSheet, View } from "react-native";

import { useT } from "../i18n";
import * as actions from "../state/actions";
import type { DeathCard } from "../sim/death";
import { HintCard } from "../ui/hint";
import { GButton, GIcon, Label, Row } from "../ui/kit";
import { palette } from "../ui/palette";

function CardFace({ card }: { card: DeathCard }) {
  const { t } = useT();
  const mercy = card.kind === "mercy";
  const color = mercy ? palette.good : palette.bad;
  const label = mercy
    ? t("death.mercy")
    : card.kind === "xp"
      ? t("death.xp", { amount: `${card.percent}%` })
      : t("death.gold", { amount: `${card.percent}%` });
  return (
    <View style={styles.cardFace}>
      <View style={styles.cardIcon}>
        <GIcon
          name={
            mercy ? "dove" : card.kind === "xp" ? "hourglass-half" : "coins"
          }
          size={26}
          color={color}
        />
      </View>
      <View style={styles.cardText}>
        <Label
          value={label}
          type="footnote"
          color={color}
          style={styles.cardLabel}
        />
      </View>
    </View>
  );
}

export default function DeathScreen({
  cards,
  picked,
}: {
  cards: DeathCard[];
  picked: number | null;
}) {
  const { t } = useT();
  return (
    <View style={styles.page}>
      <GIcon name="skull" size={40} color={palette.muted} />
      <Label value={t("death.title")} type="title2" color={palette.text} />
      <Label value={t("death.pick")} type="callout" color={palette.muted} />
      <Row gap={10} wrap style={styles.cards}>
        {cards.map((card, i) => {
          const open = picked !== null;
          return (
            <Pressable
              key={i}
              disabled={open}
              accessibilityLabel={`${i + 1}`}
              onPress={() => actions.pickDeathCard(i)}
              style={[
                styles.card,
                open && (i === picked ? styles.chosen : styles.other),
              ]}
            >
              {open ? (
                <CardFace card={card} />
              ) : (
                <View style={styles.cardBack}>
                  <GIcon name="skull" size={26} color={palette.line} />
                </View>
              )}
            </Pressable>
          );
        })}
      </Row>
      <View style={styles.footerSlot}>
        {picked !== null ? (
          <GButton
            label={t("death.rise")}
            icon="church"
            tone="primary"
            onPress={actions.riseAgain}
          />
        ) : null}
      </View>
      {picked === null ? <HintCard where="death" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 20,
    backgroundColor: palette.night,
  },
  cards: { justifyContent: "center" },
  card: {
    width: 86,
    height: 128,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  cardFace: { flex: 1, alignItems: "center", paddingTop: 19 },
  cardIcon: { height: 32, alignItems: "center", justifyContent: "center" },
  cardText: { width: "100%", marginTop: 10, paddingHorizontal: 2 },
  cardLabel: { textAlign: "center", fontSize: 17, lineHeight: 21 },
  cardBack: { flex: 1, alignItems: "center", justifyContent: "center" },
  footerSlot: { height: 44, alignItems: "center", justifyContent: "center" },
  chosen: { borderColor: palette.gold },
  other: { opacity: 0.5 },
});
