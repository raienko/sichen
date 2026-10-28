import {
  ActivityIndicator,
  type ActivityIndicatorProps,
  type ColorValue,
} from "react-native";

import { useLocale } from "@/features/localization";
import { useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

export type SpinnerSize = "small" | "medium" | "large";

type Props = Omit<
  ActivityIndicatorProps,
  "accessibilityLabel" | "color" | "role" | "size"
> & {
  /** Defaults to the theme's primary colour. */
  color?: ColorValue;
  /** A responsive visual size. Defaults to `medium`. */
  size?: SpinnerSize;
  /**
   * Accessible progress label. Defaults to localized "Loading". Pass
   * `null` when a labelled parent already owns the busy state, as Button does.
   */
  label?: string | null;
};

/** A themed, responsive loading indicator for native apps and web. */
export default function Spinner({
  color,
  size = "medium",
  label,
  ...props
}: Props) {
  const { t } = useLocale();
  const { spacing } = useSizes();
  const theme = useTheme();
  const resolvedLabel = label === undefined ? t("common.loading") : label;
  const resolvedSize = {
    small: spacing.x16,
    medium: spacing.x20,
    large: spacing.x24,
  }[size];

  return (
    <ActivityIndicator
      {...props}
      color={color ?? theme.colors.accent}
      size={resolvedSize}
      accessible={resolvedLabel !== null}
      accessibilityRole={resolvedLabel === null ? undefined : "progressbar"}
      accessibilityLabel={resolvedLabel ?? undefined}
      role={resolvedLabel === null ? undefined : "progressbar"}
    />
  );
}
