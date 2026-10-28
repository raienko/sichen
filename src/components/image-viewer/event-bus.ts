import { createEventBus } from "@/features/event-bus";

type ImageViewerEvents = {
  /** A viewer is about to open, at this picture. */
  willShow: { id: string; index: number };
};

/**
 * Backs `ImageViewer.show(id, index)`: the mounted viewer with that id moves
 * to `index` and resets before its `Modal` is presented, so it never opens
 * on the last picture and then jumps. Same pattern as `Popup`.
 */
export const imageViewerEventBus = createEventBus<ImageViewerEvents>();
