import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Barcode",
  component: Component,
};

export default meta;

export const Qr = () => (
  <Component
    format="qr"
    value="https://example.com/order/12"
    label="Order QR code"
    size={200}
  />
);

/** Higher correction for a code something will be drawn over. */
export const QrHighCorrection = () => (
  <Component
    format="qr"
    value="https://example.com/order/12"
    label="Order QR code"
    errorCorrection="H"
    size={200}
  />
);

export const Code128 = () => (
  <Component format="CODE128" value="PKG-4821" label="Package" size={260} />
);

/** EAN13 computes its own check digit — thirteen printed for twelve typed. */
export const Ean13 = () => (
  <Component format="EAN13" value="590123412345" label="Product" size={260} />
);

export const WithoutPrintedValue = () => (
  <Component
    format="CODE128"
    value="PKG-4821"
    label="Package"
    showValue={false}
    size={260}
  />
);

export const Formats = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Component format="CODE39" value="ABC123" label="CODE39" size={240} />
      <Component format="EAN8" value="9638507" label="EAN8" size={240} />
      <Component
        format="ITF14"
        value="1234567890123"
        label="ITF14"
        size={240}
      />
      <Component
        format="codabar"
        value="A123456789B"
        label="Codabar"
        size={240}
      />
    </View>
  );
};

/** An invalid value draws nothing rather than a code that scans wrong. */
export const Invalid = () => (
  <Component
    format="EAN13"
    value="not-a-product-code"
    label="Product"
    fallback={<Text value="Not a valid EAN13 value." type="caption1" />}
  />
);

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x16,
  },
}));
