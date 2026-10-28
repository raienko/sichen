[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Dev menu

> An in-app developer menu: what the app knows about itself, and shortcuts that would otherwise take a debugger. Development builds only.

<sub>`src/features/dev-menu` · Tests: [`menu.test.tsx`](menu.test.tsx), [`platform/index.web.test.ts`](platform/index.web.test.ts)</sub>

```ts
import { devMenu } from "@/features/dev-menu";

devMenu.open(); // from anywhere, e.g. a long-press on a debug badge
devMenu.close();
```

**Opening it**

- **iOS / Android:** open Expo's dev menu (shake, three-finger long press, or `m` in the terminal) and choose **App dev menu**. Needs a development build (expo-dev-client), not Expo Go.
- **Web:** <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> on a Mac).

**What's in it**

| Section | Shows / does                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| App     | Version and build, OS, `EXPO_PUBLIC_API_URL`, network status, install id                                                                 |
| API     | `GET /api/health` against the app's own [API route](../../app/api/index.md); clear the query cache (memory and disk); emit `forceLogout` |
| Tools   | The haptics setting, copy the install id, show a toast, reload the app                                                                   |

- **Debug builds only (`isDebug` from `@/utils`).** In a release build or an end-to-end run, `<DevMenu />` renders nothing, registers nothing, and `devMenu.open()` does nothing, so the whole menu is dead code in a release bundle and stays out of a test flow's way.
- **Mounted once, in `Root`** — the real app only; Storybook and tests don't get it.
- **English only, on purpose.** It's a tool for whoever is building the app, not part of the product, so its labels aren't translated.
- **Adding to it.** Put a button in `menu.tsx` under the section it belongs to. Something destructive gets a toast saying it happened.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
