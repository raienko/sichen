[Docs](index.md)

# Architecture

> How the repository is laid out, the one-folder-per-unit rule, custom vs `@expo/ui` implementations, and where each kind of documentation lives.

This is an **application boilerplate**: fork or copy it for one product. Components and features are app-owned, and their folder entry points are internal import surfaces, not a published package API. [ADR 0005](adr/0005-application-boilerplate.md) records ownership, dependency direction, routes and versioning.

---

## Project structure

```
app.config.ts          Expo config — identity from the env files (src/constants/env), colours from assets/brand
metro.config.js         Wraps Metro with Storybook's entry-swap (see Storybook below)
src/
  app/                   Routing only (Expo Router) — each route file re-exports a screen
  root/                   Root — wraps the router; see below
  screens/<name>/        One folder per screen, index.tsx is the screen component
  screens/showcase/sections/ One file per showcase section — see "The app" below
  components/<name>/     One folder per component: index.tsx, index.stories.tsx, index.test.tsx
  features/storage/       LocalValue<T> for preferences; SecureValue<T> for small secrets
  features/deep-links/    One pipeline for every incoming link — see below
  constants/env/          Validated EXPO_PUBLIC_* env vars, used by both app code and app.config.ts
assets/
  brand/                  App icon, adaptive icon, splash, favicon — everything that carries the app's identity
  images/                 What a screen draws, reached through `@/assets/images/...`
```

**The colours the OS paints for us live in `assets/brand/brand.json`.** `colors.iconBackground` (the plate an Android adaptive icon's foreground sits on), `colors.splashBackground` (behind the launch image) and optional `colors.splashBackgroundDark` are baked into the native projects at prebuild — the app is not running when they are on screen, so `theme/palette.json` is the wrong home for them and nothing in the app ever draws them. Like the rest of how the app looks, they come from `assets/brand/brand.json` — see [Brand](../assets/brand/README.md); who the app is (name, ids, scheme, link domains) comes from the env files instead. They are validated as 3- or 6-digit hex on load: eight-digit is refused outright, because `#RRGGBBAA` on the web and `#AARRGGBB` on Android would make the same string two different colours. A malformed one otherwise fails much later, in Gradle or Xcode, complaining about something else.

**`assets/brand` and `assets/images` are split by who reads them, not by file type.** Everything under `brand/` is read by Expo at config time and baked into the native projects; nothing there is imported by the app at runtime. Everything under `images/` goes through Metro and is `require()`d by a component. The practical payoff is that a rebrand is replacing `assets/brand` — a `brand.json` and a logo — and running `yarn brand`, which generates every icon and the splash into the gitignored `assets/brand/generated/` without ever touching a file a screen draws. `app.config.ts` reaches them through a `brandAsset()` helper, so the directory name appears once — and a typo in a path Expo only reads at prebuild time otherwise surfaces as a missing icon on a build machine.

Every screen/component/feature-value lives in its own folder with a single `index` entry point; all imports go through that folder path (e.g. `@/components/text`), not into its internals.

`src/app` composes `src/root` and `src/screens`; the root and screens consume shared `src/components` and `src/features`. Shared modules never import routes, screens or the app root. ESLint enforces the boundary on the file each import resolves to, so `@/screens/x` and `../../screens/x` are caught alike. `src/components/manifest.json` marks which components screens may use, and its test checks the public component contract. Product-specific UI stays in its screen or feature until it has a shared contract.

Components ship with a co-located Storybook story and a Jest smoke test that follows the same pattern:

```ts
import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  /* ... */
});
```

**Inside a unit, a file gets its own folder only when it has more than a file and its test.** A private helper and its test stay flat beside each other (`chat/rows.ts`, `chat/rows.test.ts`): two files don't need a folder, and a flat name reads better in tabs, stack traces and file search than another `index.ts`. A folder with an `index` entry point is for:

- a module with platform variants (`storage/persistence/index.ts` + `index.web.ts`, `radio-button/expo/index.ios.tsx`);
- a module with more than a source and one test — a story, a second test (`button/icon-button`, `deep-links/registry`);
- each top-level group in `src/utils` (`utils/time`, `utils/hooks`), which `@/utils` re-exports.

Imports don't change either way: `./persistence` resolves to `persistence.ts` or `persistence/index.ts`, so a helper can move into a folder when it grows a variant without touching anything that imports it.

### Component implementation types

Custom design-system components are always the default. When a component
also offers an `@expo/ui` implementation, it uses the shared
`ComponentTypeProps` from `src/components/types.ts`:

```tsx
<Checkbox value={accepted} onChange={setAccepted} />
<Checkbox type="expo" value={accepted} onChange={setAccepted} />
```

`type` accepts `"custom" | "expo"` and defaults to `"custom"`. Both paths
must expose the same public behavior — including the app-wide `value` /
`onChange` naming — so changing the implementation does not leak Expo UI's
internal API into application code.

---

## Where documentation lives

| What                                                          | Where                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| The project at a glance                                       | [`README.md`](../README.md) at the repository root          |
| Anything that spans folders — setup, architecture, catalogues | `docs/`                                                     |
| One component, feature, screen or the app root                | `index.md` in that folder, beside its code, story and tests |

Every folder guide starts with a breadcrumb back to its catalogue, so either end of a link leads to the other.

---

[Docs index](index.md) · [Components](components/index.md) · [Features](features/index.md) · [`Root` & `Providers`](../src/root/index.md)
