[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Haptics

> One-call haptic feedback (tap, selection, success, warning, error) that respects a user setting and is silent on web.

<sub>`src/features/haptics` · Tests: [`index.test.ts`](index.test.ts), [`web.test.ts`](web.test.ts)</sub>

```tsx
import { haptics } from "@/features/haptics";

haptics.tap(); // a press landed
haptics.impact("heavy"); // light · medium · heavy · soft · rigid
haptics.selection(); // a picker, slider or segment moved one step
haptics.success(); // saved, sent, done
haptics.warning();
haptics.error(); // refused

// A settings switch:
const enabled = haptics.useEnabled();
<Switch value={enabled} onChange={haptics.setEnabled} />;
```

A thin layer over `expo-haptics`, named by what happened rather than by the engine's vocabulary.

- **Fire and forget.** Nothing returns a promise and nothing throws: feedback is a nicety, so a failure is logged in development and otherwise ignored.
- **One setting turns it all off.** `setEnabled(false)` is stored in a `LocalValue` (`haptics-enabled`) and every call checks it, so a settings screen needs nothing else. Unset means on.
- **Silent on web.** The browser's Vibration API is a buzz, not a tap, and desktops have nothing to buzz, so web gets no feedback at all rather than a poor imitation.
- **The OS can still say no.** iOS plays nothing in Low Power Mode, with system haptics turned off, while the camera or dictation is active, and in the simulator. Try it on a phone.
- **Use it sparingly.** Feedback that comes with every touch stops meaning anything. Keep it for moments that matter: a value snapping into place, something saved, something refused.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
