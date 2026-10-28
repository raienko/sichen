[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Overlays

# Modal

> Popup, bottom sheet, action sheet or fullscreen overlay, with animated enter and exit.

<sub>`src/components/modal` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Modal from "@/components/modal";

<Modal id="confirm-delete" type="popup">
  <Text value="Are you sure?" />
</Modal>;

// from anywhere — no ref needed:
Modal.show("confirm-delete");
Modal.hide("confirm-delete");
```

Wraps RN's own `Modal` — already a native, full-window overlay, so no `Root` wiring is needed for it to render above everything — and drives its enter/exit visuals with [Reanimated](https://docs.swmansion.com/react-native-reanimated/) instead of `Modal`'s built-in `animationType`, so each `type` gets its own appearance and motion:

| `type`        | position   | animation | backdrop | content background |
| ------------- | ---------- | --------- | -------- | ------------------ |
| `popup`       | center     | fade      | yes      | yes                |
| `bottomSheet` | bottom     | slide up  | yes      | yes                |
| `actions`     | bottom     | slide up  | yes      | no                 |
| `fullscreen`  | fullscreen | fade      | no       | yes                |

(`type` is optional, defaults to `"popup"`. Table lives in code as `MODAL_TYPE_CONFIG` in `config.ts` — add a type by adding one entry there + the literal to `ModalType` in `types.ts`; `index.tsx` reads it generically and doesn't otherwise change.)

- **`actions` has a backdrop but no content background** — a native-style action sheet: the dimmed backdrop with a stack of items straight over it and no card behind them. The Showcase demo stacks two `Button`s and a `Close` `Button` with a `gap`. A gradient fade behind the stack was tried and dropped; a better look is still open.
- **Toggle two ways, both converging on the same internal show/hide**: locally via a ref (`<Modal ref={ref} id="x">...</Modal>`, then `ref.current.show()`/`.hide()`), or globally via `id` from anywhere with no ref — `Modal.show("x")`/`Modal.hide("x")`, backed by `event-bus.ts` (built on the generic bus above). Every mounted `<Modal id="x">` subscribes for its own id and reacts only to it — verified live and in tests (`Modal.show("some-other-id")` while a differently-`id`'d modal is mounted does nothing to it).
- **`onDismiss`** fires when the user _asks_ to close the modal — a backdrop tap, or the Android back button / RN `Modal`'s `onRequestClose` (not RN `Modal`'s own `onDismiss`, which is iOS-only and fires _after_ its dismissal animation — this one fires on the request, on every platform, before any animation). Defaults to hiding the modal; pass your own to run different logic instead, or to make the modal only closable via `Modal.hide(id)`/a ref (e.g. a "processing, please wait" modal). Doesn't affect `show`/`hide` via ref or the static API — those always still work regardless of `onDismiss`.
- **Exit animations play out before the native `Modal` unmounts.** RN's `Modal` unmounts its content the instant its `visible` prop goes false, which would cut a Reanimated exit animation short — so here, `visible` only follows a state flag that's flipped to `false` inside the exit animation's completion callback (`withTiming`'s 3rd argument, hopped back to the JS thread via `runOnJS`), not immediately when `hide()`/`Modal.hide(id)` is called. Verified live: closing a popup/sheet visibly animates out before disappearing, not an instant cut.
- Bottom-sheet/actions padding and fullscreen's top padding account for safe-area insets (`useSafeAreaInsets`, already provided by `Root`'s `SafeAreaProvider`) on top of the base spacing, so content clears the home indicator / notch.
- **Jest needs one extra config line for Reanimated v4**: `"resolver": "react-native-worklets/jest/resolver.js"` in `package.json`'s `"jest"` block. Reanimated v4 splits its native/worklet runtime into the separate `react-native-worklets` package, whose native-only files (`*.native.ts`) crash under plain Jest (no native module) unless this resolver strips that extension during test resolution — no such config existed before Modal was the first thing in this codebase to import `react-native-reanimated`. `expo start`/`expo start --web` need no equivalent change — `babel-preset-expo` auto-detects `react-native-worklets`/`react-native-reanimated` being installed and wires their Babel plugin in automatically, which is also why there's still no `babel.config.js` in this project.
- **Accessibility**: the outer container gets `accessibilityViewIsModal` (maps to `role="dialog" aria-modal="true"` on web — verified via the actual DOM), and the backdrop gets `accessibilityRole="button"`/`accessibilityLabel="Dismiss"` so a screen reader announces what tapping it does. Keyboard/screen-reader focus trapping and restore-on-close are **not** hand-rolled here — react-native-web's own `Modal` already wraps its children in a WCAG-compliant focus trap (`ModalFocusTrap`) whenever `visible` is true, and native platforms handle modal accessibility focus themselves; re-implementing that would just duplicate what the platform already does correctly.
- **Same-`id` and orphan-`id` calls warn in dev instead of failing silently.** `Modal.show`/`Modal.hide` broadcast on the event bus regardless of whether anything is listening — a typo'd `id`, or two `<Modal id="x">`s accidentally mounted at once, would otherwise do nothing/double up with zero indication why. `registry.ts` tracks which ids are currently mounted purely to `console.warn` in dev in both cases (`__DEV__`-gated, zero runtime cost in production) — verified in tests and doesn't change behavior, only diagnosability.
- **Content taller than the screen scrolls instead of overflowing.** Every type's children render inside a `ScrollView`, bounded by `maxHeight: windowHeight * 0.85` for `popup`/`bottomSheet`/`actions` (fullscreen's is `flex: 1`, already bounded by the screen). Verified live: a popup with 40 lines of text bounds to 85% of the viewport height and scrolls to reveal a "Close" button below the fold, instead of clipping it off-screen.
- **A native Modal is its own window**, so each `Modal` mounts its own `SafeAreaProvider` (insets measured for the full-screen window, not wherever the app root sits — in Storybook the root is below the status bar) and its own `GestureHandlerRootView` (gesture-handler needs one inside a native Modal on Android).
- **`immersive`** is full-screen, edge to edge, with no ScrollView and no background of its own — for content that takes over the screen and brings its own gestures: [`ImageViewer`](../image-viewer/index.md), and later a full-screen video, camera or map. Every other type wraps its children in a ScrollView, which would take a pinch or a swipe away from them.
- **`bottomSheet`/`actions` support drag-to-dismiss from a grabber handle** (`react-native-gesture-handler`'s `Gesture.Pan()` + `GestureDetector`, Reanimated-driven). Deliberately scoped to just the handle, not the whole sheet — wrapping the entire content (including the `ScrollView` above) in the pan gesture would fight the `ScrollView`'s own vertical scrolling for the same gesture. Dragging past 100px or with velocity over 800px/s dismisses (via the same `dismiss()`/`onDismiss` path as a backdrop tap); otherwise it snaps back. Verified live in-browser with simulated pointer drags: a 200px drag dismissed the sheet, a 20px drag snapped back without dismissing.
- **`GestureHandlerRootView` now wraps the whole app**, added to `Providers` (`src/root/providers.tsx`) rather than only around Modal's gesture — gesture-handler needs exactly one, at the true root, to reliably capture touches on Android; wrapping it locally around just the drag handle would work inconsistently. `jest.setup.js` also needed `require("react-native-gesture-handler/jestSetup")` (gesture-handler's own recommended Jest setup) once any gesture was actually used.
- **Composed from smaller pieces**, same folder-per-piece pattern as `Input`: `backdrop.tsx` (`ModalBackdrop`), `content.tsx` (`ModalContent` — position/animation styling + the fade/slide-up interpolation), `handle.tsx` (`ModalHandle` — the grabber and its pan gesture), and `scroll-area.tsx` (`ModalScrollArea` — the bounded, scrollable content region) each own one concern; `index.tsx` is the orchestrator that owns state (`nativeVisible`, `progress`/`dragY` shared values, the show/hide/dismiss callbacks) and composes the pieces, using `If` (above) for the parts that are conditional per `type` (backdrop, drag handle) instead of ternaries.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
