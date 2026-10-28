[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Actions

# Button

> The one pressable action: `primary`, `secondary` or `tertiary`, in three sizes, with loading, selected and pressed states.

<sub>`src/components/button` · [Stories](index.stories.tsx) · Tests: [`content.test.tsx`](content.test.tsx), [`icon-button.test.tsx`](icon-button/index.test.tsx), [`index.test.tsx`](index.test.tsx)</sub>

```tsx
import Button from "@/components/button";

<Button value="Continue" type="primary" size="large" onPress={submit} />
<Button value="Cancel" onPress={dismiss} />              // secondary / medium
<Button value="Learn more" type="tertiary" size="auto" onPress={open} />
```

Two independent axes — `type` (visual emphasis) and `size` (box metrics and type scale) — plus `selected` and `disabled` states that cut across both.

| `type`      | Fill                          | Border   | Label       |
| ----------- | ----------------------------- | -------- | ----------- |
| `primary`   | `primary`                     | —        | `onPrimary` |
| `secondary` | none (`selected` when picked) | `border` | `text`      |
| `tertiary`  | none (`selected` when picked) | —        | `accent`    |

| `size`   | Height                 | Label type |
| -------- | ---------------------- | ---------- |
| `small`  | `elementHeightSm` (32) | `footnote` |
| `medium` | `elementHeightMd` (44) | `body`     |
| `large`  | `elementHeightLg` (56) | `headline` |
| `auto`   | hugs its label         | `body`     |

- **The defaults are `type="secondary"`, `size="medium"`** — chosen so adding both props changed nothing about how any existing button in the app renders. `secondary` is also the right default on the merits: the app's buttons are overwhelmingly utility actions, and defaulting to `primary` would make every one of them shout.
- **`secondary` is outlined, and its border is load-bearing.** With no fill, the `border` edge is the only thing marking the control, so it is the semantic token held to the 3:1 WCAG 1.4.11 asks of a boundary against every surface a button can sit on — `backgroundElement` and the `selected` tint included (see the palette contrast test in the Theme section).
- **Every type gets two backgrounds, resting and `selected`**, so a segmented control reads as picked whichever type it's built from — not just the one that happened to have a darker token lying around. `primary` is the exception and stays put: it's already at full emphasis, so it conveys selection through `aria-selected` alone. Verified live: clicking through the showcase's segmented control moves both the readout and the rendered `aria-selected`.
- **`auto` is the one size that reserves no touch target** — it hugs its label, for a button that has to sit inline with text or in a tight row, which by definition puts it under the 44pt minimum. That's why it's the one size to avoid for a primary action, and why it's called out here rather than left to be discovered.
- **The box metrics live in `createStyles`, the type scale in a lookup table.** Height and padding need `units()`-scaled values, which only the style factory has; the label's typography token doesn't. Splitting them isn't ideal, but duplicating the heights into a const nothing reads would be worse — an earlier version did exactly that and the dead fields survived a refactor unnoticed.
- **`borderWidth` is always present, transparent unless the type asks for a border**, so a bordered and an unbordered type occupy identical space and swapping between them doesn't shift the layout around them.
- **Accessibility** comes from `controlA11yProps()` (see the Accessibility section) — a bare `Pressable` has no role of its own, so without it every button announces as an anonymous group. The label comes from the `Text` child rather than an explicit `accessibilityLabel`, and only the states actually in play are emitted.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
