import { useState } from "react";
import { View } from "react-native";

import Barcode, { type BarcodeFormat } from "@/components/barcode";
import Input from "@/components/input";
import SegmentedControl from "@/components/segmented-control";
import Section from "@/components/section";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

const LINEAR: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "CODE128" },
  { value: "EAN13", label: "EAN13" },
  { value: "CODE39", label: "CODE39" },
];

const SAMPLE: Partial<Record<BarcodeFormat, string>> = {
  CODE128: "PKG-4821",
  EAN13: "590123412345",
  CODE39: "ABC123",
};

/** Both symbologies, the validation, and why they stay black on white. */
export default function BarcodeSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [url, setUrl] = useState("https://example.com/order/12");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [value, setValue] = useState("PKG-4821");

  return (
    <View style={styles.container}>
      <Text
        value="A QR code or a linear barcode, encoded in plain JavaScript and drawn with react-native-svg — no native module and no canvas, so the same code runs on iOS, Android and the web."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Section title="QR">
        <Input
          type="text"
          label="Encoded value"
          value={url}
          onChange={setUrl}
          placeholder="https://example.com"
        />
        <View style={styles.stage}>
          <Barcode
            format="qr"
            value={url}
            label="Order QR code"
            size={180}
            fallback={
              <Text
                value="Nothing to encode."
                type="caption1"
                style={{ color: theme.colors.textSecondary }}
              />
            }
          />
        </View>
        <Text
          value="The blank border is part of the drawing, not the caller's padding: a scanner finds the symbol by that quiet zone, and a code flush to its container often will not read at all."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="Linear">
        <SegmentedControl
          label="Format"
          value={format}
          onChange={(next) => {
            const chosen = next as BarcodeFormat;
            setFormat(chosen);
            setValue(SAMPLE[chosen] ?? "");
          }}
          options={LINEAR}
        />
        <Input
          type="text"
          label="Encoded value"
          value={value}
          onChange={setValue}
        />
        <View style={styles.stage}>
          <Barcode
            format={format}
            value={value}
            label={`${format} barcode`}
            size={260}
            fallback={
              <Text
                value={`Not a valid ${format} value.`}
                type="caption1"
                style={{ color: theme.colors.error }}
              />
            }
          />
        </View>
        <Text
          value="Try clearing a digit from the EAN13: an invalid value renders the fallback rather than a barcode that scans as the wrong thing. EAN13 also computes its own check digit — the printed line is thirteen digits, not the twelve you type."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>

      <Section title="Always black on white">
        <Text
          value="A code is not a graphic the user reads, it is a target a camera reads. Most QR decoders cope with a light-on-dark symbol; many linear decoders do not, and the failure is silent — so these two palette entries deliberately do not follow the scheme."
          type="caption1"
          style={{ color: theme.colors.textSecondary }}
        />
      </Section>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x24,
  },
  stage: {
    alignItems: "center",
    paddingVertical: spacing.x8,
  },
}));
