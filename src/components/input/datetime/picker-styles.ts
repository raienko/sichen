import { useMemo } from "react";
import type { DatePickerBaseProps } from "react-native-ui-datepicker";

import { useSizes, useTypography } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type PickerStyles = NonNullable<DatePickerBaseProps["styles"]>;

/**
 * Maps react-native-ui-datepicker's style slots onto this app's theme and
 * type scale. The library ships unstyled-by-default and takes a flat
 * `styles` object keyed by slot, which is the whole reason it can meet the
 * "looks like the rest of the app" requirement a native picker can't.
 *
 * Deliberately **not** built on top of its own `useDefaultStyles()`. That
 * helper fills every slot from the library's private palette, so spreading
 * it and overriding "the colours we care about" leaves its greys sitting in
 * whichever slot we forgot — most visibly across a theme switch, where the
 * ones we missed keep their old scheme. Every slot that carries a colour or
 * a font is therefore listed here explicitly; the ones left out are pure
 * layout, which the library's internal styles already handle.
 *
 * The `range_*` slots are absent on purpose: this picker only ever runs the
 * library's `single` mode, so nothing renders them.
 */
export default function usePickerStyles(): PickerStyles {
  const theme = useTheme();
  const typography = useTypography();
  const { radius, spacing } = useSizes();

  // Memoized for the same reason the handlers in ./index are: a fresh
  // object each render keeps the picker re-rendering, and its scroll
  // wheels reposition themselves as it does.
  return useMemo<PickerStyles>(
    () => ({
      // Days grid.
      day: { borderRadius: radius.control },
      day_label: { ...typography.callout, color: theme.colors.text },
      today: {
        borderRadius: radius.control,
        borderWidth: spacing.x1,
        // A ring rather than a fill, so it stays readable underneath the
        // selected background on the day that is both.
        borderColor: theme.colors.accent,
      },
      today_label: { color: theme.colors.text },
      selected: {
        borderRadius: radius.control,
        backgroundColor: theme.colors.primary,
      },
      selected_label: { color: theme.colors.onPrimary },
      outside_label: { color: theme.colors.textSecondary },
      disabled_label: { color: theme.colors.textSecondary, opacity: 0.5 },

      // Weekday headings.
      weekday_label: {
        ...typography.caption1,
        color: theme.colors.textSecondary,
      },

      // Month and year grids, reached from the header's selectors.
      month: {
        borderRadius: radius.control,
        borderWidth: spacing.x1,
        borderColor: theme.colors.divider,
      },
      month_label: { ...typography.callout, color: theme.colors.text },
      selected_month: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      selected_month_label: { color: theme.colors.onPrimary },
      year: {
        borderRadius: radius.control,
        borderWidth: spacing.x1,
        borderColor: theme.colors.divider,
      },
      year_label: { ...typography.callout, color: theme.colors.text },
      selected_year: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      selected_year_label: { color: theme.colors.onPrimary },
      active_year: { borderColor: theme.colors.accent },
      active_year_label: { color: theme.colors.text },

      // Header: the month / year / time selectors and the step arrows.
      header: { marginBottom: spacing.x8 },
      month_selector_label: {
        ...typography.headline,
        color: theme.colors.text,
      },
      year_selector_label: { ...typography.headline, color: theme.colors.text },
      time_selector_label: { ...typography.headline, color: theme.colors.text },
      button_prev: {
        borderRadius: radius.control,
        backgroundColor: theme.colors.backgroundElement,
      },
      button_next: {
        borderRadius: radius.control,
        backgroundColor: theme.colors.backgroundElement,
      },
      // The step arrows themselves are the app's `Icon`s, passed in as
      // `components` by ./index, which colour themselves.

      // Time wheels.
      time_label: { ...typography.title3, color: theme.colors.text },
      time_selected_indicator: {
        borderRadius: radius.control,
        backgroundColor: theme.colors.selected,
      },
    }),
    [theme, typography, radius, spacing],
  );
}
