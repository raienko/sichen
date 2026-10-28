[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › Foundations

# Responsive units, sizes & typography

> Device scaling, breakpoints (phone, foldable, tablet, desktop), the spacing/radius/sizes styleguide and the type scale.

<sub>`src/features/responsive` · Tests: [`breakpoint.test.ts`](breakpoint.test.ts), [`create-styles.test.ts`](create-styles.test.ts), [`grid.test.ts`](grid.test.ts), [`responsive-value.test.ts`](responsive-value.test.ts) …</sub>

```tsx
import { useBreakpoint, useUnits } from "@/features/responsive";

const units = useUnits();
const breakpoint = useBreakpoint(); // "phone" | "foldable" | "tablet" | "desktop"

<View style={{ padding: units(12) }} />; // 12 in Figma is units(12)
```

- `useUnits()` scales a Figma px value for the current device: near-1:1 on a base-width phone (375px, configurable in `config.ts`), scaling up moderately (not linearly — see `SCALE_MODERATION`) and clamped (`MIN_SCALE`/`MAX_SCALE`) so values don't blow up on tablet/desktop.
- Reactive via `useWindowDimensions()` — updates live on rotation, a foldable unfolding, or a browser/desktop resize, verified by resizing the emulated viewport at runtime without navigating away (375 → 768 → 1280 → 2560px; `units(12)` went 12 → 18 → 19 → 19px, confirming both the moderated scale-up and the clamp holding at very wide desktop sizes).
- Scales off `Math.min(width, height)` — the shorter edge — not raw width, so rotating a device doesn't change its values: a phone isn't physically bigger sideways. Verified live: `375×812` portrait and `812×375` landscape both give `units(12) = 12px`; a genuinely bigger screen (`1200×800`) correctly gives `19px`.
- Memoized on the _derived scale factor_, not the raw width/height — two sizes that clamp to the same scale (e.g. 1280px and 2560px both hit `MAX_SCALE`) produce the same `units` function reference, so a `useMemo`/`createStyles()` depending on it won't recompute for a resize that wouldn't change any actual output value.
- Because it's reactive, a `units()`-based style can't live in a module-scope `StyleSheet.create` (that only runs once). Compute those inside the component instead, e.g. `useMemo(() => StyleSheet.create({ padding: units(12) }), [units])`.
- `useBreakpoint()` classifies the current width into `"phone" | "foldable" | "tablet" | "desktop"` — thresholds in `config.ts` (768 deliberately reads as `"tablet"`, matching the common iPad-portrait/`md` breakpoint, not `"foldable"`).

**Everything window-derived comes from one read — `useResponsive()`.** It returns `units`, `breakpoint`, the sizes styleguide (`spacing`/`radius`/`sizes`), and `typography` from a **single** `useWindowDimensions()` call, and it's what `createStyles` uses internally.

That single read is the point. Each styleguide used to own its own `useUnits()`, so one `createStyles` component subscribed to dimension changes four times over (units, breakpoint, sizes, typography) — multiplied by every styled component on screen. The pure `createUnits`/`getBreakpoint`/`createSizes`/`createTypography` builders exist precisely so this composition is possible; the hooks are thin wrappers over them. Verified by counting real `Dimensions` subscriptions while rendering 1, 3, and 6 styled components: 2, 4, and 7 — i.e. exactly **one per component** (plus one app-wide for `AccessibilityProvider`), down from four each.

`useSizes()` and `useTypography()` remain for the cases a static style factory can't cover — a size needed outside a style object entirely (an `Icon`'s `size` prop) or a type-scale entry chosen by a prop at render time (`Text`'s `type`).

**Using units outside a component.** There's also a plain, non-hook `unitsSnapshot(value)`, for module scope, utility functions, or anywhere a hook isn't available:

```ts
import { unitsSnapshot } from "@/features/responsive";

const styles = StyleSheet.create({ padding: unitsSnapshot(16) }); // module scope, no hook
```

It reads `Dimensions.get("window")` imperatively at call time rather than subscribing via `useWindowDimensions()`, so it's a **snapshot, not reactive** — verified directly: called at a 900px width it correctly returned `unitsSnapshot(16) = 26`, but after resizing to 375px _without reloading_, that same module-scope value stayed frozen at `26` (it's only ever recomputed if the surrounding code re-runs, which module-scope code doesn't). Use `useUnits()` inside a component whenever the value needs to track live resizes.

It's named `unitsSnapshot`, not `units`, on purpose, and `eslint.config.js` bans importing it from anywhere under `src/components/`, `src/screens/`, or `src/root/` — verified directly (a scratch file importing it there fails lint; the same import from `src/features/` passes). Inside a component "units" should only ever mean the reactive value from `useUnits()`; reaching for the snapshot there is a lint error now, not a silent stale-value bug.

**Defining a style sheet outside the component, reactively.** `createStyles()` turns a factory into a hook — the factory is a plain function you write next to (or below) the component, and calling the hook it returns gives you fully reactive styles inside the component:

```tsx
import { Text } from "react-native";
import { createStyles } from "@/features/responsive";

function Component() {
  const styles = useStyles();
  return <Text style={styles.text} />;
}

const useStyles = createStyles(
  ({ units, breakpoint, isRTL, spacing, radius, sizes }) => ({
    text: { fontSize: units(14) },
  }),
);
```

The factory receives the same reactive `units`/`breakpoint` as the hooks, plus `isRTL` (see `useIsRtl()` in the Localization section below) and `spacing`/`radius`/`sizes` (see the sizes styleguide just below), and returns a plain style object — `createStyles` runs it through `StyleSheet.create()` itself, so call sites return the object directly and don't need their own `"react-native"` import just for that. The result is memoized (only recomputed when one of these actually changes). `Button` and `Screen` both use this. Verified live: resizing 375px → 768px without reloading grew both `Screen`'s padding and `Button`'s size in the same frame, exactly as before this refactor.

`isRTL` here is deliberately the locale-derived flag, not `I18nManager.isRTL` — see the Localization section's RTL note for why `I18nManager.isRTL` can't be used for this at all (it's a snapshot that never updates without a reload). Because `useIsRtl()` flips the instant the locale does, a style built directly off it (e.g. `flexDirection: isRTL ? "row-reverse" : "row"`) can mirror manually without waiting on the reload that native RTL otherwise requires.

The factory also gets **`direction`** (`"ltr"` / `"rtl"`, the same flag as a style value), and a style's `direction` key works on every platform: react-native-web has no `direction` style, so `createStyles` passes it on as `writingDirection`, which is what becomes CSS `direction` there. A layer that positions its content by physical offsets — a switch thumb, a sliding indicator — pins itself with `direction: "ltr"` so neither Yoga nor the browser mirrors those offsets a second time.

- `createUnits(width)` / `getBreakpoint(width)` are the underlying pure functions (what the hooks call after reading `useWindowDimensions()`) — used directly in `units.test.ts`/`breakpoint.test.ts`, no component rendering needed.

**Sizes styleguide — `spacing`/`radius`/`sizes`** (`sizes.ts`, via `useSizes()`). Two different things that both answer "don't hardcode the same size in two places" — and both come out already scaled, no `units()` wrapping needed at the call site:

```tsx
import { createStyles } from "@/features/responsive";

const useStyles = createStyles(({ units, spacing, radius, sizes }) => ({
  row: { gap: spacing.x8, padding: spacing.x12 },
  card: { borderRadius: radius.surface },
  field: { minHeight: sizes.elementHeightMd },
}));
```

- **`spacing` is a generic scale**, keyed `x<value>` (`spacing.x8`, not `spacing.sm` or `spacing[8]`) — a numeric-value key says exactly what step you're getting without a name to look up first, and `spacing.x10` (not a step in the scale) is a `tsc` error instead of a silently-accepted typo; the `x` prefix exists only because a bare number can't be a dot-accessible property name. The underlying steps match the distinct values already in real use across the component set when this was written (same "derive from what's actually there" reasoning as `THEME_PREFERENCES` deriving from `Object.keys(colors)` rather than being hand-typed). Every `createStyles` call site in the app now reaches for one of these wherever its value matches a step, instead of a bare number — adopting them was a like-for-like swap with zero visual change (verified: full test suite and a live before/after screenshot both came back identical). Not only for `gap`/`padding`, either: `Accordion`'s chevron and the Showcase screen's header icon both pass `size={spacing.x20}` to `Icon`, reusing the same step `Screen`'s padding already uses, rather than a separate icon-size scale.
- **`radius` is by role, not by value — and every corner goes through it, even a zero one.** `radius.control` (buttons, fields, segmented controls, tags, checkboxes, switches), `radius.surface` (cards, modals, toasts, media, code blocks, avatars), `radius.indicator` (badges, dots, progress tracks, swatches) and `radius.full` (a true circle or capsule: radio buttons, the sheet grabber). The Graphite kit is square, so the first three are `0`; rounding the app later is an edit to `RAW_RADIUS` in `sizes.ts` and nothing else. A component that omitted `borderRadius` instead couldn't be rounded from there, which is why a zero corner still names its token.
- **`sizes` is purpose-specific, not generic — but named by _purpose_, not by whichever component happens to use it first.** Where `spacing.x16` means nothing beyond "16px", each entry means exactly one thing: `elementHeightSm`/`elementHeightMd`/`elementHeightLg` (32/44/56 — the compact, standard and prominent control heights, shared by `Input`'s minimum touch target and `Button`'s three fixed sizes; `elementHeightMd` is the 44pt minimum, named for the concept rather than for Input, which is why `Button` sizing itself to match is reusing a touch-target height rather than borrowing Input's own measurement), `elementWidthSm`/`elementWidthLg` (currently Accordion's fixed width and Modal's content `maxWidth` — two components that happened to need two different tiers of "how wide should a self-contained element be" first, not two unrelated measurements). `grabberWidth`/`grabberHeight` (Modal's drag handle) stay specifically named, though — they're genuinely that one element's own pill dimensions, not a reusable concept, and genericizing the name wouldn't make the measurement itself any more general.
- **None of the three raw tables is exported** — every consumer goes through the scaled `spacing`/`radius`/`sizes` from `useSizes()` or `createStyles`. Handing out a raw table would let a call site use an unscaled value by accident, silently skipping the device scaling every other size in the app gets. (`NAMED_SIZES` used to be exported with exactly that hazard, unused by anything, while the two tables beside it were deliberately kept private — the inconsistency is now closed.)
- **`createStyles` hands the whole styleguide to its factory**, which is how most call sites get it. A component needs `useSizes()` directly only for a size used outside a style object entirely — `Accordion` and the Showcase screen both do exactly that (the `Icon` `size` prop above).
- **What's deliberately excluded from both groups**: a measurement that doesn't represent a reusable step or a reusable named purpose — a hairline `borderWidth`, a `minWidth` tuned to one component's own buttons — stays a plain number owned by its component, still passed through `units()` at the call site same as always. Nothing was rounded or forced to fit either group just to reuse it; `sizes.ts`'s own doc comments say the same for each: pull a value in once it has a genuine second use or a clear standalone purpose, not before.

**Typography styleguide — `typography`** (`typography.ts`, via `useTypography()`). Apple's [Human Interface Guidelines type scale](https://developer.apple.com/design/human-interface-guidelines/typography) for iOS/iPadOS — the same 11 named text styles Apple's own apps use (at the default "Large" Dynamic Type size, before a user changes their text-size setting), reactive and already scaled through `units()` exactly like `spacing`/`radius`/`sizes`:

```tsx
import { createStyles } from "@/features/responsive";

const useStyles = createStyles(({ typography }) => ({
  title: typography.headline,
}));
```

- **Eleven tokens** — `largeTitle`, `title1`, `title2`, `title3`, `headline`, `body`, `callout`, `subheadline`, `footnote`, `caption1`, `caption2` — each a full `{ fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }`, not just a size. Point sizes and line heights are Apple's own published values for this exact scale, used as-is (same "real numbers, not invented" reasoning as `spacing`/`radius`'s steps), and so is the tracking below the titles — `headline` is Semibold (`600`) per HIG, so it reads as distinct from `body` despite sharing its 17pt size. The four title steps (`largeTitle`–`title3`) are the one deliberate departure: the Graphite kit sets them Semibold with tight negative tracking, the dense grid-set look the rest of the kit is built around.
- **`fontFamily` is set per style, not once for the whole scale** — every entry in `typography.ts`'s `RAW_TYPOGRAPHY` names its own `fontFamily` (all eleven currently point at the same `SYSTEM_FONT_FAMILY` constant, since San Francisco is what HIG itself specifies this scale in), so a future style that genuinely needs a different face — a monospace `caption2` for code, a distinct display face for `largeTitle` — is a one-line change to that entry, not a structural change to how typography works. `SYSTEM_FONT_FAMILY` itself resolves per platform: `"System"` on iOS (RN's special-cased value for San Francisco, so no font bundling needed), Android's own default system font (no San Francisco equivalent there), and the standard Apple-first web system-font stack (resolves to San Francisco on macOS/iOS Safari, a sane native fallback elsewhere).
- **`Text` (`src/components/text`) takes a `type` prop** — `<Text type="headline" value="..." />` — defaulting to `"body"`. It's the one component that reads the scale directly (via `useTypography()`) rather than through `createStyles`, because its variant is chosen by a _prop_ at render time and a static style factory can't express that. An earlier version worked around it by spreading all eleven tokens into the component's own `StyleSheet.create` (`...typography`), so every `<Text>` instance allocated twelve style objects to use exactly one; reading `typography[type]` costs one.
- **Take a whole token, not just its `fontSize`.** Overriding only the size on top of another token leaves the rest of that token behind — which was a real bug in `Input`: its label and helper text set `fontSize` over a `<Text>` that had already received `body`, so an 11px label rendered inside `body`'s 19px line box (and a 10px helper inside the same), 73–90% leading overhead, measurably loose. They're now `<Text type="footnote">` and `<Text type="caption1">`, whose point sizes happened to match exactly what the overrides were reaching for; the field's own `RNTextInput` host takes `typography.callout` as a style, since it isn't our `Text` and has no `type` prop. Measured after the fix: label `11px/16px`, helper `10px/14px`.
- **Line heights scale with the OS text-size setting.** `createTypography` multiplies `lineHeight` by `fontScale` and deliberately leaves `fontSize` alone — see the Accessibility section above for why that split is the correct one. `Text` undoes the `lineHeight` half when a caller passes `allowFontScaling={false}`, since opting out of RN's automatic `fontSize` scaling would otherwise leave the glyphs fixed while their line box kept growing.
- **The type scale carries heading semantics, not just sizes — and `type` is the only input.** `Text` derives `accessibilityRole="header"` (and a real `<h1>`–`<h4>` on web) straight from `type`: `largeTitle` → level 1, `title1`/`title2`/`title3` → 2/3/4. There's deliberately no separate `heading` prop: the type scale already _is_ the hierarchy, so picking `title2` because something is a sub-section and then separately declaring it a heading states the same fact twice, with the option of contradicting yourself. `headline` is excluded from the mapping — HIG uses it for list-row titles at body size, which are emphasis rather than document structure, and marking those as headings fills a screen reader's heading rotor with entries that aren't navigation landmarks.
  - The tradeoff is that a title size can't currently be used as pure decoration (a large stat, say) without also entering the outline. No call site needs that yet; if one turns up, an explicit opt-out is the change to make — the same "pull it in when there's a real second case" rule the styleguides follow.
  - Before this the app had **zero** heading semantics anywhere — verified in the DOM: no `role="heading"`, no `<h*>` tags, no `aria-level` — so a screen-reader user had no way to navigate a screen by structure at all. The Showcase screen's title now renders as a genuine `<h1 aria-level="1">`.
- **`createStyles` supports `typography` the same way it supports `spacing`/`radius`/`sizes`** — it arrives already scaled, no `units()` wrapping needed at the call site.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
