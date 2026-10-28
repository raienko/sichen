import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { controlA11yProps, headingA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { ChatAction, ChatMessage } from "./types";

/** The rows the sheet can offer — the subset of `ChatAction` it starts. */
type SheetAction = "reply" | "copy" | "edit" | "delete";

export const DEFAULT_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

type Props = {
  message: ChatMessage;
  /** Own messages also offer Edit and Delete. */
  own: boolean;
  /** The quick-reaction row. Pass `[]` to drop it. */
  reactions?: readonly string[];
  /** Which of reply, copy, edit, delete to offer at all. Defaults to all four. */
  actions?: readonly SheetAction[];
  /** The emoji the current user has already reacted with, shown selected. */
  currentUserId?: string;
  onSelect: (action: ChatAction) => void;
  /** Adds a Cancel at the foot of the menu. */
  onCancel?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const ALL_ACTIONS = ["reply", "copy", "edit", "delete"] as const;

/**
 * What can be done with one message: a row of quick reactions, then Reply,
 * Copy, Edit and Delete. The content of the sheet `Chat` opens on a
 * long-press (a `Modal` of type `bottomSheet`), kept separate so a screen with
 * its own menu can reuse it.
 *
 * **Only what applies is offered**: Copy needs text, Edit needs text and
 * an own message, Delete an own message. Nothing is offered greyed out —
 * a disabled row a user can't explain is worse than no row.
 *
 * **Reports the choice; doesn't act on it.** `onSelect` gets a `ChatAction`
 * and the caller decides — `Chat` closes the sheet first and then copies,
 * starts a reply or an edit, or asks before deleting.
 */
export default function MessageActions({
  message,
  own,
  reactions = DEFAULT_REACTIONS,
  actions = ALL_ACTIONS,
  currentUserId,
  onSelect,
  onCancel,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t } = useLocale();

  const hasText = Boolean(message.text?.trim());
  const available = actions.filter((action) => {
    if (action === "copy") return hasText;
    if (action === "edit") return own && hasText;
    if (action === "delete") return own;
    return true;
  });
  const reacted = new Set(
    (message.reactions ?? [])
      .filter(
        (reaction) =>
          currentUserId !== undefined &&
          reaction.userIds.includes(currentUserId),
      )
      .map((reaction) => reaction.emoji),
  );

  const ICONS = {
    reply: "corner-up-left",
    copy: "copy",
    edit: "edit-2",
    delete: "trash-2",
  } as const;

  return (
    // No surface of its own: it's shown in a `bottomSheet`, which brings
    // the page-coloured sheet, grabber and drag-to-dismiss.
    <View testID={testID} style={[styles.menu, style]}>
      <Text
        {...headingA11yProps(2)}
        value={t("chat.actions.title")}
        type="headline"
      />

      <If condition={reactions.length > 0}>
        <View style={styles.reactions}>
          {reactions.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => onSelect({ type: "react", emoji })}
              {...controlA11yProps({
                label: t("chat.actions.react", { emoji }),
                selected: reacted.has(emoji),
              })}
              style={({ pressed }) => [
                styles.reaction,
                {
                  backgroundColor: reacted.has(emoji)
                    ? theme.colors.selected
                    : theme.colors.backgroundElement,
                  borderColor: reacted.has(emoji)
                    ? theme.colors.accent
                    : "transparent",
                },
                pressed ? { backgroundColor: theme.colors.pressed } : null,
              ]}
            >
              <Text value={emoji} type="title3" accessible={false} />
            </Pressable>
          ))}
        </View>
      </If>

      {available.map((action) => (
        <Button
          key={action}
          type="tertiary"
          label={t(`chat.actions.${action}`)}
          onPress={() => onSelect({ type: action })}
        >
          <View style={styles.actionContent}>
            <Icon
              name={ICONS[action]}
              size={spacing.x20}
              color={
                action === "delete" ? theme.colors.error : theme.colors.text
              }
            />
            <Text
              value={t(`chat.actions.${action}`)}
              style={action === "delete" ? { color: theme.colors.error } : null}
            />
          </View>
        </Button>
      ))}

      <If condition={onCancel}>
        <Button
          type="tertiary"
          value={t("common.cancel")}
          onPress={() => onCancel?.()}
        />
      </If>
    </View>
  );
}

const useStyles = createStyles(({ units, spacing, radius, isRTL }) => ({
  menu: {
    gap: spacing.x4,
  },
  reactions: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: spacing.x8,
    paddingVertical: spacing.x4,
  },
  reaction: {
    width: units(44),
    height: units(44),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: units(1),
    borderRadius: radius.control,
  },
  actionContent: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x12,
  },
}));
