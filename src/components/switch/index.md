[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# Switch

> A setting that is on or off and takes effect immediately.

<sub>`src/components/switch` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Switch from "@/components/switch";

<Switch label="Notifications" value={enabled} onChange={setEnabled} />
<Switch label="Dark mode" value={dark} onChange={setDark} type="expo" />
```

- **Use it for a setting that takes effect immediately.** When the choice is only applied on submit, use a `Checkbox`.
- **The label leads and the indicator trails** (`indicatorPosition="end"`), like a native settings row. In RTL the row is mirrored.
- **Controlled** through `value` / `onChange`, and announced as a switch with its on/off state (`switchA11yProps`). The whole row is the press target.
- **`type="expo"`** hosts Expo UI's native switch: `UISwitch` on iOS, Material 3 on Android, and Expo UI's web track in the browser. Each platform gets a fixed slot sized to that control, so rows line up.
- For a group of related toggles use `<Input type="switchGroup">`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
