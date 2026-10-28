[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › Foundations

# Localization

> Locales, translations, RTL and number formatting.

<sub>`src/features/localization` · Tests: [`composition.test.ts`](composition.test.ts), [`locale-provider.test.tsx`](locale-provider.test.tsx), [`number.test.ts`](number.test.ts), [`translations.test.ts`](translations.test.ts)</sub>

```tsx
import { useLocale } from "@/features/localization";

const { locale, isRTL, preference, setPreference, t } = useLocale();

t("common.close"); // "Close" / "Cerrar" / "关闭" / ... depending on locale
t("showcase.summary", { name: "Ada", age: 30, email: "a@b.c" }); // {{token}} interpolation
```

Ten locales ship out of the box — `en` (English), `uk` (Ukrainian), `es` (Spanish), `fr` (French), `pt` (Portuguese), `de` (German), `it` (Italian), `zh` (Chinese), `ja` (Japanese), `ar` (Arabic, the only RTL one) — plus a `"system"` preference (default) that follows the device's own language list via [`expo-localization`](https://docs.expo.dev/versions/v57.0.0/sdk/localization/), falling back to `en` if none of its languages are supported. Same shape as `ThemeProvider`/`useTheme()` end to end: `LocalePreference = LocaleCode | "system"`, persisted via `LocalValue` (`"locale-preference"`), `LocaleProvider` added to `Providers` alongside `ThemeProvider`. A manual choice outranks the OS from then on — see the OS-tracking bullet below.

```
src/features/localization/
  translations/          One flat JSON file per locale (en/uk/es/zh/ja/ar.json)
  translations.ts         Validates every locale against en.json + the `t()` lookup/interpolation
  types.ts                 LocaleCode/LocalePreference/Locale types, the LOCALES metadata table
  rtl.ts                    syncRTL() — the one platform-specific piece, see below
  os-locale.ts               useOsLocale() — tracks + persists the device language
  locale-provider.tsx         LocaleProvider — resolves locale, persists preference, calls syncRTL()
  hooks.ts                     useLocale()/useIsRtl() — both read from context.ts
  context.ts, index.ts
```

- **`en.json` is the source of truth for which keys must exist** — every other locale file is validated against its flattened key set on module load (missing _or_ extra keys throw a clear error naming them), the same fail-fast idea as `theme/colors.ts`'s palette validation. `TranslationKey` is a template-literal type derived from `en.json`'s actual shape (`Flatten<typeof en>`, producing dotted paths like `"input.email.error"`), the same "derive the type from the real data instead of hand-typing it" approach `Icon` uses for glyph names — passing a key that doesn't exist in `en.json` is a `tsc` error, not a runtime "Missing translation" surprise (though `translate()` also throws that at runtime, for the one case type-checking can't catch: a key that exists in `en.json` but was typo'd in a non-`en` locale file, which the cross-validation above already catches at import time instead).
- **`{{token}}` interpolation** is a single `String.prototype.replace` in `translate()` — deliberately not a full ICU/plural-rules engine, since nothing in this app's copy needs pluralization yet; `t("showcase.summary", { name, age, email })` is the one interpolated string used by the Showcase.
- **`LOCALES`** (`types.ts`) is the hand-authored display-name table — `code`, `englishName`, `nativeName` (what `LocaleSwitcher` actually renders — a language's own name for itself, not translated through `t()`), and `rtl`. Cross-checked on load against `Object.keys(translations)` so a locale can't have one without the other (a JSON file with no `LOCALES` entry, or vice versa) without an immediate, clear error.
- **Adding a locale is four edits and no more**, each of which fails loudly if you miss it: a JSON file under `translations/` (validated key-for-key against `en.json` on load, so a missing or extra string throws at startup rather than rendering a raw key), the code in `LocaleCode`, an entry in `LOCALES`, and — because the date field renders through moment rather than `Intl` — a side-effect import plus a `MOMENT_LOCALE` entry in `components/input/datetime/format.ts`. That last map is typed `Record<LocaleCode, string>`, so `tsc` catches a locale that was added everywhere else and would have silently formatted its dates in English.
- **`LocaleSwitcher`** (`src/components/locale-switcher`, wired into the Showcase's Localization section) renders one button per `LOCALE_PREFERENCES` entry (every locale's `nativeName`, plus `t("locale.system")`), the selected/`onPress` pattern `ThemeSwitcher` used before it moved to `SegmentedControl` (a locale list can outgrow a single row).

**RTL** is the one place native and web genuinely can't share a code path, and `rtl.ts`'s `syncRTL()` is deliberately small so that split is easy to see:

- **Web**: sets `document.documentElement.dir` directly. CSS flexbox mirrors `flexDirection: "row"` off the element's own computed `direction` natively — no `I18nManager` involvement needed at all — so this alone re-mirrors every row layout (headers, button rows, `Input`'s `leftSlot`/`rightSlot`) live, with no reload. Verified live: switching to Arabic instantly mirrors the Showcase screen — title, every accordion header/chevron, every button row, and `Input`'s icon slots all flip from the left to the right side, text right-aligns, all without a reload.
- **Native**: `I18nManager.forceRTL()` changes how Yoga mirrors layout app-wide, but only takes effect after a fresh bundle load — so `syncRTL` calls `DevSettings.reload()` after forcing it, guarded to only do so when `I18nManager.isRTL` doesn't already match (`DevSettings.reload()` works in a dev client, which is what this project's `yarn ios`/`yarn android` build; a store-shipped production build would need `expo-updates`' `Updates.reloadAsync()` for the same effect instead — out of scope for this starter app, same "deferred" reasoning as the Modal/`react-native-gesture-handler` Jest-utils note below).
- **These two branches can't be merged into one guard.** `I18nManager.isRTL` reads as `undefined` on web — RN core's `I18nManager.js` snapshots `NativeI18nManager.getConstants()` once at module load, and no such native module is registered on web — so `undefined === false` is `false` on every single render, and reusing the native guard on web calls `syncRTL` → mismatch → (if it also reloaded on web) reload → same mismatch again, forever. This was a real bug caught while verifying this feature live: the first implementation used one shared reload-based guard for both platforms, and the dev server's terminal log showed a tight loop of full bundle rebuilds (`Web Bundled .../entry.js`, repeating every ~150ms) instead of the app ever settling — the fix was recognizing that web doesn't need (or support) the reload-based approach at all, not tuning the guard condition.
- `expo-localization` is a native module — installed via `npx expo install` (keeps it Expo-SDK-compatible) and pinned exact like every other dependency, registered in `app.config.ts`'s `plugins`. Like the vector-icon font families, adding it requires an `expo run:ios`/`expo run:android` rebuild of the dev client before it works on device/simulator — a `yarn ios`/`yarn android` (or Metro reload alone) against an _already-built_ older dev client throws `Cannot find native module 'ExpoLocalization'` instead, same class of caveat as this README's Xcode-version note above.
- **The OS language seeds the app; a manual choice outranks it.** `os-locale.ts`'s `useOsLocale()` tracks the device language _live_ — through `expo-localization`'s `useLocales()` hook, which re-renders on an OS language change, not the one-shot `getLocales()` that shipped first — narrows it to a locale this app actually ships (walking the device's full ordered preference list, so an unsupported first language still yields a supported second before falling back to `en`), and persists it under `"os-locale"`. Resolution order in `LocaleProvider` is then: the user's stored preference if they picked one, otherwise the OS locale. So a first launch comes up in the device language, and the moment someone chooses a language in `LocaleSwitcher` that choice sticks — a later OS language change will not override it. Picking "System" again hands control back to the OS. Covered end-to-end in `locale-provider.test.tsx`, including the relaunch case (a fresh mount with a changed OS language still honours the stored manual choice).
  - The persisted copy deliberately isn't what `useOsLocale()` returns — the live value is always at least as correct, and returning it directly avoids a first-render gap on a genuinely first launch when nothing is stored yet. What storage buys is a record that outlives the process, readable synchronously before React mounts via `getStoredOsLocale()`.
- **`useIsRtl()`** exposes `Locale.isRTL` on its own — a thin wrapper around `useLocale()` for callers that only need the RTL flag, not the rest (`t`, `preference`, `setPreference`, ...). It's what `createStyles` (see Responsive units below) builds its own `isRTL` on, specifically because it's derived straight from `LOCALES`' `rtl` table rather than from `I18nManager.isRTL` — it changes the instant the locale does, on every platform, with no reload to wait on. That makes it useful for more than just reacting to native's reload: styles that manually mirror off `isRTL` (`flexDirection: isRTL ? "row-reverse" : "row"`, swapped `marginLeft`/`marginRight`, ...) work correctly even in environments where automatic mirroring doesn't apply at all, like Yoga on native inside the split-second before `syncRTL`'s reload lands, or a future non-flexbox layout that wouldn't auto-mirror from `dir`/`I18nManager` either way.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
