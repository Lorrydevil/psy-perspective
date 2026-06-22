import { readStorageJSON, writeStorageJSON } from "./storage";

export const LIVE_ROOMS_STORAGE_KEY = "looplot-live-rooms";
export const LIVE_ROOMS_UPDATED_EVENT = "looplot:live-rooms-updated";

export type PublicLiveRoom = {
  id: string;
  title: string;
  seller: string;
  metric: string;
  detail: string;
  lot: string;
  lotId?: string;
  lotDetail?: string;
  lotState?: string;
  lotPhotoCount?: number;
  bid: string;
  status: string;
  category: string;
  format: string;
  hostNote: string;
  startedAt: string;
  isSimulated?: boolean;
};

export const seededLiveRooms: PublicLiveRoom[] = [
  {
    id: "sim-gold-room",
    title: "Gold Room Auctions",
    metric: "18.4k watching",
    detail: "High-energy lot rotation with premium item reveals.",
    seller: "Mila Archive",
    lot: "Chanel mini flap",
    lotId: "sim-gold-room-lot",
    bid: "$640",
    status: "Simulation room",
    category: "Luxury",
    format: "Auction Sprint",
    hostNote: "Simulation room with premium lot reveals and fast countdown pacing.",
    startedAt: "Simulated schedule",
    isSimulated: true
  },
  {
    id: "sim-collectors-table",
    title: "Collector's Table",
    metric: "12.1k watching",
    detail: "Rapid hobby breaks with chase alerts and queue previews.",
    seller: "Break Vault",
    lot: "Jordan rookie refractor",
    lotId: "sim-collectors-table-lot",
    bid: "$225",
    status: "Simulation room",
    category: "Trading Cards",
    format: "Break Room",
    hostNote: "Simulation room focused on chase cards, queue previews, and pinned bundles.",
    startedAt: "Simulated schedule",
    isSimulated: true
  },
  {
    id: "sim-heat-check-soles",
    title: "Heat Check Soles",
    metric: "9.3k watching",
    detail: "Sneaker sprints with fast-closing bids and instant checkout.",
    seller: "Sole Circuit",
    lot: "SB Dunk low size 10",
    lotId: "sim-heat-check-soles-lot",
    bid: "$188",
    status: "Simulation room",
    category: "Sneakers",
    format: "Buy Now",
    hostNote: "Simulation room for quick sneaker rotations and instant checkout moments.",
    startedAt: "Simulated schedule",
    isSimulated: true
  }
];

export function formatWatchingMetric(viewerCount: number) {
  if (viewerCount >= 1000) {
    return `${(viewerCount / 1000).toFixed(1)}k watching`;
  }

  return `${viewerCount} watching`;
}

export function readPublishedLiveRooms() {
  return readStorageJSON(LIVE_ROOMS_STORAGE_KEY, [] as PublicLiveRoom[], (value) =>
    Array.isArray(value) ? (value as PublicLiveRoom[]) : []
  );
}

function writePublishedLiveRooms(rooms: PublicLiveRoom[]) {
  writeStorageJSON(LIVE_ROOMS_STORAGE_KEY, rooms, LIVE_ROOMS_UPDATED_EVENT);
}

export function upsertPublishedLiveRoom(room: PublicLiveRoom) {
  const nextRooms = readPublishedLiveRooms().filter((item) => item.id !== room.id);
  nextRooms.unshift(room);
  writePublishedLiveRooms(nextRooms);
}

export function removePublishedLiveRoom(roomId: string) {
  const currentRooms = readPublishedLiveRooms();
  const nextRooms = currentRooms.filter((room) => room.id !== roomId);

  if (nextRooms.length === currentRooms.length) {
    return;
  }

  writePublishedLiveRooms(nextRooms);
}
