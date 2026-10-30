import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { getBase, RULES } from "../../data";
import { useT } from "../../i18n";
import HeroPreview from "../../render/hero-preview";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { meetsRequirement } from "../../sim/hero";
import {
  RELICS,
  type EquipSlot,
  type Item,
  type ItemSlot,
} from "../../sim/types";
import { ItemCard, ItemTile } from "../../ui/items";
import { GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { palette, rarityColor } from "../../ui/palette";

import { CharacterPanel } from "./misc";
import { RelicsTab } from "./relics";
import { CornerAction, Workspace } from "./workspace";

/**
 * Character and bag in one screen, after the approved composition: the
 * hero turning in the middle with the ten worn positions down both sides,
 * the bag below with a category rail, and the selected item's details
 * laid over the dimmed hero. Equip, Take off and Drop sit in the lower
 * right; the bag and equipment stay usable while details show.
 */

/** Down the left: head to waist. Down the right: jewellery and hands. */
const LEFT: readonly EquipSlot[] = [
  "helmet",
  "chest",
  "gloves",
  "boots",
  "belt",
];
const RIGHT: readonly EquipSlot[] = [
  "amulet",
  "ring1",
  "ring2",
  "offhand",
  "weapon",
];

/** Placeholder glyphs for empty positions, until painted slot art. */
const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: "khanda",
  offhand: "shield-halved",
  helmet: "helmet-safety",
  chest: "shirt",
  gloves: "mitten",
  boots: "socks",
  belt: "ribbon",
  amulet: "gem",
  ring1: "ring",
  ring2: "ring",
};

type Category = "all" | "weapons" | "armour" | "jewellery" | "relics";
const CATEGORIES: {
  id: Category;
  icon: string;
  slots?: readonly ItemSlot[];
}[] = [
  { id: "all", icon: "grip" },
  { id: "weapons", icon: "khanda", slots: ["weapon"] },
  {
    id: "armour",
    icon: "shield-halved",
    slots: ["offhand", "helmet", "chest", "gloves", "boots", "belt"],
  },
  { id: "jewellery", icon: "ring", slots: ["amulet", "ring"] },
  { id: "relics", icon: "gem" },
];

type Selection =
  { from: "bag"; uid: string } | { from: "worn"; slot: EquipSlot };

const COLUMNS = 5;

function WornSlot({
  slot,
  item,
  selected,
  onPress,
}: {
  slot: EquipSlot;
  item: Item | undefined;
  selected: boolean;
  onPress: () => void;
}) {
  const { t, tr } = useT();
  const color = item ? rarityColor[item.rarity] : palette.faint;
  return (
    <RoundButton
      size={52}
      accessibilityLabel={
        item
          ? `${t(`slot.${slot}`)}: ${tr(getBase(item.baseId).name)}`
          : t(`slot.${slot}`)
      }
      selected={selected}
      dim={!item}
      onPress={onPress}
    >
      <GIcon
        name={item ? getBase(item.baseId).icon : SLOT_ICONS[slot]}
        size={20}
        color={item ? palette.ivory : palette.faint}
      />
      {item && item.rarity !== "normal" ? (
        <View style={[styles.rarity, { backgroundColor: color }]} />
      ) : null}
    </RoundButton>
  );
}

export function CharacterScreen({
  save,
  onClose,
  showStats = false,
}: {
  save: SaveData;
  onClose: () => void;
  /** The full stat list on top; closing it goes back to the bag. */
  showStats?: boolean;
}) {
  const { t } = useT();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const [selected, setSelected] = useState<Selection | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [gridWidth, setGridWidth] = useState(0);
  const { hero } = save;

  const item: Item | undefined = !selected
    ? undefined
    : selected.from === "worn"
      ? hero.equipment[selected.slot]
      : save.inventory.find((i) => i.uid === selected.uid);
  const filter = CATEGORIES.find((c) => c.id === category)!;
  const shown = filter.slots
    ? save.inventory.filter((i) =>
        filter.slots!.includes(getBase(i.baseId).slot),
      )
    : save.inventory;
  const cell = gridWidth > 0 ? Math.floor((gridWidth - 4 * 4) / COLUMNS) : 0;
  const weapon = hero.equipment.weapon;

  const toggle = (next: Selection) =>
    setSelected((prev) =>
      prev &&
      prev.from === next.from &&
      (prev.from === "worn"
        ? prev.slot === (next as { slot: EquipSlot }).slot
        : prev.uid === (next as { uid: string }).uid)
        ? null
        : next,
    );

  const hero3d = (
    <View style={styles.stage}>
      <View style={StyleSheet.absoluteFill}>
        <HeroPreview
          look={hero.look}
          classId={hero.classId}
          weapon={weapon ? getBase(weapon.baseId).kind : undefined}
          helmet={!!hero.equipment.helmet}
        />
      </View>
      {item ? (
        // The details fade over a locally dimmed hero.
        <View style={styles.details}>
          <ScrollView contentContainerStyle={styles.detailsBody}>
            <ItemCard item={item} hero={hero} bare />
            {selected?.from === "bag" && !meetsRequirement(hero, item) ? (
              <Label
                value={t("inv.cantWear")}
                type="caption1"
                color={palette.bad}
              />
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const equipment = (
    <View style={styles.equipment}>
      <View style={styles.column}>
        {LEFT.map((slot) => (
          <WornSlot
            key={slot}
            slot={slot}
            item={hero.equipment[slot]}
            selected={selected?.from === "worn" && selected.slot === slot}
            onPress={() =>
              hero.equipment[slot] ? toggle({ from: "worn", slot }) : undefined
            }
          />
        ))}
      </View>
      {hero3d}
      <View style={styles.column}>
        {RIGHT.map((slot) => (
          <WornSlot
            key={slot}
            slot={slot}
            item={hero.equipment[slot]}
            selected={selected?.from === "worn" && selected.slot === slot}
            onPress={() =>
              hero.equipment[slot] ? toggle({ from: "worn", slot }) : undefined
            }
          />
        ))}
      </View>
    </View>
  );

  const bag = (
    <View style={styles.bag}>
      <Row gap={8}>
        <GIcon name="bag-shopping" size={14} color={palette.muted} />
        <Label
          value={`${save.inventory.length}/${RULES.inventorySize}`}
          type="subheadline"
          color={palette.ivory}
          style={styles.flex}
        />
        <GIcon name="coins" size={13} color={palette.gold} />
        <Label value={String(save.gold)} type="footnote" color={palette.gold} />
        <GIcon name="flask" size={13} color={palette.hp} />
        <Label value={String(hero.potions.hp)} type="footnote" />
        <GIcon name="vial" size={13} color={palette.mana} />
        <Label value={String(hero.potions.mana)} type="footnote" />
      </Row>
      <View style={styles.bagBody}>
        <View style={styles.rail}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="tab"
              accessibilityLabel={
                c.id === "relics" ? t("inv.tab.relics") : t(`inv.cat.${c.id}`)
              }
              accessibilityState={{ selected: category === c.id }}
              onPress={() => setCategory(c.id)}
              style={[styles.railItem, category === c.id && styles.railOn]}
            >
              <GIcon
                name={c.icon}
                size={17}
                color={category === c.id ? palette.amber : palette.muted}
              />
              {c.id === "relics" ? (
                <Label
                  value={String(RELICS.reduce((n, r) => n + save.relics[r], 0))}
                  type="caption2"
                  color={palette.muted}
                />
              ) : null}
            </Pressable>
          ))}
        </View>
        {category === "relics" ? (
          <ScrollView style={styles.flex}>
            <RelicsTab save={save} />
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.flex}
            onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.grid}>
              {cell > 0
                ? Array.from(
                    {
                      length:
                        category === "all"
                          ? RULES.inventorySize
                          : Math.max(COLUMNS * 3, shown.length),
                    },
                    (_, i) => {
                      const it = shown[i];
                      return (
                        <ItemTile
                          key={it?.uid ?? `empty${i}`}
                          item={it}
                          size={cell}
                          selected={
                            !!it &&
                            selected?.from === "bag" &&
                            selected.uid === it.uid
                          }
                          dim={!!it && !meetsRequirement(hero, it)}
                          onPress={
                            it
                              ? () => toggle({ from: "bag", uid: it.uid })
                              : undefined
                          }
                        />
                      );
                    },
                  )
                : null}
            </View>
          </ScrollView>
        )}
      </View>
      {item ? (
        <Row gap={14} style={styles.actions}>
          {selected?.from === "bag" ? (
            <>
              <CornerAction
                icon="user-shield"
                label={t("inv.equip")}
                disabled={!meetsRequirement(hero, item)}
                onPress={() => {
                  actions.equipItem(item.uid);
                  setSelected(null);
                }}
              />
              <CornerAction
                icon="trash"
                label={t("inv.drop")}
                danger
                onPress={() => {
                  actions.dropItem(item.uid);
                  setSelected(null);
                }}
              />
            </>
          ) : selected?.from === "worn" ? (
            <CornerAction
              icon="arrow-down"
              label={t("inv.unequip")}
              onPress={() => {
                actions.unequipItem(selected.slot);
                setSelected(null);
              }}
            />
          ) : null}
        </Row>
      ) : null}
    </View>
  );

  return (
    <>
      <Workspace
        save={save}
        tab={showStats ? "character" : "inventory"}
        onClose={onClose}
      >
        <View style={wide ? styles.wide : styles.tall}>
          <View style={wide ? styles.half : styles.top}>{equipment}</View>
          <View style={wide ? styles.half : styles.flex}>{bag}</View>
        </View>
      </Workspace>
      {showStats ? (
        <CharacterPanel
          save={save}
          onClose={() => actions.openPanel({ name: "inventory" })}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tall: { flex: 1, gap: 10 },
  wide: { flex: 1, flexDirection: "row", gap: 14 },
  top: { height: "46%" },
  half: { flex: 1 },
  equipment: { flex: 1, flexDirection: "row", gap: 8 },
  column: { justifyContent: "space-between", paddingVertical: 2 },
  stage: { flex: 1, overflow: "hidden", borderRadius: 12 },
  details: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(12, 10, 8, 0.72)",
    justifyContent: "center",
  },
  detailsBody: { padding: 12, gap: 6, flexGrow: 1, justifyContent: "center" },
  rarity: {
    position: "absolute",
    bottom: 3,
    end: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  bag: { flex: 1, gap: 8 },
  bagBody: { flex: 1, flexDirection: "row", gap: 8 },
  rail: {
    gap: 4,
    paddingEnd: 6,
    borderEndWidth: 1,
    borderColor: palette.bronze,
  },
  railItem: {
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  railOn: { borderWidth: 1.5, borderColor: palette.amber },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  actions: { alignSelf: "flex-end" },
});
