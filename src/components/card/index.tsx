import type { ReactNode } from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { controlA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useElevationStyle, useTheme } from "@/features/theme";

export type CardType = "elevated" | "outlined" | "filled";

/**
 * Which palette entries each type draws from, and whether it casts a
 * shadow. Kept as a table for the same reason `Modal`'s `MODAL_TYPE_CONFIG`
 * is: adding a type is one entry here plus the literal in `CardType`, and
 * the component below reads it generically.
 *
 * **`outlined` is the one to reach for on an already-raised surface.** The
 * other two fill with `backgroundElement`, the same token every other
 * raised surface in the app uses — a filled card sitting on an `Accordion`
 * or a `Modal` is literally the same colour as what's behind it. Same trap
 * `Button`'s `secondary` documents.
 *
 * `outlined` answers that with *no fill at all* rather than the page
 * colour. Filling with `background` looks like the obvious fix and is the
 * wrong one: on a dark scheme `background` is darker than the raised
 * surface it sits on, so the card reads as a well punched into the page
 * rather than a thing resting on it — verified on screen, where it came out
 * as a black hole in a grey panel. Taking whatever is behind it and drawing
 * only the `border` edge reads correctly on any surface in either scheme.
 */
const TYPE_CONFIG: Record<
  CardType,
  {
    /** `null` means no fill — the card takes whatever is behind it. */
    background: "backgroundElement" | null;
    bordered: boolean;
    shadow: boolean;
  }
> = {
  elevated: { background: "backgroundElement", bordered: false, shadow: true },
  outlined: { background: null, bordered: true, shadow: false },
  filled: { background: "backgroundElement", bordered: false, shadow: false },
};

type PressProps =
  | {
      onPress?: never;
      /** Only a pressable card is a control worth naming. */
      label?: never;
      disabled?: never;
    }
  | {
      /** Turns the whole card into one control — see the accessibility note. */
      onPress: () => void;
      /**
       * What a screen reader announces. Omit when the card's own text says
       * it: RN derives the name from the text inside, and a duplicate
       * explicit label just makes the announcement noisier. Same rule
       * `Button` follows for a labelled button.
       */
      label?: string;
      disabled?: boolean;
    };

type Props = Omit<
  PressableProps,
  "children" | "style" | "onPress" | "disabled" | "accessible"
> &
  PressProps & {
    children: ReactNode;
    /** Defaults to `"elevated"`. */
    type?: CardType;
    /**
     * Inner spacing. Turn it off for a card whose content goes edge to edge
     * — an image filling the top, a list of rows that draw their own
     * padding — and let that content own its spacing instead.
     */
    padded?: boolean;
    style?: StyleProp<ViewStyle>;
  };

/**
 * A raised surface that groups related content — the box a list row, a
 * summary, or a preview sits in.
 *
 * It owns the surface and nothing else: no title, no footer, no slots.
 * Content is `children`, composed from `Text`, `Image`, `Spacer` and the
 * rest, which is what keeps one component from growing a prop per layout
 * anyone ever wants. `Accordion` is the version of this that also owns a
 * header, and stays separate for that reason.
 *
 * **Passing `onPress` makes the whole card a single button**, which is the
 * right shape for a card that navigates and the wrong one for a card with
 * its own controls inside: `accessible` groups the children into one
 * announcement, so a button nested in a pressable card becomes unreachable.
 * Put `onPress` on the inner control instead when the card holds more than
 * one thing to do.
 *
 * @example
 * <Card>
 *   <Text value="Total" type="footnote" />
 *   <Text value="£42.00" type="title2" />
 * </Card>
 * @example
 * <Card type="outlined" onPress={() => router.navigate("/orders/12")}>
 *   <Text value="Order #12" />
 * </Card>
 * @example
 * // edge-to-edge content owns its own spacing
 * <Card padded={false}><Image source={url} alt="Preview" /></Card>
 */
export default function Card({
  children,
  type = "elevated",
  padded = true,
  onPress,
  label,
  disabled = false,
  style,
  ...props
}: Props) {
  const theme = useTheme();
  const elevationStyle = useElevationStyle("raised");
  const styles = useStyles();
  const config = TYPE_CONFIG[type];

  const surface = [
    styles.card,
    padded ? styles.padded : null,
    {
      backgroundColor:
        config.background === null
          ? "transparent"
          : theme.colors[config.background],
      borderColor: config.bordered ? theme.colors.border : "transparent",
    },
    // A shadow is nearly invisible against a dark background, which is why
    // `elevated` also carries the raised *fill* rather than leaning on the
    // shadow alone to separate it from the page.
    config.shadow ? elevationStyle : null,
    disabled ? styles.disabled : null,
    style,
  ];

  if (onPress === undefined) {
    return (
      <View style={surface} {...props}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      // A plain Pressable has no role of its own, so without this the whole
      // card announces as an anonymous group — the same gap `Button`
      // shipped with.
      {...controlA11yProps({ label, disabled })}
      {...props}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ...surface,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  card: {
    borderRadius: radius.surface,
    // Fills whatever contains it rather than picking a width of its own.
    // `alignSelf` (not `width: "100%"`) for the reason `Accordion`
    // documents: the usual parent centers its children without stretching
    // them, and only alignSelf opts back out of that.
    alignSelf: "stretch",
    // Always present, transparent unless the type asks for one — so a
    // bordered and an unbordered card are the same size and don't shift
    // layout when swapped.
    borderWidth: spacing.x1,
    // Keeps edge-to-edge content (a `padded={false}` image) inside the
    // card's edge instead of painting over its border.
    overflow: "hidden",
  },
  padded: {
    padding: spacing.x16,
    gap: spacing.x8,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
}));
