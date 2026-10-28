import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUnits } from "@/features/responsive";

import type { TabBarLayoutProps } from "./types";

/**
 * The bar's own height, and the gap a `floating` one leaves around itself,
 * as Figma px. Not exported: every consumer goes through `useTabBarSpace()`
 * so the value they get is scaled through `units()` like every other size
 * in the app — handing out the raw numbers would let a call site reserve an
 * unscaled height that's wrong on every device but the reference one. Same
 * reasoning `sizes.ts` gives for keeping its own scale private.
 */
const BAR_HEIGHT = 56;
const FLOATING_INSET = 12;

/**
 * How much vertical space the bar occupies, for a screen to reserve at the
 * bottom of its content — as `paddingBottom` on a `ScrollView`'s
 * `contentContainerStyle`, say.
 *
 * A tab bar is drawn over the screen, not beside it, so nothing about the
 * layout tells a list that its last row is underneath one. Without this the
 * final item is unreachable, and the usual fix — a hardcoded `paddingBottom:
 * 80` — silently goes wrong on a device with a different chin, at a
 * different text size, or the moment the bar's variant changes.
 *
 * Takes the same options the bar does, and defaults them the same way, so
 * the two can't disagree.
 *
 * @example
 * // Inside a `Screen`, prefer `<Spacer size="tab-bar" />`. Outside one:
 * const tabBarSpace = useTabBarSpace();
 * <ScrollView contentContainerStyle={{ paddingBottom: tabBarSpace }} />
 * @example
 * // matching a bar configured differently
 * const space = useTabBarSpace({ variant: "floating", avoidChin: false });
 */
export default function useTabBarSpace({
  variant = "sticky",
  avoidChin = true,
}: TabBarLayoutProps = {}): number {
  const units = useUnits();
  const insets = useSafeAreaInsets();

  const chin = avoidChin ? insets.bottom : 0;
  // A floating bar is lifted off the bottom edge, so it eats its own inset
  // *plus* the gap underneath it; a sticky one is flush and eats only the
  // inset it pads itself with.
  const floating = variant === "floating" ? units(FLOATING_INSET) : 0;

  return units(BAR_HEIGHT) + chin + floating;
}

/** The bar's own metrics, for the component that draws it. */
export function useTabBarMetrics() {
  const units = useUnits();

  return {
    height: units(BAR_HEIGHT),
    floatingInset: units(FLOATING_INSET),
  };
}
