[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# Carousel

> Swipeable slides with accessible pagination.

<sub>`src/components/carousel` · [Stories](index.stories.tsx) · [Tests](index.test.tsx), [autoplay](autoplay.test.tsx)</sub>

```tsx
import Carousel from "@/components/carousel";

<Carousel
  data={photos}
  label="Trip photos"
  slideLabel={(photo) => photo.caption}
  renderItem={({ item }) => <Image source={item.url} alt={item.caption} />}
  style={styles.carousel}       // must give it a height — see below
  loop
/>

<Carousel data={steps} label="Onboarding" hasPagination={false} renderItem={renderStep} />
```

A wrapper over [`react-native-reanimated-carousel`](https://rn-carousel.dev/) (v5, whose peer deps — Reanimated 4, Worklets, Gesture Handler — this project already had). `loop`, `autoplay`, `itemSize`, `layout`, `animation`, `snapMode`, `orientation` and the render callbacks are the library's own API, passed straight through; the wrapper adds pagination and accessibility.

- **`hasPagination`** (default `true`) shows one dot per slide. On by default because a carousel's remaining content is off-screen by definition — without dots nothing says it exists or how much of it there is. The dots are this app's own `Pagination` in its `"dots"` variant — the private `pagination.tsx` that used to live here is gone, and with it the `progress` shared value it interpolated each dot from. They follow the settled slide instead, which is what made them reliably pressable on iOS; see `Pagination` above for what that cost. The active dot is **recoloured**, and the carousel passes `slideLabel` through so a dot announces what it goes to rather than a number.
- **`testID`** (default `"carousel"`) names the region; its dots are `<testID>.dot.1`, `.dot.2`, …. End-to-end flows change slide with the dots, which work the same on iOS, Android and web, while a pan gesture can't be driven in a browser.
- **Autoplay holds still for people who need it to.** While Reduce Motion or a screen reader is on, the carousel doesn't advance by itself. For a screen-reader user, a slide changing under the cursor is content disappearing mid-sentence.
- **Changing `loop` remounts the library carousel** on the slide it was showing. The library reads its position once, at mount, so wrapping backwards past the first slide and then turning `loop` off used to leave it blank (an offset a bounded carousel has nothing to draw at). The caller's `ref` follows to the new instance.
- **`style` has to give the carousel a height.** Its slides are absolutely positioned — that's how the library animates them — so they can't stretch their container the way ordinary children would, and an unsized carousel renders as an empty box. The dots share that same box.
- **A carousel is driven by a pan gesture, which no screen reader can perform.** Left alone it's a region whose content silently changes and that a VoiceOver or TalkBack user can never move through. Two things fix that, both on by default:
  - The region is `accessibilityRole="adjustable"` with increment/decrement actions wired to the carousel's own `next()`/`prev()`, so the native swipe-up/swipe-down gesture changes slides. Its `accessibilityValue` carries the position, which both platforms re-announce as it changes. A one-slide carousel gets neither — offering gestures that can't do anything is worse than offering none.
  - The pagination dots are real buttons that jump straight to a slide. That's the ARIA "slide picker" pattern and the one navigation path that behaves identically everywhere, which is why turning pagination off is a visual decision worth making deliberately.
- **On web the region is additionally `role="group"` with `aria-roledescription="carousel"`** — the ARIA authoring-practices spelling for exactly this widget, which native has no equivalent of. Same two-spellings-because-neither-covers-both split as the rest of `@/features/accessibility`. Verified in the rendered DOM, along with the announcement updating live: pressing the fourth dot moved `aria-valuetext` to `"A forest road in the fog, Slide 4 of 4"`.
- **`slideLabel(item, index)`** names what's _on_ a slide. The active slide's own content is already reachable — the library mounts every slide at once but marks all but the current one `aria-hidden`, confirmed in the DOM — so this isn't rescuing hidden content. It names the two things that _describe_ the carousel rather than being it: the region's announcement becomes "A pug wrapped in a blanket, Slide 2 of 4", and each dot says where it goes instead of only which number it is. Without it both fall back to the position alone.
- **Known gap, web only:** the library's dots set their current-slide state through `accessibilityState={{ selected }}` and nothing else, and react-native-web 0.21 renders only the `aria-*` form — the same finding this project already documented for `Button` — so `aria-selected` never reaches the DOM. Native is unaffected. It degrades rather than breaks: the region's own `aria-valuetext` still announces which slide is current, so the information is available, just not from the dot itself. Patching it needs `patch-package` against the library's minified `lib/` build (its unminified `src/` is not what the bundler resolves — verified), which didn't seem worth the maintenance for a redundancy gap; say the word and it's a small patch.
- **Images inside slides must not be native drag sources.** An `<img>` that the browser can drag hijacks the pan the moment the pointer moves, so the carousel just snaps back — this is why `Image` now ships `draggable={false}` (above). A slide rendering a raw `expo-image` or `<img>` of its own needs the same flag.
- **Jest can't drive it.** Under `react-native-reanimated/mock` nothing animates, so the library never settles a slide and `onSnapToItem` never fires. The tests cover every piece of wiring the wrapper owns — the region's accessibility props, the pagination, and that the controls reach the library's handle (spying on the very object `useImperativeHandle` hands the caller) — and the parts that need real motion are verified in the browser instead.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
