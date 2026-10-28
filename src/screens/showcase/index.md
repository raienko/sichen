[Docs](../../../docs/index.md)

# The showcase app

> The app is a living catalogue: one collapsible section per feature or component, so everything documented here can be seen running.

<sub>`src/screens/showcase` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx)</sub>

The app itself is a **showcase**: one collapsible section per feature or component, so everything below can be seen running rather than only read about. Sections are listed alphabetically by their title in the active language (sorted with that language's own collation), so the list stays in order after switching languages.

| Section           | What it demonstrates                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Typography        | All 11 type-scale entries at their own size, with the title sizes as real headings                                     |
| Markdown          | A rendered document taking the app's type scale and palette, with an editable source                                   |
| Web view          | The bridge both ways, the app's typography inside a page, and the theme switchable live                                |
| Theme & colors    | `ThemeSwitcher`, the resolved scheme/preference, and a swatch per palette key                                          |
| Localization      | `LocaleSwitcher`, a translated sentence, and the resolved locale/RTL state                                             |
| Accessibility     | A live readout of every OS flag, `fontScale`, and `duration()`                                                         |
| Responsive units  | Window size, breakpoint, `units(16)`, the spacing scale drawn to width, named sizes                                    |
| Grid              | 12-column spans, per-breakpoint spans that reflow on resize, and a tile grid                                           |
| Spacer            | A gap between two blocks, switchable across all three directions and the spacing scale                                 |
| Divider           | Both orientations, a labelled rule, and the inset switchable against a list                                            |
| Icons             | One glyph from each of the five families, the custom SVG set, colour and size overrides                                |
| Buttons           | The full type × size matrix, a real segmented control (so `selected` moves), and a disabled row                        |
| Tags              | All three shapes, both sizes, the two-control tag, disabled, and truncation                                            |
| Badges            | Every type, the count formatting and its zero case, the dot, and where a badge sits                                    |
| Avatars           | The fallback stack, the sizes switchable live, the status dot, and awkward names                                       |
| Stepper           | The limits disabling their own button, a fractional step, the sizes, and the typing alternative                        |
| Skeleton          | A card and a list of rows from one file, the children form beside them, and the pulse switchable live                  |
| Chart             | The three forms switchable live, the theme series palette, and the sentence it reads out                               |
| Barcode           | A live-editable QR, the linear formats switchable, and an invalid value falling back                                   |
| Timer             | A countdown with its ring, a stopwatch, the formats, and pause                                                         |
| Progress          | A live determinate bar, custom value wording, and the indeterminate state                                              |
| Segmented control | Both implementations side by side, a disabled option, and a disabled control                                           |
| Color picker      | The picker on its own with presets, and its value read out live                                                        |
| API               | The request client and TanStack Query: a persisted query, a mutation echoing the headers sent, and an `ApiError`       |
| Header            | All three zones, uneven slots staying centred, a component in the middle, notch padding                                |
| Tab bar           | Both variants over a scrolling stage, with the reserved space switchable live                                          |
| Inputs            | Text, textarea, numeric, email, password, code, phone, select and date/time variations                                 |
| Form field        | A Slider and a Stepper framed like inputs, a required/optional hint, and an error that announces itself                |
| Images            | A source that loads, one that's empty, one that fails, a custom fallback, and the cache controls                       |
| Cards             | The three types, the case that tells them apart, a pressable card, edge-to-edge content                                |
| Section           | A settings group, an action beside a title, a form footer, and levels that count themselves                            |
| List items        | Pressable rows with both slots filled, a row holding its own control, truncation                                       |
| List              | 200 rows with a handful mounted, and the default renderer swapped for a custom one                                     |
| Carousel          | Slides with pagination you can switch off live, and the position it announces                                          |
| Pagination        | A paged list, the window and its gaps, the compact form, the dots, and the one-page case                               |
| Media player      | Video and audio behind one transport, switchable live, with native controls as an escape hatch                         |
| Image picker      | A pressable trigger and the static API — a camera/gallery sheet on native, the file dialog on web                      |
| File picker       | A drop-zone trigger, the static API, and the `type="file"` field built on the same picker                              |
| Modals            | All four types, opened by `id` _and_ by ref, with `onShow`/`onClose` shown live                                        |
| Share             | The two icons, the text form, the copy fallback, and all four outcomes reported                                        |
| Alerts            | Every type, a title with an action that updates its message, and one that can be dismissed                             |
| Permissions       | Persisted camera, gallery and notification permission state and actions                                                |
| Deep links        | Dispatching a link by URL, the registered patterns, and a gate holding one back                                        |
| Storage           | A `LocalValue` stepper and imperative get/set/reset, plus a `SecureValue` with reactive reads and awaited deletion UI  |
| Logger            | Every logger method and structured metadata                                                                            |
| Utilities         | `If` toggling content, `Match` cycling four states, and a scoped event bus emitting and counting pings                 |
| Forms             | A sign-up form: zod rules, translated errors, focus on the first invalid field.                                        |
| Formatting        | Dates, numbers, money and sizes in the active language, and what the device reports.                                   |
| Network           | The connection as the app sees it, live — toggle airplane mode or Wi-Fi to watch it change.                            |
| Haptics           | Every kind of feedback, plus the setting that turns them all off. Felt on a phone; silent on web and in the simulator. |

Each section is its own file under `src/screens/showcase/sections/`. They're screen-local — the showcase is their only consumer — but split for the same reason `Modal`'s internals are: one file per concern beats one large screen file. The section list itself is a table in `screens/showcase/index.tsx`, so adding one is an entry there plus a file.

Section titles are translated; the labels _inside_ sections mostly aren't, on purpose — token names, flag names, and icon family names are identifiers, not copy, and translating `sizes.elementHeightMd` would make it harder to match against the code it names.

---

[Docs index](../../../docs/index.md)
