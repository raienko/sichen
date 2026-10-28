import { LegendList, type LegendListRef } from "@legendapp/list/react-native";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import If from "@/components/if";
import Spinner from "@/components/spinner";
import { useAnimationDuration } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import Activity from "./activity";
import DateSeparator from "./date-separator";
import JumpToLatest from "./jump-to-latest";
import Message, { type MessageProps } from "./message";
import { buildRows, startOfDay, type ChatRow } from "./rows";
import type { ChatActivity, ChatMessage, ChatParticipant } from "./types";

export type ConversationProps = Pick<MessageProps, "onEvent" | "readOnly"> & {
  /** Oldest first — the order they happened in. */
  messages: readonly ChatMessage[];
  currentUserId: string;
  participants: ReadonlyMap<string, ChatParticipant>;
  /** Shown at the foot of the thread, under the newest message. */
  activity?: readonly ChatActivity[];
  /** Names and avatars on others' messages. Defaults to on for 3+ people. */
  showSenders?: boolean;
  /** Called on scrolling near the oldest loaded message, while `hasEarlier`. */
  onLoadEarlier?: () => void;
  hasEarlier?: boolean;
  loadingEarlier?: boolean;
  /** Drawn instead of the list when there are no messages. */
  empty?: ReactElement | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A first-render hint only: Legend List measures and replaces it at once. */
const ESTIMATED_ROW_HEIGHT = 64;

/**
 * The scrolling thread: day separators, grouped messages, and what others
 * are doing at the foot. Virtualized with Legend List — the same engine
 * as `List` — so a thread of thousands of messages keeps a constant number
 * of mounted rows.
 *
 * **Anchored to the newest message, without inverting.** Chat lists are
 * commonly an inverted list, which flips scrolling, keyboard order and the
 * screen-reader order upside down to fake a bottom anchor. Legend List
 * anchors natively instead: it opens at the end (`initialScrollAtEnd`),
 * pushes a short thread to the bottom (`alignItemsAtEnd`), follows new
 * messages only while the reader is already at the end
 * (`maintainScrollAtEnd`) — so someone reading history isn't yanked down
 * by every arrival — and keeps their place when earlier messages are
 * prepended (`maintainVisibleContentPosition`). Reading order stays
 * oldest-to-newest, the order the thread happened in.
 *
 * **Rows are built outside** by `buildRows` (`./rows.ts`): one flat array
 * of date and message rows, typed per kind so the list keeps separate
 * size estimates for each.
 */
const Conversation = forwardRef<LegendListRef, ConversationProps>(
  function Conversation(
    {
      messages,
      currentUserId,
      participants,
      activity = [],
      showSenders,
      onLoadEarlier,
      hasEarlier = false,
      loadingEarlier = false,
      empty,
      onEvent,
      readOnly,
      style,
      testID,
    },
    ref,
  ) {
    const styles = useStyles();
    const { t } = useLocale();
    const duration = useAnimationDuration();

    const list = useRef<LegendListRef>(null);
    useImperativeHandle(ref, () => list.current as LegendListRef, []);

    // ---- back to the newest messages ----------------------------------
    // How many messages there were when the reader scrolled away from the
    // end; `undefined` while they're at it. Others' messages after that
    // index are the "unseen" count on the button.
    const [awayFrom, setAwayFrom] = useState<number>();
    const away = awayFrom !== undefined;
    const unseen = away
      ? messages
          .slice(awayFrom)
          .filter((message) => message.senderId !== currentUserId).length
      : 0;

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const fromEnd =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      // Half a screen of slack: a nudge isn't "reading history", and the
      // button shouldn't flicker in and out at the very bottom.
      const isAway = fromEnd > layoutMeasurement.height / 2;
      if (isAway && !away) setAwayFrom(messages.length);
      if (!isAway && away) setAwayFrom(undefined);
    };

    const jumpToLatest = useCallback(() => {
      setAwayFrom(undefined);
      // Reduce Motion gives a zero duration: jump rather than glide.
      void list.current?.scrollToEnd({ animated: duration(1) > 0 });
    }, [duration]);

    // Sending is a request to see the thread's end: follow your own new
    // message down even from deep in history, which `maintainScrollAtEnd`
    // (rightly) doesn't do for anyone else's.
    const last = messages[messages.length - 1];
    const lastOwnId =
      last !== undefined && last.senderId === currentUserId
        ? last.id
        : undefined;
    const seenOwnId = useRef(lastOwnId);
    useEffect(() => {
      if (lastOwnId === seenOwnId.current) return;
      seenOwnId.current = lastOwnId;
      if (lastOwnId !== undefined && away) jumpToLatest();
    }, [lastOwnId, away, jumpToLatest]);

    const rows = useMemo(() => buildRows(messages), [messages]);
    const byId = useMemo(
      () => new Map(messages.map((message) => [message.id, message])),
      [messages],
    );
    const senders = showSenders ?? participants.size > 2;
    // The day, not the instant: "Today" only changes at midnight, and a
    // timestamp here would rebuild every row's renderer on every render.
    const now = startOfDay(Date.now());

    const renderItem = useCallback(
      ({ item }: { item: ChatRow }) => {
        if (item.type === "date") {
          return <DateSeparator date={item.day} now={now} />;
        }
        const { message } = item;
        const target =
          message.replyTo === undefined ? undefined : byId.get(message.replyTo);
        return (
          <Message
            message={message}
            sender={participants.get(message.senderId)}
            own={message.senderId === currentUserId}
            position={item.position}
            showSender={senders}
            currentUserId={currentUserId}
            replyTarget={
              target === undefined
                ? undefined
                : {
                    message: target,
                    senderName:
                      target.senderId === currentUserId
                        ? t("chat.you")
                        : (participants.get(target.senderId)?.name ??
                          target.senderId),
                  }
            }
            onEvent={onEvent}
            readOnly={readOnly}
          />
        );
      },
      [now, byId, participants, currentUserId, senders, t, onEvent, readOnly],
    );

    return (
      <View testID={testID} style={[styles.container, style]}>
        <If condition={messages.length === 0 && empty}>{empty}</If>
        <If condition={messages.length > 0 || !empty}>
          <LegendList
            ref={list}
            data={rows}
            renderItem={renderItem}
            keyExtractor={(row) => row.key}
            getItemType={(row) => row.type}
            estimatedItemSize={ESTIMATED_ROW_HEIGHT}
            initialScrollAtEnd
            alignItemsAtEnd
            maintainScrollAtEnd
            maintainVisibleContentPosition
            onStartReached={
              hasEarlier && !loadingEarlier ? onLoadEarlier : undefined
            }
            onStartReachedThreshold={0.5}
            // Native only: Legend List's web build hands these straight to
            // a DOM element, which React warns about.
            {...(isWeb
              ? null
              : {
                  keyboardShouldPersistTaps: "handled" as const,
                  keyboardDismissMode: "interactive" as const,
                })}
            ListHeaderComponent={
              loadingEarlier ? (
                <View style={styles.header}>
                  <Spinner size="small" label={t("chat.loadingEarlier")} />
                </View>
              ) : null
            }
            ListFooterComponent={
              <Activity
                activity={activity}
                participants={participants}
                currentUserId={currentUserId}
              />
            }
            contentContainerStyle={styles.content}
            onScroll={onScroll}
            scrollEventThrottle={64}
          />
          <If condition={away}>
            <JumpToLatest
              unseen={unseen}
              onPress={jumpToLatest}
              style={styles.jump}
            />
          </If>
        </If>
      </View>
    );
  },
);

export default Conversation;

const useStyles = createStyles(({ spacing, isRTL }) => ({
  container: {
    flex: 1,
  },
  // Over the thread's end corner, clear of the activity line's text.
  jump: {
    position: "absolute",
    bottom: spacing.x12,
    ...(isRTL ? { left: spacing.x16 } : { right: spacing.x16 }),
  },
  content: {
    paddingTop: spacing.x8,
  },
  header: {
    alignItems: "center",
    paddingVertical: spacing.x12,
  },
}));
