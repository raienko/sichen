import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import Icon from "@/components/icon";
import Text from "@/components/text";
import type { IconNameByType } from "@/components/icon";
import type { TypographyToken } from "@/features/responsive";
import { haptics } from "@/features/haptics";

import { DISPLAY_FONT } from "./fonts";
import { palette } from "./palette";

export type GameIconName = IconNameByType["FontAwesome6"];

/** Icons come from data as strings; the content test checks they exist. */
export function GIcon({
  name,
  size = 16,
  color = palette.text,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Icon
      type="FontAwesome6"
      name={name as GameIconName}
      size={size}
      color={color}
    />
  );
}

export function Label({
  value,
  type = "footnote",
  color = palette.text,
  style,
  numberOfLines,
  display,
}: {
  value: string;
  type?: TypographyToken;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Names and headings: the display serif (not numbers, see fonts.ts). */
  display?: boolean;
}) {
  return (
    <Text
      value={value}
      type={type}
      numberOfLines={numberOfLines}
      style={[{ color }, display && styles.display, style]}
    />
  );
}

/** The smallest effective touch target, in points. */
export const TOUCH = 44;

/**
 * A circular HUD control: a thin ivory ring over dark glass, an amber ring
 * and glow when selected. Below 44 points it pads its hit area out to 44,
 * so neighbours need at least that much room between their centres.
 */
export function RoundButton({
  size = TOUCH,
  onPress,
  onLongPress,
  accessibilityLabel,
  selected,
  disabled,
  dim,
  children,
  style,
}: {
  size?: number;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  selected?: boolean;
  disabled?: boolean;
  /** Shown faded but still pressable, e.g. an empty preset. */
  dim?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const slop = Math.max(0, Math.ceil((TOUCH - size) / 2));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={slop}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: disabled ? 0.4 : pressed ? 0.7 : dim ? 0.7 : 1,
        },
        selected && styles.roundOn,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function GButton({
  label,
  icon,
  onPress,
  disabled,
  tone = "default",
  compact,
  style,
  accessibilityLabel,
}: {
  label?: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger" | "ghost";
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const colors = {
    default: { bg: palette.panelHi, border: palette.line, text: palette.text },
    primary: {
      bg: palette.embroidery,
      border: palette.gold,
      text: palette.text,
    },
    danger: { bg: "#3a1410", border: palette.bad, text: palette.text },
    ghost: { bg: "transparent", border: palette.lineSoft, text: palette.muted },
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <GIcon name={icon} size={compact ? 13 : 15} color={colors.text} />
      ) : null}
      {label ? (
        <Label
          value={label}
          type={compact ? "caption1" : "callout"}
          color={colors.text}
        />
      ) : null}
    </Pressable>
  );
}

export function Bar({
  value,
  max,
  color,
  height = 10,
  showText,
  style,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
  showText?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={[styles.bar, { height }, style]}>
      <View
        style={[
          styles.barFill,
          { width: `${share * 100}%`, backgroundColor: color },
        ]}
      />
      {showText ? (
        <View style={styles.barText}>
          <Label
            value={`${Math.round(value)}/${Math.round(max)}`}
            type="caption2"
          />
        </View>
      ) : null}
    </View>
  );
}

/** A framed sheet over the world: title row, close button, scrollable body. */
export function Sheet({
  title,
  icon,
  onClose,
  children,
  wide,
  scroll = true,
  footer,
}: {
  title: string;
  icon?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  scroll?: boolean;
  /** Stays in view under the scrolling body, e.g. the selected item. */
  footer?: ReactNode;
}) {
  return (
    <View style={styles.sheetBackdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View style={[styles.sheet, wide && styles.sheetWide]}>
        <View style={styles.sheetHeader}>
          {icon ? <GIcon name={icon} size={16} color={palette.gold} /> : null}
          <Label
            value={title}
            type="headline"
            color={palette.gold}
            style={styles.flex}
          />
          <GButton
            icon="xmark"
            onPress={onClose}
            tone="ghost"
            compact
            accessibilityLabel="Close"
          />
        </View>
        <View style={styles.ornament} />
        {scroll ? (
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.sheetBody, styles.flex]}>{children}</View>
        )}
        {footer ? (
          <ScrollView
            style={styles.sheetFooter}
            contentContainerStyle={styles.sheetFooterBody}
          >
            {footer}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

export function Row({
  children,
  gap = 8,
  style,
  wrap,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
}) {
  return (
    <View style={[styles.row, { gap }, wrap && styles.wrap, style]}>
      {children}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The font file is one weight; a synthetic bold on top would smear it.
  display: { fontFamily: DISPLAY_FONT, fontWeight: "normal" },
  round: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.ivory,
    backgroundColor: palette.glass,
  },
  roundOn: {
    borderWidth: 2.5,
    borderColor: palette.amber,
    boxShadow: `0 0 12px 1px ${palette.amber}`,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  compact: { minHeight: 30, paddingHorizontal: 9, gap: 5 },
  bar: {
    backgroundColor: palette.night,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    overflow: "hidden",
    justifyContent: "center",
  },
  barFill: { position: "absolute", start: 0, top: 0, bottom: 0 },
  barText: { alignItems: "center" },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.shade,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "100%",
    backgroundColor: palette.panel,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  sheetWide: { maxWidth: 900, flex: 1 },
  sheetFooter: {
    flexGrow: 0,
    maxHeight: "45%",
    borderTopWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.panelHi,
  },
  sheetFooterBody: { padding: 12, gap: 8 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.panelHi,
  },
  ornament: {
    height: 3,
    backgroundColor: palette.embroidery,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.gold,
    opacity: 0.8,
  },
  sheetBody: { padding: 14, gap: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  wrap: { flexWrap: "wrap" },
  divider: { height: 1, backgroundColor: palette.lineSoft },
});
