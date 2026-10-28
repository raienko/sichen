import { useState } from "react";
import { useWindowDimensions, View } from "react-native";

import Toast from "@/components/toast";
import { createStyles } from "@/features/responsive";

import { ME, PEOPLE, sampleThread } from "./fixtures";
import Component, {
  type ChatAction,
  type ChatMessage,
  type ChatSendPayload,
} from "./index";

const meta = {
  title: "components/Chat",
  component: Component,
};

export default meta;

/**
 * Where an app would navigate: a profile press arrives as an action, and
 * here a toast stands in for the route change.
 */
function onAction(action: ChatAction) {
  if (action.type === "profile") {
    void Toast.show({
      type: "info",
      message: `Navigate to ${action.participant.name}'s profile`,
    });
  }
}

/** The header press — chat info in a group, the profile one-to-one. */
function openChatInfo(title: string) {
  void Toast.show({ type: "info", message: `Navigate to ${title}` });
}

/**
 * Storybook's own canvas padding (`layout: "padded"`, 1rem a side) — a CSS
 * pixel value of the host page, so deliberately not through `units()`.
 */
const CANVAS_PADDING = 16;

/**
 * A fixed-height frame, as a screen would give it — the window's height
 * less the canvas padding, so the composer is on screen at any size.
 */
function Frame({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  return (
    <View style={[styles.frame, { height: height - CANVAS_PADDING * 2 }]}>
      {children}
    </View>
  );
}

function useLocalThread(initial: ChatMessage[]) {
  const [messages, setMessages] = useState(initial);
  const send = ({ text, attachments, replyTo, editOf }: ChatSendPayload) =>
    setMessages((current) =>
      editOf
        ? current.map((message) =>
            message.id === editOf
              ? { ...message, text, editedAt: Date.now() }
              : message,
          )
        : [
            ...current,
            {
              id: `${Date.now()}`,
              senderId: ME,
              createdAt: Date.now(),
              text,
              attachments,
              replyTo,
              status: "sent",
            },
          ],
    );
  return { messages, send };
}

/** Group chat: separators, grouping, a reply, reactions, every receipt. */
export const Group = () => {
  const { messages, send } = useLocalThread(sampleThread());
  return (
    <Frame>
      <Component
        header={
          <Component.Participants
            participants={PEOPLE}
            excludeId={ME}
            onPress={() => openChatInfo("chat info")}
          />
        }
        messages={messages}
        currentUserId={ME}
        participants={PEOPLE}
        onSend={send}
        onAction={onAction}
        attachmentKinds={["image", "file"]}
      />
    </Frame>
  );
};

/** One-to-one: no names or avatars on the other person's bubbles. */
export const OneToOne = () => {
  const { messages, send } = useLocalThread(
    sampleThread().filter((message) => [ME, "ada"].includes(message.senderId)),
  );
  return (
    <Frame>
      <Component
        header={
          <Component.Participants
            participants={PEOPLE.slice(0, 2)}
            excludeId={ME}
            onPress={() => openChatInfo(`${PEOPLE[1].name}'s profile`)}
          />
        }
        messages={messages}
        currentUserId={ME}
        participants={PEOPLE.slice(0, 2)}
        onSend={send}
        onAction={onAction}
      />
    </Frame>
  );
};

export const Typing = () => (
  <Frame>
    <Component
      messages={sampleThread()}
      currentUserId={ME}
      participants={PEOPLE}
      activity={[
        { userId: "ada", kind: "typing" },
        { userId: "grace", kind: "typing" },
      ]}
      onSend={() => {}}
      onAction={onAction}
    />
  </Frame>
);

export const Empty = () => (
  <Frame>
    <Component
      messages={[]}
      currentUserId={ME}
      participants={PEOPLE.slice(0, 2)}
      onSend={() => {}}
      onAction={onAction}
      emptyState={{ suggestions: ["Hi! 👋", "Are you free today?"] }}
    />
  </Frame>
);

export const ReadOnly = () => (
  <Frame>
    <Component
      messages={sampleThread()}
      currentUserId={ME}
      participants={PEOPLE}
      onSend={() => {}}
      onAction={onAction}
      disabled
    />
  </Frame>
);

/** A thousand messages, to see the virtualization hold. */
// Built once, at module load: a story re-renders, and a thread made from
// the clock during render would change under it.
const LONG_THREAD_END = Date.now();

export const LongThread = () => {
  const now = LONG_THREAD_END;
  const { messages, send } = useLocalThread(
    Array.from({ length: 1000 }, (_, index) => ({
      id: `long-${index}`,
      senderId: index % 3 === 0 ? ME : index % 3 === 1 ? "ada" : "grace",
      createdAt: now - (1000 - index) * 7 * 60 * 1000,
      text: `Message ${index + 1}`,
      status: "read" as const,
    })),
  );
  return (
    <Frame>
      <Component
        messages={messages}
        currentUserId={ME}
        participants={PEOPLE}
        onSend={send}
        onAction={onAction}
      />
    </Frame>
  );
};

export const Receipts = () => (
  <View>
    {(["sending", "sent", "delivered", "read", "failed"] as const).map(
      (status) => (
        <Component.Receipt key={status} status={status} onRetry={() => {}} />
      ),
    )}
  </View>
);

const useStyles = createStyles(({ units }) => ({
  frame: {
    overflow: "hidden",
  },
}));
