[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Spacer

> An explicit gap from the spacing scale, or room kept clear of the keyboard, tab bar or safe area.

<sub>`src/components/spacer` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Spacer, { points } from "@/components/spacer";

<Spacer />                                    // 16pt vertical (the default)
<Spacer size="x8" />                           // a step of the spacing scale, by name
<Spacer direction="horizontal" size="x24" />
<Spacer direction="both" size={10} />          // off-scale px, still unit-scaled

<Spacer size="keyboard" />                     // grows with the keyboard
<Spacer size={["tab-bar", "keyboard"]} />      // a list takes the tallest
<Spacer size={[points(insets.bottom + 50), "keyboard"]} />
```

An explicit gap between two elements — the version of a margin you can see in the tree, for the places a parent's `gap` can't express: an uneven step inside an otherwise evenly-spaced stack, or a gap between two siblings that neither of them owns.

- **`direction`** (`"vertical" | "horizontal" | "both"`, default `"vertical"`) picks which axes the gap occupies. The unused axis is left **unset rather than zeroed**, so a vertical spacer dropped into a row container takes no width of its own instead of forcing a 0-sized box into the layout. A gap only separates anything along its parent's own main axis, which is what the showcase section makes visible by switching the stage between a row and a column.
- **`size`** takes a spacing-scale step _by name_ (`"x8"`, `"x16"`, …, exported as `SpacingToken` from `@/features/responsive`) so a step that isn't in the scale is a `tsc` error rather than a silent typo — the same guarantee a `spacing.x8` lookup already has. A raw px number is accepted for a gap the scale genuinely doesn't have, and goes through `units()` like every other size in the app. Defaults to `"x16"`.
- **`size` can also name room something else takes up**, measured live:

  | Keyword                                  | Height                                                         | `direction`  |
  | ---------------------------------------- | -------------------------------------------------------------- | ------------ |
  | `"keyboard"`                             | The open keyboard, frame by frame; 0 while closed              | `vertical`   |
  | `"tab-bar"`                              | The (sticky) tab bar drawn over the screen                     | `vertical`   |
  | `"safe-area-top"` / `"safe-area-bottom"` | The notch / home-indicator inset                               | `vertical`   |
  | `"safe-area-start"` / `"safe-area-end"`  | The side insets in reading order — `start` is the right in RTL | `horizontal` |

  A keyword on the wrong axis is a `tsc` error, and `direction="both"` takes fixed sizes only.

- **A list takes the tallest.** `["tab-bar", "keyboard"]` is the tab bar's height while the keyboard is closed, and grows with the keyboard when it opens over the bar. Things at the bottom edge overlap the same strip of screen, so the tallest is the room needed. Two sibling spacers still add up, so both ways of combining stay explicit.
- **Where `"keyboard"` and `"tab-bar"` are measured from.** By default, from above the bottom safe area, which `Screen` already pads, so they don't count the home indicator twice. List `"safe-area-bottom"` as well and they're measured from the screen's bottom edge, for a spacer that sits there itself: `["safe-area-bottom", "keyboard"]` is a form footer's padding that grows with the keyboard.
- **Numbers are Figma px; `points()` marks one that isn't.** A plain number goes through `units()` like every size in the kit. A value already in screen points — an inset, a measured height — is wrapped so it isn't scaled twice: `points(insets.bottom + 50)`.
- **Only `"keyboard"` costs anything.** A size that includes it renders a Reanimated view whose height is set on the UI thread, in step with the keyboard's own animation. Every other spacer is a plain `View` with a fixed height. On web the keyboard part stays 0: the browser resizes the viewport itself.
- **The tab bar's `variant`** isn't a parameter yet: `"tab-bar"` measures the default sticky bar. For a floating one: `size={points(useTabBarSpace({ variant: "floating", avoidChin: false }))}` ([`useTabBarSpace`](../tab-bar/index.md)).
- **Prefer the parent's `gap` when the spacing is uniform** — it says "these are evenly spaced" once instead of once per gap. The two compose rather than replace each other: a `Spacer` inside a `gap`'d container adds the container's gap on _both_ sides of it.
- **It is deliberately invisible to assistive technology.** A spacer carries nothing a screen-reader user could act on, so it spreads `disabledA11yProps()` (above) and is hidden on every platform at once. Two things make that structural rather than a convention: the props are spread **after** the caller's, so an override can't undo the one guarantee the component makes, and every prop that would give it something to say (`accessible`, `accessibilityLabel`, `role`, the hide flags themselves, …) is `Omit`ted from its props type, so passing one is a `tsc` error rather than something you'd find later with VoiceOver. Its test suite asserts this from both sides: with `includeHiddenElements` a query finds the node, and _without_ it — which is what a screen reader effectively does — the same query returns nothing.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
