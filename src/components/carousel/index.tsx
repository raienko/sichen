import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Carousel as ReanimatedCarousel } from "react-native-reanimated-carousel";
import type {
  CarouselProps as ReanimatedCarouselProps,
  CarouselRef,
} from "react-native-reanimated-carousel";

import { useAccessibility } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

import If from "@/components/if";
import { isE2E, testId } from "@/utils";
import Pagination from "@/components/pagination";

export type { CarouselRef } from "react-native-reanimated-carousel";

/**
 * `Omit` collapses a union into one object type, and `CarouselProps` is a
 * union — `layout` and `itemAnimation` are mutually exclusive. Omitting
 * across it distributively keeps those two alternatives apart, so the
 * pass-through spread below still type-checks against the library's own
 * props.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type Props<Item> = DistributiveOmit<
  ReanimatedCarouselProps<Item>,
  "progress" | "onSnapToItem" | "style"
> & {
  /**
   * What the whole carousel is, in words — "Featured products", "Trip
   * photos". Required, because a carousel is a region a screen-reader user
   * lands on with no text of its own to name it, and an unnamed one is
   * announced as an anonymous group.
   */
  label: string;
  /**
   * Whether the dots below the slides are shown. Defaults to `true`: a
   * carousel's remaining content is off-screen by definition, and without
   * dots there is nothing saying it exists or how much of it there is.
   *
   * They aren't only decoration — see the accessibility note below.
   */
  hasPagination?: boolean;
  /**
   * What the slide at `index` contains, in words — a photo's caption, a
   * product's name.
   *
   * The active slide's own content is reachable on its own — the library
   * mounts every slide at once but hides all but the current one from
   * assistive technology, verified in the rendered DOM. What this adds is a
   * name for the two things that *describe* the carousel rather than being
   * it: the region announces "Sunset over the canyon, slide 2 of 5" as you
   * move, and each pagination dot says where it goes instead of only which
   * number it is. Without it both fall back to the position alone.
   */
  slideLabel?: (item: Item, index: number) => string;
  /**
   * The region's id (default `"carousel"`); its dots get
   * `<testID>.dot.1`, `.dot.2`, …. The library's own `testID` isn't
   * exposed — it names an inner layer nothing needs to reach.
   */
  testID?: string;
  /** Fires with the settled slide's index whenever the carousel comes to rest. */
  onChange?: (index: number) => void;
  /**
   * Must give the carousel a height (or a `flex` that resolves to one).
   * Its slides are absolutely positioned — that's how the library animates
   * them — so they can't size their container the way ordinary children
   * would, and an unsized carousel renders as nothing at all. The dots,
   * when shown, sit inside that same box.
   */
  style?: StyleProp<ViewStyle>;
  ref?: React.Ref<CarouselRef>;
};

/**
 * `react-native-reanimated-carousel` with this app's pagination and the
 * accessibility the library leaves to its host.
 *
 * Everything else is the library's own API, passed straight through —
 * `loop`, `autoplay`, `itemSize`, `layout`, `animation`, `snapMode`,
 * `orientation`, the render callbacks. This is a wrapper, not a redesign.
 *
 * **A carousel is driven by a pan gesture, which no screen reader can
 * perform.** Left alone it's a region whose content silently changes and
 * that a VoiceOver or TalkBack user can never move through. Two things fix
 * that here, and both are on by default:
 *
 * - The container is `accessibilityRole="adjustable"` with increment and
 *   decrement actions wired to the carousel's own `next()`/`prev()`, so the
 *   native swipe-up/swipe-down gesture moves between slides. Its
 *   `accessibilityValue` carries "Slide 2 of 5", which both platforms
 *   re-announce as it changes — that's what makes the position audible
 *   instead of only visible.
 * - The pagination dots are real buttons (`hasPagination`, default `true`)
 *   that jump straight to a slide, each labelled and carrying its selected
 *   state. That's the ARIA "slide picker" pattern and the one navigation
 *   path that behaves identically on every platform, which is why turning
 *   pagination off is a visual decision worth making deliberately rather
 *   than a default.
 *
 * **`autoplay` holds still for people who need it to.** It doesn't advance
 * while Reduce Motion or a screen reader is on: one asked for less
 * movement, and for the other a slide changing under the cursor is content
 * disappearing mid-sentence.
 *
 * On web the container is additionally `role="group"` with
 * `aria-roledescription="carousel"` — the ARIA authoring-practices spelling
 * for exactly this widget, and one native has no equivalent of. Same
 * two-spellings-because-neither-covers-both split as the rest of
 * `@/features/accessibility`.
 *
 * @example
 * <Carousel
 *   data={photos}
 *   renderItem={({ item }) => <Image source={item.url} alt={item.caption} />}
 *   label="Trip photos"
 *   loop
 * />
 * @example
 * // dots off — the slides themselves already say where you are
 * <Carousel data={steps} renderItem={renderStep} label="Onboarding" hasPagination={false} />
 */
export default function Carousel<Item>({
  data,
  label,
  hasPagination = true,
  slideLabel,
  onChange,
  testID = "carousel",
  orientation = "horizontal",
  style,
  ref,
  ...props
}: Props<Item>) {
  const { t } = useLocale();
  const styles = useStyles();
  const { isReduceMotionEnabled, isScreenReaderEnabled } = useAccessibility();
  const carousel = useRef<CarouselRef>(null);
  const [index, setIndex] = useState(props.defaultIndex ?? 0);

  const count = data.length;
  // Holds still for people who asked for less motion or are listening, and
  // in an end-to-end run, where a slide moving on its own makes every
  // assertion a race.
  const autoplay =
    Boolean(props.autoplay) &&
    !isReduceMotionEnabled &&
    !isScreenReaderEnabled &&
    !isE2E;

  // The caller's ref reaches the library's own handle untouched — `next`,
  // `prev`, `scrollTo` and `getCurrentIndex` are exactly what a call site
  // driving the carousel from outside needs, and re-wrapping them would
  // only add a layer to keep in sync.
  // No dependency list: switching `loop` remounts the library carousel
  // (below), and a handle created once would keep driving the old one.
  useImperativeHandle(ref, () => carousel.current as CarouselRef);

  const handleSnap = useCallback(
    (snapped: number) => {
      setIndex(snapped);
      onChange?.(snapped);
    },
    [onChange],
  );

  // The slide's own description first, then where it sits — a screen
  // reader reads it in that order, and what's on the slide is the part the
  // user is actually waiting for.
  const describe = useCallback(
    (slide: number) => {
      const position = t("carousel.slide", {
        current: slide + 1,
        total: count,
      });
      const description = slideLabel?.(data[slide], slide);
      return description ? `${description}, ${position}` : position;
    },
    [t, count, data, slideLabel],
  );

  const position = describe(index);

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      // Only meaningful with somewhere to go. A one-slide carousel that
      // still advertises increment/decrement makes a screen reader offer
      // gestures that do nothing.
      {...(count > 1
        ? {
            accessibilityActions: [
              { name: "increment" },
              { name: "decrement" },
            ],
            accessibilityValue: {
              min: 1,
              max: count,
              now: index + 1,
              text: position,
            },
            "aria-valuetext": position,
          }
        : null)}
      // react-native-web has no "adjustable" role; this is the ARIA
      // authoring-practices spelling of the same widget, which native in
      // turn has no equivalent of.
      role="group"
      aria-label={label}
      aria-roledescription="carousel"
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "increment") carousel.current?.next();
        if (nativeEvent.actionName === "decrement") carousel.current?.prev();
      }}
      style={[styles.container, style]}
    >
      <ReanimatedCarousel
        {...props}
        key={props.loop ? "loop" : "bounded"}
        defaultIndex={index}
        autoplay={autoplay}
        ref={carousel}
        data={data}
        orientation={orientation}
        onSnapToItem={handleSnap}
        style={styles.carousel}
      />

      <If condition={hasPagination && count > 0}>
        <Pagination
          variant="dots"
          label={label}
          value={index + 1}
          total={count}
          orientation={orientation}
          // Pressing a dot is the screen-reader-reachable way to change
          // slides, so the handler is always wired rather than being
          // something a call site has to remember to pass.
          onChange={(value) => carousel.current?.scrollTo({ index: value - 1 })}
          getItemLabel={(value) => describe(value - 1)}
          // `<testID>.dot.1`, `.dot.2`, … — what a test taps to change slide
          // on any platform, since a web test can't drive the pan gesture.
          testID={testId(testID, "dot")}
          style={
            orientation === "vertical"
              ? styles.paginationVertical
              : styles.pagination
          }
        />
      </If>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    width: "100%",
  },
  // Takes whatever height the caller's `style` gave the container, minus
  // the dots. Without it the carousel measures as zero and draws nothing —
  // its slides are absolutely positioned and can't stretch it themselves.
  carousel: {
    flex: 1,
    width: "100%",
  },
  // The gap between the strip and its dots. It lived in the private
  // pagination wrapper; now that the dots are the shared component, the
  // spacing is the carousel's own business.
  pagination: {
    paddingTop: spacing.x12,
  },
  paginationVertical: {
    paddingStart: spacing.x12,
  },
}));
