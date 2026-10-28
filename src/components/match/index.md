[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Utilities

# Match

> `switch`/`case` as JSX, for more than two outcomes.

<sub>`src/components/match` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Match from "@/components/match";

<Match<Status> value={status}>
  <Match.Case when="loading">
    <Spinner />
  </Match.Case>
  <Match.Case when={["idle", "ready"]}>
    <Results />
  </Match.Case>
  <Match.Default>
    <Empty />
  </Match.Default>
</Match>;
```

`If` for more than two outcomes — the `switch`/`case` statement as JSX.

- **`Match`, not `Switch`, because `Switch` is already the toggle.** Two components of the same name is a rename at every call site that wants both, and the one that would have to give way is the control people actually see. `Match` is what the pattern is called wherever it isn't a C-family statement.
- **Only the first match renders, and there's no fall-through.** The statement's `break` is what everyone means and forgets to write. A branch listing several values — `when={["idle", "ready"]}` — covers the one use of fall-through anybody wanted.
- **It adds no host element**, the same as `If`. The matched branch's children are returned directly, which is what makes it usable inside `Chart`'s Skia canvas, where a stray `View` is handed to Skia's reconciler and silently renders nothing.
- **`Case` and `Default` hang off `Match` rather than being exported beside it**, so the three read as one construct and neither can be imported without the `Match` that gives it meaning — on its own, a `Match.Case` renders nothing. Same shape as `Share.copy` and `Popup.show`.
- **`<Match<T>>` types `value`, and cannot type the branches.** It reads as though it should, so this is worth knowing before relying on it: a parent's type argument can't reach its JSX children. Every JSX expression arrives typed as `React.JSX.Element` — which is `ReactElement<any>` — so a `children` typed as `ReactElement<CaseProps<T>>` accepts any element at all and the props are never compared. `NoInfer` and a `when?: never` discriminant on `Default` were both tried; neither helps, because nothing is being compared in the first place. What `<Match<Status>>` does buy you is a checked `value`: passing a number, or a string outside the union, is an error.
- **Where a typo in `when` matters, write the type on the branch.** `<Match.Case<Status> when="loding">` gives "Did you mean 'loading'?" at compile time. It's opt-in per branch — `when` defaults to `unknown` and takes anything — which is the trade for writing the type once on the `Match` instead of on every case. Worth it on a switch over a string union; noise on a boolean.
- **Branches have to be direct children.** They're read as props rather than rendered, so a `Match.Case` inside a fragment or lifted into its own component is invisible to the `Match` and that branch silently never matches. There's a test pinning it.
- **`Match` does not narrow, and its branches are all constructed** — the same rule as `If` above. A dispatch that needs narrowing stays a `switch` statement: `Input` picks between thirteen variations off a discriminated union, and its `switch` is what proves each variation gets props of the right shape. Converting that would cost the type check and build all thirteen elements to use one.
- **Two-branch dispatch stays a ternary.** `Checkbox`, `RadioButton`, `SegmentedControl`, `Switch` and `MediaPlayer` each pick one of two implementations off `type`; `a ? <X /> : <Y />` is shorter and no less clear. `Match` earns its place from three branches up — which in this repo is `Chart`, picking between bar, area and line.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
