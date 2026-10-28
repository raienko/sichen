import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { getBreakpoint, type Breakpoint } from "./breakpoint";
import { createSizes, type Sizes } from "./sizes";
import { createTypography, type Typography } from "./typography";
import { createUnitsForScale, scaleFactorForWidth, type Units } from "./units";

export type Responsive = Sizes & {
  units: Units;
  breakpoint: Breakpoint;
  typography: Typography;
  /**
   * The OS text-size multiplier already folded into `typography`'s line
   * heights. Exposed so a caller that opts *out* of RN's automatic font
   * scaling can undo it — see `Text`'s `allowFontScaling` handling.
   */
  fontScale: number;
};

/**
 * Everything derived from the window — units, breakpoint, the sizes
 * styleguide, and the type scale — from a **single** `useWindowDimensions()`
 * read.
 *
 * That single read is the whole point. Each styleguide used to own its own
 * `useUnits()` call, so a component calling `createStyles` ended up
 * subscribed to dimension changes four times over (units, breakpoint,
 * sizes, typography) — multiplied by every styled component on screen.
 * Composing them here from one read collapses that to one, and the pure
 * `createSizes`/`createTypography`/`createUnits`/`getBreakpoint` builders
 * exist precisely so this composition is possible.
 *
 * Each piece is memoized on what it actually depends on, so a resize that
 * doesn't change the derived scale doesn't churn any of them: `units` on
 * the clamped scale factor (see `useUnits`), `typography` additionally on
 * `fontScale` since it scales line heights by the OS text-size setting.
 */
export default function useResponsive(): Responsive {
  const { width, height, fontScale } = useWindowDimensions();
  const scale = scaleFactorForWidth(Math.min(width, height));

  const units = useMemo(() => createUnitsForScale(scale), [scale]);
  const breakpoint = useMemo(() => getBreakpoint(width), [width]);
  const sizes = useMemo(() => createSizes(units), [units]);
  const typography = useMemo(
    () => createTypography(units, fontScale),
    [units, fontScale],
  );

  return useMemo(
    () => ({ units, breakpoint, typography, fontScale, ...sizes }),
    [units, breakpoint, typography, fontScale, sizes],
  );
}

/**
 * Just the sizes styleguide, for a component that needs a size outside a
 * style object entirely (an `Icon`'s `size` prop, say) — `createStyles`
 * already hands these to its factory, so most call sites never need this.
 */
export function useSizes(): Sizes {
  const { spacing, radius, sizes } = useResponsive();
  return useMemo(() => ({ spacing, radius, sizes }), [spacing, radius, sizes]);
}

/**
 * Just the type scale. `Text` uses this to pick a variant by its `type`
 * prop at render time, which a static `createStyles` factory can't do.
 */
export function useTypography(): Typography {
  return useResponsive().typography;
}
