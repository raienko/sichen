import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import If from "@/components/if";
import Text from "@/components/text";
import { imageA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { encodeLinear, type LinearFormat } from "./linear";
import { encodeQr, type QrErrorCorrection } from "./qr";

export type { LinearFormat } from "./linear";
export type { QrErrorCorrection } from "./qr";
export { encodeQr, QR_QUIET_ZONE } from "./qr";
export { encodeLinear } from "./linear";

/** Every symbology this draws. `"qr"` is the two-dimensional one. */
export type BarcodeFormat = "qr" | LinearFormat;

/** How tall a linear barcode is drawn, relative to its width. */
const LINEAR_ASPECT = 0.32;
/** The quiet zone a linear symbol needs at each end, in modules. */
const LINEAR_QUIET_ZONE = 10;

type Props = {
  /**
   * What the code encodes. A URL, an order id, a product number — whatever
   * the scanner on the other side expects.
   */
  value: string;
  /**
   * Which symbology to draw. Required rather than defaulted: a component
   * called `Barcode` that silently produced a QR would be a surprise, and
   * one that silently produced `CODE128` would be a worse one.
   */
  format: BarcodeFormat;
  /**
   * What the code is for — "Boarding pass", "Order QR code". Required: a
   * grid of squares says nothing to a screen reader, and unlike most
   * pictures this one cannot be described by looking at it.
   */
  label: string;
  /** The drawn size, in points. Square for `"qr"`; the width for a linear code. */
  size?: number;
  /** QR only. Defaults to `"M"` — see `QrErrorCorrection`. */
  errorCorrection?: QrErrorCorrection;
  /**
   * Prints the value under a linear barcode, the way a product label does.
   * On by default: it is what lets a human key the number in when the
   * scanner will not read it. Ignored for QR, which has no such convention.
   */
  showValue?: boolean;
  /** Rendered when `value` cannot be encoded in `format` — see the note. */
  fallback?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A QR code or a linear barcode, drawn as vectors.
 *
 * ```tsx
 * <Barcode format="qr" value={order.url} label="Order QR code" />
 * <Barcode format="CODE128" value="PKG-4821" label="Package barcode" />
 * <Barcode format="EAN13" value="590123412345" label="Product barcode" />
 * ```
 *
 * **No native module, and no canvas.** Both symbologies are encoded in
 * plain JavaScript — `qrcode-generator` and `jsbarcode`'s own encoders,
 * used without their DOM renderers — and drawn with `react-native-svg`,
 * which this app already has. So it works on iOS, Android and the web from
 * the same code, with nothing to prebuild.
 *
 * **It stays black on white in both schemes.** A code is not a graphic the
 * user reads, it is a target a camera reads, and the scanner is the
 * audience. Inverting it for the dark scheme is a real risk rather than a
 * theoretical one: most QR decoders cope with a light-on-dark symbol, many
 * linear decoders do not, and the failure is silent — the code just never
 * scans, on someone else's phone. `scanSurface`/`onScanSurface` are the
 * palette's two entries that deliberately do not follow the scheme.
 *
 * **The quiet zone is drawn, not left to the caller's padding.** A scanner
 * finds a symbol by the blank border around it, so a code flush to the edge
 * of its container often will not read at all. It is the most common way a
 * hand-rolled code renderer fails, so the margin is part of the drawing.
 *
 * **Invalid input renders the `fallback`, never a wrong code.** Each
 * symbology has rules — `EAN13` is twelve digits plus a check, `CODE39` has
 * no lower case — and drawing something anyway produces a code that scans
 * as the wrong thing with nothing on screen to say so. The encoders are
 * asked first, and `null` means nothing is drawn.
 *
 * **A screen reader gets the value, not the picture.** The label names the
 * code and the encoded value is its hint, because someone who cannot see it
 * also cannot point a camera at it — the string is the only way they get
 * what it holds.
 *
 * @example <Barcode format="qr" value="https://example.com/t/9f2" label="Ticket" size={200} />
 * @example <Barcode format="CODE128" value="PKG-4821" label="Package" showValue={false} />
 */
export default function Barcode({
  value,
  format,
  label,
  size = 160,
  errorCorrection = "M",
  showValue = true,
  fallback = null,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  const surface = { backgroundColor: theme.colors.scanSurface };
  const ink = theme.colors.onScanSurface;

  const a11y = imageA11yProps({ label });
  // The value as the hint rather than folded into the name: a screen reader
  // reads the name first, so "Ticket" arrives before a forty-character URL
  // instead of after it.
  const describes = { ...a11y, accessibilityHint: value };

  if (format === "qr") {
    const matrix = encodeQr(value, errorCorrection);
    if (matrix === null) return <>{fallback}</>;

    return (
      <View
        testID={testID}
        {...describes}
        style={[styles.code, surface, { width: size, height: size }, style]}
      >
        {/* No a11y props of its own. The container is `role="img"` with a
            name, which makes it a leaf: native collapses its descendants
            into that one element, and the web exposes nothing inside an
            image. Spreading `disabledA11yProps()` here instead pushed
            react-native's own prop names straight through to the DOM
            <svg>, where React rejects `accessibilityElementsHidden` and
            `importantForAccessibility` outright — the same leak `WebView`
            hit with `maskType`. */}
        <Svg
          width="100%"
          height="100%"
          // The whole symbol including its quiet zone, so the modules are
          // drawn in module units and the viewBox does the scaling.
          viewBox={`0 0 ${matrix.extent} ${matrix.extent}`}
        >
          <Path d={matrix.path} fill={ink} />
        </Svg>
      </View>
    );
  }

  const encoded = encodeLinear(value, format);
  if (encoded === null) return <>{fallback}</>;

  const extent = encoded.extent + LINEAR_QUIET_ZONE * 2;
  const height = size * LINEAR_ASPECT;

  return (
    <View
      testID={testID}
      {...describes}
      style={[styles.code, surface, { width: size }, style]}
    >
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${extent} ${extent * LINEAR_ASPECT}`}
        preserveAspectRatio="none"
      >
        {encoded.bars.map((bar) => (
          <Rect
            key={bar.x}
            x={bar.x + LINEAR_QUIET_ZONE}
            y={0}
            width={bar.width}
            height={extent * LINEAR_ASPECT}
            fill={ink}
          />
        ))}
      </Svg>
      <If condition={showValue}>
        <Text
          value={encoded.text}
          type="caption2"
          style={[styles.value, { color: ink }]}
        />
      </If>
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  code: {
    borderRadius: radius.surface,
    // Sized by its own props, never stretched: a code drawn to whatever
    // width a container happens to be is a code at an unpredictable module
    // size, which is the other half of why scanners fail.
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  value: {
    paddingBottom: spacing.x4,
    // The human-readable line is part of the label, not a caption under it,
    // so it sits inside the same white field as the bars.
    textAlign: "center",
  },
}));
