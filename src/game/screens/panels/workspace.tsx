import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/features/haptics";

import { getClass } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { treePointsLeft, xpToNext } from "../../sim/hero";
import { Bar, GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { LevelBadge } from "../../ui/level-badge";
import { palette } from "../../ui/palette";

/**
 * The hero's management workspace: character and bag, active skills and the
 * passive tree share one full-screen frame over the dimmed world. A short
 * header names the hero on the inventory, character and skills tabs; symbols
 * along the bottom switch screens, with Back in the outer corner.
 */

export type WorkspaceTab = "inventory" | "character" | "skills" | "tree";

const TABS: {
  id: WorkspaceTab;
  icon: string;
  key: "menu.inventory" | "menu.character" | "menu.skills" | "menu.tree";
}[] = [
  { id: "inventory", icon: "bag-shopping", key: "menu.inventory" },
  { id: "character", icon: "user", key: "menu.character" },
  { id: "skills", icon: "book-open", key: "menu.skills" },
  { id: "tree", icon: "code-branch", key: "menu.tree" },
];

export function Workspace({
  save,
  tab,
  onClose,
  hideHeader,
  children,
}: {
  save: SaveData;
  tab: WorkspaceTab;
  onClose: () => void;
  hideHeader?: boolean;
  children: ReactNode;
}) {
  const { t, tr } = useT();
  const insets = useSafeAreaInsets();
  const { hero } = save;
  const cls = getClass(hero.classId);
  const treePoints = treePointsLeft(hero);
  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 8,
          paddingStart: insets.left + 18,
          paddingEnd: insets.right + 18,
        },
      ]}
    >
      {!hideHeader ? (
        <Row gap={10} style={styles.header}>
          <View>
            <View style={styles.portrait}>
              <View style={styles.portraitInner}>
                <GIcon name={cls.icon} size={22} color={palette.ivory} />
              </View>
            </View>
            <LevelBadge level={hero.level} style={styles.portraitLevel} />
          </View>
          <View style={styles.title}>
            <Label
              value={`${hero.name} · ${tr(cls.name)}`}
              type="headline"
              display
              color={palette.ivory}
              numberOfLines={1}
            />
            <Row gap={8}>
              <Bar
                value={hero.xp}
                max={xpToNext(hero.level)}
                color={palette.gold}
                height={6}
                style={styles.flex}
              />
              <Label
                value={`${hero.xp}/${xpToNext(hero.level)}`}
                type="caption2"
                color={palette.muted}
              />
            </Row>
          </View>
        </Row>
      ) : null}
      <View style={styles.body}>{children}</View>
      <Row gap={8} style={styles.nav}>
        {TABS.map((tb, i) => (
          <Row key={tb.id} gap={8}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.navTab}>
              <RoundButton
                size={54}
                accessibilityLabel={
                  tb.id === "tree" && treePoints > 0
                    ? `${t(tb.key)}, ${t("tree.points", { points: treePoints })}`
                    : t(tb.key)
                }
                selected={tab === tb.id}
                onPress={() => actions.openPanel({ name: tb.id })}
                style={styles.navButton}
              >
                <GIcon
                  name={tb.icon}
                  size={22}
                  color={tab === tb.id ? palette.amber : palette.ivory}
                />
              </RoundButton>
              {tb.id === "tree" && treePoints > 0 ? (
                <View style={styles.treeBadge} pointerEvents="none">
                  <Label
                    value={String(treePoints)}
                    type="caption2"
                    color={palette.night}
                    numberOfLines={1}
                  />
                </View>
              ) : null}
            </View>
          </Row>
        ))}
        <View style={styles.flex} />
        <RoundButton
          size={54}
          accessibilityLabel={t("menu.close")}
          onPress={onClose}
          style={styles.navButton}
        >
          <GIcon name="reply" size={20} color={palette.ivory} />
        </RoundButton>
      </Row>
    </View>
  );
}

/**
 * A round action with a caption under it, for the lower outer corner. The
 * circle and the caption are one button, so either can be tapped.
 */
export function CornerAction({
  icon,
  label,
  onPress,
  disabled,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const tone = danger ? palette.bad : palette.ivory;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.corner,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.cornerRing, { borderColor: tone }]}>
        <GIcon name={icon} size={20} color={tone} />
      </View>
      <Label value={label} type="caption2" color={tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Dims the world rather than hiding it.
  page: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(12, 10, 8, 0.9)",
    gap: 10,
  },
  flex: { flex: 1 },
  header: { alignItems: "center" },
  portrait: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: palette.bronze,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.glass,
    transform: [{ rotate: "45deg" }],
  },
  portraitInner: { transform: [{ rotate: "-45deg" }] },
  portraitLevel: { position: "absolute", bottom: -4, end: -6 },
  title: { flex: 1, gap: 4, minWidth: 0 },
  body: { flex: 1 },
  nav: { alignItems: "center" },
  navTab: { width: 54, height: 54 },
  navButton: {
    borderWidth: 0,
    backgroundColor: "transparent",
    boxShadow: "none",
  },
  treeBadge: {
    position: "absolute",
    top: -5,
    right: -6,
    minWidth: 21,
    minHeight: 21,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: palette.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { width: 1, height: 26, backgroundColor: palette.bronze },
  corner: { alignItems: "center", gap: 2, minWidth: 56 },
  cornerRing: {
    width: 52,
    height: 52,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
