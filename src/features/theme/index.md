[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › Foundations

# Theme & colour

> The Graphite palette, semantic colour tokens, light/dark switching and the contrast rules the palette is tested against.

<sub>`src/features/theme` · Tests: [`colors.test.ts`](colors.test.ts), [`theme-provider.test.tsx`](theme-provider.test.tsx)</sub>

```tsx
import { useTheme } from "@/features/theme";

const theme = useTheme(); // { scheme, colors, preference, setPreference }
```

- `scheme` — the resolved `"light" | "dark"` actually in effect.
- `preference` — what the user picked: `"light" | "dark" | "system"` (default `"system"`), persisted via `LocalValue` so it survives restarts. `setPreference` updates it.
- When `preference` is `"system"`, `scheme` tracks the OS setting live via React Native's `useColorScheme()` — no reload needed, verified by flipping the emulated OS scheme at runtime.
- `colors` — the current semantic palette (`ThemeColors`: content/surface, selection, border/divider/disabled, status, overlay/focus, and primary/accent tokens), sourced from `palette.json`, which `yarn brand` generates from [`palette.base.json`](palette.base.json) plus the brand's derived primary/accent family (see [Brand](../../../assets/brand/README.md)) — edit those, not the generated file — `colors.ts` validates both `light` and `dark` have every required key and throws a clear error naming the missing one otherwise. (It's `palette.json`, not `colors.json` — Metro and Vite disagree on `.ts` vs `.json` priority for a bare `./colors` specifier, so a same-basename pair resolves to the wrong file depending on which bundler is running; keep the JSON's basename different from `colors.ts`.)

- **The palette is the Graphite kit** — the softened variant of the "Grid" direction: tinted charcoal and warm off-white instead of pure black and white, one blue hue, square corners, hairline rules. Picked from the [UI kit directions canvas](https://claude.ai/artifact/DDBHSjjLv3fGhfEH81GjhT).
- **`primary`/`onPrimary` are a fill pair; `accent` is the same hue as a foreground.** `primary` is the high-emphasis _fill_ (`Button`'s `primary`, a checked box, an on switch) and `onPrimary` the only color guaranteed legible on it. `accent` is that hue as text or an indicator on the app's own surfaces — a `tertiary` label, a link, the bar under a selected segment. They are separate because one value can't do both in the dark scheme: a fill dark enough to carry white text reads under 4.5:1 as text on a dark page, and a label light enough to read turns into a glaring block as a fill. A rebrand moves all three together.
- **Selection is a tint, never an inverted block.** `selected` is the accent-tinted fill behind whatever is currently chosen (a segment, an option row, a tag), always paired with an `accent` edge or label so the choice isn't carried by the tint alone. `divider` is the quiet hairline between rows and sections — deliberately under `border`, which stays the 3:1 control boundary.
- **Every pressable answers a press.** `pressed` is a translucent overlay laid over whatever an unfilled control shows (a secondary/tertiary/icon button, an option row, an accordion header), so one value shades every surface by the same step; `primaryPressed` is the solid shade a `primary` fill switches to, chosen so `onPrimary` stays above 4.5:1 while held (the contrast test checks it).
- **[`colors.test.ts`](colors.test.ts) enforces WCAG contrast on the palette itself**, so a palette edit can't quietly ship an unreadable combination: every foreground (`text`, `accent`, `error`) clears 4.5:1 against both surfaces the app paints text on (`text` and `accent` against the `selected` tint too), a `primary` fill clears 3:1 against them, `onPrimary` clears it against a `primary` fill, and `textSecondary` clears the 3:1 that WCAG 1.4.11 asks of a control outline against all three fills. It reimplements the luminance math rather than importing it — the point is to check the palette independently. Two real failures were found this way and fixed rather than waived: the accent was 4.17:1 as a label on `backgroundElement` (the Accordion/Modal surface `tertiary` buttons actually sit on), and `error` was 3.90:1 on the same surface. `backgroundElementSelected` is deliberately excluded from the _text_ checks — it's a pressed/selected fill, and the only type that uses it labels itself in `text`; holding every foreground to 4.5:1 against it as well would force the accent several steps paler than any surface in the app needs.

`ThemeProvider` and a `ThemeSwitcher` component (`src/components/theme-switcher`, wired into the Showcase screen) are both included; `Text`, `Screen`, and `Icon` (default `color`) already consume `theme.colors`.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
