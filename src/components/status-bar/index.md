[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# StatusBar

> The clock-and-battery bar's colour and visibility, following the app theme by default.

<sub>`src/components/status-bar` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import StatusBar from "@/components/status-bar";

<StatusBar />                 // follows the app theme — already mounted at the root
<StatusBar style="light" />   // white text over a dark image, whatever the theme
<StatusBar style="inverted" />
<StatusBar hidden />          // a full-screen viewer
```

- **One is already mounted** in `src/root/providers.tsx`, following the theme. A screen adds its own only to differ — a full-bleed photo, a dark hero on a light app. The last one mounted wins and unmounting restores the previous one (`expo-status-bar` underneath).
- **`auto` means the app's theme, not the OS appearance.** Without this, iOS picks the text colour from the system setting, so choosing Dark in the app on a phone set to Light drew dark text on a dark background. `light` / `dark` name the **text** colour; `inverted` is the opposite of `auto`.
- **Focus-aware inside a navigator.** Tab screens stay mounted behind the active one, so a screen's override applies only while it's focused. Outside a navigator (stories, tests, the root) it always applies.
- **Renders nothing on web**, which has no status bar. Android is edge-to-edge, so there is no background colour to set — draw what's behind the bar instead.
- Try it in the Showcase's Theme section: the "Status bar" control switches the style for that screen.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
