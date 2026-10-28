import { useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Spinner from "@/components/spinner";
import Text from "@/components/text";
import { statusA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import { isIOS } from "@/utils";

import { STATE_VIEW_CONFIG } from "./config";
import stateViews from "./store";
import type { StateViewOverlayOptions, StateViewProps } from "./types";

function StateViewComponent({
  type,
  title,
  message,
  children,
  actionLabel,
  onAction,
  style,
  testID,
}: StateViewProps) {
  const { t } = useLocale();
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const [actionLoading, setActionLoading] = useState(false);
  const config = STATE_VIEW_CONFIG[type];
  const resolvedTitle = title ?? t(config.title);
  const announcement = [resolvedTitle, message].filter(Boolean).join(", ");

  async function runAction() {
    if (actionLoading || onAction === undefined) return;
    setActionLoading(true);
    try {
      await onAction();
    } catch (error) {
      logger.error(`StateView "${type}" action failed.`, error);
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    // Android and web consume the live-region props below. VoiceOver needs
    // an explicit announcement when a state view appears dynamically.
    if (isIOS) {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [announcement]);

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View
        {...statusA11yProps({
          urgency: config.urgency,
          label: announcement,
        })}
        style={styles.status}
      >
        <If condition={type === "loading"}>
          <Spinner size="large" label={null} />
        </If>
        <If condition={config.icon}>
          <Icon
            name={config.icon ?? "info"}
            size={spacing.x40}
            color={theme.colors[config.accent]}
          />
        </If>

        <Text value={resolvedTitle} type="title3" style={styles.title} />
        <If condition={message}>
          <Text
            value={message ?? ""}
            style={[styles.message, { color: theme.colors.textSecondary }]}
          />
        </If>
      </View>

      {children}

      <If condition={actionLabel}>
        <Button
          value={actionLabel ?? ""}
          type="primary"
          loading={actionLoading}
          style={styles.action}
          onPress={() => void runAction()}
        />
      </If>
    </View>
  );
}

type StateViewStatic = {
  /** Shows or replaces the single global overlay and returns its id. */
  show: (options: StateViewOverlayOptions) => string;
  /** Hides the overlay, optionally only when its id still matches. */
  hide: (id?: string) => void;
};

const StateView = StateViewComponent as typeof StateViewComponent &
  StateViewStatic;

StateView.show = (options) => stateViews.show(options);
StateView.hide = (id) => stateViews.hide(id);

export default StateView;

const useStyles = createStyles(({ spacing, sizes }) => ({
  container: {
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x16,
    padding: spacing.x24,
  },
  status: {
    alignItems: "center",
    gap: spacing.x8,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
  },
  action: {
    alignSelf: "stretch",
  },
}));
