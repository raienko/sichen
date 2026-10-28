[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Navigation

# TabBar

> Bottom tabs for an Expo Router `Tabs` navigator, docked or floating.

<sub>`src/components/tab-bar` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { NavigationTabBar } from "@/components/tab-bar";

<Tabs
  screenOptions={{ headerShown: false }}
  tabBar={(props) => <NavigationTabBar {...props} />}
/>;

// and at the end of each tab screen, so its last row clears the bar
<Screen scrollable header={<Header title="Home" />}>
  …
  <Spacer size="tab-bar" />
</Screen>;
```

A bottom tab bar for an Expo Router `Tabs` navigator, in two shapes: `sticky` (docked to the edge, full width, top border) or `floating` (inset as an outlined, raised bar that content scrolls under). Default `sticky`.

- **One bar, three ways in.** `TabBar` is the controlled form (`items` / `value` / `onChange`) — that's what the Showcase and stories drive, and what makes the whole thing testable without standing up a navigator. `NavigationTabBar` is the same bar wired to a navigator's props. They live in separate files behind a barrel for the reason `button` and `icon` do: the adapter imports the bar, so defining both in `index` would have them importing each other.
- **The adapter reads each route's own options**, so tabs stay configured the way every Expo Router app already configures them — `title` for the label, `tabBarIcon` for the glyph, `href: null` to keep one out of the bar — rather than being described a second time. Its props type is derived from `Tabs`'s own (`Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0]`) rather than imported: React Navigation's `BottomTabBarProps` isn't re-exported at `expo-router`'s top level, and reaching into its `build/` folder for a type breaks on any internal reshuffle.
- **Pressing goes through the navigator, not straight to `navigate()`.** A `tabPress` event goes out first and a listener can cancel it (`preventDefault`) — which is how "scroll to top instead of re-navigating" and "block leaving a dirty form" are written. An already-focused tab doesn't navigate again. The controlled form still reports a press on the current tab, because that press is exactly what those listeners are for.
- **`avoidChin`** adds the bottom safe-area inset so the bar clears the home indicator. **On by default**, unlike `Header`'s `avoidNotch`: a tab bar is at the bottom of the screen by definition, so the inset is right in every case except one deliberately nested elsewhere. A `sticky` bar is _padded_ by it, keeping the row of tabs at full height and growing only the dead space beneath; a `floating` bar is _lifted_ by it, since it's already off the edge.
- **`<Spacer size="tab-bar" />` is the room a tab screen leaves for the bar**, placed last inside `Screen`. It's measured above the bottom safe area, which `Screen` already pads, so the home indicator isn't counted twice; list `"safe-area-bottom"` too where nothing else clears the chin. It measures the default `sticky` bar — for a `floating` one, until [`Spacer`](../spacer/index.md) takes a variant: `<Spacer size={points(useTabBarSpace({ variant: "floating", avoidChin: false }))} />`.
- **`useTabBarSpace({ variant, avoidChin })` is the reserved height as a number**, for a layout `Screen` doesn't own, and it takes the same options the bar does so the two can't disagree. The bar is drawn over the screen, not beside it, so nothing in the layout tells a list that its last row is underneath one — and the usual fix, a hardcoded `paddingBottom: 80`, silently breaks on a different chin, at a different text size, or the moment the variant changes. There is deliberately **no exported height constant**: every consumer goes through the hook so the value is scaled through `units()` like every other size, the same reasoning `sizes.ts` gives for keeping its own scale private. Demonstrated in the Showcase with a switch that turns the reservation off — verified in the browser, where the last row sits clear of the bar with it on (bottom 322 vs bar top 330) and disappears beneath it with it off (381 vs 330).
- **Changing tab animates, and the selection is one thing that moves.** The current tab is marked by a single indicator drawn behind the row — Graphite's selection, the `selected` tint with an `accent` bar along its top edge — which slides (240 ms, ease-out) from the old tab to the new one rather than one tab switching off and another on. It's the same shape as `Pagination`'s highlight. The first position is placed without animating, so nothing flies in on mount, and the indicator is decoration: hidden from assistive technology and ignoring touches, since each tab carries its own selected state.
- **The indicator follows measured layouts, not equal shares.** Each tab reports its `onLayout` and the indicator takes that tab's `x` and width, so it lands correctly whatever the tabs' widths. Tabs and indicator share an inner row with no border or padding, so both count from the same origin. **RTL**: the row's order mirrors from `useIsRtl()` (the locale, not `I18nManager`), and the measured `x` is physical either way; the layer the indicator moves in is pinned to `direction: "ltr"` so native Yoga, which reads `left` as the leading edge under RTL, can't mirror the offset a second time. When the direction flips at runtime the row is remounted and measured afresh, with measurements keyed by direction: the tabs swap places without changing size, and react-native-web reports layout from a `ResizeObserver`, which never hears of a move. Verified in the browser under Arabic: Home sits on the right and the indicator lands exactly on each tab picked (x 16 / 264 / 512 / 760).
- **The easing is clamped.** On web, Reanimated's first frame can be stamped just before the press that started it, so progress starts slightly below 0, and plain `Easing.out(Easing.cubic)` extrapolates that steeply. Measured in the browser, the indicator's first frame jumped 45 px the wrong way before sliding. `easeOutClamped` (`@/utils`) holds the input to 0–1, which removes the kick; Pagination uses the same easing.
- **Icon and label crossfade.** An icon draws its colour as a glyph or an SVG, so there's no single colour to interpolate: each tab draws its icon and label twice, in `textSecondary` and in `text`, and fades the `text` copy in over 200 ms. The copy on top is hidden from assistive technology (the tab's own label names it). A selected tab's pair also grows slightly (×1.06). An `icon` can be a function of `{ focused, color, size }` — `NavigationTabBar` passes a route's `tabBarIcon` through this way, so a navigator's icons fade too; it's called once per colour, so it should depend only on its arguments.
- **Reduce Motion: no movement, the crossfade stays.** Through `useAnimationDuration()`, the indicator's slide takes 0 ms, so it jumps; the growth is dropped. The colour crossfade remains, since a fade isn't movement and is the substitution Apple's own guidance names — the same call `ProgressBar` makes. The `ChangingTab` story cycles tabs on a loop to show both modes.
- **Accessibility is a `tablist` of `tab`s**, not a row of buttons: a tab tells a screen reader that picking it swaps the view rather than performing an action, and that it belongs to the set its parent declares — which is what makes position announcements work. Each tab's whole column is the touch target, since a tab bar's most common miss is a hit area the size of the glyph.
- **Not yet wired into this app's routing.** The showcase is a single route, and adding a `(tabs)` group would restructure the app rather than add a component — so the Showcase demonstrates it over a bounded scrolling stage instead, which is also the only way to show what the space hook is for.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
