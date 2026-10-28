[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Icon

> Five vector-icon families plus the app's own SVG set, themed by default.

<sub>`src/components/icon` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Icon from "@/components/icon";

<Icon type="Feather" name="home" color="red" size={units(24)} />;
<Icon type="custom" name="logo" size={units(24)} />;
<Icon name="home" />; // type omitted -> the default family (Feather)
```

Wraps five [`@react-native-vector-icons`](https://www.npmjs.com/org/react-native-vector-icons) families — `Feather`, `MaterialIcons`, `Ionicons`, `FontAwesome6`, `AntDesign` — plus a `"custom"` type for SVG icons defined in `custom-icons.tsx` (built with `react-native-svg`, no asset-file transform needed).

- **`name` autocompletes to the real glyph names for whichever `type` you pick**, and a name that doesn't exist for that type is a type error — not from a hand-written list, but from each package's own generated `<Family>IconName` union (`keyof typeof glyphMap`), which is also how it stays correct if a package updates its glyph set. Verified directly: `tsc` accepts `<Icon type="Feather" name="home" />` and rejects (with `@ts-expect-error`) a MaterialIcons-only name passed with `type="MaterialIcons"`, a Feather name passed to `type="custom"`, and vice versa — four independent, genuine type errors, not just "it compiles."
- **Default type is one constant**: `DEFAULT_ICON_TYPE` in `index.tsx`. Change it there and `<Icon name="..." />` (type omitted) switches which family's names it expects — no other file changes.
- **`color` defaults to `theme.colors.text`** — pass it explicitly to override, same as `size`. This is what makes an icon with no `color` prop legible in both themes automatically instead of defaulting to the underlying library's black. Verified both ways live in-browser: the Showcase screen's header icon (no `color`) renders white in dark mode and black in light mode, tracking `theme.colors.text` with no reload; a `color="red"` override stays red in both.
- Every family needs its font registered on iOS — each `@react-native-vector-icons/*` package ships its own Expo config plugin (adds the font to `Info.plist`), listed in `app.config.ts`'s `plugins`.
- Verified rendering on web: all 5 vector families with distinct glyphs, the custom SVG icon, and the omitted-`type` default all confirmed visually in-browser. Before the theme-default-color above, several of these icon families defaulted to **black** — invisible against this app's dark-mode `Screen` background unless you passed an explicit `color`; the theme default now makes that the non-issue it should be.
- Adding a new vector family or a new custom icon is one line each in `icon-sets.ts` / `custom-icons.tsx` — nothing else needs to change.
- **FontAwesome6 is the one family that needs a style picked for it.** It ships three separate fonts (regular / solid / brand), each with its own glyphs, chosen by an `iconStyle` prop that defaults to `regular` — much the smallest of the three in the free tier. Its exported `FontAwesome6IconName` is the union of _all three_, so a solid-only name like `"rocket"` type-checked and then rendered as a missing-glyph box: the type promised more than the default font could draw. `IconNameByType` now narrows to `FontAwesome6SolidIconName` and `index.tsx` passes the matching `iconStyle="solid"`, so names and glyphs agree again. Found by building the showcase — the Icons section rendered a `?` where the rocket should have been. Regular/brand aren't exposed yet; add them the day something needs one.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
