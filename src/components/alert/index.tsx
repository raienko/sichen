import { View, type StyleProp, type ViewStyle } from "react-native";

import Button, { IconButton } from "@/components/button";
import Icon, { type IconNameByType } from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { statusA11yProps } from "@/features/accessibility";
import { useLocale, type TranslationKey } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme, type ThemeColors } from "@/features/theme";
import { testId } from "@/utils";

export type AlertType = "info" | "success" | "warning" | "error";

/**
 * What differs between the types, as a table for the reason Toast keeps
 * one: adding a type is an entry here plus the literal above and its
 * `alert.<type>` translation.
 *
 * `urgency` follows Toast's rule — only `error` interrupts. The
 * `announcement` is read before the message so the type survives for
 * someone who can't see the colour or the glyph (WCAG 1.4.1).
 */
const TYPE_CONFIG: Record<
  AlertType,
  {
    color: keyof ThemeColors;
    icon: IconNameByType["Feather"];
    urgency: "polite" | "assertive";
    announcement: TranslationKey;
  }
> = {
  info: {
    color: "info",
    icon: "info",
    urgency: "polite",
    announcement: "alert.info",
  },
  success: {
    color: "success",
    icon: "check-circle",
    urgency: "polite",
    announcement: "alert.success",
  },
  warning: {
    color: "warning",
    icon: "alert-triangle",
    urgency: "polite",
    announcement: "alert.warning",
  },
  error: {
    color: "error",
    icon: "alert-octagon",
    urgency: "assertive",
    announcement: "alert.error",
  },
};

type Props = {
  /** Defaults to `"info"`. */
  type?: AlertType;
  title?: string;
  message: string;
  /** One follow-up the message invites — "Retry", "Verify email". */
  action?: { label: string; onPress: () => void };
  /** Shows a close control. Omit for a message that must stay while its cause does. */
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A message that stays in the page, where it's relevant, until whatever it
 * reports stops being true — offline, an unverified email, a form that
 * failed to save.
 *
 * It sits between the two overlays the app already has: a `Toast` says
 * something happened and leaves on its own, a `Popup` stops everything
 * until it's answered, and this does neither. It takes its place in the
 * layout and can be read, acted on, or dismissed at the reader's pace.
 *
 * Drawn to match the kit rather than as a coloured card: the raised
 * surface with a hairline edge, and the type carried by its icon in the
 * status colour plus the spoken announcement — never by the fill alone.
 *
 * Announced once, when it mounts, through a live region, with the type read
 * first. Its controls stay separate stops so a screen-reader user can reach
 * the action and the close button after hearing the message.
 *
 * @example
 * <Alert type="warning" message="You're offline. Changes will sync later." />
 * @example
 * <Alert
 *   type="error"
 *   title="Couldn't save"
 *   message="Check your connection and try again."
 *   action={{ label: "Retry", onPress: save }}
 *   onDismiss={() => setError(null)}
 * />
 */
export default function Alert({
  type = "info",
  title,
  message,
  action,
  onDismiss,
  style,
  testID = "alert",
}: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const { t } = useLocale();
  const config = TYPE_CONFIG[type];

  const announcement = [t(config.announcement), title, message]
    .filter(Boolean)
    .join(", ");

  return (
    <View
      testID={testID}
      style={[
        styles.alert,
        {
          backgroundColor: theme.colors.backgroundElement,
          borderColor: theme.colors.divider,
        },
        style,
      ]}
    >
      <View
        {...statusA11yProps({ urgency: config.urgency, label: announcement })}
        style={styles.body}
      >
        <View style={styles.icon}>
          <Icon
            name={config.icon}
            size={spacing.x20}
            color={theme.colors[config.color]}
          />
        </View>
        <View style={styles.text}>
          <If condition={title}>
            <Text value={title ?? ""} type="headline" />
          </If>
          <Text
            value={message}
            type="subheadline"
            // Always a real colour: an `undefined` here still overrides
            // Text's own and falls back to the platform default (black).
            style={{
              color: title ? theme.colors.textSecondary : theme.colors.text,
            }}
          />
          <If condition={action}>
            <Button
              testID={testId(testID, "action")}
              value={action?.label ?? ""}
              type="tertiary"
              size="small"
              onPress={action?.onPress}
              // Sits flush with the text above rather than indented by its
              // own padding, so it reads as part of the message.
              style={styles.action}
            />
          </If>
        </View>
      </View>

      <If condition={onDismiss}>
        <IconButton
          testID={testId(testID, "dismiss")}
          label={t("common.close")}
          size="small"
          onPress={onDismiss}
        >
          <Icon name="x" />
        </IconButton>
      </If>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, radius }) => ({
  alert: {
    borderRadius: radius.surface,
    // Fills whatever holds it rather than picking a width of its own —
    // the same reason `Card` and `ListItem` use alignSelf.
    alignSelf: "stretch",
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: spacing.x8,
    paddingVertical: spacing.x12,
    paddingHorizontal: spacing.x16,
    borderWidth: spacing.x1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: spacing.x12,
  },
  // Nudged to sit on the first line of text rather than above it.
  icon: {
    paddingTop: spacing.x2,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: spacing.x4,
  },
  action: {
    alignSelf: isRTL ? "flex-end" : "flex-start",
    paddingHorizontal: 0,
  },
}));
