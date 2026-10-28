[Docs](../../docs/index.md) › [Components](../../docs/components/index.md) › Utilities

# Utilities

> Platform constants, build flags (`isDebug`, `isE2E`), time spans in milliseconds, common hooks and the kit's easing — small helpers, all imported from `@/utils`.

## Platform constants

<sub>`src/utils` · [Tests](index.test.ts)</sub>

```ts
import { isWeb, isIOS, isAndroid } from "@/utils";

if (isIOS) AccessibilityInfo.announceForAccessibility(message);
const keyboardProps = isWeb ? { tabIndex: 0, onKeyDown } : null;
```

Three constants instead of a platform comparison written out at every call site — every one of the app's platform branches goes through them (`StateView`'s iOS announcement, `Toast`'s, `Switch`'s per-platform track size, the web keyboard handling in `Slider`, `Input`'s checklist/radio-group/switch-group, `ImagePicker`'s web path).

- **Constants, not functions.** The platform can't change while the app runs, so there's nothing to re-evaluate, and `if (isWeb)` reads as a fact rather than a question.
- **They read `Platform.OS`, not `process.env.EXPO_OS`** — and the difference matters more than it looks. The env read is inlined by `babel-preset-expo` at transform time, so it collapses to a literal and its branches are dead-code-eliminated per platform: cheaper, but under Jest it is permanently `"ios"`, which makes every non-iOS branch unreachable by any test. That's how `ImagePicker`'s web behaviour was first written — shipped, with no test able to see it. `Platform.OS` costs one comparison at module load and leaves the other branches in the bundle; being able to prove platform-specific behaviour is worth more. `src/utils/index.test.ts` asserts the env read is still pinned to `"ios"` under Jest, so a change back fails there rather than silently freezing every branch.
- **A test that needs a different platform mocks `@/utils`**, not react-native's `Platform` — replacing that module breaks `expo-modules-core`, which reads `select` from it during setup. Because the values are settled at module load, that mock belongs at the top of its own test file; `image-picker`'s web behaviour is covered in `web.test.tsx` beside the native cases in `index.test.tsx` for exactly that reason.

## Time

```ts
import { days, duration, hours, seconds, toUnit, wait } from "@/utils";

setTimeout(close, seconds(17));
const expiresAt = Date.now() + days(30);
if (Date.now() - fetchedAt > hours(1)) refresh();
await wait(seconds(2));

duration({ hours: 1, minutes: 30 }); // 5_400_000
toUnit(elapsed, "minute"); // 2.5 — round it yourself
```

| What                                                                | Is                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `seconds` `minutes` `hours` `days` `weeks` `months` `years`         | `(count) => milliseconds`                                                 |
| `SECOND` `MINUTE` `HOUR` `DAY` `WEEK` `MONTH` `YEAR`                | One of each, in milliseconds — for dividing: `Math.round(span / DAY)`     |
| `duration({ years, months, weeks, days, hours, minutes, seconds })` | Several units added together                                              |
| `toUnit(milliseconds, unit)`                                        | Milliseconds in another unit, fraction kept                               |
| `TIME_UNITS`                                                        | `[unit, length]` pairs, largest first — what `format.relative` picks from |
| `wait(milliseconds)`                                                | A promise that resolves after that long                                   |

Months and years are fixed lengths, 30 and 365 days: right for "about how long ago" and cache lifetimes, wrong for calendar maths. For "same day next month", change the `Date`'s month instead. Showing a span to people (`1:05:09`, `5 minutes ago`) is [Format](../features/format/index.md)'s job.

## Build flags

```ts
import { ifE2E, isDebug, isE2E } from "@/utils";

if (isDebug) registerDevTools();
if (isE2E) LogBox.ignoreAllLogs();
<Carousel autoplay={ifE2E(false, autoplay)} />;
```

| What                      | Is                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `isDebug`                 | A development build that isn't an end-to-end run: where developer-only tooling (the [dev menu](../features/dev-menu/index.md)) is on |
| `isE2E`                   | `true` in a build made for end-to-end tests, a constant like `isWeb`                                                                 |
| `ifE2E(inE2E, otherwise)` | `inE2E` in such a build, `otherwise` everywhere else                                                                                 |

- **Switched on per run, not per brand.** `yarn e2e:start` / `yarn e2e:web` start the dev server with `EXPO_PUBLIC_E2E=1`, and Metro bakes it into that bundle. `--clear` is part of both scripts: a cached bundle from an ordinary run would still say `false`. Only `1` or `true` turn it on, so `EXPO_PUBLIC_E2E=0` stays off.
- **For holding still, not for changing behaviour.** Use it for what makes a test runner's life unpredictable: autoplay and animations, the language, dev overlays, network images. Anything a user would see differently is a bug the e2e run exists to catch, so it must not hide behind the flag.
- **Tests mock `@/constants/env`**, the same way they mock `@/utils` for a platform: the value is read once, when the module loads. See `build/index.test.ts`.

## Test ids

```ts
import { testId } from "@/utils";

testId("showcase", "carousel"); // "showcase.carousel"
testId(testID, "dot", 2); // "carousel.dot.2" — undefined only if the owner has no id
```

One format for every `testID`: dot-separated segments from the owner down to the part, each lower-case. A component gives itself a **default owner id** — its own name — so `testID` is never required: `<Carousel />` is `carousel` with dots `carousel.dot.1`, `<Carousel testID="trips" />` is `trips` with `trips.dot.1`. Something the app renders once (the toasts overlay) uses a named constant instead. ESLint rejects a string or template literal in a component's `testID`, so every id goes through here. **Tests build ids the same way**, from `@/root/testing`: `screen.getByTestId(testId("screen", "header"))`, and `testIdPattern("toasts", ANY, "close")` for an id with a segment the test can't know. Nothing in a test spells the format out, so changing it here changes no test. End-to-end flows select these with `id:` on iOS, Android and web alike — see [Getting started › End-to-end tests](../../docs/getting-started.md#end-to-end-tests).

## Hooks

```tsx
import {
  useDebouncedValue,
  useInterval,
  useOnForeground,
  useToggle,
} from "@/utils";

const query = useDebouncedValue(text, 300);
const [open, toggleOpen, setOpen] = useToggle();
useInterval(refresh, isOnline ? seconds(30) : null);
useOnForeground(() => queryClient.invalidateQueries({ queryKey: ["inbox"] }));
```

| Hook                              | Does                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| `useDebouncedValue(value, delay)` | `value`, once it has stopped changing for `delay` ms — search-as-you-type |
| `useDebouncedCallback(fn, delay)` | `fn`, run `delay` ms after the last call; `.cancel()` drops a pending one |
| `usePrevious(value)`              | The value before the last change; `undefined` until it first changes      |
| `useToggle(initial?)`             | `[value, toggle, set]`, with a stable `toggle` for `onPress`              |
| `useInterval(fn, delay \| null)`  | `fn` every `delay` ms; `null` pauses                                      |
| `useTimeout(fn, delay \| null)`   | `fn` once after `delay` ms; `null` cancels                                |
| `useAppState()`                   | `active` / `background` / `inactive`, live                                |
| `useOnForeground(fn)`             | `fn` each time the app returns to the foreground, not on mount            |
| `useKeyboard()`                   | `{ isVisible, height }` of the software keyboard                          |

- **Callbacks are always the latest.** The timer and app-state hooks call the callback from the most recent render (`useEffectEvent`), so it can read current state without the timer restarting, and an inline arrow function is fine.
- **Timers are cleaned up on unmount.** Nothing fires into an unmounted component.
- **Not here on purpose:** `useIsMounted` (a cleanup function does that job properly) and a `useFetch` (use TanStack Query through [`@/features/api`](../features/api/index.md)).

## `easeOutClamped`

```ts
import { easeOutClamped } from "@/utils";

x.value = withTiming(target, { duration, easing: easeOutClamped });
```

Ease-out cubic with its input held to 0–1 — the easing for every slide and grow in the kit (TabBar, Pagination). On web, Reanimated's first frame can be stamped just before the press that started it, so a timing's progress begins slightly below 0, and plain `Easing.out(Easing.cubic)` extrapolates that into a visible backwards kick: measured in the browser, 45 px on TabBar's 0→496 slide and up to 43 px on Pagination's 0→236. Clamping removes it and changes nothing between 0 and 1.

---

[All components](../../docs/components/index.md) · [Docs index](../../docs/index.md)
