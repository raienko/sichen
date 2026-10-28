import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import SegmentedControl from "@/components/segmented-control";
import StatusBar, { type StatusBarStyle } from "@/components/status-bar";
import Text from "@/components/text";
import ThemeSwitcher from "@/components/theme-switcher";
import { createStyles } from "@/features/responsive";
import {
  ThemeProvider,
  useTheme,
  type ThemeProviderConfig,
} from "@/features/theme";

import Readout from "./readout";
import showcasePalettes from "./theme-palettes.json";

const PALETTE_CONFIGS = {
  core: undefined,
  violet: showcasePalettes.violet,
  amber: showcasePalettes.amber,
} as const satisfies Record<string, ThemeProviderConfig | undefined>;

type PaletteName = keyof typeof PALETTE_CONFIGS;

const PALETTE_OPTIONS = [
  { value: "core", label: "Core", testID: "palette-core" },
  { value: "violet", label: "Violet", testID: "palette-violet" },
  { value: "amber", label: "Amber", testID: "palette-amber" },
] as const;

const STATUS_BAR_OPTIONS = [
  { value: "auto", label: "Theme" },
  { value: "inverted", label: "Inverted" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const satisfies { value: StatusBarStyle; label: string }[];

function isStatusBarStyle(value: string): value is StatusBarStyle {
  return STATUS_BAR_OPTIONS.some((option) => option.value === value);
}

function isPaletteName(value: string): value is PaletteName {
  return value in PALETTE_CONFIGS;
}

/** The part of the section that is deliberately inside the configured provider. */
function PalettePreview() {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      testID="configured-palette-preview"
      style={[
        styles.preview,
        {
          backgroundColor: theme.colors.backgroundElement,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text value="Configured provider preview" type="headline" />
      <Text
        value="This subtree reads its colors from ThemeProvider config. Unchanged tokens still fall back to core."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.previewColors}>
        <View
          testID="configured-primary-swatch"
          style={[
            styles.previewColor,
            { backgroundColor: theme.colors.primary },
          ]}
        />
        <View
          testID="configured-focus-swatch"
          style={[styles.previewColor, { backgroundColor: theme.colors.focus }]}
        />
        <Button value="Primary action" type="primary" />
      </View>

      <Readout label="primary" value={theme.colors.primary} />
      <Readout label="focus" value={theme.colors.focus} />
    </View>
  );
}

/**
 * The theme switcher plus a swatch per palette entry, so switching light /
 * dark / system shows every colour change at once — including the ones no
 * other section happens to put on screen.
 *
 * The swatch list is derived from `theme.colors` rather than hand-listed,
 * so a palette key added to `palette.json` shows up here for free.
 */
export default function ThemeSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [palette, setPalette] = useState<PaletteName>("core");
  const [statusBar, setStatusBar] = useState<StatusBarStyle>("auto");

  return (
    <View style={styles.container}>
      <ThemeSwitcher />

      <Readout label="scheme" value={theme.scheme} />
      <Readout label="preference" value={theme.preference} />

      {/* Overrides the root one while this screen is up (iOS / Android). */}
      <StatusBar style={statusBar} />
      <SegmentedControl
        label="Status bar"
        value={statusBar}
        onChange={(value) => {
          if (isStatusBarStyle(value)) setStatusBar(value);
        }}
        options={[...STATUS_BAR_OPTIONS]}
      />

      <View style={styles.swatches}>
        {Object.entries(theme.colors).map(([name, value]) => (
          <View key={name} style={styles.swatch}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: value,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <Text value={name} type="caption2" style={styles.chipLabel} />
          </View>
        ))}
      </View>

      <View style={styles.configuredPalette}>
        <Text value="Application palette" type="headline" />
        <Text
          value="Switch between complete provider configurations. The theme preference above still controls light, dark, or system mode."
          type="footnote"
          style={{ color: theme.colors.textSecondary }}
        />
        <SegmentedControl
          label="Application palette"
          value={palette}
          onChange={(value) => {
            if (isPaletteName(value)) setPalette(value);
          }}
          options={[...PALETTE_OPTIONS]}
        />

        <ThemeProvider config={PALETTE_CONFIGS[palette]}>
          <PalettePreview />
        </ThemeProvider>
      </View>
    </View>
  );
}

/**
 * Palette keys are long compound names (`backgroundElementSelected`), so
 * the swatch is sized to the *label* rather than the chip, and the label is
 * stretched to that full width so it wraps inside its own column instead of
 * spilling over its neighbours.
 */

const useStyles = createStyles(({ spacing, radius }) => ({
  container: {
    gap: spacing.x12,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
  swatch: {
    alignItems: "center",
    gap: spacing.x4,
    width: spacing.x40 * 3,
  },
  chip: {
    borderRadius: radius.indicator,
    width: spacing.x32,
    height: spacing.x32,
    borderWidth: spacing.x1,
  },
  chipLabel: {
    alignSelf: "stretch",
    textAlign: "center",
  },
  configuredPalette: {
    gap: spacing.x8,
  },
  preview: {
    borderRadius: radius.surface,
    gap: spacing.x12,
    padding: spacing.x16,
    borderWidth: spacing.x1,
  },
  previewColors: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.x8,
  },
  previewColor: {
    borderRadius: radius.indicator,
    width: spacing.x32,
    height: spacing.x32,
  },
}));
