import SegmentedControl from "@/components/segmented-control";
import { useLocale } from "@/features/localization";
import { THEME_PREFERENCES, useTheme } from "@/features/theme";
import type { ThemePreference } from "@/features/theme";

const LABEL_KEY = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system",
} as const;

export default function ThemeSwitcher() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <SegmentedControl
      label={t("theme.label")}
      value={theme.preference}
      // Only ever an option's value — one of THEME_PREFERENCES.
      onChange={(value) => theme.setPreference(value as ThemePreference)}
      options={THEME_PREFERENCES.map((option) => ({
        value: option,
        label: t(LABEL_KEY[option]),
      }))}
    />
  );
}
