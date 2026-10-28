[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# ImageViewer

> Full-screen pictures: pinch and double-tap to zoom, drag a zoomed picture around, swipe across to page, swipe down to close.

<sub>`src/components/image-viewer` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`zoom.test.ts`](zoom.test.ts)</sub>

```tsx
import ImageViewer, { type ImageViewerItem } from "@/components/image-viewer";

const photos: ImageViewerItem[] = [
  {
    source: url,
    thumbnail: thumbUrl,
    alt: "Harbour at dawn",
    caption: "Lisbon, 6:10",
  },
];

<ImageViewer id="trip" images={photos} onIndexChange={setSeen} />;

<Pressable onPress={() => ImageViewer.show("trip", 2)}>…</Pressable>;
await ImageViewer.hide("trip");
```

- **Opened by id**, like `Modal` and `Popup`: mount one next to the thumbnails, call `ImageViewer.show(id, index)` from anywhere. It opens on that picture with the controls showing and nothing zoomed, and both statics resolve once the fade has finished.
- **It is a `Modal` of type `immersive`** — edge to edge, with no ScrollView around its content (one would steal the gestures), fading in and out, closed by the Android back button — over the always-black `mediaSurface`, so pictures look the same in either theme.
- **Gestures** (all in `stage.tsx`, on the UI thread, because they compete for the same finger):
  - **Pinch** zooms 1–4× about the point between the fingers.
  - **Double-tap** zooms to 2.5× at the tapped point, or back to fit.
  - **Drag** moves a zoomed picture, clamped to its edges; dragging on past an edge turns the page, so you can pan to the edge and keep going.
  - Unzoomed, a drag picks an axis once: **across** turns the page (a quarter of the width, or a flick), **down or up** drags the picture away and closes past 120 pt or on a fast flick, with the backdrop and controls fading as it goes. Past the first or last picture a swipe only gives a little.
  - **Single tap** shows or hides the controls, once a double-tap is ruled out.
- **Page turns are seamless.** The shown index is a shared value: a turn swaps it and resets the offset in the same frame, and React re-renders afterwards. Only the current picture and its neighbours are mounted, so a long album holds at most three decoded pictures. A neighbour chosen from a thumbnail, a key or a screen reader slides in like a swipe; anything further jumps. Turns settle with `easeOutClamped` from `@/utils`: on the web a first frame can be stamped just before the turn began, and plain ease-out cubic kicked the page up to 44 px the wrong way (measured in web Storybook, 7 of 8 arrow-key turns); clamped, none do.
- **Controls** (`controls.tsx`): close, "2 / 5" and share along the top; the caption and a thumbnail strip along the bottom (`thumbnails.tsx`). A single picture shows neither the counter nor the thumbnails, and is announced by its `alt` alone. The current thumbnail takes Graphite's selection — an `accent` edge with a band of background — and stays scrolled into view. Hidden controls stop taking touches.
- **Share** appears only when the picture has a link another app can open — `shareUrl`, or an http(s) `source` — and goes through `shareContent`; saving to Photos happens from the system share sheet, so no media-library module is needed.
- **Accessibility.** The picture is one adjustable element, "Photo 2 of 5, Harbour at dawn": swipe up or down to change picture, double-tap to toggle the controls. Thumbnails, close and share are named buttons. On the web the arrow keys page (mirrored in right-to-left) and Escape closes. Reduce Motion makes every transition instant.
- **Geometry** is pure and tested in `zoom.ts`: fitting the picture into the page, how far a zoomed picture may move, zooming about a focal point, and whether it is against an edge.
- **Verified on the iOS simulator:** pinch, pan while zoomed, double-tap in and out, single tap toggling the controls, a swipe turning the page (recorded: one continuous eased slide), swipe down closing, and reopening from a thumbnail on the right picture. On the web, a mouse drag begins and resolves the page turn.
- **Not yet:** trackpad and mouse-wheel zoom on the web, and swiping between pictures with two fingers while zoomed. Android hasn't been tried on a device.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
