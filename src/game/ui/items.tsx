import { Pressable, StyleSheet, View } from "react-native";

import { getAffix, getBase, getSet, getUnique } from "../data";
import { useT, type StringKey } from "../i18n";
import { itemName, requirement } from "../sim/loot";
import type { Hero, Item, StatKey, StatMods } from "../sim/types";

import { GIcon, Label } from "./kit";
import { palette, rarityColor } from "./palette";

const PERCENT = new Set<StatKey>([
  "resPhysical",
  "resMagical",
  "resChaos",
  "incPhysical",
  "incMagical",
  "incChaos",
  "incMaxHp",
  "critChance",
  "critMulti",
]);

/** One line per stat: "+12% Physical damage", "Weapon damage 4-8". */
export function useModLines() {
  const { t } = useT();
  return (mods: StatMods | StatMods[]): string[] => {
    const merged: Partial<Record<StatKey, number>> = {};
    for (const m of Array.isArray(mods) ? mods : [mods]) {
      for (const [k, v] of Object.entries(m)) {
        merged[k as StatKey] = (merged[k as StatKey] ?? 0) + (v ?? 0);
      }
    }
    const lines: string[] = [];
    if (merged.weaponMin || merged.weaponMax) {
      lines.push(
        `${t("stat.weaponMin")} ${merged.weaponMin ?? 0}-${merged.weaponMax ?? 0}`,
      );
    }
    for (const [key, value] of Object.entries(merged) as [StatKey, number][]) {
      if (key === "weaponMin" || key === "weaponMax" || !value) continue;
      const sign = value > 0 ? "+" : "";
      const shown = Math.round(value * 10) / 10;
      lines.push(
        `${sign}${shown}${PERCENT.has(key) ? "%" : ""} ${t(`stat.${key}` as StringKey)}`,
      );
    }
    return lines;
  };
}

export function ItemTile({
  item,
  selected,
  onPress,
  size = 46,
  dim,
}: {
  item?: Item;
  selected?: boolean;
  onPress?: () => void;
  size?: number;
  dim?: boolean;
}) {
  const { tr } = useT();
  const color = item ? rarityColor[item.rarity] : palette.lineSoft;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={item ? tr(itemName(item)) : undefined}
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderColor: selected ? palette.gold : color,
          borderWidth: selected ? 2 : 1,
          opacity: dim ? 0.45 : 1,
        },
      ]}
    >
      {item ? (
        <GIcon
          name={getBase(item.baseId).icon}
          size={size * 0.45}
          color={color}
        />
      ) : null}
    </Pressable>
  );
}

export function ItemCard({ item, hero }: { item: Item; hero: Hero }) {
  const { t, tr } = useT();
  const lines = useModLines();
  const base = getBase(item.baseId);
  const req = requirement(item);
  const color = rarityColor[item.rarity];
  const set = item.setId ? getSet(item.setId) : null;
  const worn = set
    ? Object.values(hero.equipment).filter((e) => e?.setId === set.id).length
    : 0;
  const implicit = lines(base.implicit);
  const rolled = lines(
    item.affixes.map((a) => ({ [getAffix(a.id).stat]: a.value })),
  );
  const special = item.uniqueId
    ? lines(getUnique(item.uniqueId).mods)
    : set
      ? lines(set.pieces.find((p) => p.baseId === item.baseId)?.mods ?? {})
      : [];
  const reqText = [
    `Lv ${req.level}`,
    req.str ? `${t("stat.str")} ${req.str}` : null,
    req.dex ? `${t("stat.dex")} ${req.dex}` : null,
    req.int ? `${t("stat.int")} ${req.int}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Label value={tr(itemName(item))} type="headline" color={color} />
      <Label
        value={`${t(`rarity.${item.rarity}`)} · ${tr(base.name)} · ilvl ${item.ilvl}`}
        type="caption1"
        color={palette.muted}
      />
      {implicit.map((l) => (
        <Label key={`i${l}`} value={l} type="footnote" color={palette.muted} />
      ))}
      {special.map((l) => (
        <Label key={`s${l}`} value={l} type="footnote" color={color} />
      ))}
      {rolled.map((l) => (
        <Label
          key={`r${l}`}
          value={l}
          type="footnote"
          color={rarityColor.magic}
        />
      ))}
      {set ? (
        <View style={styles.setBlock}>
          <Label
            value={`${tr(set.name)} · ${t("inv.set", { count: worn, total: set.pieces.length })}`}
            type="caption1"
            color={rarityColor.set}
          />
          {set.bonuses.map((b) => (
            <Label
              key={b.pieces}
              value={`(${b.pieces}) ${lines(b.mods).join(", ")}`}
              type="caption2"
              color={worn >= b.pieces ? rarityColor.set : palette.faint}
            />
          ))}
        </View>
      ) : null}
      {item.uniqueId ? (
        <Label
          value={tr(getUnique(item.uniqueId).lore)}
          type="caption2"
          color={palette.ember}
        />
      ) : null}
      <Label
        value={`${t("inv.requires")}: ${reqText}`}
        type="caption2"
        color={palette.faint}
      />
    </View>
  );
}

/** For lists of loot: tile and name side by side. */
export function ItemRow({ item }: { item: Item }) {
  const { tr } = useT();
  return (
    <View style={styles.row}>
      <ItemTile item={item} size={34} />
      <Label
        value={tr(itemName(item))}
        type="footnote"
        color={rarityColor[item.rarity]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.night,
    borderRadius: 6,
  },
  card: {
    gap: 3,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: palette.night,
  },
  setBlock: { gap: 2, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
