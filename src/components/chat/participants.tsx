import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { AvatarGroup } from "@/components/avatar";
import If from "@/components/if";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { ChatParticipant } from "./types";

type Props = {
  participants: readonly ChatParticipant[];
  /** The chat's name. Defaults to the participants' names, joined. */
  title?: string;
  /**
   * Leaves this person out of the avatars and the default title — the
   * current user, usually, who knows they're in the chat.
   */
  excludeId?: string;
  /** Avatars drawn before "+N". Defaults to 3. */
  max?: number;
  /**
   * Makes the whole summary a button — the other person's profile in a
   * one-to-one chat, the chat's info screen in a group.
   */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Who's in the chat, for a header: overlapping avatars, the chat's name,
 * and "5 members · 2 online" under it.
 *
 * A one-to-one chat gets the other person's own presence instead — a
 * member count of one is not information.
 *
 * The avatars are an `AvatarGroup` (`@/components/avatar`), the kit's
 * reusable primitive; this adds the chat-specific summary around it.
 */
export default function Participants({
  participants,
  title,
  excludeId,
  max = 3,
  onPress,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  const others = participants.filter((person) => person.id !== excludeId);
  const online = others.filter((person) => person.online).length;
  const name =
    title ??
    others.map((person) => person.name).join(t("avatarGroup.separator"));
  const summary =
    others.length > 1
      ? [
          t("chat.participants.members", {
            count: formatNumber(participants.length, locale),
          }),
          online > 0
            ? t("chat.participants.online", {
                count: formatNumber(online, locale),
              })
            : undefined,
        ]
          .filter(Boolean)
          .join(" · ")
      : online > 0
        ? t("chat.participants.online", { count: formatNumber(1, locale) })
        : "";

  return (
    <Pressable
      testID={testID}
      accessible
      disabled={!onPress}
      onPress={onPress}
      {...(onPress
        ? controlA11yProps({
            label: [name, summary].filter(Boolean).join(", "),
          })
        : null)}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: theme.colors.pressed } : null,
        style,
      ]}
    >
      <AvatarGroup
        people={others.map((person) => ({
          id: person.id,
          name: person.name,
          source: person.avatar,
        }))}
        max={max}
        size="small"
      />
      <View style={styles.text}>
        <Text value={name} type="headline" numberOfLines={1} />
        <If condition={summary}>
          <Text
            value={summary}
            type="caption1"
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary }}
          />
        </If>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, isRTL }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
    flexShrink: 1,
  },
  text: {
    flexShrink: 1,
  },
}));
