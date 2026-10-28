[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# Skeleton

> A loading placeholder drawn from your own artwork, with a highlight pulsing through its shapes.

<sub>`src/components/skeleton` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`source.test.tsx`](source.test.tsx)</sub>

```tsx
import Skeleton from "@/components/skeleton";

<Skeleton source={require("@/assets/images/skeleton-card.svg")} style={styles.card} />

<Skeleton>
  <Image source={placeholder} alt="" style={{ width: 200, height: 200 }} />
</Skeleton>

<Skeleton>
  <SvgFromFigma width={200} height={50} />
</Skeleton>
```

A loading placeholder: your own artwork, with a highlight pulsing through its shapes.

- **It draws no shapes of its own.** There are no `<SkeletonLine>` / `<SkeletonCircle>` primitives to reassemble the design in code. A placeholder's whole job is to be the shape of the content that is coming, the design tool is where that shape already exists, and rebuilding it in JSX means maintaining the same layout twice and watching the two drift. Export it from Figma as one file, or hand over the elements you have already drawn.
- **The highlight stays inside the artwork's shapes whenever the artwork is a file.** Given a `source` — or a lone `<Image>` child, which is the same thing said another way — a second copy of the file, tinted in the highlight colour, fades in and out over the first (`pulse.tsx`). The light lives in the shapes and never in the gaps between them, with no mask to build. `<Skeleton source={x} />` and `<Skeleton><Image source={x} /></Skeleton>` are therefore the same placeholder, drawn the same way; only a direct, only child is inspected, and only when it is this app's own `Image`, the same limit `withIconDefaults` puts on which children it will touch. The child's own `contentFit` is carried over to the copy, or the two would line up only by accident.
- **Anything else breathes as a whole**, because a React element tree has no alpha channel to ask about. An SVG component out of Figma, or several elements, fade gently down and back up — the opacity is on the skeleton's own root, so the caller's layout is untouched. Pass the artwork as `source` where you can; the light reads better than the dimming.
- **Why a pulse and not a travelling band.** The first version swept a skewed gradient band across the artwork, clipped to its shapes by a react-native-svg `<Mask>` built from an `<Image>` of the same file. That only ever worked on the web: on iOS and Android react-native-svg's `<Image>` loads through the platform image loader, which can't decode an SVG, so the mask came out empty and the band never showed. Swept unmasked instead, it painted the gaps between the shapes too and read as a grey panel sliding past. A pulse needs no mask, uses only `expo-image` (which draws SVG and raster alike on every platform) and Reanimated, and looks the same everywhere.
- **A `source` is recoloured, not used as drawn.** It goes through `Image`'s `tintColor`, so only its alpha matters — a Figma export in any grey comes out in the app's own palette, correct in both schemes and after a rebrand, with nothing to re-export. Opacity in the file still counts, so a shape drawn at 50% comes out half-strength. `children` are drawn as given; `SKELETON_COLORS` is exported so they can use the same two tones.
- **The base is `backgroundElementSelected`, not `backgroundElement`**, for the reason `ProgressBar`'s track is: `backgroundElement` is what most raised surfaces already use, so a placeholder on a `Card` or in an open `Accordion` is the colour of what is behind it. The first version did exactly that and rendered invisible in the showcase. The highlight is `grabber`, the one neutral with the same value in both schemes — that makes it reliably _visible_ rather than reliably brighter (it reads as a lighter glow in dark and a darker one in light). No token is brighter than the base in both, so visibility is the property worth pinning; a conventional always-brighter shine would need a palette entry of its own.
- **Reduce Motion stops it dead, with nothing substituted.** `ProgressBar` swaps its motion for a cross-fade because there the movement carries information — "this is still going" — and something has to take that over. A skeleton's does not: the shapes already say the content hasn't arrived, so a placeholder that simply sits still is the whole answer rather than a lesser one, and the highlight copy isn't rendered at all. `animated={false}` does the same thing by hand, for a screen where a dozen independent pulses is worse than none.
- **It is hidden from assistive technology unless you name it.** A skeleton is a picture of content that hasn't arrived: nothing to read, nothing to act on, and usually the screen already says it is loading. Pass `label` when this _is_ the announcement, and it becomes a polite live region instead.
- **A `source` sizes itself from `style`, like `Image` does** — a file has no layout of its own to contribute, so give it the width and height (or a width and an `aspectRatio`) of the space it stands in for. `children` size the skeleton themselves.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
