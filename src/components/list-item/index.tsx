import type { ReactNode } from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/**
 * What sits between the slots. Three shapes rather than three optional
 * props, so the states that mean nothing can't be written: a `subtitle`
 * with no `title` to sub, or a custom element competing with a title for
 * the same space. Same construction `Header` uses.
 */
type ContentProps =
  | {
      /** The row's own text, and the name it announces under. */
      title: string;
      /** A second line under it — an address, a status, a count. */
      subtitle?: string;
      children?: never;
    }
  | {
      title?: never;
      subtitle?: never;
      /** Anything else in the middle, when two lines of text aren't it. */
      children: ReactNode;
    };

type PressProps =
  | {
      onPress?: never;
      label?: never;
      disabled?: never;
      selected?: never;
    }
  | {
      /** Makes the whole row one control — see the accessibility note. */
      onPress: () => void;
      /**
       * What a screen reader announces. Omit when the row's own text says
       * it: RN derives the name from the text inside, and a duplicate
       * explicit label only makes the announcement noisier.
       */
      label?: string;
      disabled?: boolean;
      /** For a row that is one of several choices — announced as such. */
      selected?: boolean;
    };

export type ListItemProps = Omit<
  PressableProps,
  "children" | "style" | "onPress" | "disabled" | "accessible"
> &
  ContentProps &
  PressProps & {
    /** Leading content — an avatar, an icon, a checkbox. */
    left?: ReactNode;
    /** Trailing content — a chevron, a value, a switch, a badge. */
    right?: ReactNode;
    style?: StyleProp<ViewStyle>;
  };

/**
 * One row in a list: something on the left, text in the middle, something
 * on the right.
 *
 * Unlike `Header`, the middle is *not* centred — a list is read down its
 * leading edge, and text that shifts with the width of whatever is beside
 * it is much harder to scan. It takes the space the slots don't need and
 * truncates before either of them shrinks, since a squashed avatar or
 * control is unusable while a clipped line is merely shorter.
 *
 * **`onPress` makes the whole row a single control**, which is right for a
 * row that navigates and wrong for one that *holds* a control: `accessible`
 * groups the children into one announcement, so an `IconButton` in the
 * right slot of a pressable row becomes unreachable. Give the button the
 * interaction and leave the row inert — the row is then a label beside a
 * control, which is what it looks like anyway.
 *
 * **`Switch`, `Checkbox` and `RadioButton` don't go in a slot at all.**
 * Each is already a full labelled row of its own, so nesting one puts its
 * label beside this row's title and says everything twice — they replace a
 * `ListItem` rather than sitting inside one.
 *
 * @example
 * <ListItem title="Ada Lovelace" subtitle="ada@example.com" left={<Avatar />} />
 * @example
 * <ListItem title="Account" right={<Icon name="chevron-right" />} onPress={open} />
 * @example
 * // the button is the control; the row just labels it, so it stays inert
 * <ListItem title="Ada" right={<IconButton label="Remove Ada" onPress={remove}>…</IconButton>} />
 */
export default function ListItem({
  title,
  subtitle,
  children,
  left,
  right,
  onPress,
  label,
  disabled = false,
  selected = false,
  style,
  ...props
}: ListItemProps) {
  const theme = useTheme();
  const styles = useStyles();

  const content = (
    <>
      {left === undefined ? null : <View style={styles.slot}>{left}</View>}

      <View style={styles.center}>
        {children}
        {title === undefined ? null : (
          <Text value={title} numberOfLines={1} style={styles.line} />
        )}
        {subtitle === undefined ? null : (
          <Text
            value={subtitle}
            type="footnote"
            numberOfLines={1}
            style={[styles.line, { color: theme.colors.textSecondary }]}
          />
        )}
      </View>

      {right === undefined ? null : <View style={styles.slot}>{right}</View>}
    </>
  );

  const surface = [
    styles.row,
    disabled ? styles.disabled : null,
    selected ? { backgroundColor: theme.colors.selected } : null,
    style,
  ];

  if (onPress === undefined) {
    return (
      <View style={surface} {...props}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      // A plain Pressable has no role of its own, so without this the whole
      // row announces as an anonymous group — the gap `Button` shipped with.
      {...controlA11yProps({ label, disabled, selected })}
      {...props}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ...surface,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    // Fills whatever contains it rather than picking a width of its own —
    // same reason `Card` and `Accordion` use alignSelf rather than a width.
    alignSelf: "stretch",
    minHeight: sizes.elementHeightMd,
    paddingHorizontal: sizes.rowInset,
    paddingVertical: spacing.x8,
    gap: spacing.x12,
  },
  slot: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
    // Sized by what they hold and never squashed: the text gives way first.
    flexShrink: 0,
  },
  center: {
    // Takes the space the slots don't need, and is the one part that
    // shrinks. `minWidth: 0` is what actually lets it: a flex item's
    // default minimum size is its own content, so without it the text
    // refuses to give and pushes the slots out of shape instead.
    flex: 1,
    minWidth: 0,
    alignItems: isRTL ? "flex-end" : "flex-start",
    justifyContent: "center",
    gap: spacing.x2,
  },
  // The same escape from `min-width: auto`, one level down on the lines
  // themselves — a centre free to shrink is no use while the text inside
  // it insists on its full width.
  line: {
    flexShrink: 1,
    minWidth: 0,
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
}));
