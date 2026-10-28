[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# ColorPicker

> A colour picked freely: a saturation/brightness square, a hue bar and optional preset swatches.

<sub>`src/components/color-picker` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import ColorPicker from "@/components/color-picker";

<ColorPicker value={color} onChange={setColor} />
<ColorPicker value={color} onChange={setColor} presets={["#3F5BD9", "#E4002B", "#00A86B"]} />
```

For a form field, use `<Input type="color">`. It wraps this in a bottom sheet, adds a hex field, and only reports a colour on "Done".

- **Built in-house, the same everywhere.** Expo UI only has a native colour picker on iOS (SwiftUI's), so this draws its own: three SVG layers for the square (the pure hue, a white wash across it, a black wash down it) and a gradient for the hue bar. Dragging uses RN's responder system, the same choice as the custom `Slider`, so iOS, Android and the web behave alike.
- **It reports every change, mid-drag included**, as `#RRGGBB` in upper case, so whatever previews the colour follows the finger. Stage it yourself if you want a commit step; `Input`'s `color` type does exactly that.
- **It keeps the colour as HSV itself.** Hex has no hue for greys and black, so re-deriving from `value` on every render would snap the hue bar back to red whenever the square is dragged into a corner. A `value` that changes from outside (a preset, a hex field, the caller) is adopted; the echo of its own last change isn't.
- **The thumb is white with a black edge**, the palette's fixed `scanSurface`/`onScanSurface` pair. It sits over every possible colour, and any themed colour would vanish against part of the field.
- **The square and bar are laid out left to right in every locale.** They're colour fields, not text, and every colour tool draws them that way round.
- **Accessible as two sliders.** The square is a slider for brightness, with saturation read out alongside; the hue bar is a slider in degrees. Both take screen-reader increment/decrement and the arrow keys on the web (left/right saturation and up/down brightness on the square). For precise values, the hex field in `Input type="color"` is the way in that doesn't need dragging.
- **Hex in and out** goes through `normalizeHex` (exported): three or six digits, `#` optional. Eight-digit hex is refused, the same as for the brand colours, because `#RRGGBBAA` on the web and `#AARRGGBB` on Android are two colours for one string.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
