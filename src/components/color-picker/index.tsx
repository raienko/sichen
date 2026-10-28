import { useState } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import If from "@/components/if";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import ColorArea from "./area";
import { BLACK, hexToHsv, hsvToHex, normalizeHex, type Hsv } from "./color";
import ColorHue from "./hue";

export { hexToHsv, hsvToHex, normalizeHex } from "./color";

type Props = {
  /** The colour as `#RRGGBB`. Three-digit hex is read too. */
  value: string;
  /** Called with `#RRGGBB` (upper case) on every change, mid-drag included. */
  onChange: (hex: string) => void;
  /** Colours offered as one-tap swatches above the picker. */
  presets?: readonly string[];
  /**
   * The swatch-and-hex row under the hue bar. On by default; off where
   * something else already shows the value, like `Input`'s hex field.
   */
  preview?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A colour, picked freely: a saturation/brightness square for the current
 * hue, a hue bar beneath it, and optional preset swatches. Built from
 * scratch rather than wrapping a native control — Expo UI only has one on
 * iOS — so it looks and behaves the same on iOS, Android and the web.
 *
 * It reports every change, mid-drag included, so whatever previews the
 * colour follows the finger. `<Input type="color">` wraps it in a sheet
 * that stages those changes in a draft and only commits on Done, and adds
 * a hex field for typing a value in.
 *
 * It holds the colour as HSV itself rather than re-deriving it from
 * `value` each render: hex has no hue for greys and black, so dragging the
 * square into a corner would otherwise snap the hue bar back to red.
 *
 * @example <ColorPicker value={color} onChange={setColor} />
 * @example <ColorPicker value={color} onChange={setColor} presets={["#3F5BD9", "#E4002B", "#00A86B"]} />
 */
export default function ColorPicker({
  value,
  onChange,
  presets,
  preview = true,
  disabled = false,
  style,
  testID = "color-picker",
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();

  const hex = normalizeHex(value) ?? BLACK;
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(hex));
  // Adopt a `value` that changed from outside (a preset, the hex field, the
  // caller) — but not the echo of our own last change, which would round
  // the hue away on greys. Adjusted during render, React's own pattern for
  // state that follows a prop.
  const [seen, setSeen] = useState(hex);
  if (hex !== seen) {
    setSeen(hex);
    if (hex !== hsvToHex(hsv)) setHsv(hexToHsv(hex));
  }

  function change(next: Hsv) {
    setHsv(next);
    const nextHex = hsvToHex(next);
    setSeen(nextHex);
    if (nextHex !== hex) onChange(nextHex);
  }

  return (
    <View
      testID={testID}
      style={[styles.picker, disabled ? styles.disabled : null, style]}
    >
      <If condition={presets !== undefined && presets.length > 0}>
        <View style={styles.presets}>
          {(presets ?? []).map((preset) => {
            const presetHex = normalizeHex(preset);
            if (presetHex === null) return null;
            const selected = presetHex === hex;
            return (
              <Pressable
                key={presetHex}
                {...controlA11yProps({
                  label: t("colorPicker.preset", { hex: presetHex }),
                  selected,
                  disabled,
                })}
                testID={testId(testID, "preset", presetHex)}
                disabled={disabled}
                onPress={() => change(hexToHsv(presetHex))}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: presetHex,
                    borderColor: selected
                      ? theme.colors.accent
                      : theme.colors.divider,
                  },
                  selected ? styles.swatchSelected : null,
                ]}
              />
            );
          })}
        </View>
      </If>

      <ColorArea
        testID={testId(testID, "area")}
        hsv={hsv}
        onChange={change}
        disabled={disabled}
      />
      <ColorHue
        testID={testId(testID, "hue")}
        hsv={hsv}
        onChange={change}
        disabled={disabled}
      />

      <If condition={preview}>
        <View style={styles.preview}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: hex, borderColor: theme.colors.divider },
            ]}
          />
          <Text value={hex} selectable testID={testId(testID, "hex")} />
        </View>
      </If>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  picker: {
    // Fills a phone's width but stops growing on a tablet or a desktop
    // window, where a 3:2 square the width of the screen is a wall of
    // colour — the same cap the date picker's sheet takes.
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    gap: spacing.x16,
  },
  disabled: {
    opacity: 0.5,
  },
  presets: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
  swatch: {
    width: spacing.x32,
    height: spacing.x32,
    borderRadius: radius.indicator,
    borderWidth: spacing.x1,
  },
  swatchSelected: {
    borderWidth: spacing.x2,
  },
  preview: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x12,
  },
}));
