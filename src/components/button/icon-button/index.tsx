import type { ReactNode } from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { withIconDefaults } from "@/components/icon";
import { createStyles, useSizes } from "@/features/responsive";

import Button from "../button";
import type { ButtonType } from "../palette";

/** `auto` is deliberately absent — a square has nothing to hug. */
export type IconButtonSize = "small" | "medium" | "large";

/** Roughly half the box, so the glyph reads as an icon rather than a shape. */
const ICON_SIZE: Record<IconButtonSize, "x16" | "x20" | "x24"> = {
  small: "x16",
  medium: "x20",
  large: "x24",
};

type Props = Omit<PressableProps, "children" | "style"> & {
  /** Usually an `<Icon />`, which takes its colour and size from here. */
  children: ReactNode;
  /** Required, unlike `Button`: there's no text child to derive a name from. */
  label: string;
  /**
   * Same palette as `Button`. Defaults to `"tertiary"`: an icon button is
   * usually a bare affordance, where a filled one is the deliberate case.
   */
  type?: ButtonType;
  /** Defaults to `"medium"`, which is the 44pt touch-target height. */
  size?: IconButtonSize;
  /** One of several choices (a segmented option) — also announced as such. */
  selected?: boolean;
  /** Shows a spinner in place of the icon and blocks presses. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A `Button` whose whole content is an icon.
 *
 * It *is* a Button — pressable, palette, states and accessibility all come
 * from there, so `secondary` here and `secondary` there can't drift. This
 * adds the square box and a matching glyph size.
 *
 * Worth its own component because the hand-written alternative, a
 * `Pressable` around an `Icon`, gets three things wrong every time: the hit
 * area collapses to the glyph, the icon's colour is restated and drifts from
 * the theme, and there's nothing for a screen reader to say.
 *
 * @example <IconButton label="Close" onPress={close}><Icon name="x" /></IconButton>
 * @example <IconButton label="Favourite" type="primary" selected={saved}><Icon name="star" /></IconButton>
 */
export default function IconButton({
  children,
  type = "tertiary",
  size = "medium",
  style,
  ...props
}: Props) {
  const { spacing } = useSizes();
  const styles = useStyles();

  return (
    <Button
      {...props}
      type={type}
      // The one size reserving no height of its own, leaving the square
      // below free to set an exact one.
      size="auto"
      style={[styles[size], style]}
    >
      {/* Size only — the colour is Button's to fill in on the way through. */}
      {withIconDefaults(children, { size: spacing[ICON_SIZE[size]] })}
    </Button>
  );
}

// Exactly the heights Button uses for the same names, so the two sit level
// in a row. `auto`'s padding is cancelled: a square sizes by its box.
const useStyles = createStyles(({ sizes }) => ({
  small: {
    width: sizes.elementHeightSm,
    height: sizes.elementHeightSm,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  medium: {
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  large: {
    width: sizes.elementHeightLg,
    height: sizes.elementHeightLg,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
}));
