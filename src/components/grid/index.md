[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Grid

> 12-column rows and cells, with spans that change per breakpoint.

<sub>`src/components/grid` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import { Cell, Column, Row } from "@/components/grid";

// 12-column layout, reflowing by breakpoint
<Row gap={spacing.x12}>
  <Cell columns={{ phone: 12, tablet: 6 }}><Card /></Cell>
  <Cell columns={{ phone: 12, tablet: 6 }}><Card /></Cell>
</Row>

// A uniform tile grid — columns alone, no per-cell props
<Row columns={{ phone: 2, tablet: 4 }}>
  {tiles.map((t) => <Cell key={t.id}><Tile {...t} /></Cell>)}
</Row>

// Column is Row's transpose: it stacks blocks down the page
<Column gap={spacing.x16}>
  <Row>…</Row>
  <Row>…</Row>
</Column>
```

Three pieces: **`Row`** places cells across and divides into `columns` (default 12), **`Cell`** occupies `columns` of them (default 1), **`Column`** stacks blocks down. Cells wrap onto new lines on their own, so one `<Row>` holds a whole grid — the same auto-placement CSS Grid does, and one less level of nesting than a container/row/cell hierarchy. Both `columns` props accept a plain number or a per-breakpoint map.

- **Why `columns` on both, and not `span`.** A bare `span` doesn't say span _of what_, or along which axis — `<Cell span={6}>` could plausibly mean six columns, six rows, or six pixels. Using `columns` on the cell reads one level down from the row's own: a row _has_ twelve columns, a cell _takes_ six of them. They're separate components, so there's no ambiguity at a call site — `<Row columns={12}><Cell columns={6}>` states the whole relationship in two props with one word.
- **`Column` means the direction, never the count.** "Column" does double duty in every grid system that has both — a vertical arrangement, and a subdivision of a row. The rule here: the _component_ always means the direction, the _count_ is always a `columns` prop.
- **`gap` is the prop, but not the implementation — and that's the whole design.** A cell occupying half a 12-column row is `width: "50%"`. Set RN's own `gap` style between cells and two of them no longer fit on one line (50% + 50% + the gap overflows), so everything wraps one-per-line and the grid silently stops being a grid. The usual escapes are to measure the row and compute exact pixel widths — an extra layout pass plus a visible reflow before the first measurement — or a `calc()` RN doesn't have. Instead each cell carries **half** the requested gap as padding on all sides, and the row cancels the resulting outer edge with a matching negative margin. Widths then sum to exactly 100%, wrapping is exact, adjacent cells sit a full gap apart, and nothing needs measuring. It works because RN lays out border-box, so padding is inside the declared width rather than added to it. `Column` has no such arithmetic — its children are stacked, not sized as percentages — so there it really is RN's `gap`.
- **Verified by measurement, not by eye.** At a 1100px window the four `columns={{ phone: 12, foldable: 6, tablet: 3 }}` cells came out 252.25px each inside a 1009px row — 4 × 252.25 = 1009 exactly, four per line, with 6.5px padding a side (half the 13px scaled gap). The same cells go two per line at 700px and one per line at 500px, summing to the row width at every step.
- **`columns` is clamped to the row's column count**, so a cell asking for more columns than exist becomes a full-width line instead of overflowing. `<Cell>` outside a `<Row>` throws rather than silently laying out wrong.
- **There's deliberately no row-spanning counterpart.** Rows here come from flex wrapping, and a wrapped flex line has no concept of a cell reaching into the line below. True two-dimensional spanning needs absolute positioning off a measured row height — a different and much heavier component than this one.
- **RTL-aware** — `Row`'s `flexDirection` flips, so cells fill from the right in an RTL locale.

**The layout arithmetic is not in the components.** `createGridMetrics(columns, gap)` and its hook `useGridMetrics()` live in `features/responsive` and return the whole calculation — the resolved column count, the gap, each cell's half-gap `cellPadding`, the container's cancelling `edgeOffset`, and `widthFor(n)` for a cell's percentage width (clamped, so an over-wide or zero request can't produce a broken value). `Row` calls the hook and shares the result with its cells through context; `Cell` does no arithmetic of its own. Anything else that wants to sit on the same grid without being inside a `<Row>` — a standalone card that should be a third of the screen, a modal sized to eight columns — can call it directly. The pure function is covered by its own tests, including that a full line of cells sums to exactly 100%.

**`ResponsiveValue<T>` / `resolveResponsive()`** (`features/responsive`) are the primitive underneath, and are useful well beyond the grid: a value that's either fixed or a per-breakpoint map, resolved **mobile-first**. A breakpoint with no entry inherits the nearest narrower one that has one, so `{ phone: 12, tablet: 6 }` means 12 on phone _and_ foldable, then 6 on tablet _and_ desktop — a map only names the widths where something actually changes. It never cascades downward: `{ desktop: 4 }` on a phone falls back rather than reaching up. `BREAKPOINT_ORDER` drives the cascade and is derived by sorting `BREAKPOINTS` on its own thresholds, so a new breakpoint slots in at the right place without the order being restated.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
