import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import Icon, { withIconDefaults } from "@/components/icon";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import {
  createStyles,
  useSizes,
  type TypographyToken,
} from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

/** `auto` is deliberately absent — a tag is already sized by its own text. */
export type TagSize = "small" | "medium";

/**
 * Compact by design: a tag labels something else, so it's set a step below
 * the text it sits beside rather than competing with it.
 */
const SIZE_TEXT: Record<TagSize, TypographyToken> = {
  small: "caption1",
  medium: "footnote",
};

/**
 * `selected` and `label` only mean something for a tag you can press: a
 * static tag is a label, and a label that reports itself as selected —
 * or carries an accessible name with no control to name — is a state that
 * shouldn't be expressible. Same construction `ListItem` uses for its own
 * inert/pressable split.
 */
type PressProps =
  | { onPress?: never; selected?: never; label?: never }
  | {
      /** Makes the tag's body a control — a filter chip, a suggestion. */
      onPress: () => void;
      /** One of several choices, and announced as such. */
      selected?: boolean;
      /**
       * What a screen reader announces for the body. Omit it when the tag's
       * own text says it — RN derives the name from the text inside, and a
       * duplicate explicit label only makes the announcement noisier.
       */
      label?: string;
    };

/** A `closeLabel` with no remove button to name is the same mistake. */
type CloseProps =
  | { onClose?: never; closeLabel?: never }
  | {
      /**
       * Adds the remove button and reports a press on it. Its own target,
       * never the body's — see the accessibility note.
       */
      onClose: () => void;
      /** Overrides the localized "Remove {value}". */
      closeLabel?: string;
    };

type Props = PressProps &
  CloseProps & {
    /** The tag's text, and the name it announces under. */
    value: string;
    /** Leading content — usually an `<Icon />`, which takes its colour and size from here. */
    icon?: ReactNode;
    /** Defaults to `"medium"`, which is the 44pt touch-target height. */
    size?: TagSize;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
  };

/**
 * A short piece of text in a small outlined box: a keyword on an article, an applied
 * filter, one of the recipients in a "To:" field.
 *
 * Three shapes out of two props. With neither `onPress` nor `onClose` it's
 * static — content, not a control. `onPress` makes the body pressable and
 * lets it be `selected`, which is the filter-chip case. `onClose` adds the
 * remove button.
 *
 * **The remove button is its own target, never part of the body's.** A
 * pressable body groups its children into one announcement, so a remove
 * button *inside* it would be unreachable to a screen reader and the whole
 * tag would carry two meanings on one tap — "apply this filter" and
 * "delete it" — with no way to choose. The two sit side by side instead:
 * one tag, two controls, each with its own name. It's the same rule
 * `ListItem` states for a row that holds a control.
 *
 * **The remove button names what it removes.** "Remove Ada Lovelace", not
 * "Close" — a row of tags is a row of identical ✕ glyphs otherwise, and
 * which one a screen-reader user is on is exactly the thing they can't see.
 *
 * @example <Tag value="Design" />
 * @example <Tag value="Unread" onPress={toggle} selected={unreadOnly} />
 * @example <Tag value="Ada Lovelace" onClose={() => remove(person)} />
 * @example <Tag value="Draft" icon={<Icon name="edit-3" />} size="small" />
 */
export default function Tag({
  value,
  icon,
  onPress,
  selected = false,
  label,
  onClose,
  closeLabel,
  size = "medium",
  disabled = false,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const { t } = useLocale();

  // A selected tag is tinted and labelled in `accent` rather than inverted
  // into a solid block; the palette tests hold `accent` to 4.5:1 on the
  // `selected` tint. The resting tag is `backgroundElement`, the same
  // surface every other raised element uses, so `text` reads on it.
  const foreground = selected ? theme.colors.accent : theme.colors.text;
  const glyphSize = spacing.x16;

  const content = (
    <>
      {icon === undefined
        ? null
        : withIconDefaults(icon, { color: foreground, size: glyphSize })}
      <Text
        value={value}
        type={SIZE_TEXT[size]}
        numberOfLines={1}
        style={[styles.label, { color: foreground }]}
      />
    </>
  );

  const bodyStyle = [
    styles.body,
    styles[size],
    onClose === undefined ? null : styles.bodyBesideClose,
  ];

  return (
    <View
      testID={testID}
      style={[
        styles.tag,
        {
          backgroundColor: selected
            ? theme.colors.selected
            : theme.colors.backgroundElement,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {onPress === undefined ? (
        <View style={bodyStyle}>{content}</View>
      ) : (
        <Pressable
          // A plain Pressable has no role of its own, so without this the
          // body announces as an anonymous group — the gap `Button` shipped
          // with.
          {...controlA11yProps({ label, disabled, selected })}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            ...bodyStyle,
            pressed && !disabled ? styles.pressed : null,
          ]}
        >
          {content}
        </Pressable>
      )}

      {onClose === undefined ? null : (
        <Pressable
          testID={testId(testID, "close")}
          {...controlA11yProps({
            label: closeLabel ?? t("tag.remove", { value }),
            disabled,
          })}
          disabled={disabled}
          onPress={onClose}
          style={({ pressed }) => [
            styles.close,
            styles[size],
            pressed && !disabled ? styles.pressed : null,
          ]}
        >
          <Icon name="x" size={glyphSize} color={foreground} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  tag: {
    borderRadius: radius.control,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    // Sized by its own text, unlike `Card` or `ListItem` which stretch: a
    // tag is a word, and a row of them is meant to read as a row.
    alignSelf: "flex-start",
    borderWidth: spacing.x1,
    // Keeps each half's pressed state inside the tag's own edge.
    overflow: "hidden",
    // A tag longer than its container truncates rather than overflowing it.
    maxWidth: "100%",
  },
  // Both halves take the tag's full height, so neither target is a
  // fraction of what it looks like.
  small: {
    minHeight: sizes.elementHeightSm,
  },
  medium: {
    minHeight: sizes.elementHeightMd,
  },
  body: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x4,
    paddingHorizontal: spacing.x12,
    // The half that gives way when the tag hits `maxWidth` — the remove
    // button is a touch target and never shrinks.
    flexShrink: 1,
    minWidth: 0,
  },
  // Trailing padding drops to a gap when the remove button follows, so the
  // ✕ isn't pushed a full pad away from the word it removes. Written as a
  // physical side because the row itself is already mirrored above.
  bodyBesideClose: isRTL
    ? { paddingLeft: spacing.x4 }
    : { paddingRight: spacing.x4 },
  close: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.x8,
    flexShrink: 0,
  },
  // The same escape from `min-width: auto` one level down: a body free to
  // shrink is no use while the text inside insists on its full width.
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
}));
