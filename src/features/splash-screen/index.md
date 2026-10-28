[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Splash screen

> The native splash screen stays up until the app says it's ready — and for at least 2.5 s — then fades out.

<sub>`src/features/splash-screen` · Tests: [`index.test.ts`](index.test.ts), [`root`](../../root/index.test.tsx)</sub>

```tsx
// src/root/index.tsx — module scope, once:
keepSplashScreen();

// src/root/index.tsx — SplashScreenGate decides when the app is ready:
const isRestoring = useIsRestoring();
useHideSplashScreen(!isRestoring);

// Anywhere, imperatively (still waits out the 2.5 s minimum):
hideSplashScreen();
```

A thin layer over `expo-splash-screen`.

- **Held from the very start.** `keepSplashScreen()` calls `preventAutoHideAsync()` at module scope of `src/root/index.tsx`, which loads with the entry layout. Called from a component instead, it can run after the splash is already gone. Only the real app loads that file: Storybook and Jest import `src/root/providers.tsx` directly, so they are never held.
- **One place decides "ready".** `SplashScreenGate` in [`src/root/index.tsx`](../../root/index.tsx) waits for everything the first screen needs and passes the result to `useHideSplashScreen(ready)`. Today that is the persisted query cache being restored. A new startup step, such as fonts or a restored session, is one more condition there.
- **Up for at least 2.5 s, then fades.** A fast startup still shows the splash for `SPLASH_SCREEN_MIN_MS`, counted from launch, so it never flickers past; a slow one hides as soon as it's ready. It fades out over `SPLASH_SCREEN_FADE_MS` (400 ms) on both platforms; Android fades by default, iOS is asked to (not in Expo Go, which can't set it).
- **Hidden after the ready frame is drawn.** The hook hides in an effect, after the commit that rendered the ready tree, so there is no blank flash between the splash and the first screen.
- **Never stuck.** If the app isn't ready after `SPLASH_SCREEN_TIMEOUT_MS` (10 s), the splash hides anyway and a warning is logged. A slow screen beats a frozen logo.
- **Idempotent.** `hideSplashScreen()` can be called any number of times from anywhere; only the first call does anything.
- **Native only.** Web has no native splash screen, so every call is a no-op there. Expo Go and development builds don't show the real Android splash; check it on a release build.

The splash's look (image, colours, dark variant) is set at build time from [`assets/brand/brand.json`](../../../assets/brand/README.md), not here.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
