import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import Icon from "@/components/icon";
import If from "@/components/if";
import Match from "@/components/match";
import Text from "@/components/text";
import { controlA11yProps, imageA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { ChatReceiptStatus } from "./types";

type Props = {
  status: ChatReceiptStatus;
  /** Makes `failed` pressable. Ignored for every other status. */
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A message's delivery state, as one glyph: a clock while sending, one
 * tick when sent, two when delivered, two in the accent colour when read,
 * and an error mark with "Retry" when it failed.
 *
 * **Never colour alone.** Read and delivered differ by colour *and* by the
 * accessible name every state carries, so the difference survives both a
 * colour-blind reader and a screen reader (WCAG 1.4.1).
 *
 * **Failed is the one actionable state**: with `onRetry` it becomes a
 * button that says so — the error colour plus a visible "Retry", since an
 * icon on its own wouldn't tell anyone it can be pressed.
 *
 * @example <Chat.Receipt status="read" />
 * @example <Chat.Receipt status="failed" onRetry={() => resend(message)} />
 */
export default function Receipt({ status, onRetry, style, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t } = useLocale();

  const label = t(`chat.receipt.${status}`);
  const size = spacing.x16;
  const muted = theme.colors.textSecondary;

  const glyph = (
    <Match value={status}>
      <Match.Case when="sending">
        <Icon name="clock" size={size} color={muted} />
      </Match.Case>
      <Match.Case when="sent">
        <Icon name="check" size={size} color={muted} />
      </Match.Case>
      <Match.Case when="delivered">
        <Icon type="Ionicons" name="checkmark-done" size={size} color={muted} />
      </Match.Case>
      <Match.Case when="read">
        <Icon
          type="Ionicons"
          name="checkmark-done"
          size={size}
          color={theme.colors.accent}
        />
      </Match.Case>
      <Match.Case when="failed">
        <Icon name="alert-circle" size={size} color={theme.colors.error} />
      </Match.Case>
    </Match>
  );

  const retryable = status === "failed" && onRetry !== undefined;

  return (
    <>
      <If condition={retryable}>
        <Pressable
          testID={testID}
          {...controlA11yProps({ label })}
          onPress={onRetry}
          hitSlop={spacing.x8}
          style={({ pressed }) => [
            styles.row,
            pressed ? { backgroundColor: theme.colors.pressed } : null,
            style,
          ]}
        >
          {glyph}
          <Text
            value={t("chat.retry")}
            type="caption1"
            style={{ color: theme.colors.error }}
          />
        </Pressable>
      </If>
      <If condition={!retryable}>
        <View
          testID={testID}
          {...imageA11yProps({ label })}
          style={[styles.row, style]}
        >
          {glyph}
        </View>
      </If>
    </>
  );
}

const useStyles = createStyles(({ spacing, isRTL }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x4,
  },
}));
