[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# Toast

> A short, self-dismissing report on something that just happened.

<sub>`src/components/toast` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Toast from "@/components/toast";

await Toast.show({ type: "success", message: "Saved" });
Toast.show({
  type: "error",
  title: "Upload failed",
  message: "Check your connection.",
  link: "/uploads",
  actionLabel: "View",
  duration: null,
});
Toast.show({ id: "sync", message: "Syncing…" }); // same id replaces in place
await Toast.hideAll();
```

- **Raised imperatively and rendered by `ToastsProvider`**, which `Providers` mounts. At most `MAX_VISIBLE` (3) are on screen; the rest queue and move up as slots free, so a burst of errors doesn't cover the screen.
- **`type`** (`success`, `error`, `warning`, `info`) sets the icon, accent and announcement. The type is also read out before the message, so it doesn't rely on colour. Only `error` is assertive.
- **Lifetime:** `duration` defaults to 4 s and counts from when the toast becomes visible, not when it was queued. `null` keeps it up until hidden. `expiresAt` sets an absolute deadline, and a toast whose deadline passes while queued is never shown. **Auto-hide pauses while a screen reader is on** (WCAG 2.2.1), which is why `dismissible` defaults to `true`.
- **Pressing follows `link`** through `deepLinks.open()`, the same pipeline as OS and push links, and then dismisses the toast. There is deliberately no `onPress`; a route's `handle` can do anything a callback could.
- `show`, `hide` and `hideAll` resolve after the animation. `onHide` fires once the toast has fully gone. `toasts` / `useToasts()` expose the store for reading (debug screens, tests).

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
