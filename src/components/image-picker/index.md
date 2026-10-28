[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# ImagePicker

> Wraps any trigger to pick one image from the camera or the library.

<sub>`src/components/image-picker` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ImagePicker from "@/components/image-picker";

<ImagePicker
  id="avatar"
  accessibilityLabel="Change photo"
  onChange={(image) => upload(image.uri)}
  options={{ allowsEditing: true, aspect: [1, 1] }}
>
  <Avatar source={photo} />
</ImagePicker>;

await ImagePicker.show("avatar");
```

- **Native shows a chooser sheet** (Gallery / Camera) in a bottom-sheet `Modal`. The sheet closes before the system picker opens, so the OS doesn't dismiss both. Camera permission goes through `permissions.camera` and is requested only when needed.
- **Web goes straight to the file dialog.** A desktop browser has no camera to offer, and browsers only open a file dialog from the user gesture that asked for it. So both the press and `ImagePicker.show(id)` reach `launchImageLibraryAsync` synchronously, through the picker's own event bus.
- **One image, images only.** `options` accepts the rest of `ImagePickerOptions`. Multiple selection and media type are fixed. A cancelled pick calls nothing. A failure is logged, and the next press can try again.
- The trigger announces `expanded` while the native sheet is open. Give it an `accessibilityLabel`, because its children are often just an image.
- The sheet's title and buttons are localized under `imagePicker.*`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
