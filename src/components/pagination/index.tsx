import { useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import {
  View,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import Button, {
  IconButton,
  type ButtonSize,
  type ButtonType,
} from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { disabledA11yProps } from "@/features/accessibility";
import { useIsRtl, useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import PaginationDot from "./dot";
import PageIndicator from "./indicator";
import useWindowShift from "./shift";
import { GAP, clampPage, paginationRange } from "./range";

export { GAP, clampPage, paginationRange } from "./range";
export type { PaginationItem } from "./range";

/** How the pages are drawn. */
export type PaginationVariant = "numbers" | "dots";

type Props = {
  /**
   * The page being shown, 1-based — the same number the reader sees, not an
   * array index. `value`/`onChange` rather than `page`/`onPageChange` so it
   * reads like every other controlled component here: `Checkbox`, `Switch`,
   * `Slider`, `SegmentedControl`, `Stepper` and `Input` all take the same
   * pair.
   */
  value: number;
  /** How many pages there are. Fewer than two renders nothing — see below. */
  total: number;
  onChange: (value: number) => void;
  /**
   * What is being paged — "Search results", "Orders". Required: on its own
   * a row of numbers says nothing about what it moves through, and a
   * screen reader lands on it with no other context.
   */
  label: string;
  /**
   * How many pages to show either side of the current one. Defaults to 1,
   * which is seven slots in total.
   */
  siblings?: number;
  /**
   * Drops the numbers for "Page 3 of 20" between the two arrows. For a
   * narrow screen, or a footer with no room for eleven controls.
   */
  compact?: boolean;
  /**
   * `"numbers"` (default) for paged data, where the page you are on is a
   * number worth reading. `"dots"` for a small, known number of positions
   * where the count matters more than the index — a carousel, an onboarding
   * flow. Dots have no arrows and no gaps: every position is a dot.
   */
  variant?: PaginationVariant;
  /** Lays the dots out down the side instead of along the bottom. */
  orientation?: "horizontal" | "vertical";
  /**
   * What each item announces. Defaults to "Page 3 of 20"; a carousel passes
   * its own, because "Slide 2 of 5, Ada Lovelace" says more than a number.
   */
  getItemLabel?: (value: number, total: number) => string;
  type?: ButtonType;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The control for moving through paged data: previous, next, and the pages
 * in between.
 *
 * ```tsx
 * <Pagination
 *   label="Search results"
 *   value={page}
 *   total={Math.ceil(count / perPage)}
 *   onChange={setPage}
 * />
 * ```
 *
 * **Two variants, because "which of these am I on" has two shapes.**
 * `"numbers"` is the paged-data control: arrows, page numbers, and gaps.
 * `"dots"` is the position indicator for a small, known set — a carousel,
 * an onboarding flow — where the count matters more than the index.
 *
 * **Changing page animates, from the settled page only.** The numbers'
 * highlight — the `selected` tint with an `accent` edge — slides to the new
 * page instead of one button switching off and another on, and a dot
 * shrinks while the next grows. Both run when `value` changes, never off a
 * carousel's live scroll progress: an earlier version interpolated that, so
 * a dot grew while the finger was still moving, and it produced two iOS
 * press bugs in a row. The pressables themselves never move. Reduce Motion
 * makes both instant.
 *
 * **Fewer than two pages renders nothing at all.** A pagination bar for a
 * single page is a control that cannot do anything, and it is the state a
 * real screen spends most of its time in — an empty result set, a filter
 * that narrowed to one page. Hiding it is the behaviour, not an oversight.
 *
 * **The width does not change as you page.** `paginationRange` returns a
 * constant number of slots once there are enough pages to need gaps, so
 * the button under your cursor stays where it is. A bar that reflows moves
 * the target you were about to press.
 *
 * **The arrows mirror in RTL.** Previous is a direction, not a glyph: in a
 * right-to-left locale the earlier page is to the *right*, so a
 * left-pointing chevron there means next. Read from `useIsRtl()` rather
 * than automatic mirroring, which only lands after a native reload — the
 * same reason `BackButton` does it.
 *
 * **Every page announces its position.** "Page 3 of 20", not "3", because a
 * screen reader user has no row of numbers to see it among; the current
 * page is additionally marked selected.
 *
 * @example <Pagination label="Orders" value={page} total={12} onChange={setPage} />
 * @example <Pagination label="Results" value={page} total={40} onChange={setPage} compact />
 */
export default function Pagination({
  value,
  total,
  onChange,
  label,
  siblings = 1,
  compact = false,
  variant = "numbers",
  orientation = "horizontal",
  getItemLabel,
  type = "tertiary",
  size = "medium",
  style,
  testID = "pagination",
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();
  const isRTL = useIsRtl();

  // `count` rather than reusing `total`: the prop is whatever the caller
  // passed and this is the floored, non-negative version the rest of the
  // component can rely on.
  // Where each visible page's button sits in the row, by page number, so
  // the highlight knows where to slide.
  const [layouts, setLayouts] = useState<Record<number, LayoutRectangle>>({});
  const count = Math.max(0, Math.floor(total));
  const current = clampPage(value, count);
  const items = useMemo(
    () => paginationRange(current, count, siblings),
    [current, count, siblings],
  );
  // One slot's travel: a page button and the gap after it.
  const { spacing } = useSizes();
  const slot = (layouts[current]?.width ?? 0) + spacing.x4;
  const shift = useWindowShift(current, items, slot, isRTL);

  // A bar that cannot go anywhere is not a control. This is the state a
  // real screen is in most often, so it is handled first.
  if (count < 2) return null;

  const describe = (target: number) =>
    getItemLabel?.(target, count) ??
    t("pagination.page", { page: target, total: count });

  const go = (next: number) => {
    const target = clampPage(next, count);
    if (target !== current) onChange(target);
  };

  const step = (direction: -1 | 1) => (
    <IconButton
      testID={testId(testID, direction === -1 ? "previous" : "next")}
      label={t(direction === -1 ? "pagination.previous" : "pagination.next")}
      type={type}
      size={size === "auto" ? "medium" : size}
      disabled={direction === -1 ? current === 1 : current === count}
      onPress={() => go(current + direction)}
    >
      <Icon
        name={
          // Earlier is to the right in a right-to-left locale, so the
          // chevron follows the direction rather than the word.
          (direction === -1) !== isRTL ? "chevron-left" : "chevron-right"
        }
      />
    </IconButton>
  );

  if (variant === "dots") {
    return (
      <View
        testID={testID}
        accessibilityLabel={`${label}, ${t("pagination.label")}`}
        style={[
          styles.pagination,
          orientation === "vertical" ? styles.vertical : null,
          style,
        ]}
      >
        {Array.from({ length: count }, (_, index) => (
          <PaginationDot
            key={index}
            testID={testId(testID, index + 1)}
            active={index + 1 === current}
            label={describe(index + 1)}
            orientation={orientation}
            onPress={() => go(index + 1)}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      // Named as a whole so a screen reader says what these numbers move
      // through. Not `accessible`, which would collapse the buttons inside
      // into one announcement and make them unreachable — the trap `Card`
      // and `ListItem` both document.
      accessibilityLabel={`${label}, ${t("pagination.label")}`}
      style={[styles.pagination, style]}
    >
      {step(-1)}

      <View style={styles.pages}>
        <If condition={!compact}>
          <PageIndicator target={layouts[current]} testID={testID} />
        </If>
        <If condition={compact}>
          <Text
            value={t("pagination.page", { page: current, total: count })}
            type="footnote"
            style={[styles.summary, { color: theme.colors.textSecondary }]}
          />
        </If>
        <If condition={!compact}>
          <Animated.View style={[styles.row, shift]}>
            {items.map((item, index) =>
              item === GAP ? (
                // An ellipsis is not a control and has nothing to announce:
                // the pages it stands for are reachable through the numbers
                // either side of it.
                <Text
                  // Keyed by position because that is all a gap has: two can
                  // appear, and neither stands for anything stable.
                  key={`gap-${index}`}
                  {...disabledA11yProps()}
                  value="…"
                  style={[styles.gap, { color: theme.colors.textSecondary }]}
                />
              ) : (
                <Button
                  key={item}
                  testID={testId(testID, item)}
                  value={String(item)}
                  // "Page 3 of 20", not "3": there is no visible row of numbers
                  // for a screen reader user to read it among.
                  label={describe(item)}
                  type={type}
                  size={size}
                  selected={item === current}
                  onPress={() => go(item)}
                  onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    setLayouts((known) =>
                      sameRect(known[item], layout)
                        ? known
                        : { ...known, [item]: layout },
                    );
                  }}
                  // The highlight behind the row draws the selection, so the
                  // button's own selected tint is cleared — it would otherwise
                  // jump while the highlight slides.
                  style={[styles.page, styles.clear]}
                />
              ),
            )}
          </Animated.View>
        </If>
      </View>

      {step(1)}
    </View>
  );
}

function sameRect(a: LayoutRectangle | undefined, b: LayoutRectangle) {
  return (
    a !== undefined &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  pagination: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    // Sized by its own buttons, and centred by whatever holds it.
    alignSelf: "center",
    justifyContent: "center",
    gap: spacing.x4,
  },
  // The numbers wrap; the arrows do not. Letting the whole row wrap put
  // "next" alone on a second line at phone widths, which reads as a
  // different control rather than the other end of this one. Wrapping is
  // still the right behaviour for the numbers themselves — nothing is
  // clipped or unreachable — but `compact` is the better answer when there
  // is genuinely no room.
  pages: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexShrink: 1,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x4,
  },
  // The page buttons, laid out as the row itself was: they move as one
  // when the window shifts, and the highlight behind them doesn't.
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexShrink: 1,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x4,
  },
  page: {
    // Square-ish, so 1 and 20 are the same width and the row does not
    // shift as the digits change — the same reason `Timer` uses tabular
    // figures.
    minWidth: sizes.elementHeightMd,
    paddingHorizontal: spacing.x8,
  },
  clear: {
    backgroundColor: "transparent",
  },
  gap: {
    minWidth: sizes.elementHeightMd,
    textAlign: "center",
  },
  summary: {
    paddingHorizontal: spacing.x8,
  },
  vertical: {
    flexDirection: "column",
  },
}));
