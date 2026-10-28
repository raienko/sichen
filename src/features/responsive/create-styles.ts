import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useIsRtl } from "@/features/localization";
import { isWeb } from "@/utils";

import useResponsive, { type Responsive } from "./use-responsive";

type StyleFactoryArgs = Responsive & {
  isRTL: boolean;
  /** The locale's layout direction — `isRTL` as a style value. */
  direction: "ltr" | "rtl";
};

/**
 * react-native-web has no `direction` style: its `writingDirection` is what
 * becomes CSS `direction`, on any element. Renamed here so one style means
 * the same thing on every platform.
 */
export function webDirection<T>(styles: T, web = isWeb): T {
  if (!web) return styles;
  return Object.fromEntries(
    Object.entries(styles as Record<string, unknown>).map(([name, style]) => {
      if (!style || typeof style !== "object" || !("direction" in style)) {
        return [name, style];
      }
      const { direction, ...rest } = style as { direction: unknown };
      return [name, { ...rest, writingDirection: direction }];
    }),
  ) as T;
}

/**
 * Turns a style factory defined outside a component into a hook you call
 * inside one — the factory gets the current (reactive) units/breakpoint/
 * isRTL/spacing/radius/sizes/typography, and the result is memoized so
 * it's only recomputed when one of them actually changes. Runs the
 * factory's return value through StyleSheet.create() itself, so call sites
 * return a plain style object and don't need their own "react-native"
 * import just for that.
 *
 * Everything window-derived comes from one `useResponsive()` call, which
 * makes one `useWindowDimensions()` read — see that hook for why that
 * matters.
 *
 * `isRTL` here is the locale-derived flag (useIsRtl(), see
 * features/localization), not I18nManager.isRTL — it flips the instant the
 * locale does, with no native reload to wait on, so it's safe to build
 * manual mirroring (e.g. `flexDirection: isRTL ? "row-reverse" : "row"`)
 * directly off it in a style that otherwise wouldn't re-render until a
 * reload landed.
 *
 * `direction` is the same flag as a style value. A style's `direction` key
 * works on every platform — on web it's passed on as `writingDirection`,
 * the only thing react-native-web turns into CSS `direction` — so a layer
 * that positions things by physical offsets can opt out of mirroring with
 * `direction: "ltr"`, and one can follow the locale with `direction`.
 *
 * `spacing`/`radius`/`sizes` (the sizes styleguide) and `typography` (the
 * type scale) all arrive already scaled through units(), so
 * `spacing.x8`/`sizes.elementHeightMd`/`typography.body` are used directly
 * with no units() wrapping of their own.
 *
 * @example
 * const useStyles = createStyles(({ units, isRTL, spacing, sizes, typography }) => ({
 *   text: { fontSize: units(14) },
 *   slider: { direction: "ltr" },  // offsets inside are physical
 *   row: { gap: spacing.x8 },
 *   field: { minHeight: sizes.elementHeightMd },
 *   title: typography.headline,
 * }));
 *
 * function Component() {
 *   const styles = useStyles();
 *   return <Text style={styles.text} />;
 * }
 */
export default function createStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<unknown>,
>(factory: (args: StyleFactoryArgs) => T) {
  return function useStyles(): T {
    const responsive = useResponsive();
    const isRTL = useIsRtl();
    return useMemo(
      () =>
        StyleSheet.create(
          webDirection(
            factory({ ...responsive, isRTL, direction: isRTL ? "rtl" : "ltr" }),
          ),
        ),
      [responsive, isRTL],
    );
  };
}
