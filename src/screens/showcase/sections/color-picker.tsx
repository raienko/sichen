import { useState } from "react";
import { View } from "react-native";

import ColorPicker from "@/components/color-picker";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

// Colour data the demo starts from and offers, not UI colours.
// eslint-disable-next-line no-restricted-syntax -- values, not styles
const PRESETS = ["#3F5BD9", "#E4002B", "#00A86B", "#FFD400", "#1F2023"];

/** The picker on its own, reporting every change as it happens. */
export default function ColorPickerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [color, setColor] = useState(PRESETS[0]!);

  return (
    <View style={styles.container}>
      <Text
        value="Drag the square for saturation and brightness, the bar for hue, or tap a preset. Every change is reported as it happens; Input's color type wraps this in a sheet that only commits on Done."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <ColorPicker value={color} onChange={setColor} presets={PRESETS} />
      <Readout label="value" value={color} />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x12,
  },
}));
