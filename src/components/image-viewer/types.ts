import type { ImageSourceProp } from "@/components/image";

export type ImageViewerItem = {
  source: ImageSourceProp;
  /** What the picture shows, in words — read out as it comes into view. */
  alt: string;
  /** Shown under the picture, over the thumbnails. */
  caption?: string;
  /** A smaller version for the thumbnail strip. Defaults to `source`. */
  thumbnail?: ImageSourceProp;
  /**
   * A link the share sheet can pass on. Defaults to `source` when that is
   * an http(s) URL; without either, the share button is hidden — a local
   * file or bundled asset has nothing another app can open.
   */
  shareUrl?: string;
};

export type ImageViewerProps = {
  /** Identifies this viewer for `ImageViewer.show(id, index)` / `ImageViewer.hide(id)`. */
  id: string;
  /** Default `image-viewer.<id>`; parts: `.stage`, `.close`, `.share`, `.caption`, `.thumbnail.<n>`. */
  testID?: string;
  images: readonly ImageViewerItem[];
  /** Fires as the visible image changes — by swipe, thumbnail, key or screen reader. */
  onIndexChange?: (index: number) => void;
  /** Fires once the viewer has fully closed. */
  onClose?: () => void;
};
