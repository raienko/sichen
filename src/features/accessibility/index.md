[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › Foundations

# Accessibility

> OS accessibility flags, text scaling, reduced motion and the shared accessibility-prop helpers every component uses.

<sub>`src/features/accessibility` · Tests: [`accessibility-provider.test.tsx`](accessibility-provider.test.tsx), [`props/index.test.ts`](props/index.test.ts), [`screen-reader.web.test.ts`](screen-reader/index.web.test.ts)</sub>

```tsx
import {
  useAccessibility,
  useAnimationDuration,
  controlA11yProps,
  fieldA11yProps,
} from "@/features/accessibility";

const { isScreenReaderEnabled, isLargeTextEnabled, fontScale } =
  useAccessibility();

const duration = useAnimationDuration();
progress.value = withTiming(1, { duration: duration(250) }); // 0 under Reduce Motion

<Pressable {...controlA11yProps({ disabled, selected })}>…</Pressable>;
<TextInput {...fieldA11yProps({ label, disabled, error })} />;
```

Two halves: **reading** what the user has turned on at the OS level, and **writing** correct accessibility props onto components without each one re-deriving them.

- **`AccessibilityProvider`** (in `Providers`, alongside `ThemeProvider`) reads every flag once on mount and then keeps them live through `AccessibilityInfo`'s change events — same "resolve once, then track the OS" shape `ThemeProvider` has for colour scheme, so toggling VoiceOver or Reduce Motion in Settings lands without an app restart. Which flags exist is a table in `settings.ts` (`isScreenReaderEnabled`, `isReduceMotionEnabled`, `isBoldTextEnabled`, `isReduceTransparencyEnabled`, `isInvertColorsEnabled`, `isGrayscaleEnabled`), so adding one is a single entry. Several are iOS-only — each query is wrapped so an unsupported platform resolves `false` rather than failing the whole batch, since "the user has not turned this on" is the right answer for a setting the OS doesn't have.
- **`duration(ms)` centralizes Reduce Motion.** It returns `0` when the flag is on and `ms` otherwise, so an animated component asks for its duration and gets the accessible answer without having to know the flag exists — or remember that it should. `Modal` (enter, exit, and the drag handle's snap-back) and `Accordion` (chevron rotation) all go through it. The exit animation's completion callback still fires at duration `0`, so Modal's delayed-unmount handshake with RN's `visible` prop works identically either way.
- **Increased text sizes are handled in the type scale, not per component.** `fontScale` (the OS text-size multiplier) comes from `useWindowDimensions()`, which RN already re-renders on. `createTypography` multiplies **`lineHeight`** by it and deliberately leaves `fontSize` alone: RN scales a `<Text>`'s own font size by the OS setting already (`allowFontScaling`), so scaling it here too would double-apply, while `lineHeight` is _not_ scaled by RN — which is what makes a fixed line box clip growing glyphs at large Dynamic Type settings. `isLargeTextEnabled` (`fontScale > 1`) is there for layout that needs to react more drastically than reflowing.
- **`controlA11yProps()` / `fieldA11yProps()` are the write half.** A bare `Pressable` has no role of its own, so a component that forgets `accessibilityRole` announces as an anonymous group — which is exactly what `Button` shipped as, leaving every button in the app (modal triggers, Close, the theme and locale switchers) unannounced while `Accordion` happened to get it right. Routing that through one helper makes it structural rather than per-component discipline. Only the state keys actually passed are emitted, so a plain button reports no `selected`/`expanded` at all instead of reporting them as `false` and having a screen reader announce a selection state that doesn't exist.
- **Both `accessibilityState` and `aria-*` are emitted, on purpose.** `accessibilityState` is what native reads and what testing-library asserts against; react-native-web 0.21 renders only the `aria-*` form. State set through `accessibilityState` alone therefore reaches native correctly and produces _nothing_ in the DOM — a gap the Jest suite can't see, since RNTL reads the React prop rather than the rendered output. Caught by inspecting a real rendered button (`role=button` present, `aria-selected` absent) and now covered by a test that asserts the `aria-*` mirror specifically. The Showcase exercises these states across its interactive sections.
- **`headingA11yProps(level)`** marks text as a heading so screen-reader users can navigate by structure (VoiceOver's rotor, TalkBack's heading navigation) instead of reading top to bottom. It emits three spellings because no single one covers both platforms: `accessibilityRole="header"` for native, `role="heading"` for react-native-web (which turns it into a real `<h1>`–`<h6>` element), and `aria-level` to pick which one. That last prop isn't in RN's typings at all, and omitting it doesn't degrade gracefully — react-native-web falls back to `<h1>` for _every_ heading, flattening the outline the role exists to convey. `Text` applies this automatically; see below.
- **`fieldA11yProps()`** carries a field's `error` as its `accessibilityHint`, which VoiceOver/TalkBack read after the label. RN has no "invalid" accessibility state to set — that's an ARIA concept with no React Native equivalent (`accessibilityInvalid` type-checks only because a spread suppresses excess-property checking, and does nothing at runtime) — so a hint is the portable way to announce _why_ a field is wrong instead of leaving the red border as the only signal.
- **`disabledA11yProps()`** is the opposite instruction: hide this from assistive technology entirely. It takes four spellings to say once — `accessible: false` so it never becomes an element, `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android) to hide it _and its descendants_, and `aria-hidden` for the DOM react-native-web renders — and setting only some of them leaves the node announced on whichever platforms the rest covered. It's for things that exist only visually and have nothing to say: `Spacer` (below), a decorative rule, an icon beside a label that already names it. Without it a purely presentational node is still a stop a screen-reader user has to swipe past, announced as an empty element.
- **`imageA11yProps({ label })`** names an image. An image is the one control-shaped thing with no text of its own to derive a name from, and `expo-image` defaults `accessible` to `false` — so an image left alone isn't an accessibility element on iOS or Android at all, and an undescribed one is announced as something a screen-reader user can neither read nor knowingly skip. It sets `accessible: true` alongside the usual two role spellings (`accessibilityRole="image"` for native, `role="img"` for react-native-web). `Image` (below) pairs it with `expo-image`'s own `alt`, which is what becomes the DOM `alt` attribute.
- **`radioGroupA11yProps({ label })`** names the container around a set of mutually exclusive options — a `SegmentedControl`, a radio list. Without it each option announces alone with nothing saying what the choice _is_: a screen reader reads "Day, selected, radio button" and never mentions it's the view mode. The role also tells assistive technology the options belong together, which is what makes position announcements and group navigation work. Pair it with `radioA11yProps()` on each option.
- **`progressA11yProps({ label, value, valueText })`** reports how far along something is. Its range is 0–100, not 0–1, because that is what both platforms read out as a percentage — a `now` of `0.42` is announced as "0.42", not "42%". Omitting `value` is meaningful rather than lazy: ARIA reads a missing `aria-valuenow` as "the total isn't known", so an indeterminate bar reports no figure and sets `busy` instead, which is a different claim from a bar sitting at 0%.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
