[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Utilities

# If

> Render children only when a condition is truthy.

<sub>`src/components/if` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import If from "@/components/if";

<If condition={config.backdrop}>
  <ModalBackdrop progress={progress} onDismiss={dismiss} />
</If>;
```

A plain conditional wrapper — renders `children` when `condition` is truthy, otherwise `null`. Any value works, so an optional slot is passed as is: `<If condition={footer}>`. `0` and `""` are falsy too, so compare explicitly where those are real values. It adds no host element of its own (unlike, say, wrapping in a `<View>` and toggling its visibility), so it's a drop-in replacement for `{condition && <X />}`/ternary JSX wherever that reads better as a tag than an inline expression. `Modal` (below) uses it for its optional backdrop and drag handle instead of ternaries.

- **`If` is not a ternary, in the one way that matters: its children are built whether or not the condition holds.** They're an argument, evaluated before `If` is ever called, so `<If condition={user !== undefined}><Text value={user.name} /></If>` reads `user.name` on `undefined` and throws — where `{user ? <Text value={user.name} /> : null}` would not. It doesn't narrow types either, so TypeScript catches most of these; `country-picker.tsx` keeps a ternary and a comment saying why. **Where the body reaches into the thing being guarded, use a ternary.** Everywhere else — a boolean flag, an index comparison, a count — `If` reads better and is what this repo uses.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
