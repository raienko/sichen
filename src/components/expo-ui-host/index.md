[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Internal

# ExpoUIHost

> Internal: the theme boundary around every Expo UI control.

<sub>`src/components/expo-ui-host` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ExpoUIHost from "@/components/expo-ui-host";

<ExpoUIHost matchContents ignoreSafeArea="all">
  <ExpoCheckbox value={value} onValueChange={() => {}} />
</ExpoUIHost>;
```

**Internal.** It is listed as `internal` in [`src/components/manifest.json`](../manifest.json) and used by the `type="expo"` variants of Checkbox, Switch, RadioButton and Slider.

- **Every `@expo/ui` control has to be inside one.** ESLint rejects importing `Host` from `@expo/ui` anywhere else, so no adapter can forget part of the environment.
- **Supplies the app environment**: `colorScheme` from the theme, `seedColor` from `primary`, and `layoutDirection` from the active locale. Callers can't override these three (they're omitted from its props). Everything else, including layout, is passed through to `Host`.
- Adapters wrap the host in a sized, `pointerEvents="none"` slot hidden from assistive technology. The app-owned row handles the press and the semantics, so native and custom variants behave the same.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
