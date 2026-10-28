import * as Clipboard from "expo-clipboard";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import Button from "@/components/button";
import If from "@/components/if";
import ImageViewer, { type ImageViewerItem } from "@/components/image-viewer";
import MediaPlayer from "@/components/media-player";
import Modal from "@/components/modal";
import Popup from "@/components/popup";
import { deepLinks } from "@/features/deep-links";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import MessageActions, { DEFAULT_REACTIONS } from "./actions";
import Activity from "./activity";
import AttachmentPreview from "./attachment-preview";
import Attachments from "./attachments";
import Conversation from "./conversation";
import DateSeparator from "./date-separator";
import EmptyState from "./empty-state";
import ChatInput from "./input";
import Message from "./message";
import Participants from "./participants";
import Receipt from "./receipt";
import type {
  ChatAction,
  ChatActivity,
  ChatAttachment,
  ChatAttachmentKind,
  ChatMessage,
  ChatMessageEvent,
  ChatParticipant,
  ChatSendPayload,
} from "./types";

export type {
  ChatAction,
  ChatActivity,
  ChatActivityKind,
  ChatAttachment,
  ChatAttachmentEvent,
  ChatAttachmentKind,
  ChatMessage,
  ChatMessageEvent,
  ChatParticipant,
  ChatReaction,
  ChatReceiptStatus,
  ChatSendPayload,
} from "./types";
export type { ConversationProps as ChatConversationProps } from "./conversation";
export type { MessageProps as ChatMessageProps } from "./message";

type VideoAttachment = Extract<ChatAttachment, { kind: "video" }>;

export type ChatProps = {
  /** The thread, oldest first. */
  messages: readonly ChatMessage[];
  /** Whose messages are "own": end side, receipts, edit and delete. */
  currentUserId: string;
  /** Everyone who may appear in the thread, the current user included. */
  participants: readonly ChatParticipant[];
  /** What others are doing right now — typing, recording, uploading. */
  activity?: readonly ChatActivity[];
  /** The composer's send. Chat clears the draft once it has called this. */
  onSend: (payload: ChatSendPayload) => void;
  /**
   * The one callback for everything done to a message — see `ChatAction`:
   * the actions sheet and reaction chips, a swipe-to-reply, a retry on a
   * failed receipt, a sender's avatar or name (`profile`: navigate from
   * here), an opened link or file. Some are already done by the time it's
   * called and arrive for the record (`copy`, `link`, `file`); a `delete`
   * arrives only after the user has confirmed it.
   */
  onAction: (action: ChatAction, message: ChatMessage) => void;
  onLoadEarlier?: () => void;
  hasEarlier?: boolean;
  loadingEarlier?: boolean;
  /** What the composer offers to attach. Defaults to none. */
  attachmentKinds?: readonly ChatAttachmentKind[];
  /** Upload progress for pending attachments, by id, 0–1. */
  attachmentProgress?: Readonly<Record<string, number>>;
  /** The quick reactions in the actions sheet. */
  reactions?: readonly string[];
  /** Names and avatars on others' messages. Defaults to on for 3+ people. */
  showSenders?: boolean;
  /** Above the thread — usually `<Chat.Participants />` in a `Header`. */
  header?: ReactNode;
  emptyState?: {
    title?: string;
    message?: string;
    /** Opener chips; pressing one sends it. */
    suggestions?: readonly string[];
  };
  placeholder?: string;
  maxLength?: number;
  /** Read-only: the thread still scrolls, the composer is disabled. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A complete chat surface: the thread, the composer, and the sheets they
 * open — built from the parts exported beside it (`Chat.Conversation`,
 * `Chat.Message`, `Chat.Input`, …) for a screen that needs a different
 * arrangement.
 *
 * **Controlled.** Messages, participants and activity come in as props, and
 * everything the user does goes out through two callbacks — `onSend` for
 * the composer, `onAction` for everything else; the transport, the store and optimistic updates are the
 * caller's. Chat owns only what is UI: the draft, pending attachments,
 * which message is being replied to or edited, and which sheet is open.
 *
 * **Put it in a `Screen` with `padded={false}`** (and not `scrollable`):
 * the screen already lifts its content over the keyboard, and the thread
 * scrolls itself.
 *
 * @example
 * <Screen padded={false} header={<Header center={<Chat.Participants participants={people} excludeId={me} />} />}>
 *   <Chat
 *     messages={messages}
 *     currentUserId={me}
 *     participants={people}
 *     activity={typing}
 *     onSend={send}
 *     onAction={act}
 *     attachmentKinds={["image", "file"]}
 *   />
 * </Screen>
 */
function Chat({
  messages,
  currentUserId,
  participants,
  activity,
  onSend,
  onAction,
  onLoadEarlier,
  hasEarlier,
  loadingEarlier,
  attachmentKinds,
  attachmentProgress,
  reactions = DEFAULT_REACTIONS,
  showSenders,
  header,
  emptyState,
  placeholder,
  maxLength,
  disabled = false,
  style,
  testID,
}: ChatProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();

  const id = useId();
  const actionsId = `chat-actions:${id}`;
  const deleteId = `chat-delete:${id}`;
  const viewerId = `chat-images:${id}`;
  const videoId = `chat-video:${id}`;

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [replyToId, setReplyToId] = useState<string>();
  const [editingId, setEditingId] = useState<string>();
  const [selected, setSelected] = useState<ChatMessage>();
  const [toDelete, setToDelete] = useState<ChatMessage>();
  const [viewer, setViewer] = useState<{
    images: ImageViewerItem[];
    index: number;
    // Bumped on every open, so opening the same picture twice still shows it.
    nonce: number;
  }>();
  const [video, setVideo] = useState<VideoAttachment>();

  const people = useMemo(
    () => new Map(participants.map((person) => [person.id, person])),
    [participants],
  );
  const byId = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
  const replyTo = replyToId === undefined ? undefined : byId.get(replyToId);
  const nameOf = useCallback(
    (senderId: string) =>
      senderId === currentUserId
        ? t("chat.you")
        : (people.get(senderId)?.name ?? senderId),
    [currentUserId, people, t],
  );

  // The viewer is opened once its pictures are in state — `show` before
  // the commit would open it on the previous set.
  useEffect(() => {
    if (viewer) void ImageViewer.show(viewerId, viewer.index);
  }, [viewer, viewerId]);

  const startReply = useCallback((message: ChatMessage) => {
    setEditingId(undefined);
    setReplyToId(message.id);
  }, []);

  // Everything a bubble reports, in one place: the parts of it that are
  // UI (the sheet, the viewer, the reply banner) happen here, and whatever
  // the app needs to hear about goes on to `onAction`.
  const handleEvent = useCallback(
    (event: ChatMessageEvent, message: ChatMessage) => {
      switch (event.type) {
        case "actions":
          setSelected(message);
          void Modal.show(actionsId);
          return;
        case "reply":
          startReply(message);
          onAction(event, message);
          return;
        case "image":
          setViewer((previous) => ({
            images: event.images.map((image) => ({
              source: image.uri,
              alt: image.alt ?? image.name ?? t("chat.attachment.image"),
            })),
            index: event.index,
            nonce: (previous?.nonce ?? 0) + 1,
          }));
          return;
        case "video":
          setVideo(event.attachment);
          void Modal.show(videoId);
          return;
        // Opened here rather than left to the caller: through the
        // deep-link pipeline, as `Markdown` does, so a link to the app
        // itself routes in-app and anything else goes to the browser, mail
        // or phone app. The app hears about it afterwards.
        case "link":
          void deepLinks.open(event.url);
          onAction(event, message);
          return;
        case "file":
          void deepLinks.open(event.attachment.uri);
          onAction(event, message);
          return;
        case "retry":
        case "react":
        case "profile":
          onAction(event, message);
          return;
      }
    },
    [actionsId, videoId, onAction, startReply, t],
  );

  const select = async (action: ChatAction) => {
    const message = selected;
    await Modal.hide(actionsId);
    if (message === undefined) return;

    switch (action.type) {
      case "reply":
        startReply(message);
        break;
      case "edit":
        setReplyToId(undefined);
        setEditingId(message.id);
        setDraft(message.text ?? "");
        break;
      case "copy":
        await Clipboard.setStringAsync(message.text ?? "");
        break;
      case "delete":
        // Asked first; `onAction` hears about it from the popup's confirm.
        setToDelete(message);
        await Popup.show(deleteId);
        return;
      default:
        break;
    }
    onAction(action, message);
  };

  const send = () => {
    const text = draft.trim();
    if (text === "" && pending.length === 0) return;
    onSend({
      text,
      attachments: pending,
      ...(replyToId === undefined ? null : { replyTo: replyToId }),
      ...(editingId === undefined ? null : { editOf: editingId }),
    });
    setDraft("");
    setPending([]);
    setReplyToId(undefined);
    setEditingId(undefined);
  };

  const cancelEdit = () => {
    setEditingId(undefined);
    setDraft("");
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      <If condition={header}>{header}</If>

      <Conversation
        messages={messages}
        currentUserId={currentUserId}
        participants={people}
        activity={activity}
        showSenders={showSenders}
        onLoadEarlier={onLoadEarlier}
        hasEarlier={hasEarlier}
        loadingEarlier={loadingEarlier}
        onEvent={handleEvent}
        readOnly={disabled}
        empty={
          <EmptyState
            title={emptyState?.title}
            message={emptyState?.message}
            suggestions={emptyState?.suggestions}
            onSuggestion={
              disabled ? undefined : (text) => onSend({ text, attachments: [] })
            }
          />
        }
      />

      <ChatInput
        id={id}
        value={draft}
        onChange={setDraft}
        onSend={send}
        attachments={pending}
        attachmentProgress={attachmentProgress}
        attachmentKinds={attachmentKinds}
        onAddAttachment={(attachment) =>
          setPending((current) => [...current, attachment])
        }
        onRemoveAttachment={(attachment) =>
          setPending((current) =>
            current.filter((item) => item.id !== attachment.id),
          )
        }
        replyTo={
          replyTo === undefined
            ? undefined
            : {
                name: nameOf(replyTo.senderId),
                text: replyTo.text ?? t("chat.attachment.file"),
              }
        }
        onCancelReply={() => setReplyToId(undefined)}
        editing={editingId !== undefined}
        onCancelEdit={cancelEdit}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
      />

      <Modal id={actionsId} type="bottomSheet">
        <MessageActions
          message={selected ?? EMPTY_MESSAGE}
          own={selected?.senderId === currentUserId}
          reactions={reactions}
          currentUserId={currentUserId}
          onSelect={(action) => void select(action)}
          onCancel={() => void Modal.hide(actionsId)}
        />
      </Modal>

      <Popup
        id={deleteId}
        title={t("chat.actions.deleteTitle")}
        message={t("chat.actions.deleteMessage")}
        confirmLabel={t("chat.actions.delete")}
        onConfirm={() => {
          if (toDelete) onAction({ type: "delete" }, toDelete);
          setToDelete(undefined);
        }}
        onCancel={() => setToDelete(undefined)}
      />

      <ImageViewer id={viewerId} images={viewer?.images ?? []} />

      <Modal id={videoId} type="fullscreen" onClose={() => setVideo(undefined)}>
        <View
          style={[styles.video, { backgroundColor: theme.colors.mediaSurface }]}
        >
          <If condition={video}>
            <MediaPlayer
              type="video"
              source={video?.uri ?? ""}
              label={video?.name ?? t("chat.attachment.video")}
              autoPlay
            />
          </If>
        </View>
        <Button
          value={t("common.close")}
          onPress={() => void Modal.hide(videoId)}
        />
      </Modal>
    </View>
  );
}

/** A stand-in while the sheet closes, so its content never renders `undefined`. */
const EMPTY_MESSAGE: ChatMessage = { id: "", senderId: "", createdAt: 0 };

const useStyles = createStyles(() => ({
  container: {
    flex: 1,
  },
  video: {
    flex: 1,
    justifyContent: "center",
  },
}));

export default Object.assign(Chat, {
  Conversation,
  Message,
  Input: ChatInput,
  DateSeparator,
  Activity,
  Attachments,
  AttachmentPreview,
  Receipt,
  Actions: MessageActions,
  Participants,
  EmptyState,
});
