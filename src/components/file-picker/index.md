[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# FilePicker

> Wraps any trigger in a pressable that opens the system file browser.

<sub>`src/components/file-picker` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import FilePicker from "@/components/file-picker";

<FilePicker
  id="attachment"
  onChange={setFile}
  options={{ type: "application/pdf" }}
>
  <Text value="Choose a file" />
</FilePicker>;

FilePicker.open("attachment"); // from anywhere, no ref needed
```

Wraps whatever you give it in a pressable that opens the system file browser, and reports the chosen file. Built on `expo-document-picker`.

- **Simpler than `ImagePicker`, because the platform is.** There's no camera to offer as an alternative and no permission to request first, so there's no chooser sheet in between — a press goes straight to the system UI on every platform, which is the shape `ImagePicker` only has on web.
- **`multiple` is fixed, not forwarded.** `onChange` reports one asset, so a caller never has to narrow between one file and several. A multi-select picker would be a different component.
- **Mounted without `children` it's headless**: it renders nothing and only answers to `FilePicker.open(id)`. That's not a curiosity — it's how `Input`'s `file` variation drives it, since a pressable field can't be nested inside a pressable wrapper (React Native has no touch bubbling; the inner one wins).
- **`FilePicker.open(id)` is synchronous and returns nothing**, unlike `Modal.show`. Browsers only allow a file dialog to open from the user activation that asked for it, so it has to run inside the press handler that called it with nothing awaited first; the chosen file arrives through that instance's `onChange` exactly as it does for a press. Verified in the browser across all four entry points — the component's own trigger, the static, the field, and a PDF-restricted field — each opening one `<input type="file" multiple="false">` with the right `accept`.
- **A press while the browser is already open is ignored**, so two pickers can't stack; the one the user is looking at wins.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
