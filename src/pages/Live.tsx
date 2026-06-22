import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { AppSession, BuyerAccountSettings } from "../App";
import {
  formatBidCurrency,
  formatBidTime,
  getAllLiveRoomBidStates,
  LIVE_BIDS_STORAGE_KEY,
  LIVE_BIDS_UPDATED_EVENT,
  placeLiveBid
} from "../lib/liveBids";
import { LIVE_STREAM_UPDATED_EVENT, readPublishedLiveStream } from "../lib/liveStream";
import {
  LIVE_ROOMS_STORAGE_KEY,
  LIVE_ROOMS_UPDATED_EVENT,
  readPublishedLiveRooms,
  seededLiveRooms,
  type PublicLiveRoom
} from "../lib/liveRooms";
import {
  getLiveChatMessages,
  LIVE_CHAT_STORAGE_KEY,
  LIVE_CHAT_UPDATED_EVENT,
  postLiveChatMessage
} from "../lib/liveChat";
import {
  createTrustIncidentReport,
  type TrustIncidentCategory,
  type TrustIncidentSeverity
} from "../lib/trustSafety";
import { readStorageJSON, readStorageText, writeStorageJSON, writeStorageText } from "../lib/storage";

const LIVE_JOINED_ROOMS_STORAGE_KEY = "looplot-live-joined-rooms";
const LIVE_WATCHLIST_STORAGE_KEY = "looplot-live-watchlist";
const LIVE_ACTIVE_ROOM_STORAGE_KEY = "looplot-live-active-room";

const pulseMetrics = [
  { label: "Bids / Min", value: "412" },
  { label: "Orders Tonight", value: "1,284" },
  { label: "Average Checkout", value: "$86" },
  { label: "Sell-Through Rate", value: "78%" }
];

const activityFeed = [
  "Lot 42 just closed at $118 in Gold Room Auctions.",
  "Collector's Table pinned a chase card bundle for the next round.",
  "Heat Check Soles opened instant checkout on a size 10 restock."
] as const;

const liveHandoffs = [
  { title: "Home", detail: "Switch accounts or return to the main platform entry page.", to: "/" },
  { title: "Discover", detail: "Move back to featured categories and upcoming launches.", to: "/discover" },
  { title: "Seller Dashboard", detail: "Open the seller backend for stream setup and live controls.", to: "/seller" },
  { title: "Admin Dashboard", detail: "Continue into moderation and operational oversight if permitted.", to: "/admin" }
];

type BuyerRoomMoment = {
  headline: string;
  subhead: string;
  trustSignal: string;
  lotQueue: string[];
  bidPresets: string[];
  chatMoments: string[];
  checkoutSteps: string[];
  tags: string[];
};

const buyerMomentsByCategory: Record<PublicLiveRoom["category"], BuyerRoomMoment> = {
  Luxury: {
    headline: "Premium accessories are moving with short timers and higher intent bidders.",
    subhead: "Authentication notes, condition callouts, and sudden-death pacing stay visible for buyers.",
    trustSignal: "Authenticity notes pinned before the lot closes.",
    lotQueue: ["Louis Vuitton pochette", "Cartier silk scarf", "Gucci horsebit belt"],
    bidPresets: ["$25", "$50", "$100"],
    chatMoments: ["Ask for corner closeups", "Pin authentication note", "Request shipping bundle"],
    checkoutSteps: ["Join room", "Place bid", "Confirm invoice", "Track shipment"],
    tags: ["Authenticated", "Luxury", "Fast close"]
  },
  "Trading Cards": {
    headline: "Card buyers are clustering around chase pulls and break-room momentum.",
    subhead: "Condition notes and queue previews help viewers decide when to stay for the next rip.",
    trustSignal: "Card condition and pack source stay pinned during the break.",
    lotQueue: ["Prizm hobby rip", "Jordan insert bundle", "Mystery slab pull"],
    bidPresets: ["$10", "$20", "$40"],
    chatMoments: ["Ask for surface scan", "Pin break order", "Request comp check"],
    checkoutSteps: ["Join break", "Watch reveal", "Claim invoice", "Wait for recap"],
    tags: ["Break room", "Chase pull", "Condition pinned"]
  },
  Sneakers: {
    headline: "Sneaker buyers are moving fast between auction lots and instant checkout runs.",
    subhead: "Size visibility and authenticity notes stay close to the stage so buyers can react quickly.",
    trustSignal: "Size, condition, and authenticity stay surfaced before claim windows open.",
    lotQueue: ["Jordan 1 size 10", "SB Dunk low size 9.5", "Yeezy foam runner size 11"],
    bidPresets: ["$15", "$30", "$60"],
    chatMoments: ["Ask for outsole view", "Request box condition", "Pin size run"],
    checkoutSteps: ["Watch size callout", "Place bid or buy now", "Confirm shipping", "Review order"],
    tags: ["Size run", "Instant checkout", "Verified"]
  },
  Collectibles: {
    headline: "Collectors are staying for provenance notes and story-driven lot reveals.",
    subhead: "Buyer confidence improves when rarity, flaws, and shipping constraints stay visible.",
    trustSignal: "Provenance and flaw notes stay pinned before bidding starts.",
    lotQueue: ["Signed poster tube", "Variant comic pair", "Vintage figurine set"],
    bidPresets: ["$20", "$35", "$75"],
    chatMoments: ["Ask for flaw check", "Pin provenance card", "Request shipping details"],
    checkoutSteps: ["Inspect details", "Bid with confidence", "Confirm packing notes", "Track fulfillment"],
    tags: ["Provenance", "Collector grade", "Story-led"]
  },
  Accessories: {
    headline: "Accessory buyers are responding to bundles and low-friction add-on offers.",
    subhead: "Bundle value and wear notes keep impulse claims clean while the room keeps moving.",
    trustSignal: "Material and wear notes are pinned before each bundle.",
    lotQueue: ["Charm stack set", "Designer card holder", "Travel pouch bundle"],
    bidPresets: ["$10", "$25", "$45"],
    chatMoments: ["Ask for zipper closeup", "Pin wear notes", "Request bundle swap"],
    checkoutSteps: ["Open room", "Bid or claim", "Bundle checkout", "Review invoice"],
    tags: ["Bundle-ready", "Impulse claim", "Low friction"]
  },
  Beauty: {
    headline: "Beauty rooms rely on short demos and urgency around shade and stock counts.",
    subhead: "Buyers need fast clarity on hygiene, expiry, and shade matching before checkout.",
    trustSignal: "Shade and hygiene notes stay pinned before claims open.",
    lotQueue: ["Limited palette drop", "Skincare duo", "Shade trio bundle"],
    bidPresets: ["$5", "$15", "$30"],
    chatMoments: ["Ask for shade swatch", "Pin expiry note", "Request bundle info"],
    checkoutSteps: ["Watch demo", "Claim product", "Confirm shade", "Checkout fast"],
    tags: ["Shade callout", "Limited stock", "Demo-led"]
  }
};

function buildBuyerMoment(room: PublicLiveRoom): BuyerRoomMoment {
  const categoryMoment = buyerMomentsByCategory[room.category];

  if (!room.isSimulated) {
    return {
      ...categoryMoment,
      headline: `${room.seller} is live now and the room was published from the seller launch flow.`,
      subhead: room.detail,
      lotQueue: [room.lot, ...categoryMoment.lotQueue].slice(0, 4),
      tags: ["Seller live", ...categoryMoment.tags].slice(0, 4)
    };
  }

  return categoryMoment;
}

function syncVideoElementStream(videoElement: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!videoElement) {
    return;
  }

  if (!stream) {
    try {
      videoElement.pause();
      videoElement.srcObject = null;
    } catch {
      // Fall through to the existing src cleanup for browsers with limited MediaStream support.
    }

    videoElement.removeAttribute("src");
    videoElement.load();
    return;
  }

  try {
    videoElement.srcObject = stream;
  } catch {
    videoElement.removeAttribute("src");
    videoElement.load();
    return;
  }

  const playbackAttempt = videoElement.play();

  if (playbackAttempt && typeof playbackAttempt.catch === "function") {
    playbackAttempt.catch(() => undefined);
  }
}

function getBidDisplayLabel(room: PublicLiveRoom, amount: number) {
  if (amount <= 0) {
    return room.bid;
  }

  return formatBidCurrency(amount);
}

function getSessionBidderLabel(session: AppSession | null) {
  const name = session?.name?.trim();
  return name ? name : null;
}

function canSessionPlaceBid(session: AppSession | null) {
  return session?.role === "buyer" || session?.role === "admin";
}

function parseBidPresetValue(preset: BuyerAccountSettings["bidPreset"] | undefined) {
  return preset ? Number(preset.replace(/[^0-9.]/g, "")) : NaN;
}

function buildBidSuggestions(
  minimumNextBid: number,
  currentBid: number,
  preferredPreset?: BuyerAccountSettings["bidPreset"]
) {
  const increment = Math.max(minimumNextBid - currentBid, 1);
  const preferredAmount = parseBidPresetValue(preferredPreset);
  const usablePreferredAmount =
    Number.isFinite(preferredAmount) && preferredAmount >= minimumNextBid ? preferredAmount : minimumNextBid + increment;

  return Array.from(new Set([minimumNextBid, usablePreferredAmount, usablePreferredAmount + increment])).sort(
    (left, right) => left - right
  );
}

function readStoredStringList(key: string) {
  return readStorageJSON(key, [] as string[], (value) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
  );
}

function readStoredActiveRoomId() {
  return readStorageText(LIVE_ACTIVE_ROOM_STORAGE_KEY);
}

function resolveActiveRoomId(currentRoomId: string, publishedRooms: PublicLiveRoom[]) {
  const availableRooms = [...publishedRooms, ...seededLiveRooms];

  if (currentRoomId && availableRooms.some((room) => room.id === currentRoomId)) {
    return currentRoomId;
  }

  return publishedRooms[0]?.id ?? seededLiveRooms[0]?.id ?? "";
}

export default function Live({
  buyerSettings,
  session
}: {
  buyerSettings?: BuyerAccountSettings | null;
  session: AppSession | null;
}) {
  const [publishedRooms, setPublishedRooms] = useState<PublicLiveRoom[]>(() => readPublishedLiveRooms());
  const [activeRoomId, setActiveRoomId] = useState<string>(
    () => resolveActiveRoomId(readStoredActiveRoomId(), readPublishedLiveRooms())
  );
  const [joinedRoomIds, setJoinedRoomIds] = useState<string[]>(() => readStoredStringList(LIVE_JOINED_ROOMS_STORAGE_KEY));
  const [watchlistRoomIds, setWatchlistRoomIds] = useState<string[]>(() => readStoredStringList(LIVE_WATCHLIST_STORAGE_KEY));
  const [bidRefreshKey, setBidRefreshKey] = useState(0);
  const [bidInput, setBidInput] = useState("");
  const [bidFeedback, setBidFeedback] = useState("Choose a room to see buyer actions, bid presets, and checkout cues.");
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatFeedback, setChatFeedback] = useState("Join the room to participate in live chat with the host and moderators.");
  const [reportCategory, setReportCategory] = useState<TrustIncidentCategory>("Misleading listing");
  const [reportSeverity, setReportSeverity] = useState<TrustIncidentSeverity>("Medium");
  const [reportDetail, setReportDetail] = useState("");
  const [reportFeedback, setReportFeedback] = useState("Need help from moderation? Report the room and the admin suite will pick it up.");
  const viewerRef = useRef<HTMLElement | null>(null);
  const stageVideoRef = useRef<HTMLVideoElement | null>(null);
  const [sellerFeedAvailable, setSellerFeedAvailable] = useState(false);
  const liveRooms = [...publishedRooms, ...seededLiveRooms];
  const roomBidStates = getAllLiveRoomBidStates(liveRooms);
  const activeRoom = liveRooms.find((room) => room.id === activeRoomId) ?? liveRooms[0] ?? null;
  const activeBidState = activeRoom ? roomBidStates[activeRoom.id] : null;
  const activeBuyerMoment = activeRoom ? buildBuyerMoment(activeRoom) : null;
  const activeChatMessages = activeRoom ? getLiveChatMessages(activeRoom.id) : [];
  const isJoined = activeRoom ? joinedRoomIds.includes(activeRoom.id) : false;
  const isWatchlisted = activeRoom ? watchlistRoomIds.includes(activeRoom.id) : false;
  const sessionBidderLabel = getSessionBidderLabel(session);
  const canBidWithSession = canSessionPlaceBid(session);
  const leadingBidText = activeBidState
    ? getBidDisplayLabel(activeRoom, activeBidState.currentBid || activeBidState.startingBid)
    : "Bid opening soon";
  const nextBidText = activeBidState ? formatBidCurrency(activeBidState.minimumNextBid) : "$1";
  const activeBidSuggestions = activeBidState
    ? buildBidSuggestions(activeBidState.minimumNextBid, activeBidState.currentBid, buyerSettings?.bidPreset)
    : [1, 2, 3];
  const preferredBidPresetValue = parseBidPresetValue(buyerSettings?.bidPreset);
  const buyerCategoryMatch = Boolean(buyerSettings && activeRoom && buyerSettings.favoriteCategory === activeRoom.category);
  const currentViewerIsLeading = Boolean(sessionBidderLabel && activeBidState?.leader === sessionBidderLabel);
  const sessionRecentBids = activeBidState?.recentBids.filter((entry) => entry.bidder === sessionBidderLabel) ?? [];
  const sessionHighestBid = sessionRecentBids.reduce((highest, entry) => Math.max(highest, entry.amount), 0);
  const sessionLatestBid = sessionRecentBids[0]?.amount ?? null;
  const outbidGap =
    sessionLatestBid !== null && activeBidState ? Math.max(activeBidState.minimumNextBid - sessionLatestBid, 0) : null;
  const biddingAccessLabel = !session
    ? "Sign in as a buyer to bid."
    : canBidWithSession
      ? isJoined
        ? currentViewerIsLeading
          ? "You are leading this lot."
          : "You can place the next valid bid."
        : "Join the room to unlock bid placement."
      : "Seller accounts can watch the room but cannot bid from the public floor.";

  void bidRefreshKey;
  void chatRefreshKey;

  useEffect(() => {
    writeStorageJSON(LIVE_JOINED_ROOMS_STORAGE_KEY, joinedRoomIds);
  }, [joinedRoomIds]);

  useEffect(() => {
    writeStorageJSON(LIVE_WATCHLIST_STORAGE_KEY, watchlistRoomIds);
  }, [watchlistRoomIds]);

  useEffect(() => {
    if (activeRoomId) {
      writeStorageText(LIVE_ACTIVE_ROOM_STORAGE_KEY, activeRoomId);
    }
  }, [activeRoomId]);

  useEffect(() => {
    function syncPublishedRooms() {
      const nextPublishedRooms = readPublishedLiveRooms();
      setPublishedRooms(nextPublishedRooms);
      setActiveRoomId((current) => resolveActiveRoomId(current, nextPublishedRooms));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === LIVE_ROOMS_STORAGE_KEY) {
        syncPublishedRooms();
      }
    }

    window.addEventListener(LIVE_ROOMS_UPDATED_EVENT, syncPublishedRooms);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LIVE_ROOMS_UPDATED_EVENT, syncPublishedRooms);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!activeBidState) {
      return;
    }

    setBidInput((current) => {
      if (!current.trim()) {
        return current;
      }

      const numericValue = Number(current.replace(/[^0-9.]/g, ""));

      if (!Number.isFinite(numericValue) || numericValue >= activeBidState.minimumNextBid) {
        return current;
      }

      return String(activeBidState.minimumNextBid);
    });
  }, [activeBidState?.minimumNextBid, activeRoom?.id]);

  useEffect(() => {
    function syncBids() {
      setBidRefreshKey((current) => current + 1);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === LIVE_BIDS_STORAGE_KEY) {
        syncBids();
      }
    }

    window.addEventListener(LIVE_BIDS_UPDATED_EVENT, syncBids);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LIVE_BIDS_UPDATED_EVENT, syncBids);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    function syncChat() {
      setChatRefreshKey((current) => current + 1);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === LIVE_CHAT_STORAGE_KEY) {
        syncChat();
      }
    }

    window.addEventListener(LIVE_CHAT_UPDATED_EVENT, syncChat);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LIVE_CHAT_UPDATED_EVENT, syncChat);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    function syncActiveRoomStream() {
      if (!activeRoom || activeRoom.isSimulated) {
        syncVideoElementStream(stageVideoRef.current, null);
        setSellerFeedAvailable(false);
        return;
      }

      const publishedStream = readPublishedLiveStream(activeRoom.id);
      syncVideoElementStream(stageVideoRef.current, publishedStream?.stream ?? null);
      setSellerFeedAvailable(Boolean(publishedStream?.stream));
    }

    syncActiveRoomStream();
    window.addEventListener(LIVE_STREAM_UPDATED_EVENT, syncActiveRoomStream);

    return () => {
      window.removeEventListener(LIVE_STREAM_UPDATED_EVENT, syncActiveRoomStream);
    };
  }, [activeRoom]);

  function handleEnterRoom(roomId: string) {
    setActiveRoomId(roomId);
    setJoinedRoomIds((current) => (current.includes(roomId) ? current : [...current, roomId]));
    setBidFeedback("You are in the room. Use a quick bid or set a manual bid amount.");

    window.requestAnimationFrame(() => {
      viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      viewerRef.current?.focus();
    });
  }

  function handleToggleWatchlist(roomId: string) {
    const nextState = watchlistRoomIds.includes(roomId);

    setWatchlistRoomIds((current) =>
      current.includes(roomId) ? current.filter((item) => item !== roomId) : [...current, roomId]
    );
    setBidFeedback(
      nextState
        ? "Room removed from watchlist."
        : buyerSettings?.watchlistMode === "Watchlist alerts priority"
          ? "Room saved to your watchlist and this account prioritizes watchlist alerts."
        : buyerSettings?.alerts === "All live alerts"
          ? "Room saved to your watchlist and live alerts stay fully enabled for this account."
          : buyerSettings?.alerts === "Minimal alerts"
            ? "Room saved to your watchlist with minimal alert noise."
            : "Room saved to your watchlist for quick return."
    );
  }

  function handleUseBidPreset(amount: number) {
    setBidInput(String(amount));
    setBidFeedback(
      buyerSettings?.bidPreset && amount === preferredBidPresetValue
        ? `${formatBidCurrency(amount)} loaded from your buyer preset. Minimum next bid is ${nextBidText}.`
        : `${formatBidCurrency(amount)} loaded. Minimum next bid is ${nextBidText}.`
    );
  }

  function handleBidInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handlePlaceBid();
  }

  function handlePlaceBid() {
    if (!activeRoom) {
      return;
    }

    if (!session) {
      setBidFeedback("Sign in with a buyer account before placing a bid.");
      return;
    }

    if (!canBidWithSession) {
      setBidFeedback("Seller accounts can preview the public room, but bidding is limited to buyers and admins.");
      return;
    }

    if (!isJoined) {
      setBidFeedback("Join the room before placing a live bid.");
      return;
    }

    const normalizedBid = bidInput.trim().replace(/[^0-9.]/g, "");

    if (!normalizedBid) {
      setBidFeedback("Enter a bid amount before submitting.");
      return;
    }

    const nextBidAmount = Number(normalizedBid);
    const result = placeLiveBid({
      room: activeRoom,
      amount: nextBidAmount,
      session
    });

    if (!result.ok) {
      setBidFeedback(result.message);
      return;
    }

    setJoinedRoomIds((current) => (current.includes(activeRoom.id) ? current : [...current, activeRoom.id]));
    setBidInput("");
    setBidFeedback(result.message);
  }

  function handleChatInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    handleSendChatMessage();
  }

  function handleSendChatMessage() {
    if (!activeRoom) {
      return;
    }

    if (!session) {
      setChatFeedback("Sign in before sending a live chat message.");
      return;
    }

    if (!isJoined) {
      setChatFeedback("Join the room before chatting with the host and other buyers.");
      return;
    }

    const result = postLiveChatMessage({
      roomId: activeRoom.id,
      senderName: session.name,
      senderRole: session.role,
      text: chatInput
    });

    if (result.ok === false) {
      setChatFeedback(result.message);
      return;
    }

    setChatInput("");
    setChatFeedback(`Message sent to ${activeRoom.title}.`);
  }

  function handleSubmitReport() {
    if (!activeRoom) {
      return;
    }

    const normalizedDetail = reportDetail.trim();

    if (normalizedDetail.length < 12) {
      setReportFeedback("Add a short description so moderators know what happened in the room.");
      return;
    }

    createTrustIncidentReport({
      roomId: activeRoom.id,
      roomTitle: activeRoom.title,
      sellerName: activeRoom.seller,
      reporterName: session?.name ?? "Guest Viewer",
      reporterEmail: session?.email ?? "guest@looplot.local",
      reporterRole: session?.role ?? "guest",
      category: reportCategory,
      severity: reportSeverity,
      detail: normalizedDetail
    });

    setReportDetail("");
    setReportSeverity("Medium");
    setReportCategory("Misleading listing");
    setReportFeedback(`Report sent for ${activeRoom.title}. The admin trust queue now has the incident.`);
  }

  return (
    <section className="page-grid">
      <article className="showcase-card span-12 live-floor-hero">
        <span className="section-label">Live Marketplace</span>
        <h2>The live floor now surfaces seller-launched rooms alongside the simulation floor.</h2>
        <p>
          {session
            ? `${session.name} is signed in, but the live shopping floor still avoids mixing in seller setup or admin controls.`
            : "Guests can preview the live shopping experience before signing in to any protected workspace."}
        </p>
        <div className="metric-grid">
          {pulseMetrics.map((item) => (
            <div className="metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="feature-rail">
          {activityFeed.map((item) => (
            <div className="feature-card" key={item}>
              <span>Live activity</span>
              <p>{item}</p>
            </div>
          ))}
          <div className="feature-card">
            <span>Room sourcing</span>
            <p>
              {publishedRooms.length > 0
                ? `${publishedRooms.length} seller-started room${publishedRooms.length === 1 ? "" : "s"} are currently listed for buyers.`
                : "Simulation rooms stay visible until sellers start streaming from the protected dashboard."}
            </p>
          </div>
        </div>
        {activeRoom && activeBuyerMoment ? (
          <div className="live-floor-buyer-strip">
            <div className="live-floor-buyer-intro">
              <span className="section-label">Buyer Focus</span>
              <strong>{activeBuyerMoment.headline}</strong>
              <p>{activeBuyerMoment.subhead}</p>
            </div>
            <div className="live-floor-buyer-tags">
              {activeBuyerMoment.tags.map((tag) => (
                <span className="route-pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      {activeRoom ? (
        <article className="page-card span-12 live-room-viewer" ref={viewerRef} tabIndex={-1}>
          <div className="live-room-viewer-top">
            <div>
              <span className="section-label">Room Viewer</span>
              <h2>{activeRoom.title}</h2>
              <p>
                {activeRoom.seller} is on air in {activeRoom.category}. Buyers can enter from the roster and stay on the
                public side of the app.
              </p>
            </div>
            <span className={`auction-status-pill${activeRoom.isSimulated ? "" : " is-live-room"}`}>{activeRoom.status}</span>
          </div>
          <div className="live-room-viewer-grid">
            <div className={`live-room-stage${activeRoom.isSimulated ? " is-simulated" : " is-live"}`}>
              <div className="live-room-stage-badge">{activeRoom.isSimulated ? "Simulation Feed" : "Seller Live Feed"}</div>
              {!activeRoom.isSimulated ? (
                <video
                  autoPlay
                  className={`live-room-stage-video${sellerFeedAvailable ? " is-visible" : ""}`}
                  muted={buyerSettings?.streamAudio !== "Autoplay with sound"}
                  playsInline
                  ref={stageVideoRef}
                />
              ) : null}
              {!activeRoom.isSimulated && !sellerFeedAvailable ? (
                <div className="live-room-stage-empty">
                  <strong>Seller camera is not attached yet</strong>
                  <p>Open the seller camera preview before buyers join so the published room can surface the live webcam feed.</p>
                </div>
              ) : null}
              <strong>{activeRoom.seller}</strong>
              <p>{activeRoom.hostNote}</p>
              <div className="live-room-stage-meta">
                <div className="list-card">
                  <span>Current lot</span>
                  <strong>{activeRoom.lot}</strong>
                  <p>{activeRoom.lotState ?? "Seller has the current lot pinned for buyers."}</p>
                </div>
                <div className="list-card">
                  <span>Current bid</span>
                  <strong>{leadingBidText}</strong>
                  <p>
                    {activeBidState?.leader
                      ? `${activeBidState.leader} is leading. Next bid starts at ${nextBidText}.`
                      : `${activeRoom.lotDetail ?? activeRoom.detail} Opening bid is ready for the first bidder.`}
                  </p>
                </div>
                <div className="list-card">
                  <span>Audience</span>
                  <strong>{activeRoom.metric}</strong>
                  <p>
                    {activeRoom.lotPhotoCount
                      ? `${activeRoom.lotPhotoCount} product photo${activeRoom.lotPhotoCount === 1 ? "" : "s"} prepared for this lot.`
                      : "Buyer room is synced to the seller launch flow."}
                  </p>
                </div>
              </div>
              <div className="live-buyer-actions">
                <button className="button-primary" onClick={() => handleEnterRoom(activeRoom.id)} type="button">
                  {isJoined ? "Joined Room" : "Join Room"}
                </button>
                <button className="button-secondary" onClick={() => handleToggleWatchlist(activeRoom.id)} type="button">
                  {isWatchlisted ? "Saved to Watchlist" : "Save to Watchlist"}
                </button>
              </div>
            </div>
            <div className="live-room-viewer-side">
              <div className="list-card">
                <span>Format</span>
                <strong>{activeRoom.format}</strong>
                <p>{activeRoom.detail}</p>
              </div>
              <div className="list-card">
                <span>Started</span>
                <strong>{activeRoom.startedAt}</strong>
                <p>{activeRoom.isSimulated ? "Seeded room for UI coverage." : "Published from the seller go-live flow."}</p>
              </div>
              <div className="list-card">
                <span>Room access</span>
                <strong>Buyer-facing</strong>
                <p>Entering a room keeps viewers on the public live surface while sellers continue backstage.</p>
              </div>
              <div className="list-card">
                <span>Viewer state</span>
                <strong>Now watching {activeRoom.title}</strong>
                <p>The room stream is selected and surfaced in the buyer viewer above the roster.</p>
              </div>
              {buyerSettings ? (
                <div className="list-card">
                  <span>Buyer account settings</span>
                  <strong>{buyerSettings.profileLabel}</strong>
                  <p>
                    {buyerCategoryMatch
                      ? `This room matches your saved favorite category: ${buyerSettings.favoriteCategory}.`
                      : `Favorite category: ${buyerSettings.favoriteCategory}. Bid preset: ${buyerSettings.bidPreset}.`}
                  </p>
                  <p>{buyerSettings.checkoutReadiness}. {buyerSettings.watchlistMode} is enabled for this account.</p>
                </div>
              ) : null}
              {activeBuyerMoment ? (
                <div className="list-card">
                  <span>Buyer trust signal</span>
                  <strong>{activeBuyerMoment.trustSignal}</strong>
                  <p>Room details stay buyer-facing so checkout intent never depends on seller-only controls.</p>
                </div>
              ) : null}
              <div className="list-card live-bid-card">
                <span>Quick bid</span>
                <strong>Place a live bid from the buyer surface</strong>
                <div className="live-bid-summary">
                  <div>
                    <span>Leading bid</span>
                    <strong>{leadingBidText}</strong>
                  </div>
                  <div>
                    <span>Minimum next</span>
                    <strong>{nextBidText}</strong>
                  </div>
                </div>
                <div className="live-bid-signal-strip">
                  <div className="live-bid-signal">
                    <span>Your status</span>
                    <strong>{currentViewerIsLeading ? "Leading this lot" : isJoined ? "Ready for the next bid" : "Join to bid"}</strong>
                  </div>
                  <div className="live-bid-signal">
                    <span>Your bids</span>
                    <strong>{sessionRecentBids.length}</strong>
                  </div>
                  <div className="live-bid-signal">
                    <span>Your high bid</span>
                    <strong>{sessionHighestBid > 0 ? formatBidCurrency(sessionHighestBid) : "None yet"}</strong>
                  </div>
                </div>
                <div className="list-card live-bid-status">
                  <span>Bid access</span>
                  <strong>
                    {currentViewerIsLeading
                      ? "Leading"
                      : isJoined
                        ? canBidWithSession
                          ? "Ready to bid"
                          : "View only"
                        : "Join required"}
                  </strong>
                  <p>{biddingAccessLabel}</p>
                </div>
                {isJoined && canBidWithSession ? (
                  <div className="live-bid-coach">
                    <strong>
                      {currentViewerIsLeading
                        ? "You have the lead. Raise only if you want more cushion."
                        : outbidGap && outbidGap > 0
                          ? `You need ${formatBidCurrency(outbidGap)} more to regain the lead.`
                          : "Load the next valid bid or jump a full increment to hold position."}
                    </strong>
                    <p>
                      {sessionLatestBid
                        ? `Your latest bid is ${formatBidCurrency(sessionLatestBid)}.`
                        : "Your first accepted bid will appear in the room activity feed below."}
                    </p>
                  </div>
                ) : null}
                <div className="live-bid-presets">
                  {activeBidSuggestions.map((amount) => (
                    <button
                      className="button-secondary"
                      disabled={!canBidWithSession || !isJoined}
                      key={amount}
                      onClick={() => handleUseBidPreset(amount)}
                      type="button"
                    >
                      {buyerSettings?.bidPreset && amount === preferredBidPresetValue
                        ? `${formatBidCurrency(amount)} Preset`
                        : formatBidCurrency(amount)}
                    </button>
                  ))}
                </div>
                <div className="live-bid-manual-tools">
                  <button
                    className="button-secondary"
                    disabled={!canBidWithSession || !isJoined}
                    onClick={() => handleUseBidPreset(activeBidSuggestions[0] ?? (activeBidState?.minimumNextBid ?? 1))}
                    type="button"
                  >
                    Load Minimum
                  </button>
                  <button
                    className="button-secondary"
                    disabled={!canBidWithSession || !isJoined}
                    onClick={() => handleUseBidPreset(activeBidSuggestions[2] ?? (activeBidState?.minimumNextBid ?? 1))}
                    type="button"
                  >
                    Strong Bid
                  </button>
                </div>
                <label className="field">
                  <span>Bid amount</span>
                  <input
                    disabled={!canBidWithSession || !isJoined}
                    inputMode="decimal"
                    onKeyDown={handleBidInputKeyDown}
                    min={activeBidState?.minimumNextBid ?? 1}
                    onChange={(event) => setBidInput(event.target.value)}
                    placeholder={nextBidText}
                    type="text"
                    value={bidInput}
                  />
                </label>
                <button className="button-primary" disabled={!canBidWithSession || !isJoined} onClick={handlePlaceBid} type="button">
                  {currentViewerIsLeading ? "Raise Your Leading Bid" : "Place Live Bid"}
                </button>
                <p className="feedback">{bidFeedback}</p>
              </div>
              <div className="list-card live-report-card">
                <span>Trust and safety</span>
                <strong>Report this room for moderation review</strong>
                <p>Use this if the listing feels misleading, chat becomes abusive, or the stream creates a payment or safety concern.</p>
                <label className="field">
                  <span>Issue type</span>
                  <select onChange={(event) => setReportCategory(event.target.value as TrustIncidentCategory)} value={reportCategory}>
                    <option value="Misleading listing">Misleading listing</option>
                    <option value="Counterfeit risk">Counterfeit risk</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Payment issue">Payment issue</option>
                    <option value="Spam">Spam</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="field">
                  <span>Severity</span>
                  <select onChange={(event) => setReportSeverity(event.target.value as TrustIncidentSeverity)} value={reportSeverity}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>
                <label className="field">
                  <span>What happened</span>
                  <textarea
                    onChange={(event) => setReportDetail(event.target.value)}
                    placeholder="Describe the issue, what lot was involved, and what moderators should review."
                    value={reportDetail}
                  />
                </label>
                <button className="button-secondary" onClick={handleSubmitReport} type="button">
                  Submit Report
                </button>
                <p className="feedback">{reportFeedback}</p>
              </div>
              <div className="list-card live-chat-card">
                <span>Live chat</span>
                <strong>Room messages move with the active stream window</strong>
                <div className="live-chat-thread">
                  {activeChatMessages.length > 0 ? (
                    activeChatMessages.slice(-8).map((message) => (
                      <div className={`live-chat-message live-chat-role-${message.senderRole}`} key={message.id}>
                        <div className="live-chat-message-top">
                          <strong>{message.senderName}</strong>
                          <span>{formatBidTime(message.createdAt)}</span>
                        </div>
                        <p>{message.text}</p>
                        {message.pinned ? <em>Pinned</em> : null}
                      </div>
                    ))
                  ) : (
                    <div className="live-chat-message">
                      <strong>No chat yet</strong>
                      <p>The first seller note or buyer question will appear here.</p>
                    </div>
                  )}
                </div>
                <label className="field">
                  <span>Send a message</span>
                  <input
                    disabled={!session || !isJoined}
                    maxLength={240}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={handleChatInputKeyDown}
                    placeholder={isJoined ? "Ask a question or request a close-up." : "Join the room to chat."}
                    type="text"
                    value={chatInput}
                  />
                </label>
                <button className="button-primary" disabled={!session || !isJoined} onClick={handleSendChatMessage} type="button">
                  Send Chat
                </button>
                <p className="feedback">{chatFeedback}</p>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {liveRooms.map((room) => (
        <article className={`page-card span-4 live-room-card${room.id === activeRoom?.id ? " is-active" : ""}`} key={room.id}>
          <div className="auction-card-top">
            <div className="auction-seller">
              <div className="seller-avatar">{room.seller.charAt(0)}</div>
              <div>
                <strong>{room.seller}</strong>
                <span>{room.metric}</span>
              </div>
            </div>
            <span className={`auction-status-pill${room.isSimulated ? "" : " is-live-room"}`}>{room.status}</span>
          </div>
          <div className="auction-card-body">
            <span className="section-label">{room.isSimulated ? "Simulation Room" : "Seller Live Room"}</span>
            <h2>{room.title}</h2>
            <p>{room.detail}</p>
          </div>
          <div className="live-room-lot">
            <div>
              <span>Current lot</span>
              <strong>{room.lot}</strong>
            </div>
            <div>
              <span>Bid</span>
              <strong>{getBidDisplayLabel(room, roomBidStates[room.id]?.currentBid || roomBidStates[room.id]?.startingBid || 0)}</strong>
            </div>
          </div>
          <div className="auction-bid-row">
            <div>
              <span>Room pace</span>
              <strong>{room.metric}</strong>
            </div>
            <div>
              <span>Buyer state</span>
              <strong>
                {roomBidStates[room.id]?.leader
                  ? `${roomBidStates[room.id]?.totalBids} bid${roomBidStates[room.id]?.totalBids === 1 ? "" : "s"}`
                  : joinedRoomIds.includes(room.id)
                    ? "Joined"
                    : watchlistRoomIds.includes(room.id)
                      ? "Saved"
                      : "Open"}
              </strong>
            </div>
            <button className="button-primary" onClick={() => handleEnterRoom(room.id)} type="button">
              {room.id === activeRoom?.id ? "Watching Now" : "Enter Room"}
            </button>
          </div>
        </article>
      ))}

      {activeRoom && activeBuyerMoment ? (
        <>
          <article className="page-card span-6">
            <span className="section-label">Upcoming Lots</span>
            <div className="stack">
              {activeBuyerMoment.lotQueue.map((lot) => (
                <div className="list-card" key={lot}>
                  <strong>{lot}</strong>
                  <p>Queued for buyers watching {activeRoom.title}.</p>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card span-6">
            <span className="section-label">Checkout Flow</span>
            <div className="card-grid-2">
              {activeBuyerMoment.checkoutSteps.map((step, index) => (
                <div className="list-card" key={step}>
                  <span className="card-kicker">Step {index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card span-6">
            <span className="section-label">Buyer Chat Prompts</span>
            <div className="stack">
              {activeBuyerMoment.chatMoments.map((item) => (
                <div className="list-card" key={item}>
                  <strong>{item}</strong>
                  <p>Use this prompt while staying inside the public live room flow.</p>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card span-6">
            <span className="section-label">Buyer Session</span>
            <div className="card-grid-2">
              <div className="list-card">
                <strong>Joined rooms</strong>
                <p>{joinedRoomIds.length}</p>
              </div>
              <div className="list-card">
                <strong>Watchlist saves</strong>
                <p>{watchlistRoomIds.length}</p>
              </div>
              <div className="list-card">
                <strong>Signed in state</strong>
                <p>{session ? `${session.name} on ${session.role} session` : "Guest browsing the live floor"}</p>
              </div>
              <div className="list-card">
                <strong>Current room</strong>
                <p>{activeRoom.title}</p>
              </div>
              {buyerSettings ? (
                <div className="list-card">
                  <strong>Saved bid preset</strong>
                  <p>{buyerSettings.bidPreset}</p>
                </div>
              ) : null}
              {buyerSettings ? (
                <div className="list-card">
                  <strong>Saved alerts</strong>
                  <p>{buyerSettings.alerts}</p>
                </div>
              ) : null}
              {buyerSettings ? (
                <div className="list-card">
                  <strong>Shipping preference</strong>
                  <p>{buyerSettings.shippingRegion}</p>
                </div>
              ) : null}
              {buyerSettings ? (
                <div className="list-card">
                  <strong>Watchlist behavior</strong>
                  <p>{buyerSettings.watchlistMode}</p>
                </div>
              ) : null}
              {buyerSettings ? (
                <div className="list-card">
                  <strong>Checkout readiness</strong>
                  <p>{buyerSettings.checkoutReadiness}</p>
                </div>
              ) : null}
              <div className="list-card">
                <strong>Total bids in room</strong>
                <p>{activeBidState?.totalBids ?? 0}</p>
              </div>
              <div className="list-card">
                <strong>Bid leader</strong>
                <p>{activeBidState?.leader ?? "No bids placed yet"}</p>
              </div>
              <div className="list-card">
                <strong>Your bid count</strong>
                <p>{sessionRecentBids.length}</p>
              </div>
              <div className="list-card">
                <strong>Your high bid</strong>
                <p>{sessionHighestBid > 0 ? formatBidCurrency(sessionHighestBid) : "No bids placed"}</p>
              </div>
            </div>
          </article>

          <article className="page-card span-12">
            <span className="section-label">Bid Activity</span>
            <div className="card-grid-3">
              {activeBidState && activeBidState.recentBids.length > 0 ? (
                activeBidState.recentBids.map((entry) => (
                  <div className="list-card" key={entry.id}>
                    <span className="card-kicker">{formatBidTime(entry.createdAt)}</span>
                    <strong>{formatBidCurrency(entry.amount)}</strong>
                    <p>{entry.bidder} placed this bid in {activeRoom.title}.</p>
                  </div>
                ))
              ) : (
                <div className="list-card">
                  <strong>No bids yet</strong>
                  <p>The first valid bid will start the room activity feed for this lot.</p>
                </div>
              )}
            </div>
          </article>
        </>
      ) : null}

      <article className="page-card span-12">
        <span className="section-label">Navigation Between Areas</span>
        <div className="card-grid-4">
          {liveHandoffs.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Live Floor Boundaries</span>
        <div className="card-grid-3">
          <div className="list-card">
            <strong>Buyer-Facing Stream View</strong>
            <p>Live pages focus on rooms, audience energy, and conversion signals rather than operator controls.</p>
          </div>
          <div className="list-card">
            <strong>Seller Tools Stay Separate</strong>
            <p>Stream setup, countdown readiness, wheel pacing, and listing management remain isolated inside the seller dashboard.</p>
          </div>
          <div className="list-card">
            <strong>Admin Controls Stay Separate</strong>
            <p>Moderation and compliance actions belong in the admin suite, not in the public live experience.</p>
          </div>
        </div>
      </article>

    </section>
  );
}
