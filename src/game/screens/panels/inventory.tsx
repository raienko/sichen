import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { RULES } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { meetsRequirement } from "../../sim/hero";
import { sellValue } from "../../sim/loot";
import {
  EQUIP_SLOTS,
  RELICS,
  type EquipSlot,
  type Item,
} from "../../sim/types";
import { ItemCard, ItemTile } from "../../ui/items";

import { RelicsTab } from "./relics";
import { GButton, GIcon, Label, Row, Sheet } from "../../ui/kit";
import { palette } from "../../ui/palette";

const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: "slash",
  offhand: "shield",
  helmet: "hat-cowboy",
  chest: "shirt",
  gloves: "mitten",
  boots: "socks",
  belt: "ribbon",
  amulet: "gem",
  ring1: "ring",
  ring2: "ring",
};

type Selection = {
  from: "inventory" | "stash" | "equipped";
  uid: string;
  slot?: EquipSlot;
};

export function InventoryPanel({
  save,
  mode = "inventory",
  title,
  onClose,
}: {
  save: SaveData;
  mode?: "inventory" | "vendor" | "stash";
  /** Defaults to the inventory's or the stash's own name. */
  title?: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<"items" | "relics">("items");
  // Equipment, bag and details sit side by side from about this width.
  const docked = useWindowDimensions().width < 760;
  const [selected, setSelected] = useState<Selection | null>(null);
  const { hero } = save;

  const find = (s: Selection | null): Item | undefined => {
    if (!s) return undefined;
    if (s.from === "equipped")
      return s.slot ? hero.equipment[s.slot] : undefined;
    return (s.from === "stash" ? save.stash : save.inventory).find(
      (i) => i.uid === s.uid,
    );
  };
  const item = find(selected);

  const grid = (items: Item[], from: "inventory" | "stash", size: number) => (
    <View style={styles.grid}>
      {Array.from({ length: size }, (_, i) => {
        const it = items[i];
        return (
          <ItemTile
            key={it?.uid ?? `empty${i}`}
            item={it}
            size={40}
            selected={!!it && selected?.uid === it.uid}
            dim={!!it && !meetsRequirement(hero, it)}
            onPress={it ? () => setSelected({ from, uid: it.uid }) : undefined}
          />
        );
      })}
    </View>
  );

  // The selected item's card and buttons. Where the columns don't fit side by
  // side they dock under the scrolling grids, so a tap always shows them.
  const details = (
    <>
      {item && selected ? (
        <>
          <ItemCard item={item} hero={hero} />
          {!meetsRequirement(hero, item) && selected.from !== "equipped" ? (
            <Label
              value={t("inv.cantWear")}
              type="caption1"
              color={palette.bad}
            />
          ) : null}
          <Row gap={6} wrap>
            {selected.from === "inventory" ? (
              <GButton
                label={t("inv.equip")}
                icon="user-shield"
                compact
                tone="primary"
                disabled={!meetsRequirement(hero, item)}
                onPress={() => {
                  actions.equipItem(item.uid);
                  setSelected(null);
                }}
              />
            ) : null}
            {selected.from === "equipped" && selected.slot ? (
              <GButton
                label={t("inv.unequip")}
                icon="arrow-down"
                compact
                onPress={() => {
                  actions.unequipItem(selected.slot!);
                  setSelected(null);
                }}
              />
            ) : null}
            {selected.from === "inventory" && mode === "vendor" ? (
              <GButton
                label={t("inv.sellFor", { gold: sellValue(item) })}
                icon="coins"
                compact
                onPress={() => {
                  actions.sellItem(item.uid);
                  setSelected(null);
                }}
              />
            ) : null}
            {selected.from === "inventory" && mode === "stash" ? (
              <GButton
                label={t("inv.toStash")}
                icon="box-archive"
                compact
                onPress={() => {
                  actions.moveToStash(item.uid);
                  setSelected(null);
                }}
              />
            ) : null}
            {selected.from === "stash" ? (
              <GButton
                label={t("inv.fromStash")}
                icon="box-open"
                compact
                onPress={() => {
                  actions.takeFromStash(item.uid);
                  setSelected(null);
                }}
              />
            ) : null}
            {selected.from === "inventory" && mode === "inventory" ? (
              <GButton
                label={t("inv.drop")}
                icon="trash"
                compact
                tone="ghost"
                onPress={() => {
                  actions.dropItem(item.uid);
                  setSelected(null);
                }}
              />
            ) : null}
          </Row>
        </>
      ) : null}
    </>
  );

  return (
    <Sheet
      title={title ?? (mode === "stash" ? t("npc.stash") : t("menu.inventory"))}
      icon={
        mode === "stash"
          ? "box-archive"
          : mode === "vendor"
            ? "coins"
            : "box-open"
      }
      onClose={onClose}
      wide
      footer={docked && item && tab === "items" ? details : undefined}
    >
      {mode === "inventory" ? (
        <Row gap={6}>
          {(["items", "relics"] as const).map((id) => (
            <GButton
              key={id}
              label={
                id === "relics"
                  ? `${t("inv.tab.relics")} ${RELICS.reduce((n, r) => n + save.relics[r], 0)}`
                  : t("inv.tab.items")
              }
              icon={id === "relics" ? "gem" : "box-open"}
              compact
              tone={tab === id ? "primary" : "default"}
              onPress={() => setTab(id)}
            />
          ))}
        </Row>
      ) : null}
      {tab === "relics" ? <RelicsTab save={save} /> : null}
      {tab === "items" ? (
        <View style={styles.columns}>
          <View style={styles.equipment}>
            <Label
              value={t("inv.equipped")}
              type="caption1"
              color={palette.muted}
            />
            <View style={styles.grid}>
              {EQUIP_SLOTS.map((slot) => {
                const it = hero.equipment[slot];
                return (
                  <View key={slot} style={styles.slotCell}>
                    {it ? (
                      <ItemTile
                        item={it}
                        size={44}
                        selected={selected?.slot === slot}
                        onPress={() =>
                          setSelected({ from: "equipped", uid: it.uid, slot })
                        }
                      />
                    ) : (
                      <View style={styles.emptySlot}>
                        <GIcon
                          name={SLOT_ICONS[slot]}
                          size={16}
                          color={palette.faint}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            <Row gap={10} wrap>
              <Row gap={4}>
                <GIcon name="coins" size={14} color={palette.gold} />
                <Label
                  value={String(save.gold)}
                  type="headline"
                  color={palette.gold}
                />
              </Row>
              <Row gap={4}>
                <GIcon name="flask" size={14} color={palette.hp} />
                <Label value={String(hero.potions.hp)} type="footnote" />
                <GIcon name="vial" size={14} color={palette.mana} />
                <Label value={String(hero.potions.mana)} type="footnote" />
              </Row>
            </Row>
            {mode === "vendor" ? (
              <View style={styles.vendor}>
                <GButton
                  icon="flask"
                  label={`${t("npc.buy")} ${RULES.potionPrice.hp}`}
                  compact
                  disabled={
                    save.gold < RULES.potionPrice.hp ||
                    hero.potions.hp >= RULES.potionCap
                  }
                  onPress={() => actions.buyPotion("hp")}
                />
                <GButton
                  icon="vial"
                  label={`${t("npc.buy")} ${RULES.potionPrice.mana}`}
                  compact
                  disabled={
                    save.gold < RULES.potionPrice.mana ||
                    hero.potions.mana >= RULES.potionCap
                  }
                  onPress={() => actions.buyPotion("mana")}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.bag}>
            <Label
              value={`${t("menu.inventory")} ${save.inventory.length}/${RULES.inventorySize}`}
              type="caption1"
              color={palette.muted}
            />
            {grid(save.inventory, "inventory", RULES.inventorySize)}
            {mode === "stash" ? (
              <>
                <Label
                  value={`${t("npc.stash")} ${save.stash.length}/${RULES.stashSize}`}
                  type="caption1"
                  color={palette.muted}
                />
                {grid(save.stash, "stash", RULES.stashSize)}
              </>
            ) : null}
          </View>
          {docked ? null : <View style={styles.details}>{details}</View>}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  equipment: { width: 200, gap: 8 },
  bag: { flex: 1, minWidth: 260, gap: 8 },
  details: { width: 260, gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  slotCell: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySlot: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  vendor: { gap: 6 },
});
