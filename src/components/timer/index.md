[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# Timer

> A countdown or stopwatch, with an optional progress ring.

<sub>`src/components/timer` · [Stories](index.stories.tsx) · Tests: [`duration.test.ts`](duration.test.ts), [`index.test.tsx`](index.test.tsx)</sub>

```tsx
import Timer from "@/components/timer";

<Timer label="Time remaining" until={expiresAt} ring onComplete={expire} />
<Timer label="Session length" since={startedAt} type="body" />
```

A countdown or a stopwatch. `until` counts down and stops at zero, `since` counts up — a union, so a timer with both (no sensible answer) or neither (nothing to count) won't compile.

- **The two halves run at different rates, and that is the whole design.** The digits change once a second, so they are React state and cost one cheap re-render a second. The ring changes every frame, so it is a single `withTiming` on a shared value read straight into the circle's `strokeDashoffset` — it runs on the UI thread, never re-renders React, and stays smooth while JavaScript is busy. Driving both from one clock would mean either a ring that jumps in sixty steps or sixty React renders a second for something React does not need to know about. Measured in the browser: the ring's offset moved 86.80 → 88.68 over 480ms in sub-pixel steps while the digits produced three distinct values over 3.2 seconds.
- **It cannot drift.** Every value is `Date.now()` measured against the target rather than a count of elapsed ticks, so it is still correct after the app was backgrounded, after the device slept, and after a slow frame — a timer that counted its own ticks would be visibly behind after any of those and would never recover. `AppState` re-reads on foreground, because that is the one moment the value on screen is guaranteed stale.
- **The redraw is scheduled to the next second boundary**, not a flat 1000ms. An interval started at `x.900` redraws at `.900` forever — always 100ms after the second it is showing actually turned over, and further out as the drift accumulates. Waiting for the remainder means each redraw lands when the digits change, once each, instead of sometimes firing twice inside one second.
- **The digits are tabular.** In a proportional font `11:11` is narrower than `00:00`, so a timer laid out normally jiggles every second and shoves whatever is beside it. `fontVariant: ["tabular-nums"]` fixes every digit's width — the difference between a timer and a timer that looks broken.
- **A screen reader hears words, not a clock face.** `4:07` is announced as "four oh seven", which is a time of day rather than a length of one, so the spoken form is built separately (`describeDuration` → "4 minutes 7 seconds") and stops at the two largest units that carry information. It is the element's _value_ rather than a live region: a timer announcing itself every second would talk over the whole screen, so it is read on demand like any other value.
- **The ring sweeps linearly and starts at twelve o'clock.** Eased, it would disagree with the digits about how much time is left, which is the one thing a timer must not do. Under Reduce Motion it is drawn at its true position without the sweep — the number beside it already says how long is left, so the movement alone was carrying nothing.
- **`onComplete` fires once**, not once per redraw after the deadline, and `ring` is countdown-only in the types: counting up has no total to be a fraction of, so there is nothing for a ring to show.
- One bug worth recording: the value arithmetic was written twice, and the copy the scheduler used had its sign inverted — so every countdown reported itself complete on the first tick and never redrew. It is one function now.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
