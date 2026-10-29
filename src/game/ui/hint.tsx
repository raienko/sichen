import { StyleSheet, useWindowDimensions, View } from "react-native";

import { getNpc } from "../data";
import { useT } from "../i18n";
import * as actions from "../state/actions";
import { useGame } from "../state/store";
import { nextHint, type HintWhere } from "../state/tutorial";

import { GButton, GIcon, Label, Row } from "./kit";
import { palette } from "./palette";

/** The current tutorial hint, in Ivan Sirko's voice, if one is due. */
export function HintCard({
  where,
  round = 0,
}: {
  where: HintWhere;
  round?: number;
}) {
  const { t, tr } = useT();
  const save = useGame((s) => s.save);
  const panelOpen = useGame((s) => s.panel !== null);
  const { width, height } = useWindowDimensions();
  const hint = save && !panelOpen ? nextHint(save, where, round) : null;
  if (!hint) return null;
  const portrait = height > width;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        where === "death"
          ? styles.death
          : where === "battle"
            ? styles.battle
            : portrait
              ? styles.portrait
              : styles.landscape,
      ]}
    >
      <View style={styles.card}>
        <Row gap={8}>
          <GIcon name={hint.icon} size={16} color={palette.gold} />
          <Label
            value={tr(getNpc("sirko").name)}
            type="caption1"
            color={palette.gold}
          />
        </Row>
        <Label value={t(hint.key)} type="footnote" color={palette.text} />
        <Row gap={8} style={styles.buttons}>
          <GButton
            label={t("hint.skip")}
            tone="ghost"
            compact
            onPress={() => actions.setTutorial(false)}
          />
          <GButton
            label={t("hint.gotIt")}
            icon="check"
            tone="primary"
            compact
            onPress={() => actions.dismissHint(hint.id)}
          />
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", start: 0, end: 0, alignItems: "center" },
  landscape: { top: 64 },
  portrait: { top: "30%" },
  battle: { top: 56 },
  death: { top: 16 },
  card: {
    maxWidth: 360,
    marginHorizontal: 16,
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: "rgba(20, 15, 10, 0.94)",
  },
  buttons: { justifyContent: "flex-end" },
});
