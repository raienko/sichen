import { useEffect } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useAnimationDuration } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { easeOutClamped } from "@/utils";

import ViewerPage from "./page";
import type { ImageViewerItem } from "./types";
import {
  DOUBLE_TAP_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  clamp,
  clampTranslation,
  fittedSize,
  panLimits,
  zoomAbout,
} from "./zoom";

/** How long a page turn, a zoom or a snap-back takes, in ms (0 under Reduce Motion). */
const SETTLE_DURATION = 260;
/** A swipe this far across the page turns it, whatever its speed. */
const TURN_FRACTION = 0.25;
/** …or a flick this fast, in points per second. */
const TURN_VELOCITY = 600;
/** A downward drag this far, or this fast, closes the viewer. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1000;
/** How much a swipe past the first or last image follows the finger. */
const EDGE_RESISTANCE = 0.3;
/** How far a finger may move, in points, and still be tapping. */
const TAP_SLOP = 10;
/** Below this the picture counts as unzoomed. */
const ZOOMED = 1.01;

type Props = {
  images: readonly ImageViewerItem[];
  /** The index React has settled on; the stage animates to it when it changes from outside. */
  index: number;
  /** Called when a swipe turns the page. */
  onIndexChange: (index: number) => void;
  /** Called when a swipe down asks to close. */
  onDismiss: () => void;
  /** Called on a single tap. */
  onToggleControls: () => void;
  /** The swipe-to-close offset, shared with the viewer so its backdrop and controls can fade. */
  dismissY: SharedValue<number>;
  isRTL: boolean;
  testID?: string;
  /** Accessibility: label, value and actions for the one element a screen reader lands on. */
  accessibility: {
    label: string;
    /** Position in the album; omitted for a single picture, which has nowhere to move. */
    value?: string;
    onPrevious: () => void;
    onNext: () => void;
    onActivate: () => void;
  };
};

type Mode = "none" | "page" | "dismiss" | "pan";

/**
 * Where the pictures are and every gesture on them, in one place, because
 * they all compete for the same finger:
 *
 * - **Pinch** zooms about the point between the fingers, 1–4×.
 * - **Double-tap** zooms to 2.5× at the tapped point, or back to fit.
 * - **One-finger drag** pans a zoomed picture. Against its edge, the rest of
 *   the drag turns the page — so you can pan to the edge and keep going.
 * - Unzoomed, a drag picks an axis once: across turns the page, down (or
 *   up) drags the picture away to close.
 * - **Single tap** shows or hides the controls, once a double-tap is ruled out.
 *
 * All of it runs on the UI thread against shared values. The shown index is
 * one too, so a page turn swaps it and resets the offset in the same frame —
 * React catches up afterwards without a flash.
 */
export default function ViewerStage({
  testID,
  images,
  index,
  onIndexChange,
  onDismiss,
  onToggleControls,
  dismissY,
  isRTL,
  accessibility,
}: Props) {
  const styles = useStyles();
  const duration = useAnimationDuration();
  const settle = duration(SETTLE_DURATION);
  const count = images.length;
  const direction = isRTL ? -1 : 1;

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const shown = useSharedValue(index);
  const pagerX = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const aspects = useSharedValue<Record<number, number>>({});

  // Gesture bookkeeping: where things were when a gesture began.
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const mode = useSharedValue<Mode>("none");

  // Clamped, so a first web frame stamped before the turn began doesn't
  // kick the page the wrong way (see `easeOutClamped`).
  const timing = { duration: settle, easing: easeOutClamped };

  function resetZoom(time: number) {
    "worklet";
    scale.set(withTiming(1, { duration: time }));
    translateX.set(withTiming(0, { duration: time }));
    translateY.set(withTiming(0, { duration: time }));
  }

  function page() {
    "worklet";
    return { width: width.get(), height: height.get() };
  }

  function content() {
    "worklet";
    return fittedSize(page(), aspects.get()[shown.get()]);
  }

  function turn(step: number) {
    "worklet";
    const target = shown.get() + step;
    pagerX.set(
      withTiming(-direction * step * width.get(), timing, (finished) => {
        if (!finished) return;
        // Same frame: the page that slid in becomes the shown one, sitting
        // exactly where it already is.
        shown.set(target);
        pagerX.set(0);
        scale.set(1);
        translateX.set(0);
        translateY.set(0);
        runOnJS(onIndexChange)(target);
      }),
    );
  }

  // The index changed from outside — a thumbnail, an arrow key, a screen
  // reader. A neighbour slides in like a swipe would; anything further
  // away is a jump.
  useEffect(() => {
    if (shown.get() === index) return;
    const step = index - shown.get();
    resetZoom(0);
    if (Math.abs(step) === 1 && settle > 0) {
      pagerX.set(
        withTiming(-direction * step * width.get(), timing, (finished) => {
          if (!finished) return;
          shown.set(index);
          pagerX.set(0);
        }),
      );
    } else {
      shown.set(index);
      pagerX.set(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable; `timing` is derived from `settle`
  }, [index, settle, direction]);

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      startScale.set(scale.get());
      startX.set(translateX.get());
      startY.set(translateY.get());
      focalX.set(event.focalX - width.get() / 2);
      focalY.set(event.focalY - height.get() / 2);
    })
    .onUpdate((event) => {
      const next = clamp(startScale.get() * event.scale, MIN_SCALE, MAX_SCALE);
      const moved = clampTranslation(
        zoomAbout(
          { x: focalX.get(), y: focalY.get() },
          { x: startX.get(), y: startY.get() },
          startScale.get(),
          next,
        ),
        page(),
        content(),
        next,
      );
      scale.set(next);
      translateX.set(moved.x);
      translateY.set(moved.y);
    })
    .onEnd(() => {
      if (scale.get() < ZOOMED) resetZoom(settle);
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(8)
    .onStart(() => {
      startX.set(translateX.get());
      startY.set(translateY.get());
      mode.set(scale.get() > ZOOMED ? "pan" : "none");
    })
    .onUpdate((event) => {
      if (mode.get() === "pan") {
        const limit = panLimits(page(), content(), scale.get());
        const wanted = startX.get() + event.translationX;
        const x = clamp(wanted, -limit.x, limit.x);
        translateX.set(x);
        translateY.set(
          clamp(startY.get() + event.translationY, -limit.y, limit.y),
        );
        // Whatever the picture can't absorb turns the page.
        pagerX.set(wanted - x);
        return;
      }

      if (mode.get() === "none") {
        mode.set(
          Math.abs(event.translationX) >= Math.abs(event.translationY)
            ? "page"
            : "dismiss",
        );
      }

      if (mode.get() === "dismiss") {
        dismissY.set(event.translationY);
        return;
      }

      // Past the first or last picture the page only gives a little.
      const step = -Math.sign(event.translationX) * direction;
      const target = shown.get() + step;
      const outside = target < 0 || target >= count;
      pagerX.set(event.translationX * (outside ? EDGE_RESISTANCE : 1));
    })
    .onEnd((event) => {
      if (mode.get() === "dismiss") {
        if (
          Math.abs(dismissY.get()) > DISMISS_DISTANCE ||
          Math.abs(event.velocityY) > DISMISS_VELOCITY
        ) {
          runOnJS(onDismiss)();
        } else {
          dismissY.set(withTiming(0, { duration: settle }));
        }
        mode.set("none");
        return;
      }

      const offset = pagerX.get();
      if (offset !== 0) {
        const step = -Math.sign(offset) * direction;
        const target = shown.get() + step;
        const far = Math.abs(offset) > width.get() * TURN_FRACTION;
        const fast =
          Math.abs(event.velocityX) > TURN_VELOCITY &&
          Math.sign(event.velocityX) === Math.sign(offset);
        if (target >= 0 && target < count && (far || fast)) {
          turn(step);
        } else {
          pagerX.set(withTiming(0, { duration: settle }));
        }
      }
      mode.set("none");
    });

  // Taps fail as soon as a finger travels: the end of a pinch or a drag
  // must never also count as a tap and toggle the controls.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .maxDistance(TAP_SLOP)
    .onEnd((event) => {
      if (scale.get() > ZOOMED) {
        resetZoom(settle);
        return;
      }
      const moved = clampTranslation(
        zoomAbout(
          {
            x: event.x - width.get() / 2,
            y: event.y - height.get() / 2,
          },
          { x: 0, y: 0 },
          1,
          DOUBLE_TAP_SCALE,
        ),
        page(),
        content(),
        DOUBLE_TAP_SCALE,
      );
      scale.set(withTiming(DOUBLE_TAP_SCALE, { duration: settle }));
      translateX.set(withTiming(moved.x, { duration: settle }));
      translateY.set(withTiming(moved.y, { duration: settle }));
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDistance(TAP_SLOP)
    .requireExternalGestureToFail(doubleTap)
    .onEnd(() => {
      runOnJS(onToggleControls)();
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  function onLayout(event: LayoutChangeEvent) {
    width.set(event.nativeEvent.layout.width);
    height.set(event.nativeEvent.layout.height);
  }

  function onAspectRatio(position: number, ratio: number) {
    aspects.set({ ...aspects.get(), [position]: ratio });
  }

  // Only the pages either side of the current one are mounted: a long
  // album never holds more than three decoded pictures.
  const positions = [index - 1, index, index + 1].filter(
    (position) => position >= 0 && position < count,
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        testID={testID}
        onLayout={onLayout}
        accessible
        // One picture is just an image; several are adjustable, so a
        // screen reader can move between them.
        accessibilityRole={count > 1 ? "adjustable" : "image"}
        accessibilityLabel={accessibility.label}
        accessibilityValue={
          accessibility.value === undefined
            ? undefined
            : { text: accessibility.value }
        }
        accessibilityActions={
          count > 1
            ? [
                { name: "increment" },
                { name: "decrement" },
                { name: "activate" },
              ]
            : [{ name: "activate" }]
        }
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") {
            accessibility.onNext();
          } else if (event.nativeEvent.actionName === "decrement") {
            accessibility.onPrevious();
          } else {
            accessibility.onActivate();
          }
        }}
        style={styles.stage}
      >
        {positions.map((position) => (
          <ViewerPage
            key={position}
            item={images[position]!}
            position={position}
            shown={shown}
            direction={direction}
            width={width}
            pagerX={pagerX}
            dismissY={dismissY}
            scale={scale}
            translateX={translateX}
            translateY={translateY}
            onAspectRatio={onAspectRatio}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const useStyles = createStyles(() => ({
  stage: {
    flex: 1,
    overflow: "hidden",
  },
}));
