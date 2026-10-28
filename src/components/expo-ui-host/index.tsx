import { Host } from "@expo/ui";
import type { ComponentProps } from "react";

import { useIsRtl } from "@/features/localization";
import { useTheme } from "@/features/theme";

type Props = Omit<
  ComponentProps<typeof Host>,
  "colorScheme" | "layoutDirection" | "seedColor"
>;

/**
 * The theme boundary for every universal or Compose-backed Expo UI control.
 * Callers own layout; this owns the app-level environment that must never
 * vary between third-party adapters.
 */
export default function ExpoUIHost({ children, ...props }: Props) {
  const theme = useTheme();
  const isRTL = useIsRtl();

  return (
    <Host
      {...props}
      colorScheme={theme.scheme}
      seedColor={theme.colors.primary}
      layoutDirection={isRTL ? "rightToLeft" : "leftToRight"}
    >
      {children}
    </Host>
  );
}
