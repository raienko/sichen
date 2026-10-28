[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Actions

# Share

> Opens the OS share sheet, and copies to the clipboard where there isn't one.

<sub>`src/components/share` · [Stories](index.stories.tsx) · Tests: [`content.test.ts`](content.test.ts), [`index.test.tsx`](index.test.tsx), [`share.test.ts`](share.test.ts)</sub>

```tsx
import Share from "@/components/share";

<Share content={{ url: order.url, title: "Order #12" }} />      // share icon
<Share content={{ url: order.url }} mode="copy" />              // copy icon
<Share content={{ url: order.url }} value="Share this order" /> // text button

// or drive it yourself, from anywhere
const outcome = await Share.share({ url });
await Share.copy(url);
```

A button that opens the OS share sheet, and copies to the clipboard where there isn't one.

- **It is an icon by default, and the glyph says which mode it is in** — a share glyph for the sheet, a copy glyph for the clipboard. They are different actions rather than two spellings of one, so they no more share a glyph than they share a label. It is also what this is nearly always wanted as: one control beside the thing being shared, not a word competing with it. Passing `value` turns it into a text button for the cases that need the action spelled out, and the accessible name is the localized "Share"/"Copy" either way — so the icon form is never an unnamed control.
- **The clipboard is not a consolation prize.** iOS and Android always have a share sheet. A browser has one only where the Web Share API exists — mobile Safari and Chrome, over HTTPS — and `react-native-web` maps `Share.share` straight onto `navigator.share`, rejecting with "Share is not supported in this browser" everywhere else. That is most desktop browsers, so on the web the clipboard is the _normal_ path rather than an edge case, which is why `copied` is one of four first-class outcomes rather than an error. Confirmed in the preview browser, which reports `navigator.share` as `undefined` and takes the fallback.
- **A dismissal never falls back to copying.** Someone who opened the sheet and closed it has decided not to share; quietly copying instead — and then announcing that it was copied — does the opposite of what they just asked for. The web reports that cancel by _rejecting_ with an `AbortError`, which is indistinguishable from a real failure unless the name is checked, so it is checked.
- **Four outcomes, not a boolean**, because the three that aren't `shared` mean different things: `dismissed` is the user's choice and nothing to apologise for, `copied` means they still got what they came for, and only `failed` is a failure. On Android the OS cannot tell a share from a dismissal and reports `shared` for both — a platform limit rather than something this papers over.
- **A copy is invisible unless something says so.** Nothing on screen changes when text reaches the clipboard; the only way to know it worked is to paste somewhere and look. So the confirmation `Toast` is on by default rather than opt-in, and `notify={false}` is for a caller showing its own feedback.
- **What gets copied is the URL, not the sentence around it.** The clipboard is nearly always on its way into an address bar, a chat box, or a QR generator, where "Check this out https://…" is wrong in a way the bare link never is. `title` is deliberately not in that chain either: it names the _sheet_ rather than the thing being shared, and react-native's own `Share` rejects content that is only a title — so treating it as a payload would make the runtime disagree with `ShareContent`, which already refuses to describe that case.
- **Nothing to share is a disabled button**, not a sheet that opens empty — reached by a URL that hasn't loaded yet far more often than by a caller getting it wrong.
- **`Share.share()` and `Share.copy()` are attached to the component**, the same shape `Toast` and `Image` use, so a screen with its own `IconButton` or menu item doesn't have to render this button to get the behaviour.
- `ShareContent` is written as two whole shapes rather than `{ title? } & (A | B)`. The intersection describes the same values but stops narrowing, so a check on `message` no longer tells the compiler which branch it is in — which is exactly what handing it to react-native's own union needs.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
