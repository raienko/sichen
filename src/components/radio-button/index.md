[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# RadioButton

> One option of a set where exactly one can be chosen.

<sub>`src/components/radio-button` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import RadioButton from "@/components/radio-button";

<RadioButton
  label="Standard delivery"
  value={speed === "standard"}
  onChange={() => setSpeed("standard")}
/>;
```

- **Selecting is one-way.** Pressing an unselected radio reports `onChange(true)`. Pressing the selected one does nothing, because a radio is deselected by choosing a sibling.
- **Usually used through `<Input type="radioGroup">`**, which owns the group's value, label, helper, error text and keyboard behaviour. Use `RadioButton` on its own only for a custom layout.
- Announced as a radio with its selected state (`radioA11yProps`). The whole row is the target.
- **`type="expo"`** uses the Compose radio on Android. iOS has no Expo UI radio primitive, so iOS and web draw an RN reproduction of the Android look (`expo-style.tsx`). The default `custom` indicator is circular, one of the two exceptions to Graphite's square corners.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
