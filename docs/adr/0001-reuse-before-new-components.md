[Docs](../index.md) › [Decisions](README.md)

# 0001. Reuse before new components

<sub>Status: **Accepted** · 2026-09-06</sub>

## Context

Fifteen components shipped in two days, five of them outside the planned queue. Without a written list of what already exists and what each request should reuse, the kit grows parallel primitives: two tab systems, two dialog stores, a demo `Counter` next to a production `Stepper`.

## Decision

A new component request is first checked against the inventory and the table below. It extends the existing component unless a measured limitation is documented.

### Existing inventory

| Capability            | Existing implementation                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations/layout    | Text, Icon, Image, Card, **Section**, Accordion, Row/Column/Cell grid, Spacer, **Divider**, Screen, Header                                                |
| Actions/navigation    | Button, IconButton, BackButton, TabBar/NavigationTabBar, **Share**                                                                                        |
| Selection             | Checkbox, RadioButton, Switch, Slider, SegmentedControl, **Stepper**                                                                                      |
| Inputs                | Text, **textarea**, numeric, email, password, phone, verification code, select, date/time, checklist, radio group, switch group, single/multi-thumb range |
| Feedback              | Spinner, ProgressBar, StateView, Toast, **Alert**, **Skeleton**, **Timer**                                                                                |
| Overlays              | Modal with popup/bottom-sheet/actions/fullscreen modes; Popup with alert/confirm/prompt                                                                   |
| Media                 | Image, ImagePicker, **FilePicker**, MediaPlayer                                                                                                           |
| Content               | Carousel with its own accessible pagination, Markdown, **Chart**, **Barcode**, **WebView**, **Chat**                                                      |
| Identity/status       | **Avatar** (+ `Avatar.Group`), **Badge**, **Tag**                                                                                                         |
| App/example utilities | LocaleSwitcher, ThemeSwitcher, If                                                                                                                         |

### Requested capability → what to use

| Requested capability                | Use/extend                                                                                                     | Do not create                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon-only action                    | Existing `IconButton`                                                                                          | A second icon-button primitive                                                                                                                           |
| Empty/loading/error page            | Existing `StateView` with product copy/children                                                                | Separate EmptyState, ErrorState, and LoadingState components                                                                                             |
| Temporary notification              | Existing `Toast`                                                                                               | Snackbar with the same lifecycle                                                                                                                         |
| Alert/confirm/prompt                | Existing `Popup` over `Modal`                                                                                  | Separate AlertDialog and ConfirmDialog stores                                                                                                            |
| Component-local action/bottom sheet | Existing `Modal` `actions`/`bottomSheet` modes                                                                 | Another gesture sheet library without a measured limitation                                                                                              |
| Overlapping avatars                 | `Avatar.Group` / `AvatarGroup` in `@/components/avatar` (added 2026-10-15)                                     | A separate avatars-group component folder                                                                                                                |
| Chat empty thread / chat sub-parts  | `Chat.EmptyState` composes `StateView`; other chat parts are `Chat.*` statics in one folder (added 2026-10-15) | A chat-only EmptyState primitive, or chat parts as separate public components                                                                            |
| Full-screen image lightbox          | `ImageViewer`, over `Modal` type `immersive` (added 2026-10-15)                                                | A second overlay or a gesture-sheet library for media                                                                                                    |
| Route-owned modal/form sheet        | Expo Router presentation pattern U17                                                                           | Stretching global Modal into a navigation framework                                                                                                      |
| Search field                        | Input composition U10 or native route header search                                                            | A third unrelated search input                                                                                                                           |
| Single/multi select                 | Existing Select/Checklist/RadioGroup                                                                           | New Picker/MultiSelect until search/scale requires Combobox                                                                                              |
| Date/time and numeric range         | Existing DateTimeInput and RangeInput                                                                          | A second picker/slider facade                                                                                                                            |
| Tabs                                | Existing TabBar or a deliberate native-tabs migration                                                          | Two tab systems controlling the same route                                                                                                               |
| Carousel page dots                  | `Pagination` with `variant="dots"` — **decision reversed 2026-09-06**                                          | A second dot implementation. The shared one takes the carousel's `progress` shared value, so reuse kept the drag-linked animation instead of costing it. |
| Counter/stepper                     | `Stepper` — `Counter` was removed 2026-09-26                                                                   | A public demo Counter and a separate production Stepper                                                                                                  |
| Routed screen header                | Expo Router/React Navigation header when suitable                                                              | Custom Header on every route; retain Header for standalone surfaces and explicit custom layouts                                                          |

## Consequences

- `Counter` was removed on 2026-09-26; `Stepper` covers its behaviour. The storage showcase and `LocalValue` story now bind a `Stepper` to a `LocalValue`.
- The Carousel-dots row records a reversal: `Pagination` with `variant="dots"` is the shared implementation.
