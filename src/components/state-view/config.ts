import type { IconNameByType } from "@/components/icon";
import type { TranslationKey } from "@/features/localization";
import type { ThemeColors } from "@/features/theme";

import type { StateViewType } from "./types";

type StateViewConfig = {
  icon: IconNameByType["Feather"] | null;
  accent: keyof ThemeColors;
  title: TranslationKey;
  urgency: "polite" | "assertive";
};

/** The visual and accessibility defaults carried by each state. */
export const STATE_VIEW_CONFIG: Record<StateViewType, StateViewConfig> = {
  loading: {
    icon: null,
    accent: "primary",
    title: "stateView.loading",
    urgency: "polite",
  },
  empty: {
    icon: "inbox",
    accent: "textSecondary",
    title: "stateView.empty",
    urgency: "polite",
  },
  error: {
    icon: "alert-octagon",
    accent: "error",
    title: "stateView.error",
    urgency: "assertive",
  },
  success: {
    icon: "check-circle",
    accent: "success",
    title: "stateView.success",
    urgency: "polite",
  },
  offline: {
    icon: "wifi-off",
    accent: "warning",
    title: "stateView.offline",
    urgency: "polite",
  },
};
