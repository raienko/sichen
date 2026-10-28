import { View, type StyleProp, type ViewStyle } from "react-native";

import If from "@/components/if";
import StateView from "@/components/state-view";
import Tag from "@/components/tag";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";

type Props = {
  title?: string;
  message?: string;
  /**
   * Openers to offer as chips — "Hi!", "Are you free today?". Pressing one
   * sends it through `onSuggestion`.
   */
  suggestions?: readonly string[];
  onSuggestion?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A thread with nothing in it yet: "No messages yet — say hello", with
 * optional opener chips.
 *
 * **A `StateView` of type `empty`**, not a new primitive (ADR 0001): the
 * icon, layout and live-region announcement come from there, and this only
 * supplies the chat's own copy and the chips.
 *
 * @example <Chat.EmptyState suggestions={["Hi!", "👋"]} onSuggestion={send} />
 */
export default function EmptyState({
  title,
  message,
  suggestions = [],
  onSuggestion,
  style,
  testID,
}: Props) {
  const styles = useStyles();
  const { t } = useLocale();

  return (
    <StateView
      testID={testID}
      type="empty"
      title={title ?? t("chat.empty.title")}
      message={message ?? t("chat.empty.message")}
      style={style}
    >
      <If condition={suggestions.length > 0 && onSuggestion}>
        <View style={styles.chips}>
          {suggestions.map((suggestion) => (
            <Tag
              key={suggestion}
              value={suggestion}
              onPress={() => onSuggestion?.(suggestion)}
            />
          ))}
        </View>
      </If>
    </StateView>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.x8,
  },
}));
