import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import Image, { type ImageSourceProp } from "@/components/image";
import {
  disabledA11yProps,
  statusA11yProps,
  useAccessibility,
} from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import { SKELETON_COLORS } from "./colors";
import { SkeletonHighlight, useDimStyle } from "./pulse";
import { artworkFromChildren } from "./source";

export { SKELETON_COLORS } from "./colors";

/**
 * Two ways to say what is shimmering, as a union rather than two optional
 * props: a file this component draws and recolours itself, or content the
 * caller draws. They aren't interchangeable — see the note on the highlight —
 * so passing both should be a `tsc` error rather than a silent precedence
 * rule.
 */
type ContentProps =
  | {
      /**
       * The skeleton artwork, as anything `Image` takes — a `require()`d
       * PNG or SVG, or a URL. Export the placeholder from Figma as one file
       * and pass it here.
       */
      source: ImageSourceProp;
      children?: never;
    }
  | {
      source?: never;
      /**
       * Whatever should shimmer, drawn by the caller — an `<Image />`, an
       * SVG component, a stack of views. Sizes the skeleton itself.
       */
      children: ReactNode;
    };

type Props = ContentProps & {
  /**
   * What a screen reader should say while this is on screen — "Loading
   * messages". Omit it for a skeleton inside something that already
   * announces the wait, which is the common case; see the note below.
   */
  label?: string;
  /**
   * Turns the pulse off and leaves the content sitting there. For a screen
   * with many placeholders at once, where a dozen independent shimmers is
   * worse than none.
   */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A loading placeholder: your own artwork, with a highlight pulsing
 * through its shapes.
 *
 * **It draws no shapes of its own.** There are no `<SkeletonLine>` /
 * `<SkeletonCircle>` primitives to reassemble the design in code — a
 * placeholder's whole job is to be the shape of the content that is coming,
 * the design tool is where that shape already exists, and rebuilding it in
 * JSX means maintaining the same layout twice and watching the two drift.
 *
 * ```tsx
 * <Skeleton source={require("@/assets/images/skeleton-card.svg")} style={styles.card} />
 *
 * <Skeleton>
 *   <Image source={placeholder} alt="" style={{ width: 200, height: 200 }} />
 * </Skeleton>
 *
 * <Skeleton>
 *   <SvgFromFigma width={200} height={50} />
 * </Skeleton>
 * ```
 *
 * **The highlight stays inside the artwork's shapes whenever the artwork
 * is a file.** Given a `source` — or a lone `<Image>` child, which is the
 * same thing said another way — a second copy of the file, in the
 * highlight colour, fades in and out over the first, so the light lives in
 * the shapes and never in the gaps between them. `<Skeleton source={x} />`
 * and `<Skeleton><Image source={x} /></Skeleton>` are therefore the same
 * placeholder, drawn the same way.
 *
 * **Anything else breathes as a whole**, because a React element tree has
 * no alpha channel to ask about. An SVG component out of Figma, or several
 * elements, fade gently down and back up. Pass the artwork as `source`
 * where you can; the light reads better than the dimming.
 *
 * **Why a pulse and not a travelling band.** A band has to be clipped to
 * the shapes, which takes a mask built from the artwork, and
 * react-native-svg's mask `<Image>` can't decode an SVG on iOS or Android:
 * the mask came out empty and the band never showed. Unclipped, it painted
 * the gaps too and looked like a panel sliding past. The pulse needs no
 * mask, so it looks the same on every platform.
 *
 * **A `source` is recoloured, not used as drawn.** It goes through `Image`'s
 * `tintColor`, so only its alpha matters — a Figma export in any grey comes
 * out in the app's own palette, correct in both schemes and after a
 * rebrand, with nothing to re-export. Opacity in the file still counts, so
 * a shape drawn at 50% comes out half-strength. `children` are drawn
 * exactly as given: their colour is the caller's business, and
 * `SKELETON_COLORS` is exported so they can use the same two.
 *
 * **A `source` sizes itself from `style`, like `Image` does** — give it the
 * width and height (or a width and an `aspectRatio`) of the space it stands
 * in for, since a file has no layout of its own to contribute. `children`
 * size the skeleton themselves.
 *
 * **Reduce Motion stops it dead**, with nothing substituted. `ProgressBar`
 * swaps its motion for a cross-fade because there the movement carries
 * information — "this is still going" — and something has to. A skeleton's
 * does not: the shapes already say the content hasn't arrived, so a
 * placeholder that simply sits still is the whole answer rather than a
 * lesser one.
 *
 * **It is hidden from assistive technology unless you name it.** A skeleton
 * is a picture of content that hasn't arrived: nothing to read, nothing to
 * act on. Usually the screen already says it is loading — a `StateView`, a
 * route's own busy state — and a second announcement would talk over it.
 * Pass `label` when this *is* the announcement, and it becomes a polite
 * live region instead.
 *
 * @example <Skeleton source={require("@/assets/images/skeleton-card.svg")} style={styles.card} />
 * @example <Skeleton label="Loading messages"><Placeholder width={200} height={50} /></Skeleton>
 */
export default function Skeleton({
  source,
  children,
  label,
  animated = true,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { isReduceMotionEnabled } = useAccessibility();

  // The artwork to light up: the `source`, or a lone `<Image>` child's own
  // source, so the two ways of saying the same thing render the same
  // thing. Undefined for anything else — see ./source.ts.
  const artwork =
    source === undefined
      ? artworkFromChildren(children)
      : { source, contentFit: "contain" };

  // Reduce Motion is the whole answer, not a slower one: the pulse is
  // dropped and the placeholder sits still. `ProgressBar` substitutes a
  // cross-fade in the same spot because its movement carries information —
  // "this is still going" — but a skeleton's does not. The shapes already
  // say the content hasn't arrived, so there is nothing left for an
  // animation to convey and the honest substitution is none at all.
  const shimmering = animated && !isReduceMotionEnabled;
  const dimStyle = useDimStyle(shimmering && artwork === undefined);

  return (
    <Animated.View
      testID={testID}
      {...(label === undefined
        ? disabledA11yProps()
        : statusA11yProps({ label }))}
      style={[styles.skeleton, style, artwork === undefined ? dimStyle : null]}
    >
      {source === undefined ? (
        children
      ) : (
        /* Only the alpha of this survives: the fill is the app's own
           surface colour, so the export's greys never reach the screen. */
        <Image
          source={source}
          decorative
          contentFit="contain"
          tintColor={theme.colors[SKELETON_COLORS.base]}
          fallback={null}
          style={styles.artwork}
        />
      )}

      {artwork === undefined ? null : (
        <SkeletonHighlight
          active={shimmering}
          source={artwork.source}
          contentFit={artwork.contentFit}
          testID={testId(testID, "shimmer")}
        />
      )}
    </Animated.View>
  );
}

const useStyles = createStyles(() => ({
  skeleton: {
    // Keeps the highlight copy inside the placeholder's own box.
    overflow: "hidden",
  },
  // A file has no layout to contribute, so it fills the box `style` gave.
  artwork: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
