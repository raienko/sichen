import { DAY, MINUTE } from "@/utils";

import type { ChatMessage, ChatParticipant } from "./types";

/**
 * Sample people and a thread for stories and tests. Not exported from the
 * folder's entry point: product code brings its own data.
 */
export const ME = "me";

export const PEOPLE: ChatParticipant[] = [
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
  { id: "alan", name: "Alan Turing", online: true },
];

/** A thread ending `endingAt`, spanning yesterday and today. */
export function sampleThread(endingAt = Date.now()): ChatMessage[] {
  const at = (minutesAgo: number) => endingAt - minutesAgo * MINUTE;

  return [
    {
      id: "m1",
      senderId: "ada",
      createdAt: at(DAY / MINUTE + 90),
      text: "Has anyone looked at the new engine notes?",
    },
    {
      id: "m2",
      senderId: "grace",
      createdAt: at(DAY / MINUTE + 88),
      text: "Reading them now. The loop section is clever.",
    },
    {
      id: "m3",
      senderId: ME,
      createdAt: at(DAY / MINUTE + 80),
      text: "I've attached the diagrams.",
      status: "read",
      attachments: [
        {
          id: "a1",
          kind: "image",
          uri: "https://picsum.photos/id/1015/800/600",
          alt: "River valley",
          width: 800,
          height: 600,
        },
        {
          id: "a2",
          kind: "image",
          uri: "https://picsum.photos/id/1039/800/600",
          alt: "Waterfall",
        },
        {
          id: "a3",
          kind: "image",
          uri: "https://picsum.photos/id/1043/800/600",
          alt: "Cliffs",
        },
      ],
    },
    {
      id: "m4",
      senderId: "ada",
      createdAt: at(30),
      text: "Morning! Notes v2 below, older ones at www.example.com/notes.",
      attachments: [
        {
          id: "a4",
          kind: "file",
          uri: "https://example.com/notes-v2.pdf",
          name: "notes-v2.pdf",
          size: 482_000,
          mimeType: "application/pdf",
        },
      ],
      reactions: [{ emoji: "👍", userIds: [ME, "grace"] }],
    },
    {
      id: "m5",
      senderId: "ada",
      createdAt: at(29),
      text: "Section G is the interesting one.",
    },
    {
      id: "m6",
      senderId: "grace",
      createdAt: at(20),
      deleted: true,
    },
    {
      id: "m7",
      senderId: ME,
      createdAt: at(12),
      text: "Agreed — can we go through it at 3?",
      replyTo: "m5",
      status: "delivered",
      editedAt: at(11),
    },
    {
      id: "m8",
      senderId: ME,
      createdAt: at(11),
      text: "I'll book a room.",
      status: "failed",
    },
  ];
}
