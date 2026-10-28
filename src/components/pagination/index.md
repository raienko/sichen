[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Navigation

# Pagination

> Where am I, and take me to another page — numbered or as dots.

<sub>`src/components/pagination` · [Stories](index.stories.tsx) · Tests: [`dots.test.tsx`](dots.test.tsx), [`index.test.tsx`](index.test.tsx), [`range.test.ts`](range.test.ts), [`semantics.test.tsx`](semantics.test.tsx)</sub>

```tsx
import Pagination from "@/components/pagination";

<Pagination label="Search results" value={page} total={40} onChange={setPage} />
<Pagination label="Results" value={page} total={40} onChange={setPage} compact />
<Pagination variant="dots" label="Slides" value={slide} total={5} onChange={setSlide} />
```

Which of these am I on, and take me to another one.

- **Two variants, because that question has two shapes.** `"numbers"` is the paged-data control — arrows, page numbers, gaps. `"dots"` is the position indicator for a small, known set, where the count matters more than the index. Dots have no arrows and no gaps: every position is a dot.
- **`Carousel` uses the `"dots"` variant.** It passes its own labels, so a dot announces "A pug wrapped in a blanket, Slide 2 of 4" rather than a number, and its private pagination wrapper is gone.
- **Changing page animates, from the settled page only.** Nothing is driven off a carousel's live scroll `progress`: an earlier version interpolated the dots off it so they grew while the finger was still moving, and that produced two iOS press bugs in a row. Now everything animates when `value` changes, over 240 ms with an ease-out, and the pressables themselves never move or resize. Reduce Motion makes all of it instant.
  - **Numbers:** the current page's highlight — Graphite's `selected` tint with an `accent` edge, drawn once behind the row (`indicator.tsx`) — slides to the new page. The buttons' own selected tint is cleared so only the highlight shows it; the button still carries the selected state for assistive technology.
  - **When the window shifts** (more pages than slots, so the current page stays in the middle and the numbers change around it), the row slides one slot from the direction of travel and fades up while the highlight holds still — a ticker (`shift.ts`). Mirrored in RTL.
  - **Dots:** the old dot shrinks to `border` while the new one grows into `accent`, so the long dot appears to travel.
- **The touch target is a real box, not `hitSlop`.** An 8pt dot needs a target several times its size, and `hitSlop` is the obvious way to get one — and the wrong one here, because dots sit a few points apart, so 16pt of slop overlapped every neighbour. Overlapping targets do not average out: the topmost wins, so on iOS every press landed on the last dot rendered and the earlier ones could not be pressed at all. Sizing the `Pressable` itself (32pt, 4pt apart) makes the targets tile instead of stack.
- **Neither web check could have caught that**, which is worth recording. `react-native-web`'s `Pressable` does not implement `hitSlop` at all — only its legacy `Touchable` references it — so on web the targets never overlapped and the bug did not exist. The first check compounded it by driving the dots with `element.click()`, which dispatches straight to the element and bypasses hit-testing entirely. Verified since with real pointer events at coordinates, recording which element each one reaches: clicks on dots 1, 4, 2, 1, 3 landed on exactly those dots, backwards moves included.
- **Fewer than two pages renders nothing at all.** A pagination bar for a single page is a control that cannot do anything, and it is the state a real screen spends most of its time in — an empty result set, a filter that narrowed to one page. Hiding it is the behaviour, not an oversight.
- **The width does not change as you page.** `paginationRange` returns a constant number of slots once there are enough pages to need gaps, so the button under your cursor stays where it is; a bar that reflows moves the target you were about to press. Verified at 121px and five number slots at every position from page 1 to 10 of 40, as the digits go from one to two.
- **A gap must hide at least two pages.** An ellipsis standing in for a single number takes the same room and tells the reader less. The bound is off-by-one-prone and was — the first version rendered `1 … 3 4 5 … 12` at page 4, where the gap hid only page 2, and a test caught it.
- **The arrows mirror in RTL.** Previous is a direction, not a glyph: in a right-to-left locale the earlier page is to the _right_, so a left-pointing chevron there means next. Read from `useIsRtl()` rather than automatic mirroring, which only lands after a native reload — the same reason `BackButton` does it.
- **The numbers wrap; the arrows do not.** Letting the whole row wrap put "next" alone on a second line at phone widths, where it reads as a different control rather than the other end of this one. `compact` — two arrows and "Page 3 of 20" — is the better answer when there is genuinely no room.
- **`value`/`onChange`, not `page`/`onPageChange`.** The same pair `Checkbox`, `Switch`, `Slider`, `SegmentedControl`, `Stepper` and `Input` take, so a controlled component reads the same wherever you meet one. `value` is 1-based — the number the reader sees, not an array index — and carries none of the zero-based implication `index` would. The active item is wider or recoloured depending on the variant, so state survives greyscale (WCAG 1.4.1).
- **Every item announces its position**: "Page 3 of 20", not "3", because a screen-reader user has no visible row to read it among — and `getItemLabel` lets a carousel say "A pug wrapped in a blanket, Slide 2 of 4" instead. The current item is marked selected. The bar itself is not `accessible`: that would collapse its buttons into one announcement and make them unreachable, the trap `Card` and `ListItem` both document.
- **Out-of-range input is clamped, not trusted.** A `page` past the end selects the last page and disables "next" rather than rendering a bar with nothing selected.
- **The easing is clamped.** The highlight, the dots and the window shift all ease with `easeOutClamped` from `@/utils`, not plain `Easing.out(Easing.cubic)`. On web, Reanimated's first frame can be stamped just before the press, so progress starts slightly below 0 and the plain curve extrapolates it: recorded in web Storybook, every page change on five pages opened with a wrong-way frame, up to 43 px on a 0→236 slide. With the clamp, none.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
