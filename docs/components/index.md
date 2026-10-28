[Docs](../index.md) › Components

# Components

> Each component's guide lives next to its code, as `src/components/<name>/index.md`, beside its story and test. It is imported through its folder: `import Button from "@/components/button"`.

See them running in the [showcase app](../../src/screens/showcase/index.md) or in Storybook (`yarn storybook:web`).

**Categories:** [Actions](#actions) · [Forms & input](#forms--input) · [Feedback & status](#feedback--status) · [Navigation](#navigation) · [Overlays](#overlays) · [Layout & structure](#layout--structure) · [Lists](#lists) · [Display & identity](#display--identity) · [Media & rich content](#media--rich-content) · [Utilities](#utilities)

## Actions

Things you press to make something happen.

| Component                                                   | What it's for                                                                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [**Button**](../../src/components/button/index.md)          | The one pressable action: `primary`, `secondary` or `tertiary`, in three sizes, with loading, selected and pressed states. |
| [**BackButton**](../../src/components/back-button/index.md) | The back affordance for a screen that draws its own header, with a fallback route when there's no history.                 |
| [**Share**](../../src/components/share/index.md)            | Opens the OS share sheet, and copies to the clipboard where there isn't one.                                               |

## Forms & input

Fields, the frame around them, and controls for picking values.

| Component                                                               | What it's for                                                                                                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Input**](../../src/components/input/index.md)                        | One field component, switched by `type`: text, textarea, numeric, email, password, code, phone, select, date/time, colour, file, groups and ranges. |
| [**FormField**](../../src/components/form-field/index.md)               | The label, helper and error frame around any control, with a required/optional hint and a counter.                                                  |
| [**Stepper**](../../src/components/stepper/index.md)                    | A number with − and + either side: quantities, party sizes, small counts.                                                                           |
| [**SegmentedControl**](../../src/components/segmented-control/index.md) | A row of mutually exclusive options, for switching between a few views or modes.                                                                    |
| [**FilePicker**](../../src/components/file-picker/index.md)             | Wraps any trigger in a pressable that opens the system file browser.                                                                                |
| [**Checkbox**](../../src/components/checkbox/index.md)                  | A labelled on/off choice that stands on its own; custom or Expo UI indicator.                                                                       |
| [**Switch**](../../src/components/switch/index.md)                      | A setting that is on or off and takes effect immediately.                                                                                           |
| [**RadioButton**](../../src/components/radio-button/index.md)           | One option of a set; usually used through `<Input type="radioGroup">`.                                                                              |
| [**Slider**](../../src/components/slider/index.md)                      | A value or a range, picked by dragging; one or more thumbs.                                                                                         |
| [**ColorPicker**](../../src/components/color-picker/index.md)           | A colour picked freely: saturation/brightness square, hue bar, optional presets.                                                                    |
| [**ImagePicker**](../../src/components/image-picker/index.md)           | Wraps any trigger to pick one image from the camera or the library.                                                                                 |
| [**ThemeSwitcher**](../../src/components/theme-switcher/index.md)       | Light, dark or system appearance, persisted.                                                                                                        |
| [**LocaleSwitcher**](../../src/components/locale-switcher/index.md)     | The app language as one select field, each language in its own name.                                                                                |

## Feedback & status

Telling people what's happening — persistent alerts, progress, loading placeholders and timers.

| Component                                                     | What it's for                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**Alert**](../../src/components/alert/index.md)              | A message that stays in the page until its cause goes away — offline, unverified email, failed save. |
| [**ProgressBar**](../../src/components/progress-bar/index.md) | How far along a task is, determinate or indeterminate.                                               |
| [**Skeleton**](../../src/components/skeleton/index.md)        | A loading placeholder drawn from your own artwork, with a travelling highlight.                      |
| [**Timer**](../../src/components/timer/index.md)              | A countdown or stopwatch, with an optional progress ring.                                            |
| [**Toast**](../../src/components/toast/index.md)              | A short, self-dismissing report on something that just happened.                                     |
| [**StateView**](../../src/components/state-view/index.md)     | Loading, empty, error, success or offline — inline or as a global overlay.                           |
| [**Spinner**](../../src/components/spinner/index.md)          | An indeterminate loading indicator, announced unless a parent owns the busy state.                   |

## Navigation

Headers, tab bars and moving between pages of content.

| Component                                                  | What it's for                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| [**Header**](../../src/components/header/index.md)         | A screen's top bar: leading slot, title or custom centre, trailing slot. |
| [**TabBar**](../../src/components/tab-bar/index.md)        | Bottom tabs for an Expo Router `Tabs` navigator, docked or floating.     |
| [**Pagination**](../../src/components/pagination/index.md) | Where am I, and take me to another page — numbered or as dots.           |

## Overlays

Content that sits above the screen — popups, bottom sheets, action sheets and fullscreen modals.

| Component                                        | What it's for                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [**Modal**](../../src/components/modal/index.md) | Popup, bottom sheet, action sheet or fullscreen overlay, with animated enter and exit. |
| [**Popup**](../../src/components/popup/index.md) | A small dialog: confirm, acknowledge, or prompt for one line of text.                  |

## Layout & structure

Screens, grouping and spacing primitives.

| Component                                                 | What it's for                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [**Screen**](../../src/components/screen/index.md)        | The page container: `default` (header, footer, aside around the content, optionally scrolling) or `centered`, and it owns the safe areas. |
| [**Section**](../../src/components/section/index.md)      | A titled group — settings, a fieldset, a list with a “See all” action.                                                                    |
| [**Card**](../../src/components/card/index.md)            | A raised, outlined or filled surface for grouping content.                                                                                |
| [**Accordion**](../../src/components/accordion/index.md)  | A titled section that collapses and expands.                                                                                              |
| [**Grid**](../../src/components/grid/index.md)            | 12-column rows and cells, with spans that change per breakpoint.                                                                          |
| [**Divider**](../../src/components/divider/index.md)      | A hairline between rows, form sections or columns, optionally labelled.                                                                   |
| [**Spacer**](../../src/components/spacer/index.md)        | An explicit gap from the spacing scale, or room kept clear of the keyboard, tab bar or safe area — a list takes the tallest.              |
| [**StatusBar**](../../src/components/status-bar/index.md) | The status bar's colour and visibility — follows the app theme, overridable per screen.                                                   |

## Lists

Virtualised lists and the rows that go in them.

| Component                                               | What it's for                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [**List**](../../src/components/list/index.md)          | A virtualised list (Legend List) that recycles rows instead of mounting one view each. |
| [**ListItem**](../../src/components/list-item/index.md) | One row: leading slot, title and subtitle, trailing slot.                              |

## Display & identity

Icons, images, people and labels.

| Component                                              | What it's for                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [**Icon**](../../src/components/icon/index.md)         | Five vector-icon families plus the app's own SVG set, themed by default.                                        |
| [**Image**](../../src/components/image/index.md)       | `expo-image` with a themed placeholder, a fallback on error and cache controls.                                 |
| [**Avatar**](../../src/components/avatar/index.md)     | A person or thing as a picture, initials or icon, with an optional status dot; `Avatar.Group` overlaps several. |
| [**Badge**](../../src/components/badge/index.md)       | A small status marker: an unread count, a label, or a dot.                                                      |
| [**Tag**](../../src/components/tag/index.md)           | A short label: static, selectable as a filter, or removable.                                                    |
| [**Markdown**](../../src/components/markdown/index.md) | Markdown rendered as native text in the app's type scale and palette.                                           |
| [**Text**](../../src/components/text/index.md)         | All app text: type scale, theme colour, direction and heading semantics.                                        |

## Media & rich content

Video, audio, carousels, charts, maps, scannable codes and embedded web pages.

| Component                                                     | What it's for                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [**MediaPlayer**](../../src/components/media-player/index.md) | Video or audio with app-owned controls.                                                |
| [**Carousel**](../../src/components/carousel/index.md)        | Swipeable slides with accessible pagination.                                           |
| [**Chart**](../../src/components/chart/index.md)              | Line, area and bar charts (Skia on native, SVG on web) with an accessible summary.     |
| [**ImageViewer**](../../src/components/image-viewer/index.md) | Full-screen pictures: pinch and double-tap zoom, swipe to page, swipe down to close.   |
| [**Map**](../../src/components/map/index.md)                  | Places on a map in the app theme, with Directions handed to the platform map app.      |
| [**Barcode**](../../src/components/barcode/index.md)          | A QR code or linear barcode, drawn as vectors.                                         |
| [**WebView**](../../src/components/web-view/index.md)         | An embedded web page with a two-way event bridge and the app's typography.             |
| [**Chat**](../../src/components/chat/index.md)                | A message thread and composer: grouping, receipts, attachments, reactions and actions. |

## Utilities

Declarative conditionals and platform constants.

| Component                                        | What it's for                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**If**](../../src/components/if/index.md)       | Render children only when a condition is true.                                                                                                                |
| [**Match**](../../src/components/match/index.md) | `switch`/`case` as JSX, for more than two outcomes.                                                                                                           |
| [**Utilities**](../../src/utils/index.md)        | `isWeb`/`isIOS`/`isAndroid`, `isE2E`, time spans (`seconds(17)`, `days(30)`), `wait`, common hooks (`useDebouncedValue`, `useInterval`, …), `easeOutClamped`. |

## Internal

Building blocks other components share. They are marked `internal` in [`src/components/manifest.json`](../../src/components/manifest.json), and ESLint keeps them out of screens, root, app and features.

| Component                                                                | What it's for                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [**BinaryControlRow**](../../src/components/binary-control-row/index.md) | The labelled press target shared by Checkbox, Switch and RadioButton. |
| [**ExpoUIHost**](../../src/components/expo-ui-host/index.md)             | The theme boundary every `@expo/ui` control renders inside.           |

## Definition of done

[`src/components/manifest.test.ts`](../../src/components/manifest.test.ts) fails when a component folder is missing from the manifest, or when a component lacks its `index.md`, a test, a row in this catalogue, or (if public) a story.
