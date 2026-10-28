import { useEffect, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import Modal from "@/components/modal";
import { shareContent } from "@/components/share";
import { useIsRtl, useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isWeb, testId } from "@/utils";

import ViewerControls from "./controls";
import { imageViewerEventBus } from "./event-bus";
import ViewerStage from "./stage";
import type { ImageViewerItem, ImageViewerProps } from "./types";

export type { ImageViewerItem, ImageViewerProps } from "./types";

const modalId = (id: string) => `image-viewer:${id}`;

/** How far, in points, a picture is dragged before the backdrop has fully faded. */
const DISMISS_FADE_DISTANCE = 300;

/** A link another app can open: the explicit one, else an http(s) source. */
function shareUrlOf(item: ImageViewerItem | undefined): string | undefined {
  if (!item) return undefined;
  if (item.shareUrl) return item.shareUrl;
  const { source } = item;
  const uri =
    typeof source === "string"
      ? source
      : source && typeof source === "object" && "uri" in source
        ? source.uri
        : undefined;
  return typeof uri === "string" && /^https?:\/\//.test(uri) ? uri : undefined;
}

/**
 * A full-screen viewer for a list of pictures: pinch or double-tap to zoom,
 * drag around a zoomed picture, swipe across to page, swipe down to close.
 *
 * ```tsx
 * <ImageViewer id="trip" images={photos} />
 * <Pressable onPress={() => ImageViewer.show("trip", 3)}>…</Pressable>
 * ```
 *
 * **Opened by id**, like `Modal` and `Popup`: mount it once next to the
 * thumbnails and call `ImageViewer.show(id, index)` from anywhere. It
 * opens on that picture, with the controls showing and nothing zoomed.
 *
 * **On a `Modal` of type `immersive`** — edge to edge, no ScrollView to steal
 * the gestures, fading in and out, closed by the Android back button —
 * over the always-black `mediaSurface`, so pictures look the same in
 * either theme.
 *
 * **The gestures live in one place** (`./stage.tsx`) because they compete
 * for the same finger; see there for how a pan hands over to a page turn
 * at the edge of a zoomed picture. The controls — close, "2 / 5", share,
 * caption, thumbnails — fades out on a single tap.
 *
 * **Reachable without gestures.** To a screen reader the picture is one
 * adjustable element, "Photo 2 of 5, Sunset over the pier": swipe up or
 * down to change picture, double-tap to show or hide the controls. On the
 * web the arrow keys page and Escape closes. Share appears only when the
 * picture has a link another app can open (`shareUrl`, or an http(s)
 * source); saving goes through the system share sheet.
 */
function ImageViewerComponent({
  id,
  images,
  onIndexChange,
  onClose,
  testID,
}: ImageViewerProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();
  const isRTL = useIsRtl();

  const [index, setIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const dismissY = useSharedValue(0);

  const count = images.length;
  const current = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const item = images[current];

  const go = (next: number) => {
    if (next < 0 || next >= count || next === current) return;
    setIndex(next);
    onIndexChange?.(next);
  };
  const close = () => void ImageViewer.hide(id);
  const shareUrl = shareUrlOf(item);

  useEffect(
    () =>
      imageViewerEventBus.on("willShow", (event) => {
        if (event.id !== id) return;
        setIndex(event.index);
        setControlsVisible(true);
        dismissY.set(0);
      }),
    [id, dismissY],
  );

  // Keyboard on the web, only while open: arrows page (mirrored in
  // right-to-left), Escape closes.
  useEffect(() => {
    if (!isWeb || !open) return;
    const onKey = (event: KeyboardEvent) => {
      const forward = isRTL ? "ArrowLeft" : "ArrowRight";
      const back = isRTL ? "ArrowRight" : "ArrowLeft";
      if (event.key === forward) go(current + 1);
      else if (event.key === back) go(current - 1);
      else if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const backdrop = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(dismissY.get()) / DISMISS_FADE_DISTANCE),
  }));

  const describe = (position: number) =>
    t("imageViewer.label", { index: position + 1, total: count });

  const owner = testID ?? testId("image-viewer", id);

  return (
    <Modal
      id={modalId(id)}
      type="immersive"
      style={styles.immersive}
      onShow={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        dismissY.set(0);
        onClose?.();
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          { backgroundColor: theme.colors.mediaSurface },
          backdrop,
        ]}
      />
      <ViewerStage
        testID={testId(owner, "stage")}
        images={images}
        index={current}
        onIndexChange={go}
        onDismiss={close}
        onToggleControls={() => setControlsVisible((visible) => !visible)}
        dismissY={dismissY}
        isRTL={isRTL}
        accessibility={{
          // "Photo 1 of 1" says nothing; a single picture is just its alt.
          label: !item
            ? ""
            : count > 1
              ? `${describe(current)}, ${item.alt}`
              : item.alt,
          value:
            count > 1
              ? t("imageViewer.position", { index: current + 1, total: count })
              : undefined,
          onNext: () => go(current + 1),
          onPrevious: () => go(current - 1),
          onActivate: () => setControlsVisible((visible) => !visible),
        }}
      />
      <ViewerControls
        testID={owner}
        images={images}
        index={current}
        visible={controlsVisible}
        dismissY={dismissY}
        describe={(position) =>
          `${describe(position)}, ${images[position]?.alt ?? ""}`
        }
        onClose={close}
        onShare={
          shareUrl === undefined
            ? undefined
            : () => void shareContent({ url: shareUrl, title: item?.alt })
        }
        onSelect={go}
      />
    </Modal>
  );
}

type ImageViewerStatic = {
  /** Opens the viewer `id` at picture `index` (default 0). Resolves once it has faded in. */
  show: (id: string, index?: number) => Promise<void>;
  /** Closes the viewer `id`. Resolves once it has faded out. */
  hide: (id: string) => Promise<void>;
};

const ImageViewer = ImageViewerComponent as typeof ImageViewerComponent &
  ImageViewerStatic;

ImageViewer.show = async (id, index = 0) => {
  imageViewerEventBus.emit("willShow", { id, index });
  await Modal.show(modalId(id));
};
ImageViewer.hide = (id) => Modal.hide(modalId(id));

export default ImageViewer;

const useStyles = createStyles(() => ({
  immersive: {
    backgroundColor: "transparent",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
