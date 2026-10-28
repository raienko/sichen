import type { IconNameByType } from "@/components/icon";
import type { TranslationKey } from "@/features/localization";
import type { ThemeColors } from "@/features/theme";

import type { ToastType } from "./types";

export type ToastTypeConfig = {
  /** Border, icon and action colour. Named palette entries, so both schemes follow. */
  accent: keyof ThemeColors;
  icon: IconNameByType["Feather"];
  /**
   * How the message reaches a screen reader — see `statusA11yProps`. Only
   * `error` interrupts: a success or an FYI can wait for a pause, and
   * making all four assertive would train users to ignore the ones that
   * matter.
   */
  urgency: "polite" | "assertive";
  /**
   * Read out before the message, so the type survives for someone who
   * can't see the colour or the glyph carrying it visually. This is what
   * keeps the variants from being colour-coded and nothing else (WCAG
   * 1.4.1) — the icon covers colour-blind sighted users, this covers
   * screen-reader users.
   */
  announcement: TranslationKey;
};

/**
 * What differs between the toast types. Add a type by adding one entry here
 * (plus the literal in ./types.ts and the `toast.<type>` translation key) —
 * index.tsx reads this generically and doesn't need to change.
 */
export const TOAST_TYPE_CONFIG: Record<ToastType, ToastTypeConfig> = {
  success: {
    accent: "success",
    icon: "check-circle",
    urgency: "polite",
    announcement: "toast.success",
  },
  error: {
    accent: "error",
    icon: "alert-octagon",
    urgency: "assertive",
    announcement: "toast.error",
  },
  warning: {
    accent: "warning",
    icon: "alert-triangle",
    urgency: "polite",
    announcement: "toast.warning",
  },
  info: {
    accent: "info",
    icon: "info",
    urgency: "polite",
    announcement: "toast.info",
  },
};
