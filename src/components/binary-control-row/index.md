[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Internal

# BinaryControlRow

> Internal: the labelled press target shared by Checkbox, Switch and RadioButton.

<sub>`src/components/binary-control-row` · [Tests](index.test.tsx)</sub>

```tsx
import BinaryControlRow from "@/components/binary-control-row";

<BinaryControlRow
  label={label}
  indicator={<Indicator value={value} />}
  indicatorPosition="end"
  accessibilityProps={switchA11yProps({ label, value, disabled })}
  onPress={() => onChange(!value)}
/>;
```

**Internal.** It is listed as `internal` in [`src/components/manifest.json`](../manifest.json), and ESLint rejects imports of it from screens, root, app and features. Use `Checkbox`, `Switch` or `RadioButton`.

- **Owns layout and press behaviour only:** a row at least `elementHeightMd` tall, the label in `Text` filling the remaining width, the indicator at the start or end (mirrored in RTL), and pressed (0.7) and disabled (0.5) opacity.
- **Owns no semantics.** Each control passes its own role and state through `accessibilityProps` (`checkboxA11yProps`, `switchA11yProps`, `radioA11yProps`). The row itself is the single accessible element, and indicators hide themselves.
- `indicatorPosition="start"` uses an `x8` gap (checkbox, radio) and `"end"` an `x12` gap (switch, settings-row style).

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
