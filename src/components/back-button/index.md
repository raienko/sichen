[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Actions

# BackButton

> The back affordance for a screen that draws its own header, with a fallback route when there's no history.

<sub>`src/components/back-button` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import BackButton from "@/components/back-button";

<BackButton />                         // router.back()
<BackButton onPress={confirmDiscard} /> // takes over entirely
<BackButton fallbackHref="/orders" />   // where to go with no history
```

The back affordance for a screen that draws its own header. With no `onPress` it pops the navigation stack, which is the case it exists for — a header shouldn't have to reach for the router to do the one thing back buttons do. It's an `IconButton` underneath, so the touch target, palette, states and accessible name are the ones every other button has.

- **`onPress` replaces the navigation, it doesn't run alongside it.** That's what makes "ask before discarding" expressible without fighting a default.
- **A back button with no history is a dead control**, which is exactly what a screen opened straight from a deep link or a tapped notification gets: `router.back()` is a no-op and the user is stranded. `fallbackHref` (default `"/"`, the one route every app has) is used instead when `router.canGoBack()` is false — via `replace`, not `navigate`, since this is a way _out_ of a dead end and pushing it would leave a history whose own back button returns to the screen the user just asked to leave. Pass `fallbackHref={null}` to opt out, and the button renders nothing rather than sitting there doing nothing. It's typed as Expo Router's `Href`, so a route the app doesn't have is a `tsc` error rather than a dead end found at runtime.
- **That disappearing act only applies when the button owns the navigation.** With an `onPress`, the caller decides what pressing means and the button stays put however empty the stack is.
- **The chevron mirrors in RTL.** Back is a direction, not a glyph: in a right-to-left locale the previous screen is to the _right_, so a left-pointing chevron there means forward. It reads `useIsRtl()` — the locale-derived flag — rather than relying on automatic mirroring, which only lands after a native reload. Covered by a test that renders in `ar` and asserts both the glyph and the translated label change.
- **Its label is translated** (`common.back`), because an icon-only button has no text to derive a name from — `IconButton` requires one by construction.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
