[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# Stepper

> A number with − and + either side: quantities, party sizes, small counts.

<sub>`src/components/stepper` · [Stories](index.stories.tsx) · Tests: [`accessibility.test.tsx`](accessibility.test.tsx), [`index.test.tsx`](index.test.tsx), [`step.test.ts`](step.test.ts)</sub>

```tsx
import Stepper from "@/components/stepper";

<Stepper label="Quantity" value={quantity} onChange={setQuantity} />
<Stepper label="Guests" value={guests} onChange={setGuests} min={1} max={8} hideLabel />
<Stepper label="Rate" value={rate} onChange={setRate} step={0.25} formatValue={(v) => `${v}×`} />
```

A number with a button either side of it: a quantity, a party size, a count of anything small enough to reach by pressing.

- **The value is not editable, and that is the decision rather than an omission.** A middle you can type into makes the control two things at once — an adjustable element and a text field — which need opposite accessibility treatment and disagree about what the keyboard is for. A stepper is for small adjustments (1 to 2, 4 to 3); anything with a range wide enough to want typing wants `Input`'s `numeric` variation, which already owns the digit filtering, the clamping and the right keyboard. The showcase puts the two side by side rather than merging them.
- **The whole control is one adjustable element and the buttons are hidden from assistive technology.** That is what the platform's own stepper is: a screen-reader user swipes up and down (arrow keys, `Home` and `End` on the web) rather than hunting two anonymous buttons, and announcing "decrease, button / 2 / increase, button" would turn one control into three stops. The buttons stay perfectly pressable by touch — hiding affects the accessibility tree, not the hit area. It reuses `sliderA11yProps()` rather than a near-identical helper of its own: the native adjustable role plus the equivalent ARIA range contract is exactly a stepper's, and RN has no separate spinbutton role to reach for.
- **Hiding them means taking them out of the tab order too**, which needs two props for two platforms: `focusable={false}` is what native reads, and react-native-web ignores it on a `Pressable` — it renders a real `<button>`, focusable by default — so the web needs `tabIndex` spelled out. Caught in the browser, where the buttons were `aria-hidden` and still `tabindex="0"`: focus stops that announce nothing, and three tab stops for one control.
- **It stops at its limits and looks like it.** The button that would cross a bound is disabled rather than pressable-and-ignored, and the announced range tells a screen reader the same thing. `min` and `max` default to concrete values (0 and 99) because an adjustable element has to announce a range, and a stepper with no limits is one that can't disable at them.
- **The arithmetic is a separate, tested module** (`step.ts`). `0.1 + 0.2` is `0.30000000000000004`, and a stepper that displays that is broken — the result is rounded to as many places as the widest of its inputs actually has, which is exact for any step a caller can reasonably pass and does nothing at all to whole numbers. Verified live: a `0.25` step walks 1 → 1.25 → 1.5 → 1.75 → 2 with no drift.
- **It moves the value rather than snapping it.** A stepper is controlled, so a `value` off the step grid is the caller's business and is left alone: `2.5` with a step of `1` becomes `3.5`, not `3`. (`Slider` does snap, because there the value comes from a continuous drag rather than from the caller.)
- **The value is drawn in tabular figures over a reserved width**, so the control doesn't resize as digits are added — measured at a steady 194px from 0 to 999. The reserved width is what actually guarantees that; `fontVariant` support varies across Android builds, so the figures are the braces and the width is the belt.
- **`label` is required**, because "3" read aloud says nothing about what three of, and `hideLabel` keeps it as the accessible name for a row that already says it visually — the same contract `Slider` has.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
