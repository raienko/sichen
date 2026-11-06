import { useId, useRef, useState, type ReactNode } from "react";
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
import Modal, { type ModalHandle } from "@/components/modal";
import Text from "@/components/text";
import type { IconNameByType } from "@/components/icon";
import type { TypographyToken } from "@/features/responsive";
import { haptics } from "@/features/haptics";

import { DISPLAY_FONT } from "./fonts";
import { OrnamentRule } from "./ornaments";
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
}: {
  value: string;
  type?: TypographyToken;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Kept for existing callers; all game labels now use the same face. */
  display?: boolean;
}) {
  return (
    <Text
      value={value}
      type={type}
      numberOfLines={numberOfLines}
      style={[{ color }, style, styles.display]}
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
    default: { bg: "#2a221b", border: palette.line, text: palette.ivory },
    primary: {
      bg: "#30251d",
      border: palette.bronze,
      text: palette.ivory,
    },
    danger: { bg: "#321a18", border: "#8b4c42", text: palette.ivory },
    ghost: { bg: "transparent", border: "transparent", text: palette.ivory },
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
        <GIcon name={icon} size={compact ? 14 : 18} color={colors.text} />
      ) : null}
      {label ? (
        <Label
          value={label}
          type={compact ? "caption1" : "callout"}
          color={colors.text}
          style={compact ? styles.compactLabel : styles.buttonLabel}
        />
      ) : null}
    </Pressable>
  );
}

/** A single-choice game field, with the same carved surface as GButton. */
export function GSelect({
  label,
  value,
  options,
  onChange,
  style,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const modalId = useId();
  const modal = useRef<ModalHandle>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={[styles.select, style]}>
      <Label value={label} type="caption1" color={palette.muted} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? "" }}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setOpen(true);
          modal.current?.show();
        }}
        style={({ pressed }) => [
          styles.selectField,
          open && styles.selectFieldOpen,
          pressed && styles.selectFieldPressed,
        ]}
      >
        <Label
          value={selected?.label ?? ""}
          type="callout"
          color={palette.ivory}
          style={styles.selectValue}
          numberOfLines={1}
        />
        <GIcon name="chevron-down" size={13} color={palette.gold} />
      </Pressable>
      <Modal
        ref={modal}
        id={modalId}
        type="bottomSheet"
        style={styles.selectModal}
        onClose={() => setOpen(false)}
      >
        <Label value={label} type="headline" color={palette.ivory} />
        {options.map((option) => (
          <GButton
            key={option.value}
            label={option.label}
            icon={option.value === value ? "check" : undefined}
            tone={option.value === value ? "primary" : "default"}
            onPress={() => {
              onChange(option.value);
              modal.current?.hide();
            }}
          />
        ))}
      </Modal>
    </View>
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

/** A dark, lightly carved popup over the world. */
export function Sheet({
  title,
  icon,
  headerIcon,
  hideTitle,
  onClose,
  children,
  wide,
  fill,
  scroll = true,
  footer,
}: {
  title: string;
  icon?: string;
  headerIcon?: ReactNode;
  hideTitle?: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Occupy the available height so a footer can stay at the bottom. */
  fill?: boolean;
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
      <View
        style={[
          styles.sheet,
          wide && styles.sheetWide,
          fill && styles.sheetFill,
        ]}
      >
        <View
          style={[styles.sheetHeader, hideTitle && styles.sheetHeaderCompact]}
        >
          {headerIcon || icon ? (
            <View
              accessible={hideTitle}
              accessibilityLabel={hideTitle ? title : undefined}
            >
              {headerIcon ??
                (icon ? (
                  <GIcon name={icon} size={16} color={palette.gold} />
                ) : null)}
            </View>
          ) : null}
          {hideTitle ? (
            <View style={styles.flex} />
          ) : (
            <Label
              value={title}
              type="headline"
              color={palette.ivory}
              style={styles.sheetTitle}
            />
          )}
          <GButton
            icon="xmark"
            onPress={onClose}
            tone="ghost"
            compact
            accessibilityLabel="Close"
          />
        </View>
        <OrnamentRule />
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
  // The font file is one weight; synthetic bold would smear its details.
  display: { fontFamily: DISPLAY_FONT, fontWeight: "normal" },
  buttonLabel: { fontSize: 20, lineHeight: 25 },
  compactLabel: { fontSize: 16, lineHeight: 21 },
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
    minHeight: TOUCH,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  compact: { minHeight: TOUCH, paddingHorizontal: 10, gap: 6 },
  select: { gap: 7 },
  selectField: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: "#2a221b",
  },
  selectFieldOpen: { borderColor: palette.bronze },
  selectFieldPressed: { opacity: 0.75 },
  selectValue: { flex: 1 },
  selectModal: {
    backgroundColor: "#171a1a",
    borderTopWidth: 1,
    borderColor: palette.bronze,
  },
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
    backgroundColor: "rgba(4, 7, 8, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "100%",
    backgroundColor: "#171a1a",
    borderColor: palette.lineSoft,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  sheetWide: { maxWidth: 900, flex: 1 },
  sheetFill: { flex: 1 },
  sheetFooter: {
    flexGrow: 0,
    maxHeight: "45%",
    borderTopWidth: 1,
    borderColor: palette.lineSoft,
    backgroundColor: "#1b1b19",
  },
  sheetFooterBody: { padding: 12, gap: 8 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "transparent",
  },
  sheetHeaderCompact: { paddingVertical: 7 },
  sheetTitle: { flex: 1, fontSize: 24, lineHeight: 29 },
  sheetBody: { padding: 18, gap: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  wrap: { flexWrap: "wrap" },
  divider: { height: 1, backgroundColor: palette.lineSoft },
});
