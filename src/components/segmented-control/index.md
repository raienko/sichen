[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# SegmentedControl

> A row of mutually exclusive options, for switching between a few views or modes.

<sub>`src/components/segmented-control` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import SegmentedControl from "@/components/segmented-control";

<SegmentedControl
  label="View"
  value={view}
  onChange={setView}
  options={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ]}
/>

<SegmentedControl type="expo" label="View" value={view} onChange={setView} options={options} />
```

A row of mutually exclusive options with exactly one chosen — for switching between a handful of views or modes, where a `Select` would hide the alternatives behind a tap and a radio list would spend a whole column on them. App-owned by default, with Expo UI's platform control (`@expo/ui/community/segmented-control`) behind `type="expo"`, the same switch `Switch`, `Checkbox`, `RadioButton` and `Slider` use.

- **`options` follows `SelectOption`'s split**: `value` is what `onChange` reports and what `value` is matched against, `label` is the only thing shown — so the stored value stays a stable code while the visible text is free to be translated. A `value` matching no option leaves everything unselected rather than throwing, the same degrade-don't-crash rule `Select`'s placeholder follows, so a stale value out of storage doesn't take the screen down.
- **Pressing the current segment reports nothing.** It isn't a change, and firing `onChange` for a value the caller already holds turns an idle tap into a state update — and, for a call site that persists on change, into a write.
- **Accessibility is a `radiogroup` of radios, not a row of buttons.** Each segment announces as a radio with its checked state, inside a group named by the required `label`; a screen reader then says what the choice is for, which option this is, and whether it's checked. Announcing each as an unrelated "button, selected" would lose the fact that picking one unpicks the rest. Verified in the rendered DOM: `role="radiogroup"` with `aria-label` on the track, `role="radio"` with `aria-checked` on every segment, and `aria-disabled` on both.
- **The selected segment is tinted and underlined, not inverted.** It takes the `selected` tint, an `accent` bar along its bottom edge, and a `text` label where the rest are `textSecondary`. A solid `primary` or `text` block was the loudest thing on any screen, most of all in the dark scheme; the bar alone clears the 3:1 WCAG 1.4.11 asks of the only thing marking the choice, and as a shape it survives greyscale and a colour-blindness filter.
- **A single option can be disabled** (`options[n].disabled`) as well as the whole control. A disabled segment is dimmed as well as unpressable — one unavailable choice among available ones is otherwise indistinguishable until you tap it and nothing happens.
- **Two things `type="expo"` can't do**, by the native control's design rather than an oversight: it addresses segments by index off a flat `values: string[]` (so `value` is resolved to an index in and back out — going through the index rather than its `onValueChange`, which reports the visible _label_, keeps two same-labelled options distinguishable and leaves the label free to be translated), and it has no per-option `enabled`, so `options[n].disabled` is ignored there. Reach for the custom implementation when one choice needs to be unavailable.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
