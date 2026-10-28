[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Overlays

# Popup

> A small dialog: confirm, acknowledge, or ask for one line of text.

<sub>`src/components/popup` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Popup from "@/components/popup";

<Popup id="delete" title="Delete item?" message="This can't be undone." onConfirm={remove} />
<Popup id="saved" type="alert" title="Changes saved" />
<Popup id="rename" type="prompt" title="Rename" inputLabel="Name" defaultValue={name} onConfirm={rename} />

await Popup.show("delete");
await Popup.hide("delete");
```

- **`type` sets the contract, not only the look.** `popup` has Confirm and Cancel. `alert` has a single OK and its types forbid `onCancel`. `prompt` manages a text field and passes its value to `onConfirm(value)`; `inputLabel` is required there.
- **Opened by id.** `Popup.show(id)` and `Popup.hide(id)` reach the mounted instance anywhere in the tree, with no ref needed. Both resolve once the animation has finished. The prompt resets to `defaultValue` each time it opens.
- **Callbacks run after the popup has closed.** A confirm handler can therefore open another native surface (a picker, a share sheet) without it being dismissed along with the outgoing modal. Buttons are disabled while an action runs. A throwing callback is logged rather than left unhandled.
- **Built on [`Modal`](../modal/index.md)** (`type="popup"`), so backdrop dismiss, focus and reduced motion come from there. `children` go between the message and the actions.
- Button labels default to the localized `common.confirm`, `common.cancel` and `common.ok`. Override them with `confirmLabel` and `cancelLabel`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
