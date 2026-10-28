[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# Spinner

> An indeterminate loading indicator in the theme's accent colour.

<sub>`src/components/spinner` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Spinner from "@/components/spinner";

<Spinner />                         // announced as a localized "Loading"
<Spinner size="large" label="Loading chart" />
<Spinner label={null} />            // a labelled parent owns the busy state
```

- **Announced as a progress bar** with a localized "Loading" by default. Name it after what is loading when it's the only thing on screen, for example "Loading chart".
- **`label={null}` removes it from the accessibility tree.** Use that when the parent already says it's busy, as a loading `Button` or a `StateView` of type `loading` does. Otherwise a screen reader would hear "loading" twice.
- **`size`** (`small`, `medium`, `large`) maps to spacing tokens, so it scales with the responsive system. The colour defaults to `accent`.
- For a placeholder with the shape of the coming content, use [`Skeleton`](../skeleton/index.md). For measurable progress, use [`ProgressBar`](../progress-bar/index.md).

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
