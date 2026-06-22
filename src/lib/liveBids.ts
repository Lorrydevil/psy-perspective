import type { AppSession } from "../App";
import type { PublicLiveRoom } from "./liveRooms";
import { readStorageJSON, writeStorageJSON } from "./storage";

export const LIVE_BIDS_STORAGE_KEY = "looplot-live-bids";
export const LIVE_BIDS_UPDATED_EVENT = "looplot:live-bids-updated";
export const LIVE_BID_RECORDS_STORAGE_KEY = "looplot-live-bid-records";
export const LIVE_BID_RECORDS_UPDATED_EVENT = "looplot:live-bid-records-updated";

export type LiveBidEntry = {
  id: string;
  roomId: string;
  lotId: string;
  amount: number;
  bidder: string;
  bidderEmail: string | null;
  bidderRole: AppSession["role"] | null;
  createdAt: string;
};

export type LiveRoomBidState = {
  roomId: string;
  startingBid: number;
  currentBid: number;
  leader: string | null;
  minimumNextBid: number;
  totalBids: number;
  recentBids: LiveBidEntry[];
};

type StoredLiveBids = Record<string, LiveBidEntry[]>;
type StoredBidRecords = Record<string, LiveBidRecord[]>;

export type LiveBidRecord = {
  id: string;
  roomId: string;
  roomTitle: string;
  lotId: string;
  lotTitle: string;
  lotDetail: string;
  closedAt: string;
  status: "sold" | "passed";
  winningBid: number | null;
  winnerName: string | null;
  winnerEmail: string | null;
  winnerRole: AppSession["role"] | null;
  totalBids: number;
  bidHistory: LiveBidEntry[];
};

function readStoredLiveBids() {
  return readStorageJSON(LIVE_BIDS_STORAGE_KEY, {} as StoredLiveBids, (parsedValue) => {
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {} as StoredLiveBids;
    }

    return Object.fromEntries(
      Object.entries(parsedValue).map(([roomId, entries]) => {
        const validEntries = Array.isArray(entries)
          ? entries.filter((entry): entry is LiveBidEntry => {
              return (
                typeof entry?.id === "string" &&
                typeof entry?.roomId === "string" &&
                typeof entry?.lotId === "string" &&
                typeof entry?.amount === "number" &&
                Number.isFinite(entry.amount) &&
                typeof entry?.bidder === "string" &&
                (typeof entry?.bidderEmail === "string" || entry?.bidderEmail === null || entry?.bidderEmail === undefined) &&
                (entry?.bidderRole === "buyer" ||
                  entry?.bidderRole === "seller" ||
                  entry?.bidderRole === "admin" ||
                  entry?.bidderRole === null ||
                  entry?.bidderRole === undefined) &&
                typeof entry?.createdAt === "string"
              );
            })
          : [];

        return [
          roomId,
          validEntries.map((entry) => ({
            ...entry,
            bidderEmail: entry.bidderEmail ?? null,
            bidderRole: entry.bidderRole ?? null
          }))
        ];
      })
    );
  });
}

function writeStoredLiveBids(nextValue: StoredLiveBids) {
  writeStorageJSON(LIVE_BIDS_STORAGE_KEY, nextValue, LIVE_BIDS_UPDATED_EVENT);
}

function readStoredBidRecords() {
  return readStorageJSON(LIVE_BID_RECORDS_STORAGE_KEY, {} as StoredBidRecords, (parsedValue) => {
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {} as StoredBidRecords;
    }

    return Object.fromEntries(
      Object.entries(parsedValue).map(([roomId, records]) => {
        const validRecords = Array.isArray(records)
          ? records.filter((record): record is LiveBidRecord => {
              return (
                typeof record?.id === "string" &&
                typeof record?.roomId === "string" &&
                typeof record?.roomTitle === "string" &&
                typeof record?.lotId === "string" &&
                typeof record?.lotTitle === "string" &&
                typeof record?.lotDetail === "string" &&
                typeof record?.closedAt === "string" &&
                (record?.status === "sold" || record?.status === "passed") &&
                (typeof record?.winningBid === "number" || record?.winningBid === null) &&
                (typeof record?.winnerName === "string" || record?.winnerName === null) &&
                (typeof record?.winnerEmail === "string" || record?.winnerEmail === null) &&
                (record?.winnerRole === "buyer" ||
                  record?.winnerRole === "seller" ||
                  record?.winnerRole === "admin" ||
                  record?.winnerRole === null) &&
                typeof record?.totalBids === "number" &&
                Array.isArray(record?.bidHistory)
              );
            })
          : [];

        return [roomId, validRecords];
      })
    );
  });
}

function writeStoredBidRecords(nextValue: StoredBidRecords) {
  writeStorageJSON(LIVE_BID_RECORDS_STORAGE_KEY, nextValue, LIVE_BID_RECORDS_UPDATED_EVENT);
}

function createRoomLotKey(room: PublicLiveRoom) {
  return `${room.id}::${room.lotId ?? room.lot}`;
}

function parseAmountFromLabel(value: string) {
  const currencyMatches = Array.from(value.matchAll(/\$?\s*(\d[\d,]*(?:\.\d+)?)/g));
  const preferredMatch =
    currencyMatches.find((match) => match[0].includes("$")) ?? currencyMatches[currencyMatches.length - 1];

  if (!preferredMatch) {
    return 0;
  }

  const normalizedValue = preferredMatch[1]?.replace(/,/g, "") ?? "";
  const amount = Number(normalizedValue);

  return Number.isFinite(amount) ? amount : 0;
}

function computeMinimumIncrement(amount: number) {
  if (amount >= 500) {
    return 25;
  }

  if (amount >= 200) {
    return 10;
  }

  if (amount >= 50) {
    return 5;
  }

  return 1;
}

function createBidderLabel(session: AppSession | null) {
  if (session?.name?.trim()) {
    return session.name.trim();
  }

  return "Guest bidder";
}

export function formatBidCurrency(amount: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

export function formatBidTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getLiveRoomBidState(room: PublicLiveRoom) {
  const storedBids = readStoredLiveBids();
  return buildLiveRoomBidState(room, storedBids);
}

export function getAllLiveRoomBidStates(rooms: PublicLiveRoom[]) {
  const storedBids = readStoredLiveBids();

  return Object.fromEntries(rooms.map((room) => [room.id, buildLiveRoomBidState(room, storedBids)]));
}

function buildLiveRoomBidState(room: PublicLiveRoom, storedBids: StoredLiveBids) {
  const roomLotKey = createRoomLotKey(room);
  const roomBids = [...(storedBids[roomLotKey] ?? [])].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const latestBid = roomBids[0] ?? null;
  const startingBid = parseAmountFromLabel(room.bid);
  const currentBid = latestBid?.amount ?? startingBid;
  const minimumNextBid = currentBid + computeMinimumIncrement(currentBid || startingBid);

  return {
    roomId: room.id,
    startingBid,
    currentBid,
    leader: latestBid?.bidder ?? null,
    minimumNextBid,
    totalBids: roomBids.length,
    recentBids: roomBids.slice(0, 6)
  } satisfies LiveRoomBidState;
}

export function placeLiveBid({
  room,
  amount,
  session
}: {
  room: PublicLiveRoom;
  amount: number;
  session: AppSession | null;
}) {
  const bidState = getLiveRoomBidState(room);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false as const,
      message: "Enter a valid bid amount before submitting."
    };
  }

  if (amount < bidState.minimumNextBid) {
    return {
      ok: false as const,
      message: `Minimum next bid is ${formatBidCurrency(bidState.minimumNextBid)}.`
    };
  }

  const storedBids = readStoredLiveBids();
  const roomLotKey = createRoomLotKey(room);
  const roomBids = storedBids[roomLotKey] ?? [];
  const nextBid: LiveBidEntry = {
    id: `${room.id}-${Date.now()}`,
    roomId: room.id,
    lotId: room.lotId ?? room.lot,
    amount,
    bidder: createBidderLabel(session),
    bidderEmail: session?.email ?? null,
    bidderRole: session?.role ?? null,
    createdAt: new Date().toISOString()
  };

  writeStoredLiveBids({
    ...storedBids,
    [roomLotKey]: [nextBid, ...roomBids]
  });

  return {
    ok: true as const,
    message: `${nextBid.bidder} leads ${room.title} at ${formatBidCurrency(amount)}.`,
    bid: nextBid
  };
}

export function getLiveBidRecords(roomId: string) {
  const storedRecords = readStoredBidRecords();
  return [...(storedRecords[roomId] ?? [])].sort(
    (left, right) => new Date(right.closedAt).getTime() - new Date(left.closedAt).getTime()
  );
}

export function finalizeLiveLot({
  room,
  lotTitle,
  lotDetail
}: {
  room: PublicLiveRoom;
  lotTitle: string;
  lotDetail: string;
}) {
  const storedBids = readStoredLiveBids();
  const storedRecords = readStoredBidRecords();
  const roomLotKey = createRoomLotKey(room);
  const roomBids = [...(storedBids[roomLotKey] ?? [])].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const leadingBid = roomBids[0] ?? null;
  const nextRecord: LiveBidRecord = {
    id: `${room.id}-${room.lotId ?? room.lot}-${Date.now()}`,
    roomId: room.id,
    roomTitle: room.title,
    lotId: room.lotId ?? room.lot,
    lotTitle,
    lotDetail,
    closedAt: new Date().toISOString(),
    status: leadingBid ? "sold" : "passed",
    winningBid: leadingBid?.amount ?? null,
    winnerName: leadingBid?.bidder ?? null,
    winnerEmail: leadingBid?.bidderEmail ?? null,
    winnerRole: leadingBid?.bidderRole ?? null,
    totalBids: roomBids.length,
    bidHistory: roomBids
  };

  writeStoredBidRecords({
    ...storedRecords,
    [room.id]: [nextRecord, ...(storedRecords[room.id] ?? [])]
  });

  if (roomLotKey in storedBids) {
    const nextStoredBids = { ...storedBids };
    delete nextStoredBids[roomLotKey];
    writeStoredLiveBids(nextStoredBids);
  }

  return nextRecord;
}
