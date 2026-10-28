/**
 * `jsbarcode` ships no types for its individual encoders — only for the
 * `JsBarcode(element, value, options)` entry point, which needs a DOM node
 * to draw into and is therefore no use here.
 *
 * The encoders underneath it are plain classes that turn a value into a
 * string of `1`s and `0`s with no renderer involved, which is exactly what
 * this component wants: the bars are drawn with `react-native-svg`, on
 * every platform, with no canvas and no native module. This declares the
 * shape of that submodule so importing it isn't an implicit `any`.
 */
declare module "jsbarcode/bin/barcodes" {
  type Encoded = { text: string; data: string };

  type BarcodeEncoder = new (
    value: string,
    options: Record<string, unknown>,
  ) => {
    /** Whether this format can encode the value at all — see encodeLinear. */
    valid: () => boolean;
    /** One segment, or several for the formats that support an add-on. */
    encode: () => Encoded | Encoded[];
  };

  const barcodes: Record<string, BarcodeEncoder>;
  export default barcodes;
}
