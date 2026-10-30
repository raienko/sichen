import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { haptics } from "@/features/haptics";

import { getClass } from "../../data";
import { useT } from "../../i18n";
import * as actions from "../../state/actions";
import type { SaveData } from "../../state/save";
import { xpToNext } from "../../sim/hero";
import { heroStats } from "../../sim/stats";
import { Bar, GIcon, Label, RoundButton, Row } from "../../ui/kit";
import { LevelBadge } from "../../ui/level-badge";
import { palette } from "../../ui/palette";

/**
 * The hero's management workspace: character and bag, active skills and the
 * passive tree share one full-screen frame over the dimmed world. A short
 * header names the hero; three symbols along the bottom switch between the
 * screens, with Back in the outer corner.
 */

export type WorkspaceTab = "inventory" | "skills" | "tree";

const TABS: {
  id: WorkspaceTab;
  icon: string;
  key: "menu.inventory" | "menu.skills" | "menu.tree";
}[] = [
  { id: "inventory", icon: "bag-shopping", key: "menu.inventory" },
  { id: "skills", icon: "book-open", key: "menu.skills" },
  { id: "tree", icon: "code-branch", key: "menu.tree" },
];

/** Strength, dexterity and intellect, each with its glyph. */
const ATTRS = [
  { key: "str", icon: "hand-fist" },
  { key: "dex", icon: "feather" },
  { key: "int", icon: "book" },
] as const;

export function Workspace({
  save,
  tab,
  onClose,
  onAttributes,
  right,
  children,
}: {
  save: SaveData;
  tab: WorkspaceTab;
  onClose: () => void;
  /** Opens the full stat list; the attributes are its button. */
  onAttributes?: () => void;
  /** Replaces the attributes at the header's right, e.g. tree points. */
  right?: ReactNode;
  children: ReactNode;
}) {
  const { t, tr } = useT();
  const insets = useSafeAreaInsets();
  const { hero } = save;
  const stats = heroStats(hero);
  const cls = getClass(hero.classId);
  return (
    <View
      style={[
        styles.page,
        {
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          paddingStart: insets.left + 10,
          paddingEnd: insets.right + 10,
        },
      ]}
    >
      <Row gap={10} style={styles.header}>
        <View>
          <View style={styles.portrait}>
            <GIcon name={cls.icon} size={22} color={palette.ivory} />
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
        {right ?? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("menu.character")}
            disabled={!onAttributes}
            onPress={onAttributes}
            style={styles.attrs}
          >
            {ATTRS.map((a) => (
              <View key={a.key} style={styles.attr}>
                <Row gap={3}>
                  <GIcon name={a.icon} size={11} color={palette.muted} />
                  <Label
                    value={t(`attr.${a.key}`)}
                    type="caption2"
                    color={palette.muted}
                  />
                </Row>
                <Label
                  value={String(Math.round(stats[a.key]))}
                  type="headline"
                  color={palette.ivory}
                />
              </View>
            ))}
          </Pressable>
        )}
      </Row>
      <View style={styles.body}>{children}</View>
      <Row gap={8} style={styles.nav}>
        {TABS.map((tb, i) => (
          <Row key={tb.id} gap={8}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <RoundButton
              size={54}
              accessibilityLabel={t(tb.key)}
              selected={tab === tb.id}
              onPress={() => actions.openPanel({ name: tb.id })}
            >
              <GIcon
                name={tb.icon}
                size={22}
                color={tab === tb.id ? palette.amber : palette.ivory}
              />
            </RoundButton>
          </Row>
        ))}
        <View style={styles.flex} />
        <RoundButton
          size={54}
          accessibilityLabel={t("menu.close")}
          onPress={onClose}
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
    borderRadius: 26,
    borderWidth: 2,
    borderColor: palette.ivory,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.glass,
  },
  portraitLevel: { position: "absolute", bottom: -4, end: -6 },
  title: { flex: 1, gap: 4, minWidth: 0 },
  attrs: { flexDirection: "row", gap: 10 },
  attr: { alignItems: "center" },
  body: { flex: 1 },
  nav: { alignItems: "center" },
  divider: { width: 1, height: 26, backgroundColor: palette.bronze },
  corner: { alignItems: "center", gap: 2, minWidth: 56 },
  cornerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.glass,
  },
});
