[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# Alert

> A message that stays in the page until its cause goes away — offline, unverified email, failed save.

<sub>`src/components/alert` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Alert from "@/components/alert";

<Alert type="warning" message="You're offline. Changes will sync later." />;
<Alert
  type="error"
  title="Couldn't save"
  message="Check your connection and try again."
  action={{ label: "Retry", onPress: save }}
  onDismiss={() => setError(null)}
/>;
```

A message that stays in the page until what it reports stops being true — offline, an unverified email, a failed save. It fills the gap between the two overlays: `Toast` reports something that happened and leaves on its own, `Popup` blocks until answered, and this does neither.

- **Types**: `info` (default), `success`, `warning`, `error` — the same icons, urgencies and announcements as `Toast`, kept as a table in the component so a new type is one entry plus its `alert.<type>` translation.
- **Drawn to the kit, not as a coloured card**: the raised `backgroundElement` surface with a `divider` hairline and `radius.surface` corners. The type is carried by the icon in its status colour and by the spoken announcement — never by a fill.
- **Announced once, on mount**, through a live region with the type read first ("Error, Couldn't save, Check your connection…"); only `error` interrupts. The action (a tertiary button under the message) and the close control stay separate stops.
- **`onDismiss` is what adds the close control.** Leave it off for a message that must stay while its cause does.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
