[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Navigation

# Header

> A screen's top bar: leading slot, title or custom centre, trailing slot.

<sub>`src/components/header` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Header from "@/components/header";

<Header title="Orders" subtitle="12 open" left={<BackButton />} avoidNotch />

<Header
  left={<BackButton />}
  right={[<IconButton key="filter" label="Filter">…</IconButton>,
          <IconButton key="add" label="Add">…</IconButton>]}
>
  <Input type="text" value={query} onChange={setQuery} placeholder="Search" />
</Header>
```

A screen's top bar: something on the left, something on the right, and a title or a component of your own between them. Both slots take one element or several — pass an array or a fragment.

- **The middle stays centred against the header _and_ uses every pixel the slots don't need.** Those pull against each other in plain flexbox, and both failure modes showed up on screen: equal `flexBasis: 0` shares centre the title but make the row believe it always fits, so a long one overlapped the buttons; content-sized slots catch the overflow but let the wider side shove the title off-centre. So the slots are measured (`onLayout`) and the middle is offset by the _difference_ between them — `max(0, right − left)` leading, the reverse trailing — which puts its midpoint on the header's whatever each side holds. Verified in the browser across three headers with different slot loads: all centred to the pixel, none overlapping, the long one truncating.
- **The slots never shrink; the middle does.** A squashed control is unusable, while a clipped title is merely shorter. Making the middle actually give way needs `minWidth: 0` on both the centre _and_ the text inside it — a flex item's default minimum size is its own content, so one level of it isn't enough (which is why the first fix didn't take).
- **The title is the screen's `<h1>`.** It's set in `headline` rather than a title step — a bar is compact, and the type scale's title sizes are built for a page heading with room to breathe — so the heading semantics are declared explicitly rather than inherited from `type`. Without that, a screen reader's heading rotor has no entry for the screen the user is on. Confirmed in the rendered DOM. The subtitle stays plain text: it qualifies the heading rather than being one.
- **`avoidNotch`** — leave it off inside `Screen`'s `header` slot, which clears the notch itself. Outside one, it adds the device's top safe-area inset, clearing the notch, Dynamic Island or status bar. **Off by default**, because that padding is only correct for a header pinned to the very top: inside a `Modal`, under another header, or within a page that already inset itself, adding it again pushes content down twice. (Web has no inset, so it's a no-op there — the behaviour is covered by a test that supplies a real one through `SafeAreaInsetsContext`.)
- **Title, subtitle and custom middle content are a union**, so the combinations that mean nothing can't be written: a `subtitle` with no `title` to sub, or a custom element competing with a title for the same space. A header with nothing in the middle at all is still valid — back button plus actions is a real bar.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
