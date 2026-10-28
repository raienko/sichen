import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarSpace } from "@/components/tab-bar";
import { disabledA11yProps } from "@/features/accessibility";
import { useIsRtl } from "@/features/localization";
import { useSizes, useUnits, type SpacingToken } from "@/features/responsive";

import KeyboardSpace from "./keyboard-space";

export type SpacerDirection = "vertical" | "horizontal" | "both";

/** Room something on screen takes up, measured live. */
export type SpacerVerticalEdge =
  "keyboard" | "tab-bar" | "safe-area-top" | "safe-area-bottom";
/** The side insets, by reading direction: `start` is the left in LTR, the right in RTL. */
export type SpacerHorizontalEdge = "safe-area-start" | "safe-area-end";

/** A value that's already in screen points — see `points()`. */
export type SpacerPoints = { readonly points: number };

type Fixed = number | SpacingToken | SpacerPoints;
type OneOrMore<T> = T | T[];

/**
 * Marks a number as screen points, so it isn't scaled again. A plain
 * number is Figma px and goes through `units()`; a value computed from
 * the device — a safe-area inset, a measured height — is points already.
 *
 * @example <Spacer size={[points(insets.bottom + 50), "keyboard"]} />
 */
export function points(value: number): SpacerPoints {
  return { points: value };
}

/**
 * Every prop that would give this thing something to say. A spacer is empty
 * by definition, so there is no case where any of them is the right answer —
 * omitting them makes passing one a `tsc` error rather than something that
 * silently un-hides the spacer from a screen reader (see `disabledA11yProps`
 * below, which is spread *after* the caller's props for the same reason).
 */
type SilencedProps =
  | "children"
  | "accessible"
  | "accessibilityElementsHidden"
  | "importantForAccessibility"
  | "aria-hidden"
  | "accessibilityRole"
  | "accessibilityLabel"
  | "accessibilityHint"
  | "role";

type BaseProps = Omit<ViewProps, SilencedProps>;

/**
 * What `size` takes depends on `direction`, so a keyword on the wrong axis
 * — `"keyboard"` sideways, `"safe-area-start"` vertically — is a `tsc`
 * error. The unused axis is left unset rather than zeroed, so a vertical
 * spacer in a row container takes no width of its own.
 */
type Props = BaseProps &
  (
    | {
        /** Defaults to `"vertical"` — the common case is separating stacked rows. */
        direction?: "vertical";
        size?: OneOrMore<Fixed | SpacerVerticalEdge>;
      }
    | {
        direction: "horizontal";
        size?: OneOrMore<Fixed | SpacerHorizontalEdge>;
      }
    | {
        direction: "both";
        size?: OneOrMore<Fixed>;
      }
  );

type Size = Fixed | SpacerVerticalEdge | SpacerHorizontalEdge;

/**
 * A blank, non-interactive gap between two elements — the explicit version
 * of a margin, for the places a parent `gap` can't express: an uneven step
 * inside an otherwise evenly-spaced stack, or a gap between two siblings
 * that neither of them owns.
 *
 * Prefer the parent's `gap` when the spacing is uniform; it says "these are
 * evenly spaced" in one place instead of once per gap. Note the two compose
 * rather than replace each other — dropping a `Spacer` into a `gap`'d
 * container adds the container's gap on *both* sides of it.
 *
 * **It is deliberately invisible to assistive technology.** It carries no
 * information a screen-reader user could act on, so it's hidden on every
 * platform at once via `disabledA11yProps()` rather than left as an empty
 * announced stop between the two things that actually matter.
 *
 * **`size` can also name room something else takes up**, measured live —
 * `"keyboard"`, `"tab-bar"`, `"safe-area-top"`, `"safe-area-bottom"`, and
 * sideways `"safe-area-start"` / `"safe-area-end"` — and a list takes the
 * tallest: `["tab-bar", "keyboard"]` is the tab bar's height, growing with
 * the keyboard when it opens over it.
 *
 * `"keyboard"` and `"tab-bar"` are measured above the bottom safe area,
 * which `Screen` already pads; list `"safe-area-bottom"` too and they're
 * measured from the screen's bottom edge instead, for a spacer that sits
 * there itself.
 *
 * @example <Spacer />                              // 16pt vertical
 * @example <Spacer size="x8" />                     // 8pt vertical
 * @example <Spacer direction="horizontal" size="x24" />
 * @example <Spacer direction="both" size={10} />    // off-scale, still unit-scaled
 * @example <Spacer size="keyboard" />               // grows with the keyboard
 * @example <Spacer size={["tab-bar", "keyboard"]} />
 * @example <Spacer size={["x40", "safe-area-bottom", "keyboard"]} />
 * @example <Spacer size={[points(insets.bottom + 50), "keyboard"]} />
 */
export default function Spacer({
  direction = "vertical",
  size = "x16",
  style,
  ...props
}: Props) {
  const { spacing } = useSizes();
  const units = useUnits();
  const insets = useSafeAreaInsets();
  const isRtl = useIsRtl();
  const sizes: Size[] = Array.isArray(size) ? size : [size];
  // Listing the bottom inset means the spacer covers it itself, so the
  // bar and the keyboard are measured from the screen's edge, not above it.
  const atBottomEdge = sizes.includes("safe-area-bottom");
  const tabBar = useTabBarSpace({ avoidChin: atBottomEdge });

  const resolve = (value: Size): number => {
    if (typeof value === "number") return units(value);
    if (typeof value === "object") return value.points;
    switch (value) {
      case "keyboard":
        return 0;
      case "tab-bar":
        return tabBar;
      case "safe-area-top":
        return insets.top;
      case "safe-area-bottom":
        return insets.bottom;
      case "safe-area-start":
        return isRtl ? insets.right : insets.left;
      case "safe-area-end":
        return isRtl ? insets.left : insets.right;
      default:
        return spacing[value];
    }
  };
  const value = Math.max(0, ...sizes.map(resolve));

  // Spread last on purpose: unlike every other component here, a caller
  // overriding these would be undoing the one guarantee this component
  // makes. `SilencedProps` already keeps them out of `props`; this makes
  // the result true regardless.
  const hidden = disabledA11yProps();

  if (sizes.includes("keyboard")) {
    return (
      <KeyboardSpace
        {...props}
        floor={value}
        offset={atBottomEdge ? 0 : insets.bottom}
        style={style}
        {...hidden}
      />
    );
  }

  return (
    <View
      {...props}
      style={[
        {
          width: direction === "vertical" ? undefined : value,
          height: direction === "horizontal" ? undefined : value,
        },
        style,
      ]}
      {...hidden}
    />
  );
}
