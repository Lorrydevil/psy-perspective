import { readStorageJSON, writeStorageJSON } from "./storage";

export const LIVE_CHAT_STORAGE_KEY = "looplot-live-chat";
export const LIVE_CHAT_UPDATED_EVENT = "looplot:live-chat-updated";

export type LiveChatRole = "buyer" | "seller" | "admin" | "system";

export type LiveChatMessage = {
  id: string;
  roomId: string;
  senderName: string;
  senderRole: LiveChatRole;
  text: string;
  createdAt: string;
  pinned?: boolean;
};

const seededChatMessages: LiveChatMessage[] = [
  {
    id: "seed-gold-1",
    roomId: "sim-gold-room",
    senderName: "Mila Archive",
    senderRole: "seller",
    text: "Authentication card is pinned. Corner closeups are coming up before the timer drops.",
    createdAt: "2026-05-19T08:00:00.000Z",
    pinned: true
  },
  {
    id: "seed-gold-2",
    roomId: "sim-gold-room",
    senderName: "Rhea",
    senderRole: "admin",
    text: "Bundle shipping is available if you win multiple luxury lots tonight.",
    createdAt: "2026-05-19T08:01:00.000Z"
  },
  {
    id: "seed-cards-1",
    roomId: "sim-collectors-table",
    senderName: "Break Vault",
    senderRole: "seller",
    text: "Pack order is pinned in chat. We will surface scan the Jordan before final call.",
    createdAt: "2026-05-19T08:02:00.000Z",
    pinned: true
  },
  {
    id: "seed-cards-2",
    roomId: "sim-collectors-table",
    senderName: "Jamie P",
    senderRole: "buyer",
    text: "Can we get a closer look at the top edge before the next bid?",
    createdAt: "2026-05-19T08:03:00.000Z"
  },
  {
    id: "seed-sneakers-1",
    roomId: "sim-heat-check-soles",
    senderName: "Sole Circuit",
    senderRole: "seller",
    text: "Size 10 is on stage now. Box condition and outsole check are both queued.",
    createdAt: "2026-05-19T08:04:00.000Z",
    pinned: true
  }
];

function sortMessages(messages: LiveChatMessage[]) {
  return [...messages].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    return leftTime - rightTime;
  });
}

export function readStoredLiveChatMessages() {
  return readStorageJSON(LIVE_CHAT_STORAGE_KEY, [] as LiveChatMessage[], (value) => {
    if (!Array.isArray(value)) {
      return [] as LiveChatMessage[];
    }

    return value.filter((message): message is LiveChatMessage => {
      return (
        typeof message?.id === "string" &&
        typeof message?.roomId === "string" &&
        typeof message?.senderName === "string" &&
        (message?.senderRole === "buyer" ||
          message?.senderRole === "seller" ||
          message?.senderRole === "admin" ||
          message?.senderRole === "system") &&
        typeof message?.text === "string" &&
        typeof message?.createdAt === "string"
      );
    });
  });
}

function writeStoredLiveChatMessages(messages: LiveChatMessage[]) {
  writeStorageJSON(LIVE_CHAT_STORAGE_KEY, messages, LIVE_CHAT_UPDATED_EVENT);
}

export function getLiveChatMessages(roomId: string) {
  const seededMessages = seededChatMessages.filter((message) => message.roomId === roomId);
  const storedMessages = readStoredLiveChatMessages().filter((message) => message.roomId === roomId);
  return sortMessages([...seededMessages, ...storedMessages]);
}

export function postLiveChatMessage(input: {
  roomId: string;
  senderName: string;
  senderRole: LiveChatRole;
  text: string;
  pinned?: boolean;
}): { ok: true; message: LiveChatMessage } | { ok: false; message: string } {
  const normalizedText = input.text.trim().replace(/\s+/g, " ");

  if (normalizedText.length < 2) {
    return {
      ok: false as const,
      message: "Write a short chat message before sending."
    };
  }

  if (normalizedText.length > 240) {
    return {
      ok: false as const,
      message: "Keep chat messages under 240 characters."
    };
  }

  const nextMessage: LiveChatMessage = {
    id: `${input.roomId}-${Date.now()}`,
    roomId: input.roomId,
    senderName: input.senderName.trim() || "Unknown user",
    senderRole: input.senderRole,
    text: normalizedText,
    createdAt: new Date().toISOString(),
    pinned: input.pinned
  };

  const storedMessages = readStoredLiveChatMessages();
  writeStoredLiveChatMessages([...storedMessages, nextMessage]);

  return {
    ok: true as const,
    message: nextMessage
  };
}
