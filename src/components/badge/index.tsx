import { View, type StyleProp, type ViewStyle } from "react-native";

import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme, type ThemeColors } from "@/features/theme";

import { formatCount } from "./count";

export type BadgeType = "neutral" | "success" | "warning" | "error" | "info";

/**
 * Which palette entries each type paints with.
 *
 * **The foreground of a filled badge is `background`, not `text`.** The
 * semantic colours are tuned to contrast against the page — dark in the
 * light scheme, light in the dark one — so using one as a *fill* inverts
 * the problem, and the token that contrasts with it is the page colour it
 * was measured against. `text` on `error` is 3.25:1 in light and 2.77:1 in
 * dark, both under WCAG 1.4.3's 4.5; `background` on the same fills is
 * 6.47:1 and 7.59:1, and the worst pair across all four types and both
 * schemes is 6.47:1.
 *
 * **`neutral` carries a border and the others don't**, for the reason
 * `Button`'s `secondary` does: its fill is `backgroundElement`, so on one
 * of the app's raised surfaces — a `Card`, an open `Accordion` — it is
 * literally the same colour as what's behind it and vanishes. The showcase
 * made that obvious the moment a neutral dot rendered on a card and
 * couldn't be seen at all. The four semantic fills contrast with any
 * surface on their own and need no edge.
 *
 * There is no `primary` type on purpose: `primary` and `info` are the same
 * value in both schemes, so it would be a second name for a badge that
 * already exists.
 */
const TYPE_COLORS: Record<
  BadgeType,
  {
    background: keyof ThemeColors;
    label: keyof ThemeColors;
    border: keyof ThemeColors | null;
  }
> = {
  neutral: { background: "backgroundElement", label: "text", border: "border" },
  success: { background: "success", label: "background", border: null },
  warning: { background: "warning", label: "background", border: null },
  error: { background: "error", label: "background", border: null },
  info: { background: "info", label: "background", border: null },
};

/** How many the badge counts up to before it gives up and says "and more". */
const DEFAULT_MAX = 99;

/**
 * What the badge has to say. Three shapes rather than three optional props,
 * so a badge carrying both a count and a caption — which has no room for
 * either — can't be written.
 */
type ContentProps =
  | {
      /** Literal text: "New", "Beta", "Sold out". */
      value: string;
      count?: never;
      max?: never;
      dot?: never;
    }
  | {
      value?: never;
      /**
       * A quantity, rendered in the active locale's digits. **A count of
       * zero (or less) renders nothing at all** — "no unread" is not a
       * thing to show a badge about — so a caller who really does want a
       * literal `0` passes it as `value` instead.
       */
      count: number;
      /** Anything over this is shown as "99+". Defaults to 99. */
      max?: number;
      dot?: never;
    }
  | {
      value?: never;
      count?: never;
      max?: never;
      /**
       * No content: the "there's something here" dot for a tab icon or an
       * avatar. Hidden from assistive technology unless it's given a
       * `label` — see the accessibility note.
       */
      dot: true;
    };

type Props = ContentProps & {
  /** Chooses the fill. Defaults to `"neutral"`. */
  type?: BadgeType;
  /**
   * What a screen reader announces instead of the badge's own text — "3
   * unread messages", not "3". A badge is a number or a word with its
   * meaning carried entirely by where it sits, and position is exactly what
   * doesn't survive being read aloud.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A small status marker attached to something else: an unread count on a
 * tab, "Beta" beside a feature's name, a dot on an avatar.
 *
 * **It doesn't position itself.** A badge is sized by its own content and
 * nothing more; where it sits — inline after a title, pinned to the corner
 * of an icon — belongs to whatever owns both it and the thing it marks.
 * Giving it an `anchor` prop would put one component in charge of another's
 * layout, which is the trade `Spacer` and `Divider` also decline.
 *
 * **An unlabelled dot is invisible to assistive technology.** With no text
 * it has nothing to announce, so it's hidden on every platform rather than
 * left as an anonymous stop a screen-reader user swipes past — the same
 * treatment `Spacer` and an unlabelled `Divider` get. A dot that *does*
 * mean something ("unread") says so through `label`, and is then announced
 * like any other badge.
 *
 * **A `count` announces the number and not what it counts.** "3" on its own
 * is no use out of context, so pass a `label` whenever the badge isn't
 * already inside something that names it.
 *
 * @example <Badge value="Beta" />
 * @example <Badge count={unread} label={`${unread} unread`} type="error" />
 * @example <Badge count={1200} max={999} />        // "999+"
 * @example <Badge dot type="success" label="Online" />
 */
export default function Badge({
  value,
  count,
  max = DEFAULT_MAX,
  dot,
  type = "neutral",
  label,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  // Nothing to report is not a badge saying "0", it's no badge.
  if (count !== undefined && count <= 0) return null;

  const palette = TYPE_COLORS[type];
  // The border is applied only where there is one, rather than as a
  // transparent edge on every badge: `borderWidth` is drawn inside the box,
  // so a transparent one would quietly shrink the dot's coloured area.
  const fill = [
    { backgroundColor: theme.colors[palette.background] },
    palette.border === null
      ? null
      : [styles.outlined, { borderColor: theme.colors[palette.border] }],
  ];

  if (dot) {
    return (
      <View
        testID={testID}
        // Decoration until it's named, content once it is.
        {...(label === undefined
          ? disabledA11yProps()
          : { accessible: true, accessibilityLabel: label })}
        style={[styles.dot, ...fill, style]}
      />
    );
  }

  const text =
    value ??
    formatCount(count as number, max, locale, (capped) =>
      t("badge.overflow", { count: capped }),
    );

  return (
    <View
      testID={testID}
      // Only when there's something to say beyond the text itself: an
      // explicit label that merely repeats the digits would announce twice.
      {...(label === undefined
        ? null
        : { accessible: true, accessibilityLabel: label })}
      style={[styles.badge, ...fill, style]}
    >
      <Text
        value={text}
        type="caption2"
        numberOfLines={1}
        style={{ color: theme.colors[palette.label] }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  badge: {
    borderRadius: radius.indicator,
    alignItems: "center",
    justifyContent: "center",
    // Sized by its own content, never by its container — a badge is
    // attached to something, so stretching would be meaningless.
    alignSelf: "flex-start",
    // Minimums rather than a fixed height: a single digit comes out square,
    // and text that outgrows the box under large dynamic type makes the
    // badge grow instead of clipping.
    minWidth: spacing.x16,
    minHeight: spacing.x16,
    paddingHorizontal: spacing.x4,
  },
  // Only `neutral` takes this — see TYPE_COLORS.
  outlined: {
    borderWidth: spacing.x1,
  },
  dot: {
    borderRadius: radius.indicator,
    // A dot carries no text, so it scales with the device (`units()`) but
    // deliberately not with the OS text size — there's nothing to read.
    width: spacing.x8,
    height: spacing.x8,
    alignSelf: "flex-start",
  },
}));
