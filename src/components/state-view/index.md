[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Feedback & status

# StateView

> A screen-sized loading, empty, error, success or offline state, inline or as a global overlay.

<sub>`src/components/state-view` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import StateView from "@/components/state-view";

<StateView type="empty" message="No orders yet." actionLabel="Browse" onAction={browse} />
<StateView type="error" message={error.message} actionLabel="Retry" onAction={refetch} />

const id = StateView.show({ type: "offline", message: "Reconnecting…" });
StateView.hide(id);
```

- **`type` supplies the defaults:** icon (a spinner for `loading`), accent colour, localized title and announcement urgency. The mapping is in `config.ts`. `title` overrides the default title. `children` go between the message and the action.
- **Announced when it appears.** The title and message form a live region, assertive for `error` and polite otherwise. iOS gets an explicit VoiceOver announcement because it ignores live regions.
- **`actionLabel` and `onAction` come as a pair** (enforced by the types). The button shows a loading state while an async action runs, and a throwing action is logged.
- **`StateView.show()` is the global overlay.** It uses a single fullscreen native `Modal` rendered by `StateViewsProvider` (mounted in `Providers`), which blocks the app until it is hidden. Calling `show` again replaces the current overlay. Pass an `id` to replace a specific one, and pass it to `hide(id)` so an old caller can't hide a newer state.
- Use it for the whole content area. For a message inside a page use [`Alert`](../alert/index.md); for a passing report use `Toast`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
