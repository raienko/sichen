import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { useT } from "../i18n";

import { GIcon, Label } from "./kit";
import { LevelBadge } from "./level-badge";
import { palette } from "./palette";

type Resource = { value: number; max: number };

type Props = {
  icon: string;
  /** The fighter's face (a 3D render); without it, `icon`. */
  portrait?: ReactNode;
  level: number;
  name?: string;
  heroLevel?: number;
  portraitAccent?: string;
  reverse?: boolean;
  hp: Resource;
  mana: Resource;
  stamina: Resource;
  compact?: boolean;
  statuses?: readonly { icon: string; color: string }[];
};

/** A shared portrait pendant for the hero and the selected battle foe. */
export function ActorResourceHud({
  icon,
  portrait,
  level,
  name,
  heroLevel,
  portraitAccent = palette.bronze,
  reverse = false,
  hp,
  mana,
  stamina,
  compact = false,
  statuses,
}: Props) {
  const { t } = useT();
  const rows = [
    {
      id: "hp",
      label: t("stat.maxHp"),
      color: palette.hp,
      textColor: "#ed7763",
      ...hp,
    },
    {
      id: "mana",
      label: t("stat.maxMana"),
      color: palette.mana,
      textColor: "#79aff4",
      ...mana,
    },
    {
      id: "stamina",
      label: t("stat.maxStamina"),
      color: palette.stamina,
      textColor: "#e9c452",
      ...stamina,
    },
  ] as const;
  return (
    <View style={[styles.pendant, compact && styles.pendantCompact]}>
      {name && !compact ? (
        <Label
          value={name}
          type="caption1"
          color={palette.ivory}
          numberOfLines={1}
          style={styles.name}
        />
      ) : null}
      <View style={[styles.crestWrap, compact && styles.crestWrapCompact]}>
        <View
          style={[
            styles.crest,
            { borderColor: portraitAccent },
            compact && styles.crestCompact,
          ]}
        >
          <View
            style={[
              styles.crestInner,
              { borderColor: portraitAccent },
              compact && styles.crestInnerCompact,
            ]}
          >
            {portrait ? (
              <View style={styles.crestFace} pointerEvents="none">
                {portrait}
              </View>
            ) : (
              <View>
                <GIcon
                  name={icon}
                  size={compact ? 18 : 22}
                  color={
                    heroLevel === undefined ? palette.ivory : portraitAccent
                  }
                />
              </View>
            )}
          </View>
        </View>
        <LevelBadge
          level={level}
          heroLevel={heroLevel}
          style={reverse ? styles.levelReverse : styles.level}
        />
      </View>
      <View style={styles.spine} />
      <View style={styles.resources}>
        {rows.map((row) => (
          <View
            key={row.id}
            style={[
              styles.resource,
              reverse && styles.resourceReverse,
              { borderColor: `${row.color}88` },
              compact && styles.resourceCompact,
            ]}
            accessible
            accessibilityLabel={`${row.label}: ${Math.round(row.value)}/${Math.round(row.max)}`}
          >
            <View
              style={[
                styles.resourceFill,
                {
                  width: `${Math.max(0, Math.min(1, row.value / Math.max(1, row.max))) * 100}%`,
                  backgroundColor: row.color,
                },
              ]}
            />
            <ResourceRune kind={row.id} color={row.color} />
            <View style={styles.resourceRule} />
            <Label
              value={String(Math.round(row.value))}
              type="caption1"
              color={row.textColor}
              numberOfLines={1}
              style={[
                styles.resourceNumber,
                reverse && styles.resourceNumberReverse,
                compact && styles.resourceNumberCompact,
              ]}
            />
          </View>
        ))}
      </View>
      {statuses ? (
        <View style={styles.statuses}>
          {statuses.map((status) => (
            <GIcon
              key={status.icon}
              name={status.icon}
              size={11}
              color={status.color}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ResourceRune({
  kind,
  color,
}: {
  kind: "hp" | "mana" | "stamina";
  color: string;
}) {
  return (
    <Svg width={17} height={17} viewBox="0 0 18 18" fill="none">
      {kind === "hp" ? (
        <Path
          d="M9 1 12 4 9 7 6 4 9 1ZM9 11 12 14 9 17 6 14 9 11ZM1 9 4 6 7 9 4 12 1 9ZM11 9 14 6 17 9 14 12 11 9ZM7 7 11 11M11 7 7 11"
          stroke={color}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      ) : kind === "mana" ? (
        <Path
          d="M1 4 Q3 2 5 4 T9 4 T13 4 T17 4 M1 9 Q3 7 5 9 T9 9 T13 9 T17 9 M1 14 Q3 12 5 14 T9 14 T13 14 T17 14"
          stroke={color}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ) : (
        <>
          <Circle cx={9} cy={9} r={3.5} stroke={color} strokeWidth={1.3} />
          <Path
            d="M9 0V4M9 14V18M0 9H4M14 9H18M2.6 2.6 5.4 5.4M12.6 12.6 15.4 15.4M15.4 2.6 12.6 5.4M5.4 12.6 2.6 15.4"
            stroke={color}
            strokeWidth={1.3}
          />
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  pendant: { width: 118, alignItems: "center" },
  pendantCompact: { width: 104 },
  name: { width: "100%", textAlign: "center", marginBottom: 2 },
  crestWrap: {
    width: 70,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  crestWrapCompact: { width: 58, height: 54 },
  // An upright frame: an outer accent line, then a fine inner one.
  crest: {
    width: 60,
    height: 60,
    borderWidth: 1.6,
    borderRadius: 7,
    borderColor: palette.bronze,
    backgroundColor: palette.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  crestCompact: { width: 50, height: 50, borderRadius: 6 },
  crestInner: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: palette.gold,
    alignItems: "center",
    justifyContent: "center",
    // Clips the face to the frame.
    overflow: "hidden",
  },
  crestInnerCompact: { width: 44, height: 44, borderRadius: 4 },
  crestFace: { ...StyleSheet.absoluteFill },
  level: { position: "absolute", bottom: -2, right: -2 },
  levelReverse: { position: "absolute", bottom: -2, left: -2 },
  spine: { width: 1, height: 5, backgroundColor: palette.bronze },
  resources: { width: "100%", gap: 3 },
  resource: {
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: palette.bronze,
    borderRadius: 3,
    backgroundColor: "rgba(18, 13, 10, 0.86)",
    overflow: "hidden",
  },
  resourceCompact: { height: 22 },
  resourceReverse: { flexDirection: "row-reverse" },
  resourceFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.26,
  },
  resourceRule: { flex: 1, height: 1, backgroundColor: palette.line },
  resourceNumber: {
    minWidth: 30,
    textAlign: "right",
    fontSize: 16,
    lineHeight: 20,
  },
  resourceNumberCompact: { fontSize: 14, lineHeight: 18 },
  resourceNumberReverse: { textAlign: "left" },
  statuses: {
    height: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
});
