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
import { equip, meetsRequirement } from "../../sim/hero";
import {
  RELICS,
  type EquipSlot,
  type Item,
  type ItemSlot,
} from "../../sim/types";
import { useDoubleTap } from "../../ui/double-tap";
import { ItemCard, ItemTile } from "../../ui/items";
import { GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { palette, rarityColor } from "../../ui/palette";

import { CharacterStats } from "./misc";
import { RelicsTab } from "./relics";
import { CornerAction, Workspace } from "./workspace";

/**
 * Character and bag in one screen, after the approved composition: the
 * hero turning in the middle with the ten worn positions down both sides,
 * the bag below. The bag's category tabs sit in the bottom bar on wide
 * screens and under the bag on tall ones. A selected item's details pop up
 * over the equipment with Equip, Take off and Drop in the popup itself;
 * its close sits top right, and a tap on empty space outside closes it.
 * A bag item is shown beside whatever it would replace, so the popup
 * covers the worn positions too; a worn item's popup stays between them.
 * Double-tap equips a bag item or takes a worn one off.
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
  onDoublePress,
}: {
  slot: EquipSlot;
  item: Item | undefined;
  selected: boolean;
  onPress: () => void;
  onDoublePress: () => void;
}) {
  const { t, tr } = useT();
  const press = useDoubleTap(onPress, onDoublePress)!;
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
      onPress={press}
      style={styles.wornSlot}
    >
      <View style={styles.wornIcon}>
        <GIcon
          name={item ? getBase(item.baseId).icon : SLOT_ICONS[slot]}
          size={20}
          color={item ? palette.ivory : palette.faint}
        />
      </View>
      {item && item.rarity !== "normal" ? (
        <View style={[styles.rarity, { backgroundColor: color }]} />
      ) : null}
    </RoundButton>
  );
}

function PopupHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <Row gap={6}>
      <GIcon name={icon} size={12} color={palette.muted} />
      <Label value={label} type="caption2" color={palette.muted} />
    </Row>
  );
}

export function CharacterScreen({
  save,
  onClose,
  showStats = false,
}: {
  save: SaveData;
  onClose: () => void;
  /** Show stats in the same workspace body as the other tabs. */
  showStats?: boolean;
}) {
  const { t } = useT();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const [selected, setSelected] = useState<Selection | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [gridWidth, setGridWidth] = useState(0);
  const [equipmentWidth, setEquipmentWidth] = useState(0);
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
  // What equipping the selected bag item would take off: the item in its
  // slot, plus the offhand or weapon a two-handed swap pushes out.
  const replaced =
    selected?.from === "bag" && item ? equip(hero, item).removed : [];
  // Two cards side by side need about this much room; narrower, they stack.
  const sideBySide = equipmentWidth >= 340;

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

  const equipFromBag = (it: Item) => {
    if (!meetsRequirement(hero, it)) {
      actions.toast("user-shield", "inv.cantWear", undefined, "bad");
      return;
    }
    actions.equipItem(it.uid);
    setSelected(null);
  };
  const takeOff = (slot: EquipSlot) => {
    actions.unequipItem(slot);
    setSelected(null);
  };

  const popup =
    item && selected ? (
      // Taps on the popup itself stay here instead of closing it.
      <View onStartShouldSetResponder={() => true} style={styles.details}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.detailsBody}
        >
          {replaced.length ? (
            <View style={sideBySide ? styles.compareRow : styles.compareStack}>
              <View style={sideBySide ? styles.compareColumn : styles.stacked}>
                <PopupHeading icon="bag-shopping" label={t("inv.selected")} />
                <ItemCard item={item} hero={hero} bare compact />
              </View>
              <View
                style={
                  sideBySide
                    ? [styles.compareColumn, styles.equippedBeside]
                    : [styles.stacked, styles.equippedBelow]
                }
              >
                <PopupHeading icon="user-shield" label={t("inv.equipped")} />
                {replaced.map((r) => (
                  <ItemCard key={r.uid} item={r} hero={hero} bare compact />
                ))}
              </View>
            </View>
          ) : (
            <ItemCard item={item} hero={hero} bare />
          )}
        </ScrollView>
        <Row gap={6} style={styles.actions}>
          {selected.from === "bag" ? (
            <>
              <CornerAction
                icon="arrow-up"
                label={t("inv.equip")}
                iconOnly
                disabled={!meetsRequirement(hero, item)}
                onPress={() => equipFromBag(item)}
              />
              <CornerAction
                icon="trash"
                label={t("inv.drop")}
                iconOnly
                danger
                onPress={() => {
                  actions.dropItem(item.uid);
                  setSelected(null);
                }}
              />
            </>
          ) : (
            <CornerAction
              icon="arrow-down"
              label={t("inv.unequip")}
              iconOnly
              onPress={() => takeOff(selected.slot)}
            />
          )}
        </Row>
        <View style={styles.close}>
          <CornerAction
            icon="xmark"
            label={t("menu.close")}
            iconOnly
            onPress={() => setSelected(null)}
          />
        </View>
      </View>
    ) : null;

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
      {/* A worn item's details fade over the locally dimmed hero. */}
      {selected?.from === "worn" ? popup : null}
    </View>
  );

  const equipment = (
    <View
      style={styles.equipment}
      onLayout={(e) => setEquipmentWidth(e.nativeEvent.layout.width)}
    >
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
            onDoublePress={() =>
              hero.equipment[slot] ? takeOff(slot) : undefined
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
            onDoublePress={() =>
              hero.equipment[slot] ? takeOff(slot) : undefined
            }
          />
        ))}
      </View>
      {/* A bag item's popup covers the worn positions to fit the comparison. */}
      {selected?.from === "bag" ? popup : null}
    </View>
  );

  const categoryTabs = (
    <View accessibilityRole="tablist" style={styles.categories}>
      {CATEGORIES.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="tab"
          accessibilityLabel={
            c.id === "relics" ? t("inv.tab.relics") : t(`inv.cat.${c.id}`)
          }
          accessibilityState={{ selected: category === c.id }}
          onPress={() => setCategory(c.id)}
          style={[styles.categoryTab, category === c.id && styles.categoryOn]}
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
                          onDoublePress={
                            it ? () => equipFromBag(it) : undefined
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
      {wide ? null : categoryTabs}
    </View>
  );

  return (
    <Workspace
      save={save}
      tab={showStats ? "character" : "inventory"}
      onClose={onClose}
      navExtra={!showStats && wide ? categoryTabs : undefined}
    >
      {showStats ? (
        <CharacterStats save={save} />
      ) : (
        // A tap on empty space closes the item popup; items, slots and
        // buttons take their own taps first.
        <View
          onStartShouldSetResponder={() => !!selected}
          onResponderRelease={() => setSelected(null)}
          style={wide ? styles.wide : styles.tall}
        >
          <View style={wide ? styles.half : styles.top}>{equipment}</View>
          <View style={wide ? styles.half : styles.flex}>{bag}</View>
        </View>
      )}
    </Workspace>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tall: { flex: 1, gap: 10 },
  wide: { flex: 1, flexDirection: "row", gap: 14 },
  top: { height: "46%" },
  half: { flex: 1 },
  equipment: { flex: 1, flexDirection: "row", gap: 8 },
  wornSlot: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: "rgba(8, 12, 13, 0.48)",
    transform: [{ rotate: "45deg" }],
  },
  wornIcon: { transform: [{ rotate: "-45deg" }] },
  column: { justifyContent: "space-between", paddingVertical: 2 },
  stage: { flex: 1, overflow: "hidden", borderRadius: 12 },
  details: {
    ...StyleSheet.absoluteFill,
    borderRadius: 12,
    backgroundColor: "rgba(12, 10, 8, 0.86)",
    paddingBottom: 8,
  },
  detailsBody: {
    padding: 12,
    paddingTop: 52,
    gap: 6,
    flexGrow: 1,
    justifyContent: "center",
  },
  close: { position: "absolute", top: 0, end: 0 },
  compareRow: { flexDirection: "row", gap: 12 },
  compareStack: { gap: 14 },
  compareColumn: { flex: 1, gap: 6 },
  stacked: { gap: 6 },
  equippedBeside: {
    paddingStart: 10,
    borderStartWidth: 1,
    borderColor: palette.lineSoft,
  },
  equippedBelow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: palette.lineSoft,
  },
  rarity: {
    position: "absolute",
    bottom: 3,
    end: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  bag: { flex: 1, gap: 8 },
  bagBody: { flex: 1 },
  categories: { flexDirection: "row", gap: 4 },
  categoryTab: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 6,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  categoryOn: { borderColor: palette.amber },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  actions: { alignSelf: "flex-end", paddingHorizontal: 8 },
});
