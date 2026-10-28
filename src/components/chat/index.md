[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# Chat

> A message thread and composer: day separators, grouped bubbles, receipts, attachments, reactions, replies, edits and an actions sheet.

<sub>`src/components/chat` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`rows.test.ts`](rows.test.ts), [`format.test.ts`](format.test.ts)</sub>

```tsx
import Chat from "@/components/chat";

<Screen padded={false} header={<Header center={<Chat.Participants participants={people} excludeId={me} />} />}>
  <Chat
    messages={messages}            // oldest first
    currentUserId={me}
    participants={people}
    activity={[{ userId: "ada", kind: "typing" }]}
    onSend={({ text, attachments, replyTo, editOf }) => …}
    onAction={(action, message) => …}   // reply | copy | edit | delete | react | retry | profile | link | file
    attachmentKinds={["image", "file"]}
  />
</Screen>
```

**Controlled.** Messages, participants and activity come in; everything the user does goes out through two callbacks: `onSend` for the composer and `onAction` (required) for everything else. Transport, storage and optimistic updates are the caller's. Chat keeps only UI state: the draft, pending attachments, the reply/edit target and which sheet is open. Put it in a `Screen` with `padded={false}` and not `scrollable` — the screen lifts it over the keyboard and the thread scrolls itself.

## The parts

Everything chat-only lives in this folder and is reachable as a static, for screens that need a different arrangement:

| Static                   | File                     | What it is                                                                                                |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `Chat.Conversation`      | `conversation.tsx`       | The virtualized thread (Legend List), anchored to the newest message, with the activity line at its foot. |
| `Chat.Message`           | `message.tsx`            | One bubble: sender, reply quote, text, attachments, time, receipt, reactions; long-press and swipe.       |
| `Chat.Input`             | `input.tsx`              | The composer: `Input` textarea, attach buttons, reply/edit banner, send.                                  |
| `Chat.DateSeparator`     | `date-separator.tsx`     | "Today", "Yesterday", weekday, date — a labelled `Divider`.                                               |
| `Chat.Activity`          | `activity.tsx`           | "Ada is typing…" with pulsing dots; a polite live region.                                                 |
| `Chat.Attachments`       | `attachments.tsx`        | Pictures grid, video tiles, inline voice messages, file rows.                                             |
| `Chat.AttachmentPreview` | `attachment-preview.tsx` | Pending attachments above the composer, removable, with upload progress.                                  |
| `Chat.Receipt`           | `receipt.tsx`            | Sending / sent / delivered / read / failed (failed is a retry button).                                    |
| `Chat.Actions`           | `actions.tsx`            | Quick reactions plus Reply, Copy, Edit, Delete — the long-press sheet's content.                          |
| `Chat.Participants`      | `participants.tsx`       | `Avatar.Group` with the chat's name and "5 members · 2 online", for a header.                             |
| `Chat.EmptyState`        | `empty-state.tsx`        | A `StateView` of type `empty` with chat copy and opener chips.                                            |

The overlapping-avatar primitive is **not** here: it's `Avatar.Group` in [`Avatar`](../avatar/index.md), because nothing about it is chat-specific. The empty state composes `StateView` rather than adding a primitive ([ADR 0001](../../../docs/adr/0001-reuse-before-new-components.md)).

## Behaviour

- **Anchored to the bottom without inverting.** Chat lists are often an inverted list, which turns scrolling, keyboard order and screen-reader order upside down. Legend List anchors natively instead: it opens at the end, pushes a short thread to the bottom, follows new messages only while the reader is already at the end (so reading history isn't interrupted) and keeps the reader's place when `onLoadEarlier` prepends. Reading order stays oldest → newest.
- **One callback per layer.** Inside, a bubble reports everything through one `onEvent(event, message)` (`ChatMessageEvent`: actions, reply, retry, react, profile, link, image, video, file), forwarded unchanged by `Chat.Conversation`; `Chat.Attachments` has one `onOpen`. `Chat` handles the UI half itself (the sheet, the image viewer, the video player, the reply banner, opening links and files) and passes the rest on as `onAction(action, message)`. Without `onEvent` a bubble is display-only; `readOnly` keeps profiles, links and attachments working but drops actions, reply, reactions and retry.
- **Opening the sender's profile**: their avatar (a button) and name report `{ type: "profile", participant }` — navigate from there. Screen readers get it as a "View … profile" action on the message, which also covers one-to-one chats, where no avatar is drawn. Own messages never offer it. `Chat.Participants` takes its own `onPress` for the header (the profile in a one-to-one chat, chat info in a group), since it's used outside the thread.
- **Links in messages.** Web addresses (with or without `https://`), emails and international phone numbers become inline links (`linkify.ts`, pure and tested — trailing punctuation stays out, brackets that belong to an address stay in, local-format numbers are left alone rather than guessed at). A tap opens it through `deepLinks.open`, as `Markdown` does, so the app's own links route in-app; `onAction` then hears `{ type: "link", url }`. Each link is also an "Open …" screen-reader action on the message. Links are drawn with `Text`'s new link spans.
- **Back to the newest.** Scroll more than half a screen up and a floating button (`jump-to-latest.tsx`) appears at the thread's end corner, badged with how many messages from others have arrived since; it scrolls to the end (instantly under Reduce Motion) and goes away once you're back. Sending your own message also brings you down, wherever you were.
- **Grouping is pure and tested** (`rows.ts`). A run breaks on a new sender, a new local day, a gap over five minutes, or a deleted message. Name and avatar go on the first message of a run (group chats only — `showSenders` defaults on for three or more people), time and receipt on the last; a failed message shows its receipt wherever it is.
- **Graphite look.** Own bubbles: the `selected` tint with an `accent` bar on the outer edge, on the end side. Others': `backgroundElement`, on the start side. Every corner goes through `radius.*`, so rounding bubbles later is one edit in `sizes.ts`. Sides flip from `isRTL`.
- **Actions without a gesture.** Long-press opens the actions sheet (a `Modal` of type `bottomSheet`); swipe toward the end side replies (native only — on the web a horizontal drag is text selection). Screen readers get both as named custom actions on the message. Copy is done by Chat (`expo-clipboard`); Delete is confirmed through a `Popup` before `onAction` hears about it; Edit puts the text in the composer and the next send carries `editOf`.
- **One element per message for a screen reader**: "Ada Lovelace, 14:05. Replying to Grace. See you there. edited. Read." Attachments, reactions and a retry stay separate elements because each can be acted on.
- **Attachments reuse the kit.** Pictures open in one shared `ImageViewer`; a video opens in a fullscreen `Modal` with `MediaPlayer` (the thread never mounts video players); voice messages play inline in `MediaPlayer`; files open through `deepLinks.open`, like links, and `onAction` hears `{ type: "file", attachment }`. The composer picks images through `ImagePicker` and everything else through a headless `FilePicker` filtered to the allowed MIME types.
- **Localized.** Every string is under `chat.*`; times and days use `Intl.DateTimeFormat` in the active locale, counts `formatNumber`.

## Limits

- **Return never sends**, on the web either — the composer is the kit's `Input` textarea, which doesn't expose key events. Enter-to-send needs a key handler on `Input` first.
- No voice recording in the composer; `recording` is only an activity others report.
- No message search, jump-to-reply, or unread marker yet.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
