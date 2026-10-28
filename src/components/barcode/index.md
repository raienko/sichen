[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# Barcode

> A QR code or linear barcode, drawn as vectors.

<sub>`src/components/barcode` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`linear.test.ts`](linear.test.ts), [`qr.test.ts`](qr.test.ts)</sub>

```tsx
import Barcode from "@/components/barcode";

<Barcode format="qr" value={order.url} label="Order QR code" />
<Barcode format="CODE128" value="PKG-4821" label="Package barcode" />
<Barcode format="EAN13" value="590123412345" label="Product barcode" />
```

A QR code or a linear barcode, drawn as vectors. `format` covers `qr` plus `CODE128`, `CODE39`, `EAN13`, `EAN8`, `UPC`, `ITF14` and `codabar`.

- **No native module and no canvas.** Both symbologies are encoded in plain JavaScript — `qrcode-generator`, and `jsbarcode`'s own encoders used _without_ their DOM renderers — then drawn with `react-native-svg`, which the app already has. So iOS, Android and the web run the same code with nothing to prebuild, unlike the two components before it. The encoders are pure and separately tested; the component is the thin part.
- **It stays black on white in both schemes.** A code is not a graphic the user reads, it is a target a camera reads, and the scanner is the audience. Inverting it for dark mode is a real risk rather than a theoretical one: most QR decoders cope with a light-on-dark symbol, many linear decoders do not, and the failure is silent — the code simply never scans, on someone else's phone, where nobody testing the app will see it. `scanSurface`/`onScanSurface` are the palette's entries that deliberately do not follow the scheme, the same exception `mediaSurface` makes.
- **The quiet zone is part of the drawing.** A scanner finds a symbol by the blank border around it, so a code flush to the edge of its container frequently will not read at all — the most common way a hand-rolled code renderer fails. Four modules for QR (what the spec requires), ten for a linear symbol, both baked in rather than left to a caller's padding.
- **Invalid input renders the `fallback`, never a wrong code.** Each symbology has rules — `EAN13` is twelve digits plus a computed check, `CODE39` has no lower case — and drawing something anyway produces a code that scans as the wrong thing with nothing on screen to say so. The encoders are asked first and `null` means nothing is drawn.
- **`flat: true` is not optional when calling those encoders**, and finding out why is what the tests are for. Without it the EAN/UPC family returns a _segmented_ encoding — guard bars and halves as separate pieces for a renderer that positions them — and the top-level `data` is the three modules of the first guard. That drew three bars where a barcode should be, and was caught only because a test asserted EAN13's check digit and found the text missing too.
- **One path for a QR, runs for a barcode.** A dense QR is 57×57 — around three thousand modules, half of them dark — so every module is a subpath of a single `<Path>` rather than its own `<Rect>`. A linear symbol collapses adjacent dark modules into one bar, turning a hundred-odd modules into a couple of dozen rects.
- **A screen reader gets the value, not the picture.** `label` names the code and the encoded value is its `accessibilityHint`, because someone who cannot see it also cannot point a camera at it — the string is the only way they get what it holds. The drawing declares no accessibility props of its own: the container is one element, and `react-native-svg` forwards unknown props straight to the DOM `<svg>` on the web, where React rejects react-native's spellings of them (caught in the console, the same leak `WebView` hit with `maskType`).
- **`format` is required rather than defaulted.** A component called `Barcode` that silently produced a QR would be a surprise, and one that silently produced `CODE128` would be a worse one.
- Verified by decoding what it drew: the browser's own `BarcodeDetector` reads the rendered QR back as `https://example.com/order/12` and the rendered CODE128 back as `PKG-4821`.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
