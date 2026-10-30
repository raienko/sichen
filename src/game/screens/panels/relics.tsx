import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useT, type StringKey } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { canUseRelic } from "../../sim/loot";
import { EQUIP_SLOTS, RELICS, type Item, type Relic } from "../../sim/types";
import { ItemCard, ItemTile } from "../../ui/items";
import { GIcon, Label, Row } from "../../ui/kit";
import { palette } from "../../ui/palette";

export const RELIC_ICONS: Record<Relic, string> = {
  change: "shuffle",
  ascent: "arrow-up",
  addition: "plus",
  purge: "minus",
};

/**
 * The inventory's Relics tab: the four crafting relics with what each does,
 * and the items a picked relic can be used on.
 */
export function RelicsTab({ save }: { save: SaveData }) {
  const { t } = useT();
  const [relic, setRelic] = useState<Relic | null>(null);
  const [changed, setChanged] = useState<string | null>(null);
  const items: Item[] = [
    ...EQUIP_SLOTS.map((s) => save.hero.equipment[s]).filter(
      (i): i is Item => !!i,
    ),
    ...save.inventory,
  ];
  const shown = items.find((i) => i.uid === changed);
  return (
    <View style={styles.page}>
      <Label value={t("relic.about")} type="footnote" color={palette.muted} />
      <View style={styles.cards}>
        {RELICS.map((r) => {
          const count = save.relics[r];
          const on = relic === r;
          return (
            <Pressable
              key={r}
              accessibilityLabel={t(`relic.${r}`)}
              accessibilityState={{ selected: on, disabled: count === 0 }}
              disabled={count === 0}
              onPress={() => setRelic(on ? null : r)}
              style={[
                styles.card,
                on && styles.cardOn,
                count === 0 && styles.off,
              ]}
            >
              <View style={styles.icon}>
                <GIcon name={RELIC_ICONS[r]} size={18} color={palette.ember} />
                <View style={styles.count}>
                  <Label
                    value={String(count)}
                    type="caption2"
                    color={palette.night}
                  />
                </View>
              </View>
              <View style={styles.cardText}>
                <Label
                  value={t(`relic.${r}`)}
                  type="subheadline"
                  color={on ? palette.gold : palette.text}
                />
                <Label
                  value={t(`relic.${r}.desc` as StringKey)}
                  type="caption1"
                  color={palette.muted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
      {relic ? (
        <>
          <Label
            value={t("relic.pickItem")}
            type="caption1"
            color={palette.gold}
          />
          <Row gap={4} wrap>
            {items.map((item) => {
              const ok = canUseRelic(relic, item);
              return (
                <ItemTile
                  key={item.uid}
                  item={item}
                  size={44}
                  dim={!ok}
                  selected={item.uid === changed}
                  onPress={
                    ok
                      ? () => {
                          actions.applyRelic(relic, item.uid);
                          setChanged(item.uid);
                          if (save.relics[relic] <= 1) setRelic(null);
                        }
                      : undefined
                  }
                />
              );
            })}
          </Row>
        </>
      ) : null}
      {shown ? <ItemCard item={shown} hero={save.hero} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 10 },
  cards: { gap: 6 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: palette.panelHi,
  },
  cardOn: { borderColor: palette.gold },
  cardText: { flex: 1, gap: 2 },
  off: { opacity: 0.4 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.ember,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
  },
  count: {
    position: "absolute",
    bottom: -4,
    end: -6,
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: palette.gold,
  },
});
