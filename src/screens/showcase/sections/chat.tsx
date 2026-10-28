import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import Chat, {
  type ChatAction,
  type ChatActivity,
  type ChatMessage,
  type ChatParticipant,
  type ChatSendPayload,
} from "@/components/chat";
import If from "@/components/if";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import Toast from "@/components/toast";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { MINUTE } from "@/utils";

const ME = "me";

const PEOPLE: ChatParticipant[] = [
  { id: ME, name: "You" },
  {
    id: "ada",
    name: "Ada Lovelace",
    avatar: "https://picsum.photos/id/1027/200/200",
    online: true,
  },
  {
    id: "grace",
    name: "Grace Hopper",
    avatar: "https://picsum.photos/id/1025/200/200",
  },
];

function initialThread(): ChatMessage[] {
  const now = Date.now();
  const at = (minutesAgo: number) => now - minutesAgo * MINUTE;
  return [
    {
      id: "s1",
      senderId: "ada",
      createdAt: at(26 * 60),
      text: "Has anyone looked at the new engine notes? https://example.com/engine",
    },
    {
      id: "s2",
      senderId: ME,
      createdAt: at(26 * 60 - 5),
      text: "Diagrams attached.",
      status: "read",
      attachments: [
        {
          id: "s2a",
          kind: "image",
          uri: "https://picsum.photos/id/1015/800/600",
          alt: "River valley",
        },
        {
          id: "s2b",
          kind: "image",
          uri: "https://picsum.photos/id/1039/800/600",
          alt: "Waterfall",
        },
      ],
    },
    {
      id: "s3",
      senderId: "grace",
      createdAt: at(30),
      text: "Notes v2 — section G is the interesting one.",
      attachments: [
        {
          id: "s3a",
          kind: "file",
          uri: "https://example.com/notes-v2.pdf",
          name: "notes-v2.pdf",
          size: 482_000,
        },
      ],
      reactions: [{ emoji: "👍", userIds: [ME, "ada"] }],
    },
    {
      id: "s4",
      senderId: "grace",
      createdAt: at(29),
      text: "Can we go through it at 3?",
    },
    {
      id: "s5",
      senderId: ME,
      createdAt: at(10),
      text: "Works for me.",
      replyTo: "s4",
      status: "failed",
    },
  ];
}

type Mode = "group" | "empty";

/**
 * A live, local-only chat: sending appends a message that goes sending →
 * delivered → read, Ada "types" a reply, and every action from the sheet
 * is applied to the local thread.
 */
export default function ChatSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [mode, setMode] = useState<Mode>("group");
  const [messages, setMessages] = useState<ChatMessage[]>(initialThread);
  const [activity, setActivity] = useState<ChatActivity[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, run: () => void) => {
    timers.current.push(setTimeout(run, ms));
  };
  const patch = (id: string, change: Partial<ChatMessage>) =>
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, ...change } : message,
      ),
    );

  const deliver = (id: string) => {
    patch(id, { status: "sending" });
    later(700, () => patch(id, { status: "delivered" }));
    later(1600, () => {
      patch(id, { status: "read" });
      setActivity([{ userId: "ada", kind: "typing" }]);
    });
    later(3600, () => {
      setActivity([]);
      setMessages((current) => [
        ...current,
        {
          id: `ada-${Date.now()}`,
          senderId: "ada",
          createdAt: Date.now(),
          text: "Got it 👍",
        },
      ]);
    });
  };

  const send = ({ text, attachments, replyTo, editOf }: ChatSendPayload) => {
    if (editOf) {
      patch(editOf, { text, editedAt: Date.now() });
      return;
    }
    const id = `me-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id,
        senderId: ME,
        createdAt: Date.now(),
        text,
        attachments,
        replyTo,
        status: "sending",
      },
    ]);
    if (mode === "empty") setMode("group");
    deliver(id);
  };

  const act = (action: ChatAction, message: ChatMessage) => {
    if (action.type === "retry") deliver(message.id);
    // In a real flow this is a navigation to the profile route.
    if (action.type === "profile") {
      void Toast.show({
        type: "info",
        message: `Open profile: ${action.participant.name}`,
      });
    }
    if (action.type === "delete") patch(message.id, { deleted: true });
    if (action.type !== "react") return;
    const reactions = [...(message.reactions ?? [])];
    const index = reactions.findIndex((r) => r.emoji === action.emoji);
    const existing = reactions[index];
    if (existing === undefined) {
      reactions.push({ emoji: action.emoji, userIds: [ME] });
    } else {
      const userIds = existing.userIds.includes(ME)
        ? existing.userIds.filter((id) => id !== ME)
        : [...existing.userIds, ME];
      if (userIds.length === 0) reactions.splice(index, 1);
      else reactions[index] = { ...existing, userIds };
    }
    patch(message.id, { reactions });
  };

  return (
    <View style={styles.container}>
      <Text
        value="Long-press a message for actions, swipe it to reply (native), tap the failed receipt to retry. Everything stays local."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <SegmentedControl
        label="Thread"
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { value: "group", label: "Group" },
          { value: "empty", label: "Empty" },
        ]}
      />
      <View style={[styles.frame, { borderColor: theme.colors.divider }]}>
        <If condition={mode === "group"}>
          <Chat
            header={
              <View
                style={[styles.header, { borderColor: theme.colors.divider }]}
              >
                <Chat.Participants
                  participants={PEOPLE}
                  excludeId={ME}
                  onPress={() =>
                    void Toast.show({ type: "info", message: "Open chat info" })
                  }
                />
              </View>
            }
            messages={messages}
            currentUserId={ME}
            participants={PEOPLE}
            activity={activity}
            onSend={send}
            onAction={act}
            attachmentKinds={["image", "video", "audio", "file"]}
          />
        </If>
        <If condition={mode === "empty"}>
          <Chat
            messages={[]}
            currentUserId={ME}
            participants={PEOPLE.slice(0, 2)}
            onSend={send}
            onAction={act}
            emptyState={{ suggestions: ["Hi! 👋", "Are you free today?"] }}
          />
        </If>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ units, spacing }) => ({
  container: {
    gap: spacing.x12,
  },
  frame: {
    height: units(560),
    borderWidth: units(1),
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
    borderBottomWidth: units(1),
  },
}));
