[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# Checkbox

> A labelled on/off choice that stands on its own.

<sub>`src/components/checkbox` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Checkbox from "@/components/checkbox";

<Checkbox label="Accept terms" value={accepted} onChange={setAccepted} />
<Checkbox label="Remember me" value={remember} onChange={setRemember} type="expo" />
```

- **Controlled.** `value` is the state and `onChange(next)` reports the press. Nothing changes until the caller stores the new value.
- **The whole row is the target.** The label is part of the pressable row, so tapping the text toggles it and the row is at least `elementHeightMd` tall. The row is shared with `Switch` and `RadioButton` through the internal [`BinaryControlRow`](../binary-control-row/index.md). All three have the same API shape (`BinaryControlProps` in `src/components/types.ts`).
- **One accessible element.** It is announced as a checkbox named by `label`, with its checked and disabled state (`checkboxA11yProps`). The visual indicator is hidden from assistive technology.
- **`type="expo"`** draws Expo UI's native checkbox (SwiftUI, Compose, or its web build) inside the same app-owned row. The label, semantics and layout don't change. The default `custom` indicator follows the Graphite rules: square corners from the shared `radius.control` token and theme colours only.
- For a list of related checkboxes use `<Input type="checklist">`. It adds the group label, helper and error text.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
