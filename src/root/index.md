[Docs](../../docs/index.md) › [Architecture](../../docs/architecture.md)

# Root & Providers

> `Root` wraps the router with every provider the app needs; `Providers` is the same tree, shared with tests and Storybook.

<sub>`src/root` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```
src/root/
  index.tsx       Root — mounted once in src/app/_layout.tsx: <Root><Stack /></Root>
  providers.tsx    Providers — every context provider (safe area, accessibility, theme, locale, ...)
  testing.tsx       render()/screen/etc. wrapping Providers, for tests
```

`Root` wraps `Providers` and is the single place for:

- context providers every screen needs — add a new one to `providers.tsx` only, alongside the two app-lifetime services that live there (`Permissions`, `DeepLinks`)
- deciding when the app is ready to show: the splash screen is held as soon as this file loads, and `SplashScreenGate` hides it once everything the first screen needs is in place — see [Splash screen](../features/splash-screen/index.md)
- global overlay UI rendered above the current screen (toasts, modals, ...)
- global listeners/services that should run for the app's lifetime (analytics init, push notification listeners, app-state listeners, ...) — wire these up here via `useEffect` once there's a concrete one to add

**Providers are centralized on purpose.** Both Storybook preview configs (`.storybook/preview.tsx`, `.rnstorybook/preview.tsx`) decorate every story with `<Providers>` — imported from `@/root/providers`, so loading a story never holds the splash screen the way loading `Root` does — and every component test imports `render`/`screen`/etc. from `@/root/testing` instead of `@testing-library/react-native` directly:

```tsx
import { render, screen } from "@/root/testing";
```

That `render` is a drop-in replacement that already wraps the tree in `Providers`. Adding a new provider in `providers.tsx` — a state provider, an auth provider, whatever comes next — makes it available to the real app, every Storybook story, and every test's `render()` in one edit; no per-file changes needed. (`src/root/index.test.tsx` is the one exception — it tests `Root` itself, so it renders unwrapped, via `@testing-library/react-native` directly.)

`Root` and `Providers` also accept an optional `config` object. Core defaults remain intact; an app can layer in its palette tokens and its own namespaced strings without editing `core`:

```tsx
<Root
  config={{
    theme: { overrides: { light: { primary: "#2a6dff" } } },
    locale: {
      translations: {
        en: { app: { home: { title: "Home" } } },
        uk: { app: { home: { title: "Головна" } } },
      },
    },
  }}
>
  <Stack />
</Root>
```

Theme overrides are partial and fall back to the core palette. Locale catalogs are deep-merged per shipped locale; app-owned keys must be nested under `app.*`, while core strings can be intentionally overridden when necessary.

It's not a route or a reusable UI component — it's app composition root, kept separate from `components/` for that reason.

---

[Architecture](../../docs/architecture.md) · [Docs index](../../docs/index.md)
