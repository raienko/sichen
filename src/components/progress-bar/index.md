[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# ProgressBar

> How far along a task is, determinate or indeterminate.

<sub>`src/components/progress-bar` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ProgressBar from "@/components/progress-bar";

<ProgressBar value={uploaded / total} label="Uploading photos" />
<ProgressBar label="Checking for updates" />          // indeterminate
<ProgressBar
  value={step / steps}
  label="Setup"
  size="small"
  formatValue={(v) => `Step ${Math.round(v * steps)} of ${steps}`}
/>
```

A horizontal bar showing how far along a task is. `Spinner` stays the right answer for a wait that is short and shapeless — a bar earns its space by answering "how much longer", which is also why the indeterminate state is the weaker of the two and not the default.

- **`value` is a 0–1 fraction, clamped.** A caller dividing by a total that turns out to be `0` gets an empty bar rather than a fill running off the end. `NaN` reads as `0`; an infinity is just past the end and pins to the right edge rather than being lumped in with it.
- **Omitting `value` is a claim, not a missing prop.** It makes the bar indeterminate, which reports _no_ `aria-valuenow` at all and sets `busy` instead — a bar that can't say how far along it is says something different from one reporting 0%. Verified in the rendered DOM: the determinate bars carry `aria-valuenow` with `aria-valuetext` (`"35%"`, or a caller's `"Step 2 of 6"`) and no `aria-busy`; the indeterminate one carries `aria-busy="true"` and no value.
- **Both states honour Reduce Motion, differently.** The determinate fill goes through `duration()`, so it lands on each new value instantly instead of gliding. The indeterminate sweep can't simply stop — the movement _is_ the signal that something is happening — so it becomes a cross-fade in place, which is the substitution Apple's own guidance names. Covered by tests that render with `isReduceMotionEnabled` mocked on and assert the bar fades full-width rather than sweeping a segment.
- **The track is `backgroundElementSelected`, not `backgroundElement`** — the latter is what most raised surfaces already use, so an unfilled bar sitting on a `Card` would be invisible. Same trap `Button`'s `secondary` and `Card`'s `outlined` document.
- **No `type="expo"` here.** Expo UI has a progress view for SwiftUI and one for Jetpack Compose, but nothing universal and nothing on web — three platform-specific implementations for a bar drawn from two `View`s isn't a trade worth making. `Switch`, `Checkbox`, `RadioButton`, `Slider` and `SegmentedControl` offer the switch because Expo UI ships one component that covers every platform.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
