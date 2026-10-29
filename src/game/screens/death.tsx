import { Pressable, StyleSheet, View } from "react-native";

import { useT } from "../i18n";
import * as actions from "../state/actions";
import type { DeathCard } from "../sim/death";
import { GButton, GIcon, Label, Row } from "../ui/kit";
import { palette } from "../ui/palette";

function CardFace({ card }: { card: DeathCard }) {
  const { t } = useT();
  if (card.kind === "mercy") {
    return (
      <>
        <GIcon name="dove" size={26} color={palette.good} />
        <Label value={t("death.mercy")} type="footnote" color={palette.good} />
      </>
    );
  }
  return (
    <>
      <GIcon
        name={card.kind === "xp" ? "hourglass-half" : "coins"}
        size={26}
        color={palette.bad}
      />
      <Label
        value={
          card.kind === "xp"
            ? t("death.xp", { amount: `${card.percent}%` })
            : t("death.gold", { amount: `${card.percent}%` })
        }
        type="footnote"
        color={palette.bad}
      />
    </>
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
                <GIcon name="skull" size={26} color={palette.line} />
              )}
            </Pressable>
          );
        })}
      </Row>
      {picked !== null ? (
        <GButton
          label={t("death.rise")}
          icon="church"
          tone="primary"
          onPress={actions.riseAgain}
        />
      ) : null}
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
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.line,
    backgroundColor: palette.panel,
  },
  chosen: { borderColor: palette.gold, transform: [{ scale: 1.08 }] },
  other: { opacity: 0.5 },
});
