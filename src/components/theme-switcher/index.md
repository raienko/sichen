[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# ThemeSwitcher

> Light, dark or system appearance, as a segmented control.

<sub>`src/components/theme-switcher` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ThemeSwitcher from "@/components/theme-switcher";

<ThemeSwitcher />;
```

- **No props.** It reads and writes `useTheme().preference`, which `ThemeProvider` persists, so the choice survives a restart.
- A [`SegmentedControl`](../segmented-control/index.md) with one option per entry of `THEME_PREFERENCES`, labelled from the `theme.*` translation keys and named by `theme.label` ("Appearance") for screen readers — so it announces as a radio group, and pressing the current option writes nothing.
- Adding a preference is an entry in `THEME_PREFERENCES` plus its translation key.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
