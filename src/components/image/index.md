[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Image

> `expo-image` with a themed placeholder, a fallback on error and cache controls.

<sub>`src/components/image` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Image from "@/components/image";

<Image source={user.avatarUrl} alt={`${user.name}'s avatar`} style={styles.avatar} />
<Image source={require("...")} decorative style={styles.texture} />
<Image source={url} fallback={DEFAULT_AVATAR} alt="Profile photo" />

// from anywhere — no instance needed:
await Image.preload([urlA, urlB]);
await Image.cacheClear();
```

A wrapper over [`expo-image`](https://docs.expo.dev/versions/v57.0.0/sdk/image/) that adds the three things every call site would otherwise repeat. Everything else — `contentFit`, `transition`, `cachePolicy`, `placeholder`, `priority`, the load callbacks — is `expo-image`'s own API passed straight through; this is a wrapper, not a redesign.

- **A fallback for when there's nothing to show.** Kicks in when `source` is missing (`null`, `undefined`, `""`, `[]`) _or_ fails to load. `""` is the one worth naming: it's what a record with no picture looks like straight out of an API, and a plain `expo-image` sits on it forever loading nothing. The default fallback is a **themed placeholder** (`fallback.tsx`) rather than a bundled PNG — a fixed placeholder asset is one set of greys, so whichever scheme it wasn't drawn for gets a light patch in a dark UI exactly where something already went wrong. Pass `fallback={source}` for a specific picture instead (a default avatar, a branded product shot), or `fallback={null}` to render nothing.
- **`placeholder` and `fallback` are different things, and both are worth having.** A placeholder is what `expo-image` shows _while_ the real image loads and drops when it arrives; a fallback is what's shown when the real image is never going to arrive.
- **A failed source recovers when the source changes**, because the failure is recorded as a key derived from the source's _value_, not a boolean. That's not incidental: a call site passing `source={{ uri }}` makes a new object every render, so an identity-keyed reset would clear the flag right after each error and re-render into the same failing load forever.
- **Accessibility can't be forgotten.** `alt` and `decorative` are a union, not two optional props, so an image with neither is a `tsc` error — the same construction that makes an unnamed `IconButton` one. A described image gets `imageA11yProps()` (above) plus `expo-image`'s `alt`; a decorative one gets `disabledA11yProps()` and leaves the accessibility tree entirely. Every accessibility prop the component owns is `Omit`ted from its props type, so a caller can't half-override the set. **The description stays on the fallback too** — the image is gone, but what it was _for_ is still what the user needs to know about that spot, so it announces something missing rather than silently vanishing. Verified in the rendered DOM: a described image is `role="img"` with `alt="…"` on the `<img>`, a decorative one is `aria-hidden="true"` with neither, and a fallback placeholder keeps `role="img"` and its label.
- **Images are not native drag sources on web** (`draggable={false}` by default; pass `draggable` to opt back in). Browsers make every `<img>` an HTML5 drag source, and starting one cancels the pointer stream any gesture is reading — which silently broke dragging a `Carousel` whose slides were images. Traced in the browser: the pan fired `begin` then `end` with a translation of `0`, immediately after the browser's own `dragstart`; with the flag off the same drag runs uninterrupted. Native has no equivalent concept, so defaulting it off is also what makes web behave the way iOS and Android already did.
- **`Image.preload(urls, options?)`** warms the cache for images about to be needed — the next page of a feed, the photos behind a screen one tap away. Only remote URLs benefit; a `require()`d asset is in the bundle already. It resolves `false` if _any_ URL fails, and nothing treats that as fatal: a warm cache is an optimization, and a failed preload just means the image is fetched at render as it would have been anyway.
- **`Image.cacheClear(target?)`** empties `expo-image`'s caches — after a sign-out when images are user-scoped, or from a "clear cached data" setting. Both caches by default; `"memory"` or `"disk"` narrows it. It resolves `false` on web (which has no cache of `expo-image`'s own) and on Android when the activity is gone, so `false` means "nothing was cleared", not "something broke" — which is exactly what the Showcase shows when you press it in a browser.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
