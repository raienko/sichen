import { useState, type ReactNode } from "react";
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Text from "@/components/text";
import { headingA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

/**
 * What sits in the middle. Three shapes rather than three optional props,
 * so the states that don't mean anything can't be written: a `subtitle`
 * with no `title` to sub, or a custom element competing with a title for
 * the same space.
 */
type CenterProps =
  | {
      /** The screen's own name. Announced as its top-level heading. */
      title: string;
      /** A second line under it — a count, a status, a breadcrumb. */
      subtitle?: string;
      children?: never;
    }
  | {
      title?: never;
      subtitle?: never;
      /** Anything else in the middle: a search field, a segmented control. */
      children: ReactNode;
    }
  | { title?: never; subtitle?: never; children?: never };

type Props = CenterProps & {
  /**
   * Leading content — typically a `BackButton`. Takes one element or
   * several; pass an array or a fragment and they lay out in a row.
   */
  left?: ReactNode;
  /** Trailing content, same deal — usually one or two `IconButton`s. */
  right?: ReactNode;
  /**
   * Adds the device's top safe-area inset above the header, so it clears
   * the notch, the Dynamic Island, or the status bar.
   *
   * Off by default, because that padding is only correct for a header
   * pinned to the very top of the screen — inside a `Modal`, under another
   * header, or within a `SafeAreaView` that already inset the page, adding
   * it again just pushes the content down twice.
   */
  avoidNotch?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A screen's top bar: something on the left, something on the right, and a
 * title or a component of your own between them.
 *
 * **The middle is centred against the header, not against whatever is left
 * over**, and it still gets every pixel the slots don't need. Those two
 * pull against each other in plain flexbox: equal `flexBasis: 0` shares
 * centre the title but make the row think it always fits, so a long one
 * overlaps the buttons instead of truncating (seen on screen); content-
 * sized slots detect the overflow but let the wider side shove the title
 * off-centre.
 *
 * So the slots are measured, and the middle is offset by the *difference*
 * between them — `max(0, right - left)` leading, the reverse trailing.
 * That puts its midpoint exactly on the header's, whatever each side
 * holds, while leaving it free to use the rest of the row. The slots
 * themselves never shrink: a squashed control is unusable, while a clipped
 * title is merely shorter.
 *
 * **The title is the screen's `<h1>`.** It's set in `headline` rather than
 * a title size — a bar is compact, and the type scale's title steps are
 * built for a page heading with room to breathe — so the heading semantics
 * are declared explicitly rather than inherited from the type. Without
 * that, a screen reader's heading rotor has no entry for the screen it's
 * on. The subtitle stays plain text: it qualifies the heading rather than
 * being one.
 *
 * @example
 * <Header title="Orders" subtitle="12 open" left={<BackButton />} avoidNotch />
 * @example
 * <Header
 *   left={<BackButton />}
 *   right={[<IconButton key="filter" label="Filter">…</IconButton>,
 *           <IconButton key="add" label="Add">…</IconButton>]}
 * >
 *   <Input type="text" value={query} onChange={setQuery} placeholder="Search" />
 * </Header>
 */
export default function Header({
  title,
  subtitle,
  children,
  left,
  right,
  avoidNotch = false,
  style,
  testID = "header",
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [slots, setSlots] = useState({ left: 0, right: 0 });

  function measure(side: "left" | "right") {
    return ({ nativeEvent }: LayoutChangeEvent) => {
      const width = nativeEvent.layout.width;
      setSlots((current) =>
        current[side] === width ? current : { ...current, [side]: width },
      );
    };
  }

  // Both start at 0, so the first paint is centred as if the slots were
  // equal and corrects on layout — a frame earlier than measuring would
  // allow either way.
  const centerOffsets = {
    marginStart: Math.max(0, slots.right - slots.left),
    marginEnd: Math.max(0, slots.left - slots.right),
  };

  return (
    <View
      testID={testID}
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.divider,
        },
        avoidNotch ? { paddingTop: insets.top } : null,
        style,
      ]}
    >
      <View style={styles.bar}>
        <View
          testID={testId(testID, "left")}
          onLayout={measure("left")}
          style={[styles.slot, styles.slotStart]}
        >
          {left}
        </View>

        <View style={[styles.center, centerOffsets]}>
          {children}
          {title === undefined ? null : (
            <Text
              value={title}
              type="headline"
              numberOfLines={1}
              style={styles.line}
              // Spread after `type`, which is what Text derives heading
              // level from — `headline` deliberately maps to none.
              {...headingA11yProps(1)}
            />
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

        <View
          testID={testId(testID, "right")}
          onLayout={measure("right")}
          style={[styles.slot, styles.slotEnd]}
        >
          {right}
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  header: {
    alignSelf: "stretch",
    borderBottomWidth: spacing.x1,
  },
  bar: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    minHeight: sizes.elementHeightLg,
    paddingHorizontal: spacing.x8,
    gap: spacing.x8,
  },
  slot: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x4,
    // Sized by what they hold and never squashed — centring is handled by
    // the measured offsets on the middle instead, so the row can still
    // tell when everything no longer fits.
    flexShrink: 0,
  },
  slotStart: {
    justifyContent: "flex-start",
  },
  slotEnd: {
    justifyContent: "flex-end",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    // Takes the rest of the row, and is the one part that gives way when
    // everything can't fit. `minWidth: 0` is what actually lets it shrink:
    // a flex item's default minimum size is its own content, so without
    // this the title refuses to give and overlaps the slots instead of
    // truncating — which is exactly what it did on screen.
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  // The same escape from `min-width: auto` the centre needs, one level
  // down: the text is itself a flex child, and a centre free to shrink is
  // no use while the line inside it still insists on its full width.
  line: {
    flexShrink: 1,
    minWidth: 0,
  },
}));
