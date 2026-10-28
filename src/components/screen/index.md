[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Layout & structure

# Screen

> The page container, in two layouts: `default` (header, footer, aside around the content) and `centered`.

<sub>`src/components/screen` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Screen from "@/components/screen";

<Screen scrollable header={<Header title="Orders" />}>…</Screen>

<Screen
  scrollable
  header={<Header title="New address" left={<BackButton />} />}
  footer={<Button value="Save" type="primary" />}
>…</Screen>

<Screen padded={false} header={<Header title="Contacts" />}>
  <List data={contacts} />
</Screen>

<Screen scrollable header={<Header title="Inbox" />} aside={wide ? <SectionsNav /> : undefined}>…</Screen>

<Screen layout="centered" header={<Header left={<BackButton />} />} footer={<ResendLink />}>…</Screen>
```

Every route renders into a `Screen`. It paints the background, places the slots, and owns the safe areas, so nothing inside it has to think about the notch.

| Layout     | Slots                                                      | For                                                                                                |
| ---------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `default`  | `header`, `footer`, `aside`, all optional; content scrolls | Almost every screen: detail pages, forms, lists, tab screens, wide screens with section navigation |
| `centered` | `header`, `footer`, optional; content centred              | Sign-in, empty and confirmation screens                                                            |

- **Safe areas belong to `Screen`.** The top inset goes above the header, or above the content when there is none; the bottom inset goes below the footer, or below the content; an aside takes both for itself. Pass `Header` **without** `avoidNotch`, or the notch is cleared twice.
- **Only the content scrolls**, and only with `scrollable`. Header, footer and aside are pinned. On iOS the footer rises with the keyboard, so a form's actions stay reachable while typing. (Android keyboard behaviour has not been verified on a device yet.)
- **`aside` is drawn whenever it's passed.** There is deliberately no breakpoint prop: the screen decides, e.g. `aside={useBreakpoint() === "phone" ? undefined : <Nav />}`, which keeps what you see in the code what you see on screen. It sits at the reading start edge (the right in RTL), runs full height, and is `sizes.asideWidth` wide; header and footer span only the content column beside it.
- **`scrollable` is off by default.** Turn it on for content that can outgrow the window. Leave it off for content that scrolls itself — a `List` — so a virtualised list never ends up inside a ScrollView, and for screens that fit, so they don't rubber-band. **`padded={false}`** drops the standard `spacing.x16` padding for edge-to-edge content.
- **`centered`** still scrolls when its content outgrows the window (a small phone at a large text size), and caps the column at `sizes.elementWidthLg` so a sentence and a full-width button read well on a tablet. Its types reject `aside`, `scrollable` and `padded`.
- **Tab screens** end their content with [`<Spacer size="tab-bar" />`](../spacer/index.md). The bar belongs to the `Tabs` navigator, not to the screen, and the spacer reserves only the bar itself because `Screen` already clears the home indicator. `<Spacer size={["tab-bar", "keyboard"]} />` also grows with the keyboard when it opens over the bar.
- **`style`** applies to the content area, not the whole screen — the showcase caps its column at `contentMaxWidth` that way.
- A full-bleed media screen with details over it is not a `Screen` layout: draw the media and put the details in a `Modal` of type `bottomSheet`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
