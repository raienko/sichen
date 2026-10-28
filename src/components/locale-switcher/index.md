[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# LocaleSwitcher

> The app's language, as one select field.

<sub>`src/components/locale-switcher` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import LocaleSwitcher from "@/components/locale-switcher";

<LocaleSwitcher />;
```

- **No props.** It reads and writes `useLocale().preference`, which `LocaleProvider` persists.
- **One field, not a row of buttons.** The list is already too long for a segmented control and grows with every translation, so the choice opens in a bottom-sheet `Modal` through `<Input type="select">`.
- **Each language is listed in its own name** ("Deutsch", "日本語"), so someone who can't read the current locale can still find theirs. Only "System" is translated, because it names a behaviour rather than a language.
- New locales appear automatically once they're added to `LOCALES` in `@/features/localization`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
