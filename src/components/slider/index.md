[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# Slider

> A value, or a range, picked by dragging along a track.

<sub>`src/components/slider` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Slider from "@/components/slider";

<Slider label="Volume" value={volume} onChange={setVolume} />
<Slider label="Price" min={0} max={500} step={10} value={[min, max]} onChange={setRange}
        thumbLabels={["Minimum price", "Maximum price"]} />
<Slider label="Seek" hideLabel value={position} onChange={seek} formatValue={formatTime} />
```

- **Pass a number for one thumb or an array for several.** Values are normalised into ascending order, and thumbs can't cross.
- **`label` is always required**, even with `hideLabel`. A slider has no text of its own for a screen reader to name it from. `hideLabel` only stops drawing it, for sliders whose context already says what they are (a media scrubber, a toolbar volume).
- **Each thumb is its own adjustable element.** `thumbLabels` names them individually and `formatValue(value, index)` sets what is announced ("3:42", "$120"). Without a `step`, assistive adjustments move in 1% increments. On web the arrow keys step it and Home/End jump to the ends.
- **RTL** mirrors the track, so the minimum sits at the start edge.
- **`type="expo"`** uses Expo UI's native slider, for a single thumb only. A multi-thumb value always falls back to the custom slider.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
