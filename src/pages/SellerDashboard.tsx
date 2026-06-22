import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { AppSession } from "../App";
import {
  finalizeLiveLot,
  formatBidCurrency,
  formatBidTime,
  getLiveBidRecords,
  getLiveRoomBidState,
  LIVE_BID_RECORDS_STORAGE_KEY,
  LIVE_BID_RECORDS_UPDATED_EVENT,
  LIVE_BIDS_STORAGE_KEY,
  LIVE_BIDS_UPDATED_EVENT
} from "../lib/liveBids";
import {
  getLiveChatMessages,
  LIVE_CHAT_STORAGE_KEY,
  LIVE_CHAT_UPDATED_EVENT,
  postLiveChatMessage
} from "../lib/liveChat";
import { clearPublishedLiveStream, publishLiveStream, readPublishedLiveStream } from "../lib/liveStream";
import { formatWatchingMetric, removePublishedLiveRoom, upsertPublishedLiveRoom, type PublicLiveRoom } from "../lib/liveRooms";
import {
  SELLER_POSTAL_SETUP_UPDATED_EVENT,
  getSellerPostalReadiness,
  readStoredPostalSetup
} from "../lib/sellerPostalSetup";
import { readStorageJSON, writeStorageJSON } from "../lib/storage";
import { getSellerTrustProfile, TRUST_SAFETY_UPDATED_EVENT, upsertSellerTrustProfile } from "../lib/trustSafety";

const sellerMetrics = [
  { label: "Scheduled Shows", value: "14" },
  { label: "Queued Listings", value: "96" },
  { label: "Orders to Pack", value: "28" },
  { label: "Fulfillment SLA", value: "96%" }
];

const productCategories = [
  "Luxury",
  "Trading Cards",
  "Sneakers",
  "Collectibles",
  "Accessories",
  "Beauty"
] as const;

type ProductCategory = (typeof productCategories)[number];

type SellerListing = {
  id: number;
  title: string;
  detail: string;
  state: string;
  category: ProductCategory;
  format: "Auction" | "Buy Now";
  priceLabel: string;
  audience: string;
  photoCount: number;
  photoNotes: string;
};

type ListingDraft = {
  title: string;
  detail: string;
  state: string;
  category: ProductCategory;
  format: SellerListing["format"];
  priceLabel: string;
  audience: string;
  photoCount: number;
  photoNotes: string;
};

type ChecklistState = {
  titleReady: boolean;
  wheelReviewed: boolean;
  cameraReady: boolean;
  queueReady: boolean;
  promoArmed: boolean;
  backupMicReady: boolean;
  networkReady: boolean;
  lightingReady: boolean;
};

const initialListingQueue: SellerListing[] = [
  {
    id: 1,
    title: "Lot 01 - Vintage Bracelet",
    detail: "Opening auction with a reserve floor and auto-pin enabled for the first minute of the stream.",
    state: "Pinned opening lot",
    category: "Luxury",
    format: "Auction",
    priceLabel: "$120 reserve",
    audience: "High-intent jewelry buyers",
    photoCount: 6,
    photoNotes: "Hero wrist shot, clasp closeup, hallmark macro, side profile, wear check, packaging photo."
  },
  {
    id: 2,
    title: "Lot 02 - Designer Wallet",
    detail: "Queued to follow the first wheel moment, with fast re-list enabled if the lot stalls.",
    state: "Queued for round two",
    category: "Accessories",
    format: "Auction",
    priceLabel: "$85 reserve",
    audience: "Returning accessory collectors",
    photoCount: 5,
    photoNotes: "Front, interior, corners, zipper pull, and authenticity insert are staged."
  },
  {
    id: 3,
    title: "Buy Now - Card Sleeve Bundle",
    detail: "Instant-buy add-on stays visible during bidding rounds to keep conversion moving between auctions.",
    state: "Buy-now active",
    category: "Trading Cards",
    format: "Buy Now",
    priceLabel: "$18 fixed",
    audience: "Impulse add-on shoppers",
    photoCount: 4,
    photoNotes: "Bundle stack, sleeve texture closeup, quantity spread, and shipping pouch image are loaded."
  }
];

const streamActivity = [
  {
    title: "Pinned message armed",
    detail: "Claim rules, payment reminder, and wheel entry minimum are ready to drop on countdown open."
  },
  {
    title: "Runner queue staged",
    detail: "Packaging station already has the first two luxury lots and the card sleeve add-on ready."
  },
  {
    title: "Priority buyers tagged",
    detail: "VIP members from the previous drop are highlighted for the first wheel activation."
  }
] as const;

const chatHighlights = [
  { user: "mod-rhea", message: "Opening claim script is pinned and payments reminder is loaded." },
  { user: "vip-jamie", message: "Watching for the first bracelet lot. Ready to bid as soon as countdown clears." },
  { user: "mod-jules", message: "Wheel approval stays on me for the first result lock." }
] as const;

const launchQuickActions = [
  { label: "Run countdown", detail: "Push promo and move the room into waiting mode." },
  { label: "Pin current lot", detail: "Highlight the active lot overlay for shoppers." },
  { label: "Drop wheel", detail: "Switch from auction pace into the wheel moment." }
] as const;

const backendPages = [
  {
    title: "Channel Setup",
    detail: "Create or update the seller channel identity, cover art, and streaming category."
  },
  {
    title: "Wheel Settings",
    detail: "Tune prize slots, spin duration, and bidder entry rules from one dedicated seller page."
  },
  {
    title: "Live Stream Setup",
    detail: "Prepare title, countdown timing, moderation coverage, and device checks before launch."
  },
  {
    title: "Product Listings",
    detail: "Add products and auction lots that will appear as bid-ready listings during the stream."
  }
];

const sellerRouteRules = [
  {
    title: "Protected seller route",
    detail: "Guests and buyers are redirected away from this page."
  },
  {
    title: "Shared top navigation",
    detail: "The route is always visible so the app structure stays obvious."
  },
  {
    title: "Seller-first workflows",
    detail: "Wheel settings, stream setup, and listing prep remain grouped on one backend surface."
  }
] as const;

const streamRunOfShow = [
  {
    title: "Pre-show countdown",
    detail: "10-minute waiting room with follower push enabled and moderator notes pinned."
  },
  {
    title: "Opening segment",
    detail: "Host intro, wheel explainer, and first pinned auction lot staged for the first minute."
  },
  {
    title: "Mid-show cadence",
    detail: "Alternating auction lots, bonus wheel moments, and buy-now drops to keep momentum up."
  },
  {
    title: "Closing segment",
    detail: "Last-call reminder, bundle upsell, and post-show fulfillment handoff queued."
  }
] as const;

const sellerBackendPanels = [
  {
    title: "Stream Setup",
    detail: "Title, category, schedule, and moderator coverage stay on one seller-facing control surface."
  },
  {
    title: "Wheel Settings",
    detail: "Spin timing, prize slots, and bidder thresholds stay backstage and never leak into shopper pages."
  },
  {
    title: "Bid Listings",
    detail: "Auction lots and buy-now products stay attached to the stream workflow so sellers can reorder quickly."
  }
] as const;

const sellerAreaLinks = [
  {
    title: "Public Home",
    detail: "Return to the main storefront landing page.",
    to: "/"
  },
  {
    title: "Discover",
    detail: "Review the shopper-facing discovery surface.",
    to: "/discover"
  },
  {
    title: "Live",
    detail: "Preview the public live shopping environment without seller controls mixed in.",
    to: "/live"
  },
  {
    title: "Postal Setup",
    detail: "Configure shipping carriers, warehouse details, and return rules on the dedicated seller setup page.",
    to: "/seller/postal-service"
  },
  {
    title: "Admin",
    detail: "Admins can continue into marketplace controls from here.",
    to: "/admin"
  }
] as const;

const setupOwnership = [
  { title: "Wheel settings", detail: "Seller-owned configuration before the stream opens." },
  { title: "Live stream setup", detail: "Seller-owned launch readiness, timing, and moderation prep." },
  { title: "Bid listings", detail: "Seller-owned lot queue and buy-now setup for live conversion." }
] as const;

const sellerOutcome = [
  "One seller backend route now groups wheel settings, stream setup, and bid-ready listings.",
  "The seller page is protected from guest and buyer traffic.",
  "Navigation still makes the full app structure clear from inside the backend."
] as const;

const sellerRouteScope = [
  "Wheel settings stay on the seller backend.",
  "Live stream setup stays on the seller backend.",
  "Bid listing preparation stays on the seller backend."
] as const;

const wheelThemes = ["Luxury Gold Night", "Sunset Arcade", "Electric Mint"] as const;
const entryModes = ["Verified Payment", "VIP Members", "Previous Buyers"] as const;

const wheelPresets = [
  {
    id: "high-velocity",
    title: "High Velocity",
    detail: "Fast wheel rounds for rapid-fire streams with low cooldown and replay disabled.",
    theme: "Electric Mint" as const,
    spinDuration: 18,
    entryMinimum: 10,
    bonusSlots: 3,
    pinnedPrizeCount: 1,
    cooldownMinutes: 2,
    entryMode: "Verified Payment" as const,
    winnerAnnouncement: "Chat pin plus auto invoice banner"
  },
  {
    id: "vip-hype",
    title: "VIP Hype",
    detail: "A premium round for members with slower pacing and more featured prize wedges.",
    theme: "Luxury Gold Night" as const,
    spinDuration: 36,
    entryMinimum: 40,
    bonusSlots: 2,
    pinnedPrizeCount: 3,
    cooldownMinutes: 8,
    entryMode: "VIP Members" as const,
    winnerAnnouncement: "VIP banner callout on stream overlay"
  },
  {
    id: "buyer-recovery",
    title: "Buyer Recovery",
    detail: "Rewards returning buyers and adds more mystery energy between auction lots.",
    theme: "Sunset Arcade" as const,
    spinDuration: 24,
    entryMinimum: 20,
    bonusSlots: 4,
    pinnedPrizeCount: 2,
    cooldownMinutes: 4,
    entryMode: "Previous Buyers" as const,
    winnerAnnouncement: "Camera lower-third with bundle upsell prompt"
  }
] as const;

const streamFormats = ["Auction + Wheel", "Flash Sale", "Single Collection Drop"] as const;
const latencyProfiles = ["Ultra Low", "Balanced", "Quality First"] as const;
const streamQualities = ["1080p / 30fps", "1080p / 60fps", "4K Showcase"] as const;
const scenePresets = ["Gold Drop Countdown", "Split Lot Cam", "Full Screen Product"] as const;

const categoryPlaybooks: Array<{
  category: ProductCategory;
  routing: string;
  focus: string;
  guardrail: string;
}> = [
  {
    category: "Luxury",
    routing: "Featured launch + VIP countdown",
    focus: "High-value auction lots with slower pacing and more host storytelling.",
    guardrail: "Require camera closeups and payout reminders before pinning live."
  },
  {
    category: "Trading Cards",
    routing: "Fast break queue + buy-now add-ons",
    focus: "Rapid lot turnover with affordable fillers between headline pulls.",
    guardrail: "Keep condition notes visible and avoid vague pack labeling."
  },
  {
    category: "Sneakers",
    routing: "Size-run spotlight + timed drops",
    focus: "Alternate rare pairs with fast claim windows to keep bid pressure high.",
    guardrail: "Pin size details and authenticity notes before the lot opens."
  },
  {
    category: "Collectibles",
    routing: "Theme showcase + provenance callouts",
    focus: "Use curated segments where story and rarity justify higher dwell time.",
    guardrail: "Surface provenance, flaws, and shipping constraints in the host notes."
  },
  {
    category: "Accessories",
    routing: "Bundle-first queue + impulse closeouts",
    focus: "Mix premium items with attach-rate bundles to keep cart value climbing.",
    guardrail: "Clarify material, wear, and bundle exclusions before go-live."
  },
  {
    category: "Beauty",
    routing: "Demo segment + limited stock drops",
    focus: "Use short demonstrations and scarcity messaging to drive quick conversions.",
    guardrail: "Show shade, expiry, and hygiene handling before claims open."
  }
];

const moderationTeam = [
  { id: "mod-rhea", name: "Rhea", role: "Chat + Claims" },
  { id: "mod-jules", name: "Jules", role: "Payments + Pinning" },
  { id: "mod-cam", name: "Cam", role: "Wheel + Fulfillment Handoff" }
] as const;

const studioDevices = [
  { key: "cameraReady", label: "Primary camera", detail: "Main overhead and host shot are both framed." },
  { key: "backupMicReady", label: "Backup mic", detail: "Secondary audio path is armed if the host mic drops." },
  { key: "networkReady", label: "Upload bandwidth", detail: "Connection can hold stable video during bidding spikes." },
  { key: "lightingReady", label: "Lighting scene", detail: "Product table and host lighting match the cover theme." }
] as const;

type WheelWedge = {
  id: number;
  label: string;
  kind: "Prize" | "Mystery" | "Bonus";
  color: string;
  linkedListingId: number | null;
};

const initialWedges: WheelWedge[] = [
  { id: 1, label: "Mystery Pack", kind: "Mystery", color: "#f3c96b", linkedListingId: null },
  { id: 2, label: "10% Credit", kind: "Bonus", color: "#d78d2f", linkedListingId: null },
  { id: 3, label: "Vintage Bracelet", kind: "Prize", color: "#b66a1d", linkedListingId: 1 },
  { id: 4, label: "Free Shipping", kind: "Bonus", color: "#8a4e16", linkedListingId: null },
  { id: 5, label: "Designer Wallet", kind: "Prize", color: "#6b390e", linkedListingId: 2 },
  { id: 6, label: "Mystery Vault", kind: "Mystery", color: "#f0b85a", linkedListingId: null }
];

const wedgeColorCycle = ["#f3c96b", "#d78d2f", "#b66a1d", "#8a4e16", "#6b390e", "#f0b85a"] as const;

function formatSpinDuration(duration: number) {
  return `${duration} sec`;
}

function formatLaunchTime(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toString();
  }
}

function formatClockTime(value: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(value);
  } catch {
    return value.toTimeString().slice(0, 5);
  }
}

function formatViewerCount(value: number) {
  try {
    return new Intl.NumberFormat().format(value);
  } catch {
    return String(value);
  }
}

function describeCameraError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "Camera preview could not start. Check browser permissions and device availability.";
  }

  if (error.name === "NotAllowedError") {
    return "Camera access was blocked. Allow camera permissions in the browser to test the stream.";
  }

  if (error.name === "NotFoundError") {
    return "No camera was found on this device. Connect a webcam to continue.";
  }

  if (error.name === "NotReadableError") {
    return "The camera is already in use by another app. Close the other app and try again.";
  }

  return "Camera preview could not start. Check browser permissions and device availability.";
}

function getMediaDevices() {
  if (typeof navigator === "undefined") {
    return null;
  }

  return navigator.mediaDevices ?? null;
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
      // Keep the route renderable even when the browser cannot bind MediaStream to a video element.
    }

    videoElement.removeAttribute("src");
    videoElement.load();
    return;
  }

  try {
    videoElement.srcObject = stream;
  } catch {
    // Keep the route renderable even when the browser cannot bind MediaStream to a video element.
    videoElement.removeAttribute("src");
    videoElement.load();
    return;
  }

  const playbackAttempt = videoElement.play();

  if (playbackAttempt && typeof playbackAttempt.catch === "function") {
    playbackAttempt.catch(() => undefined);
  }
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function createSellerLiveRoomId(session: AppSession | null) {
  const accountKey = session?.email?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "seller";
  return `seller-live-${accountKey}`;
}

function createSellerListingStorageKey(session: AppSession | null) {
  const accountKey = session?.email?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "seller";
  return `seller-listings-${accountKey}`;
}

function buildWheelGradient(wedges: WheelWedge[]) {
  if (wedges.length === 0) {
    return "conic-gradient(from -90deg, #d6b066 0deg 360deg)";
  }

  const sliceAngle = 360 / wedges.length;

  return `conic-gradient(from -90deg, ${wedges
    .map((wedge, index) => `${wedge.color} ${index * sliceAngle}deg ${(index + 1) * sliceAngle}deg`)
    .join(", ")})`;
}

function createListingDraft(listing: SellerListing): ListingDraft {
  return {
    title: listing.title,
    detail: listing.detail,
    state: listing.state,
    category: listing.category,
    format: listing.format,
    priceLabel: listing.priceLabel,
    audience: listing.audience,
    photoCount: listing.photoCount,
    photoNotes: listing.photoNotes
  };
}

function createEmptyListingDraft(category: ProductCategory): ListingDraft {
  return {
    title: "",
    detail: "",
    state: "",
    category,
    format: "Auction",
    priceLabel: "",
    audience: "",
    photoCount: 1,
    photoNotes: ""
  };
}

function createNewListingTitle(nextSequence: number) {
  return `Lot ${String(nextSequence).padStart(2, "0")} - `;
}

function compactListingLabel(title: string) {
  return title.replace(/^(Lot\s*\d+\s*-\s*|Buy Now\s*-\s*)/i, "").trim() || "Linked Listing";
}

function readStoredListingQueue(session: AppSession | null) {
  return readStorageJSON(createSellerListingStorageKey(session), initialListingQueue, (value) => {
    if (!Array.isArray(value)) {
      return initialListingQueue;
    }

    const validListings = value.filter((listing): listing is SellerListing => {
      return (
        typeof listing?.id === "number" &&
        typeof listing?.title === "string" &&
        typeof listing?.detail === "string" &&
        typeof listing?.state === "string" &&
        productCategories.includes(listing?.category) &&
        (listing?.format === "Auction" || listing?.format === "Buy Now") &&
        typeof listing?.priceLabel === "string" &&
        typeof listing?.audience === "string" &&
        typeof listing?.photoCount === "number" &&
        typeof listing?.photoNotes === "string"
      );
    });

    return validListings.length > 0 ? validListings : initialListingQueue;
  });
}

export default function SellerDashboard({ session }: { session: AppSession | null }) {
  const streamWindowVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const streamModeRef = useRef<"Rehearsal" | "Ready" | "Live">("Rehearsal");
  const [theme, setTheme] = useState<(typeof wheelThemes)[number]>("Luxury Gold Night");
  const [spinDuration, setSpinDuration] = useState(30);
  const [entryMinimum, setEntryMinimum] = useState(25);
  const [bonusSlots, setBonusSlots] = useState(4);
  const [pinnedPrizeCount, setPinnedPrizeCount] = useState(2);
  const [cooldownMinutes, setCooldownMinutes] = useState(6);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState("Studio camera lower-third plus chat pin");
  const [entryMode, setEntryMode] = useState<(typeof entryModes)[number]>("Verified Payment");
  const [autoQueueWinner, setAutoQueueWinner] = useState(true);
  const [modApprovalRequired, setModApprovalRequired] = useState(true);
  const [replaySpinEnabled, setReplaySpinEnabled] = useState(false);
  const [wedgeDrafts, setWedgeDrafts] = useState(initialWedges);
  const [activePresetId, setActivePresetId] = useState<(typeof wheelPresets)[number]["id"]>("vip-hype");
  const [lastAppliedAt, setLastAppliedAt] = useState("Not applied yet");
  const [streamTitle, setStreamTitle] = useState("Luxury Accessories Sunday Live");
  const [streamCategory, setStreamCategory] = useState<ProductCategory>("Luxury");
  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategory>("Luxury");
  const [coverTheme, setCoverTheme] = useState("Gold Drop Countdown");
  const [scheduledAt, setScheduledAt] = useState("2026-04-26T19:30");
  const [openingScript, setOpeningScript] = useState(
    "Welcome back to LoopLot. We are opening with a fast wheel drop, then moving straight into pinned luxury lots."
  );
  const [streamFormat, setStreamFormat] = useState<(typeof streamFormats)[number]>("Auction + Wheel");
  const [latencyProfile, setLatencyProfile] = useState<(typeof latencyProfiles)[number]>("Ultra Low");
  const [streamQuality, setStreamQuality] = useState<(typeof streamQualities)[number]>("1080p / 60fps");
  const [scenePreset, setScenePreset] = useState<(typeof scenePresets)[number]>("Split Lot Cam");
  const [backstageCapacity, setBackstageCapacity] = useState(3);
  const [countdownMinutes, setCountdownMinutes] = useState(10);
  const [promoLeadMinutes, setPromoLeadMinutes] = useState(30);
  const [chatMode, setChatMode] = useState("Followers only for countdown");
  const [sellerNotes, setSellerNotes] = useState("Moderator pins payout reminder before Lot 01.");
  const [selectedModeratorIds, setSelectedModeratorIds] = useState<string[]>(["mod-rhea", "mod-jules"]);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [simulcastEnabled, setSimulcastEnabled] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [backupRecordingEnabled, setBackupRecordingEnabled] = useState(true);
  const [streamMode, setStreamMode] = useState<"Rehearsal" | "Ready" | "Live">("Rehearsal");
  const [launchFeedback, setLaunchFeedback] = useState("Countdown is staged. Finish readiness checks to unlock go-live.");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraPreviewActive, setCameraPreviewActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraMirrorEnabled, setCameraMirrorEnabled] = useState(true);
  const [cameraStatus, setCameraStatus] = useState("Preview is offline. Start a test stream to validate the webcam.");
  const [postalSetup, setPostalSetup] = useState(() => readStoredPostalSetup(session));
  const [sellerTrustProfile, setSellerTrustProfile] = useState(() => getSellerTrustProfile(session));
  const [listingQueue, setListingQueue] = useState<SellerListing[]>(() => readStoredListingQueue(session));
  const [editingListingId, setEditingListingId] = useState<number | null>(() => readStoredListingQueue(session)[0]?.id ?? null);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [listingDraft, setListingDraft] = useState<ListingDraft>(() => {
    const storedQueue = readStoredListingQueue(session);
    return storedQueue[0] ? createListingDraft(storedQueue[0]) : createEmptyListingDraft("Luxury");
  });
  const [listingFeedback, setListingFeedback] = useState("Select a lot to update details, pricing, category, and photos.");
  const [activeLotIndex, setActiveLotIndex] = useState(0);
  const [spotlightPinned, setSpotlightPinned] = useState(true);
  const [chatAlertMuted, setChatAlertMuted] = useState(false);
  const [wheelOverlayVisible, setWheelOverlayVisible] = useState(true);
  const [manualWheelTargetId, setManualWheelTargetId] = useState(initialWedges[0]?.id ?? 1);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinState, setWheelSpinState] = useState<"idle" | "spinning" | "complete">("idle");
  const [lockedWheelResultId, setLockedWheelResultId] = useState<number | null>(null);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [hostChatInput, setHostChatInput] = useState("");
  const [hostChatFeedback, setHostChatFeedback] = useState("Use the stream window chat to drop host notes, pinned reminders, and moderator replies.");
  const [bidRefreshKey, setBidRefreshKey] = useState(0);
  const [bidRecordRefreshKey, setBidRecordRefreshKey] = useState(0);
  const [checklistState, setChecklistState] = useState<ChecklistState>({
    titleReady: true,
    wheelReviewed: true,
    cameraReady: false,
    queueReady: true,
    promoArmed: false,
    backupMicReady: true,
    networkReady: false,
    lightingReady: true
  });

  useEffect(() => {
    streamModeRef.current = streamMode;
  }, [streamMode]);

  useEffect(() => {
    const nextQueue = readStoredListingQueue(session);
    const nextListing = nextQueue[0] ?? null;

    setListingQueue(nextQueue);
    setEditingListingId(nextListing?.id ?? null);
    setIsCreatingListing(false);
    setListingDraft(nextListing ? createListingDraft(nextListing) : createEmptyListingDraft("Luxury"));
  }, [session]);

  useEffect(() => {
    setPostalSetup(readStoredPostalSetup(session));

    function syncPostalSetup() {
      setPostalSetup(readStoredPostalSetup(session));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key?.startsWith("seller-postal-setup-")) {
        syncPostalSetup();
      }
    }

    window.addEventListener(SELLER_POSTAL_SETUP_UPDATED_EVENT, syncPostalSetup);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SELLER_POSTAL_SETUP_UPDATED_EVENT, syncPostalSetup);
      window.removeEventListener("storage", handleStorage);
    };
  }, [session]);

  useEffect(() => {
    function syncTrustProfile() {
      setSellerTrustProfile(getSellerTrustProfile(session));
    }

    syncTrustProfile();
    window.addEventListener(TRUST_SAFETY_UPDATED_EVENT, syncTrustProfile);

    return () => {
      window.removeEventListener(TRUST_SAFETY_UPDATED_EVENT, syncTrustProfile);
    };
  }, [session]);

  useEffect(() => {
    writeStorageJSON(createSellerListingStorageKey(session), listingQueue);
  }, [listingQueue, session]);

  useEffect(() => {
    async function loadDevices() {
      const mediaDevices = getMediaDevices();

      if (!mediaDevices?.enumerateDevices) {
        return;
      }

      try {
        const devices = await mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        setAvailableCameras(cameras);
        setSelectedCameraId((current) => current || cameras[0]?.deviceId || "");
      } catch {
        setAvailableCameras([]);
      }
    }

    void loadDevices();
  }, []);

  useEffect(() => {
    const sharedStream = readPublishedLiveStream(createSellerLiveRoomId(session));

    if (sharedStream?.stream) {
      previewStreamRef.current = sharedStream.stream;
      setCameraPreviewActive(true);
      setChecklistState((current) => ({ ...current, cameraReady: true }));
      setCameraStatus("Webcam is still active for the published live room.");
    }

    [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
      syncVideoElementStream(videoElement, previewStreamRef.current);
    });

    return () => {
      const roomId = createSellerLiveRoomId(session);

      if (streamModeRef.current !== "Live") {
        clearPublishedLiveStream(roomId);
        stopMediaStream(previewStreamRef.current);
      }

      previewStreamRef.current = null;
    };
  }, [session]);

  useEffect(() => {
    const roomId = createSellerLiveRoomId(session);

    if (!previewStreamRef.current) {
      return;
    }

    publishLiveStream({
      roomId,
      stream: previewStreamRef.current,
      isMirrored: cameraMirrorEnabled
    });
  }, [cameraMirrorEnabled, session]);

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
    function syncBidRecords() {
      setBidRecordRefreshKey((current) => current + 1);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === LIVE_BID_RECORDS_STORAGE_KEY) {
        syncBidRecords();
      }
    }

    window.addEventListener(LIVE_BID_RECORDS_UPDATED_EVENT, syncBidRecords);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LIVE_BID_RECORDS_UPDATED_EVENT, syncBidRecords);
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
    if (!wedgeDrafts.some((wedge) => wedge.id === manualWheelTargetId)) {
      setManualWheelTargetId(wedgeDrafts[0]?.id ?? 1);
    }
  }, [manualWheelTargetId, wedgeDrafts]);

  function handleWedgeChange(
    id: number,
    field: keyof Omit<WheelWedge, "id">,
    value: WheelWedge["label"] | WheelWedge["kind"] | WheelWedge["color"] | WheelWedge["linkedListingId"]
  ) {
    setWedgeDrafts((current) =>
      current.map((wedge) => (wedge.id === id ? { ...wedge, [field]: value } : wedge))
    );
  }

  function handleAddWedge() {
    setWedgeDrafts((current) => {
      const nextId = current.reduce((largest, wedge) => Math.max(largest, wedge.id), 0) + 1;
      const color = wedgeColorCycle[(nextId - 1) % wedgeColorCycle.length];
      const fallbackListing = listingQueue.find((listing) => listing.category === selectedProductCategory) ?? listingQueue[0];

      return [
        ...current,
        {
          id: nextId,
          label: fallbackListing ? compactListingLabel(fallbackListing.title) : `Wedge ${nextId}`,
          kind: fallbackListing ? "Prize" : "Mystery",
          color,
          linkedListingId: fallbackListing?.id ?? null
        }
      ];
    });
    setLastAppliedAt("Layout updated with a new wedge");
  }

  function handleRemoveWedge(id: number) {
    let removed = false;

    setWedgeDrafts((current) => {
      if (current.length <= 2) {
        return current;
      }

      removed = true;
      return current.filter((wedge) => wedge.id !== id);
    });

    if (!removed) {
      setLastAppliedAt("Wheel needs at least two wedges");
      return;
    }

    setLockedWheelResultId((current) => (current === id ? null : current));
    setLastAppliedAt(`Removed wedge ${id} from the layout`);
  }

  function handleWedgeListingChange(wedgeId: number, nextListingId: number | null) {
    const nextListing = nextListingId === null ? null : listingQueue.find((listing) => listing.id === nextListingId) ?? null;

    setWedgeDrafts((current) =>
      current.map((wedge) =>
        wedge.id === wedgeId
          ? {
              ...wedge,
              linkedListingId: nextListing?.id ?? null,
              label: nextListing ? compactListingLabel(nextListing.title) : wedge.label
            }
          : wedge
      )
    );
  }

  function handleNumberInput(
    setter: (value: number) => void,
    minimum: number,
    maximum: number
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setter(Math.min(maximum, Math.max(minimum, nextValue)));
    };
  }

  const mysteryCount = wedgeDrafts.filter((wedge) => wedge.kind === "Mystery").length;
  const bonusCount = wedgeDrafts.filter((wedge) => wedge.kind === "Bonus").length;
  const prizeCount = wedgeDrafts.filter((wedge) => wedge.kind === "Prize").length;
  const totalWedges = wedgeDrafts.length;
  const pinnedPrizeGap = pinnedPrizeCount - prizeCount;
  const bonusGap = bonusSlots - bonusCount;
  const fairnessState =
    pinnedPrizeGap <= 0 && bonusGap <= 0
      ? "Balanced for moderation review"
      : "Needs wedge alignment before the round is locked";

  function applyPreset(presetId: (typeof wheelPresets)[number]["id"]) {
    const preset = wheelPresets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setActivePresetId(preset.id);
    setTheme(preset.theme);
    setSpinDuration(preset.spinDuration);
    setEntryMinimum(preset.entryMinimum);
    setBonusSlots(preset.bonusSlots);
    setPinnedPrizeCount(preset.pinnedPrizeCount);
    setCooldownMinutes(preset.cooldownMinutes);
    setEntryMode(preset.entryMode);
    setWinnerAnnouncement(preset.winnerAnnouncement);
  }

  function handleApplySettings() {
    setLastAppliedAt(formatClockTime(new Date()));
  }

  function handleResetLayout() {
    setWedgeDrafts(initialWedges);
    applyPreset(activePresetId);
    setReplaySpinEnabled(false);
    setAutoQueueWinner(true);
    setModApprovalRequired(true);
    setLastAppliedAt("Reset to preset defaults");
  }

  function handleChecklistToggle(key: keyof typeof checklistState) {
    setChecklistState((current) => ({ ...current, [key]: !current[key] }));
  }

  function handleModeratorToggle(moderatorId: string) {
    setSelectedModeratorIds((current) =>
      current.includes(moderatorId) ? current.filter((id) => id !== moderatorId) : [...current, moderatorId]
    );
  }

  function handleStreamCategoryChange(category: ProductCategory) {
    setStreamCategory(category);
    setSelectedProductCategory(category);
    setChecklistState((current) => ({ ...current, titleReady: true }));
  }

  function handleListingCategoryChange(listingId: number, category: ProductCategory) {
    setListingQueue((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, category } : listing))
    );
    setSelectedProductCategory(category);
  }

  function handleEditListing(listingId: number) {
    const listing = listingQueue.find((item) => item.id === listingId);

    if (!listing) {
      return;
    }

    setIsCreatingListing(false);
    setEditingListingId(listingId);
    setListingDraft(createListingDraft(listing));
    setSelectedProductCategory(listing.category);
    setListingFeedback(`Editing ${listing.title}. Update lot details and save when ready.`);
  }

  function handleStartNewListing() {
    setIsCreatingListing(true);
    setEditingListingId(null);
    setListingDraft({
      ...createEmptyListingDraft(selectedProductCategory),
      title: createNewListingTitle(listingQueue.length + 1)
    });
    setListingFeedback(`Creating a new ${selectedProductCategory} lot. Add the details and save to place it in the queue.`);
  }

  function handleListingDraftChange<K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) {
    setListingDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSaveListingEdits() {
    if (editingListingId === null && !isCreatingListing) {
      return;
    }

    const trimmedTitle = listingDraft.title.trim();
    const trimmedDetail = listingDraft.detail.trim();
    const trimmedState = listingDraft.state.trim();
    const trimmedPriceLabel = listingDraft.priceLabel.trim();
    const trimmedAudience = listingDraft.audience.trim();
    const trimmedPhotoNotes = listingDraft.photoNotes.trim();

    if (!trimmedTitle || !trimmedDetail || !trimmedState || !trimmedPriceLabel || !trimmedAudience) {
      setListingFeedback("Lot title, details, state, pricing, and audience are required before saving.");
      return;
    }

    const nextPhotoCount = Math.max(1, Math.min(24, Math.round(listingDraft.photoCount)));

    if (isCreatingListing) {
      const nextListingId = listingQueue.reduce((largest, listing) => Math.max(largest, listing.id), 0) + 1;
      const newListing: SellerListing = {
        id: nextListingId,
        title: trimmedTitle,
        detail: trimmedDetail,
        state: trimmedState,
        category: listingDraft.category,
        format: listingDraft.format,
        priceLabel: trimmedPriceLabel,
        audience: trimmedAudience,
        photoCount: nextPhotoCount,
        photoNotes: trimmedPhotoNotes
      };

      setListingQueue((current) => [...current, newListing]);
      setEditingListingId(nextListingId);
      setIsCreatingListing(false);
      setListingDraft(createListingDraft(newListing));
      setListingFeedback(`Added ${trimmedTitle} to the queue. ${nextPhotoCount} product photo${nextPhotoCount === 1 ? "" : "s"} staged for this lot.`);
    } else {
      setListingQueue((current) =>
        current.map((listing) =>
          listing.id === editingListingId
            ? {
                ...listing,
                title: trimmedTitle,
                detail: trimmedDetail,
                state: trimmedState,
                category: listingDraft.category,
                format: listingDraft.format,
                priceLabel: trimmedPriceLabel,
                audience: trimmedAudience,
                photoCount: nextPhotoCount,
                photoNotes: trimmedPhotoNotes
              }
            : listing
        )
      );
      setListingDraft((current) => ({ ...current, photoCount: nextPhotoCount, photoNotes: trimmedPhotoNotes }));
      setListingFeedback(`Saved changes to ${trimmedTitle}. ${nextPhotoCount} product photo${nextPhotoCount === 1 ? "" : "s"} staged for this lot.`);
    }

    setSelectedProductCategory(listingDraft.category);
  }

  function handleCancelListingEdits() {
    if (isCreatingListing) {
      setIsCreatingListing(false);
      const fallbackListing = listingQueue.find((listing) => listing.id === editingListingId) ?? listingQueue[0] ?? null;

      if (fallbackListing) {
        setEditingListingId(fallbackListing.id);
        setListingDraft(createListingDraft(fallbackListing));
        setSelectedProductCategory(fallbackListing.category);
        setListingFeedback(`New lot draft cleared. Returned to ${fallbackListing.title}.`);
        return;
      }

      setListingDraft(createEmptyListingDraft(selectedProductCategory));
      setListingFeedback("New lot draft cleared.");
      return;
    }

    if (editingListingId === null) {
      return;
    }

    const listing = listingQueue.find((item) => item.id === editingListingId);

    if (!listing) {
      return;
    }

    setListingDraft(createListingDraft(listing));
    setListingFeedback(`Reverted unsaved changes for ${listing.title}.`);
  }

  async function refreshCameraList() {
    const mediaDevices = getMediaDevices();

    if (!mediaDevices?.enumerateDevices) {
      setAvailableCameras([]);
      return;
    }

    try {
      const devices = await mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      setAvailableCameras(cameras);
      setSelectedCameraId((current) => current || cameras[0]?.deviceId || "");
    } catch {
      setAvailableCameras([]);
    }
  }

  async function handleStartCameraPreview() {
    const mediaDevices = getMediaDevices();

    if (!mediaDevices?.getUserMedia) {
      setCameraStatus("This browser does not support webcam testing.");
      return;
    }

    setCameraLoading(true);
    setCameraStatus("Starting webcam preview...");

    try {
      stopMediaStream(previewStreamRef.current);

      const stream = await mediaDevices.getUserMedia({
        video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
        audio: false
      });

      previewStreamRef.current = stream;
      publishLiveStream({
        roomId: createSellerLiveRoomId(session),
        stream,
        isMirrored: cameraMirrorEnabled
      });

      [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
        syncVideoElementStream(videoElement, stream);
      });

      setCameraPreviewActive(true);
      setChecklistState((current) => ({ ...current, cameraReady: true }));
      setCameraStatus("Webcam is live in preview. Framing is ready for a test stream.");
      await refreshCameraList();
    } catch (error) {
      setCameraPreviewActive(false);
      setChecklistState((current) => ({ ...current, cameraReady: false }));
      setCameraStatus(describeCameraError(error));
    } finally {
      setCameraLoading(false);
    }
  }

  function handleStopCameraPreview() {
    clearPublishedLiveStream(createSellerLiveRoomId(session));
    stopMediaStream(previewStreamRef.current);
    previewStreamRef.current = null;

    [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
      syncVideoElementStream(videoElement, null);
    });

    setCameraPreviewActive(false);
    setChecklistState((current) => ({ ...current, cameraReady: false }));
    setCameraStatus("Preview stopped. Restart the webcam test before going live.");
  }

  const checklistItems = [
    { key: "titleReady", label: "Title, cover image, and category confirmed" },
    { key: "wheelReviewed", label: "Wheel rules reviewed with moderator" },
    { key: "cameraReady", label: "Primary camera and backup mic tested" },
    { key: "queueReady", label: "Pinned lots and buy-now items reordered" },
    { key: "promoArmed", label: "Follower notification and countdown armed" }
  ] as const;

  const completedChecklistCount = checklistItems.filter((item) => checklistState[item.key]).length;
  const trustGateCleared = Boolean(
    sellerTrustProfile &&
      sellerTrustProfile.verificationStatus === "Verified" &&
      sellerTrustProfile.idVerified &&
      sellerTrustProfile.addressVerified &&
      !sellerTrustProfile.payoutHold &&
      !sellerTrustProfile.watchlist
  );
  const launchReady = checklistItems.every((item) => checklistState[item.key]) && trustGateCleared;
  const launchStatusLabel = streamMode === "Live" ? "Live now" : launchReady ? "Ready to launch" : "Needs setup";
  const activeModerators = moderationTeam.filter((member) => selectedModeratorIds.includes(member.id));
  const activeLot = listingQueue[activeLotIndex] ?? listingQueue[0] ?? null;
  const activeWheelTarget = wedgeDrafts.find((wedge) => wedge.id === manualWheelTargetId) ?? wedgeDrafts[0];
  const lockedWheelResult = wedgeDrafts.find((wedge) => wedge.id === lockedWheelResultId) ?? null;
  const activeWheelListing =
    activeWheelTarget && activeWheelTarget.linkedListingId !== null
      ? listingQueue.find((listing) => listing.id === activeWheelTarget.linkedListingId) ?? null
      : null;
  const lockedWheelListing =
    lockedWheelResult && lockedWheelResult.linkedListingId !== null
      ? listingQueue.find((listing) => listing.id === lockedWheelResult.linkedListingId) ?? null
      : null;
  const selectedCategoryPlaybook =
    categoryPlaybooks.find((playbook) => playbook.category === selectedProductCategory) ?? categoryPlaybooks[0];
  const categoryCounts = productCategories.map((category) => ({
    category,
    count: listingQueue.filter((listing) => listing.category === category).length
  }));
  const filteredListings = listingQueue.filter((listing) => listing.category === selectedProductCategory);
  const readyStudioDevices = studioDevices.filter((device) => checklistState[device.key as keyof ChecklistState]).length;
  const studioReadinessLabel =
    readyStudioDevices === studioDevices.length ? "Studio checks cleared" : `${readyStudioDevices}/${studioDevices.length} studio checks cleared`;
  const countdownStatus =
    streamMode === "Live"
      ? "Stream is live"
      : `${countdownMinutes} minute countdown with promo push ${promoLeadMinutes} minutes before launch`;
  const visualSpinDuration = Math.min(8, Math.max(4, Math.round(spinDuration / 4)));
  const wheelGradient = buildWheelGradient(wedgeDrafts);
  const wheelSegmentAngle = wedgeDrafts.length > 0 ? 360 / wedgeDrafts.length : 360;
  const wheelStatusLabel =
    wheelSpinState === "spinning"
      ? `Wheel spinning to ${activeWheelTarget?.label ?? "next result"}`
      : lockedWheelResult
        ? `Locked result: ${lockedWheelResult.label}${lockedWheelListing ? ` linked to ${lockedWheelListing.title}` : ""}`
        : "Wheel ready for the next manual spin";

  const activeCategoryCount = listingQueue.filter((listing) => listing.category === streamCategory).length;
  const visibleListings = filteredListings.length > 0 ? filteredListings : listingQueue;
  const editingListing = listingQueue.find((listing) => listing.id === editingListingId) ?? null;
  const listingEditorVisible = isCreatingListing || editingListing !== null;
  const activeLotTitle = activeLot?.title ?? "No active lot selected";
  const activeLotState = activeLot?.state ?? "Queue a lot to show stream spotlight details.";
  const activeLotDetail = activeLot?.detail ?? "Add a listing to populate the active lot panel.";
  const activeLotPhotoCount = activeLot?.photoCount ?? 0;
  const estimatedViewerCount =
    streamMode === "Live" ? 1842 : streamMode === "Ready" ? 612 : 184;
  const sellerLiveRoom: PublicLiveRoom = {
    id: createSellerLiveRoomId(session),
    title: streamTitle.trim() || "Seller Live Room",
    seller: session?.name ?? "Studio Seller",
    metric: formatWatchingMetric(estimatedViewerCount),
    detail: openingScript.trim() || "Seller stream is live and ready for buyers to join from the public room list.",
    lot: activeLotTitle,
    lotId: activeLot ? String(activeLot.id) : undefined,
    lotDetail: activeLotDetail,
    lotState: activeLotState,
    lotPhotoCount: activeLotPhotoCount,
    bid: activeLot?.priceLabel ?? "Bid opening soon",
    status: "Live now",
    category: streamCategory,
    format: streamFormat,
    hostNote: sellerNotes.trim() || "Host notes are staged in the seller dashboard.",
    startedAt: formatLaunchTime(new Date().toISOString()),
    isSimulated: false
  };
  const sellerBidState = streamMode === "Live" ? getLiveRoomBidState(sellerLiveRoom) : null;
  const sellerBidLeader = sellerBidState?.leader ?? "No bidder yet";
  const sellerCurrentBid = sellerBidState ? formatBidCurrency(sellerBidState.currentBid || sellerBidState.startingBid) : "Not live yet";
  const sellerMinimumNextBid = sellerBidState ? formatBidCurrency(sellerBidState.minimumNextBid) : "Go live to accept bids";
  const sellerBidVelocityLabel =
    sellerBidState && sellerBidState.totalBids > 0
      ? `${sellerBidState.totalBids} live bid${sellerBidState.totalBids === 1 ? "" : "s"} on this lot`
      : "No live bids on the active lot yet";
  const sellerBidRecords = getLiveBidRecords(sellerLiveRoom.id);
  const sellerLiveChatMessages = getLiveChatMessages(sellerLiveRoom.id);
  const postalReadiness = getSellerPostalReadiness(postalSetup);
  const sellerMetricCards = [
    ...sellerMetrics,
    { label: "Postal Readiness", value: `${postalReadiness.percent}%` },
    { label: "Trust Score", value: sellerTrustProfile ? `${sellerTrustProfile.complianceScore}` : "Pending" }
  ];

  void bidRefreshKey;
  void bidRecordRefreshKey;
  void chatRefreshKey;

  const streamControlCards = [
    {
      title: "Countdown Status",
      detail: countdownStatus
    },
    {
      title: "Camera + Audio",
      detail: checklistState.cameraReady
        ? "Primary camera and backup mic are cleared for launch."
        : "Device checks are still blocking the stream from going live."
    },
    {
      title: "Pinned Opening Lots",
      detail: `${listingQueue.length} opening listings are staged, with ${pinnedPrizeCount} pinned prize callouts supporting the first live segment.`
    },
    {
      title: "Category Routing",
      detail: `${streamCategory} is the active stream category with ${activeCategoryCount} queued listing${activeCategoryCount === 1 ? "" : "s"} aligned to this show.`
    },
    {
      title: "Stream Controls",
      detail: `${streamMode} mode with ${chatMode.toLowerCase()} and seller notes staged for the host panel.`
    },
    {
      title: "Live Bidding",
      detail:
        streamMode === "Live"
          ? `${sellerCurrentBid} led by ${sellerBidLeader}. Next valid bid is ${sellerMinimumNextBid}.`
          : "Bid telemetry will appear here once the room is live."
    },
    {
      title: "Broadcast Profile",
      detail: `${streamQuality} in ${latencyProfile.toLowerCase()} mode with ${scenePreset} loaded for ${streamFormat.toLowerCase()}.`
    },
    {
      title: "Trust Gate",
      detail: trustGateCleared
        ? "Seller verification, address review, and payout safety checks are all cleared for go-live."
        : "Trust review is still blocking this room from going live."
    }
  ];

  const streamSetupSteps = [
    {
      title: "Stream Details",
      detail: `${streamTitle} is scheduled for ${formatLaunchTime(scheduledAt)} in ${streamCategory} with the ${coverTheme} cover treatment.`
    },
    {
      title: "Go-Live Checklist",
      detail: `${completedChecklistCount} of ${checklistItems.length} launch checks are complete.`
    },
    {
      title: "Lot Sequencing",
      detail: `${listingQueue[0]?.title ?? "No opening lot staged yet"} is pinned to open the room before the wheel and bonus drop cadence begins.`
    },
    {
      title: "Promo Push",
      detail: `Follower alerts are configured to trigger ${promoLeadMinutes} minutes before countdown with ${chatMode.toLowerCase()}.`
    },
    {
      title: "Studio Readiness",
      detail: `${studioReadinessLabel} with ${activeModerators.length} moderator${activeModerators.length === 1 ? "" : "s"} assigned to launch coverage.`
    },
    {
      title: "Trust Gate",
      detail: trustGateCleared
        ? "Trust review has cleared this seller for launch."
        : "Trust review still needs admin approval before launch."
    }
  ];

  useEffect(() => {
    if (streamMode !== "Live") {
      removePublishedLiveRoom(sellerLiveRoom.id);
      return;
    }

    upsertPublishedLiveRoom(sellerLiveRoom);
  }, [
    activeLot,
    activeLotDetail,
    activeLotPhotoCount,
    activeLotTitle,
    activeLotState,
    estimatedViewerCount,
    openingScript,
    sellerNotes,
    session,
    streamCategory,
    streamFormat,
    streamMode,
    streamTitle
  ]);

  function handleAdvanceLot() {
    if (listingQueue.length === 0) {
      setLaunchFeedback("Add a listing before advancing the live lot queue.");
      return;
    }

    const nextIndex = (activeLotIndex + 1) % listingQueue.length;
    setActiveLotIndex(nextIndex);
    setSpotlightPinned(true);
    setLaunchFeedback(`Active lot moved to ${listingQueue[nextIndex]?.title}.`);
  }

  function handlePinSpotlight() {
    setSpotlightPinned((current) => !current);
    setLaunchFeedback(
      spotlightPinned
        ? "Current lot spotlight removed from the stream overlay."
        : `${activeLot?.title ?? "The active lot"} is now pinned in the seller stream window.`
    );
  }

  function handleSaveStreamSetup() {
    setStreamMode(launchReady ? "Ready" : "Rehearsal");
    setLaunchFeedback(
      launchReady
        ? `Setup saved. ${streamTitle} is ready for launch at ${formatLaunchTime(scheduledAt)}.`
        : `Setup saved. ${
            checklistItems.length - completedChecklistCount + (trustGateCleared ? 0 : 1)
          } launch check(s) still need attention before go-live.`
    );
  }

  async function handleGoLive() {
    if (!trustGateCleared) {
      setLaunchFeedback("Go-live is locked until trust review clears seller verification, address, and payout checks.");
      return;
    }

    if (!launchReady) {
      setLaunchFeedback("Go-live is locked until every launch checklist item is confirmed.");
      return;
    }

    if (!cameraPreviewActive) {
      await handleStartCameraPreview();
    }

    if (!previewStreamRef.current) {
      setLaunchFeedback("Go-live could not start because the seller camera feed is still unavailable.");
      return;
    }

    setStreamMode("Live");
    setLaunchFeedback(`Stream is now live. ${streamTitle} launched with ${countdownMinutes} minute countdown preparation.`);
  }

  function handleStopStream() {
    setStreamMode(launchReady ? "Ready" : "Rehearsal");
    setWheelSpinState("idle");
    setLaunchFeedback("Stream stopped. Seller controls remain staged so the next launch can resume quickly.");
  }

  function handleSendHostChatMessage(pinned = false) {
    const result = postLiveChatMessage({
      roomId: sellerLiveRoom.id,
      senderName: session?.name ?? "Seller Host",
      senderRole: session?.role === "admin" ? "admin" : "seller",
      text: hostChatInput,
      pinned
    });

    if (result.ok === false) {
      setHostChatFeedback(result.message);
      return;
    }

    setHostChatInput("");
    setHostChatFeedback(pinned ? "Pinned host note sent to the live room." : "Host chat message sent to the live room.");
  }

  function handleSubmitTrustEvidence() {
    if (!sellerTrustProfile) {
      return;
    }

    upsertSellerTrustProfile({
      ...sellerTrustProfile,
      verificationStatus: "Pending review",
      idVerified: true,
      addressVerified: true,
      lastReviewAt: new Date().toISOString(),
      reviewNote: "Seller uploaded identity and address evidence from the dashboard and is waiting for admin review."
    });
    setLaunchFeedback("Trust evidence submitted. Admin review is required before this stream can go live.");
  }

  function handleCloseActiveLot() {
    if (streamMode !== "Live") {
      setLaunchFeedback("Go live before closing a lot and saving the bid result.");
      return;
    }

    if (!activeLot) {
      setLaunchFeedback("Add or select a lot before attempting to close the auction.");
      return;
    }

    const finalizedRecord = finalizeLiveLot({
      room: sellerLiveRoom,
      lotTitle: activeLotTitle,
      lotDetail: activeLotDetail
    });

    setLaunchFeedback(
      finalizedRecord.status === "sold" && finalizedRecord.winningBid !== null
        ? `Sold ${finalizedRecord.lotTitle} to ${finalizedRecord.winnerName ?? "Unknown bidder"} for ${formatBidCurrency(finalizedRecord.winningBid)}. Bid record saved with bidder details.`
        : `${finalizedRecord.lotTitle} closed with no winning bid. A passed-lot record was saved for reconciliation.`
    );
  }

  function handleSpinWheel() {
    if (!activeWheelTarget || wedgeDrafts.length === 0 || wheelSpinState === "spinning") {
      return;
    }

    const targetIndex = wedgeDrafts.findIndex((wedge) => wedge.id === activeWheelTarget.id);
    const centerAngle = targetIndex * wheelSegmentAngle + wheelSegmentAngle / 2;
    const normalizedRotation = ((wheelRotation % 360) + 360) % 360;
    const targetRotation = wheelRotation + (360 - centerAngle - normalizedRotation) + 360 * 4;

    setWheelOverlayVisible(true);
    setWheelSpinState("spinning");
    setLockedWheelResultId(null);
    setWheelRotation(targetRotation);
    setLaunchFeedback(`Wheel spinning for ${activeWheelTarget.label}. ${winnerAnnouncement}.`);

    window.setTimeout(() => {
      setWheelSpinState("complete");
      setLockedWheelResultId(activeWheelTarget.id);
      setLaunchFeedback(`Wheel result locked on ${activeWheelTarget.label}. ${winnerAnnouncement}.`);
    }, visualSpinDuration * 1000);
  }

  function handleClearWheelResult() {
    setWheelSpinState("idle");
    setLockedWheelResultId(null);
    setLaunchFeedback("Wheel result cleared. Manual controls are ready for the next spin.");
  }

  return (
    <section className="page-grid seller-page-grid">
      <article className="showcase-card span-8 seller-command-card">
        <span className="section-label">Seller Backend</span>
        <h2>A dedicated control panel for running the show before buyers ever hit the live floor.</h2>
        <p>
          {session
            ? `${session.name} is authenticated as ${session.role}. Seller operations stay separated from the storefront while remaining easy to reach through shared navigation.`
            : "Seller tools require seller or admin access."}
        </p>
        <div className="seller-command-strip">
          <div className="seller-command-item">
            <span>Show status</span>
            <strong>{launchStatusLabel}</strong>
            <p>{formatLaunchTime(scheduledAt)}</p>
          </div>
          <div className="seller-command-item">
            <span>Live format</span>
            <strong>{streamFormat}</strong>
            <p>{scenePreset}</p>
          </div>
          <div className="seller-command-item">
            <span>Moderator coverage</span>
            <strong>{activeModerators.length} assigned</strong>
            <p>{studioReadinessLabel}</p>
          </div>
        </div>
        <div className="metric-grid">
          {sellerMetricCards.map((item) => (
            <div className="metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-4 wheel-preview-card seller-side-panel">
        <span className="section-label">Wheel Summary</span>
        <h2>Current round rules</h2>
        <div className="stack">
          <div className="list-card">
            <strong>{theme}</strong>
            <p>{formatSpinDuration(spinDuration)} spin with {bonusSlots} bonus wedges and {pinnedPrizeCount} pinned prizes.</p>
          </div>
          <div className="wheel-badge-row">
            <span className="pill-label">{entryMode}</span>
            <span className="pill-label">${entryMinimum} entry</span>
            <span className="pill-label">{cooldownMinutes} min cooldown</span>
          </div>
          <div className="wheel-mini-preview" aria-label="Wheel preview">
            {wedgeDrafts.map((wedge) => (
              <div
                className="wheel-mini-slice"
                key={wedge.id}
                style={{ background: `linear-gradient(135deg, ${wedge.color}, rgba(255,255,255,0.96))` }}
              >
                <span>{wedge.label}</span>
                <strong>{wedge.kind}</strong>
                <p>
                  {wedge.linkedListingId !== null
                    ? listingQueue.find((listing) => listing.id === wedge.linkedListingId)?.title ?? "Linked listing"
                    : "No linked listing"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="page-card span-4 seller-side-panel">
        <span className="section-label">Postal Setup</span>
        <h2>Seller fulfillment is now staged on its own setup page.</h2>
        <div className="stack">
          <div className="list-card">
            <strong>{postalReadiness.label}</strong>
            <p>
              {postalReadiness.count} of {postalReadiness.checks.length} fulfillment checks are complete for {postalSetup.profileName}.
            </p>
          </div>
          <div className="wheel-badge-row">
            <span className="pill-label">{postalSetup.primaryCarrier}</span>
            <span className="pill-label">{postalSetup.handlingWindow}</span>
            <span className="pill-label">{postalReadiness.percent}% ready</span>
          </div>
          <div className="list-card">
            <strong>Warehouse</strong>
            <p>
              {postalSetup.warehouseCity}, {postalSetup.warehouseState}
            </p>
            <p>{postalSetup.serviceRegions}</p>
          </div>
          <Link className="button-primary" to="/seller/postal-service">
            Open Postal Setup
          </Link>
        </div>
      </article>

      <article className="page-card span-8 seller-control-surface seller-stream-window">
        <span className="section-label">Stream Window</span>
        <h2>The seller now has an actual on-air window instead of only preflight forms.</h2>
        <p>
          Preview, active lot, viewer pulse, and quick host actions stay in one focused stream surface so the seller can
          operate the show while staying inside the dashboard.
        </p>
        <div className="seller-stream-stage">
          <div className={`camera-preview-frame seller-stream-frame${streamMode === "Live" ? " is-live" : ""}`}>
            <video
              autoPlay
              className={`camera-preview-video${cameraMirrorEnabled ? " is-mirrored" : ""}`}
              muted
              playsInline
              ref={streamWindowVideoRef}
            />
            {!cameraPreviewActive ? (
              <div className="camera-preview-empty">
                <strong>{streamMode === "Live" ? "Live room awaiting camera feed" : "Seller preview offline"}</strong>
                <p>Start the webcam preview to validate framing, overlay placement, and lot transitions before buyers join.</p>
              </div>
            ) : null}
            {overlayEnabled && wheelOverlayVisible ? (
              <div className="seller-wheel-overlay" aria-live="polite">
                <div className="seller-wheel-shell">
                  <div className="seller-wheel-pointer" />
                  <div
                    className={`seller-wheel${wheelSpinState === "spinning" ? " is-spinning" : ""}`}
                    style={{
                      background: wheelGradient,
                      transform: `rotate(${wheelRotation}deg)`,
                      transitionDuration: `${visualSpinDuration}s`
                    }}
                  >
                    {wedgeDrafts.map((wedge, index) => {
                      const angle = index * wheelSegmentAngle + wheelSegmentAngle / 2;
                      const linkedListing =
                        wedge.linkedListingId !== null
                          ? listingQueue.find((listing) => listing.id === wedge.linkedListingId) ?? null
                          : null;

                      return (
                        <div
                          className="seller-wheel-label"
                          key={wedge.id}
                          style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-34%)` }}
                        >
                          <span style={{ transform: `rotate(${-angle}deg)` }}>
                            <strong>{wedge.label}</strong>
                            {linkedListing ? <em>{linkedListing.format}</em> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="seller-wheel-readout">
                  <span>{wheelSpinState === "spinning" ? "Wheel in motion" : "Wheel overlay"}</span>
                  <strong>{lockedWheelResult?.label ?? activeWheelTarget?.label ?? "No wedge selected"}</strong>
                  <p className="seller-wheel-readout-detail">
                    {lockedWheelListing?.title ?? activeWheelListing?.title ?? "Assign a listing to a wedge to feature a product on the wheel."}
                  </p>
                  <p>{wheelStatusLabel}</p>
                </div>
              </div>
            ) : null}
            <div className="seller-stream-overlay">
              <div className="seller-stream-pill-row">
                <span className="pill-label">{streamMode}</span>
                <span className="pill-label">{formatViewerCount(estimatedViewerCount)} watching</span>
                <span className="pill-label">{overlayEnabled ? "Overlay on" : "Overlay off"}</span>
              </div>
              <div className="seller-stream-lower-third">
                <span>{spotlightPinned ? "Pinned lot" : "Next up"}</span>
                <strong>{activeLotTitle}</strong>
                <p>{activeLotState}</p>
              </div>
            </div>
          </div>
          <div className="seller-stream-console">
            <div className="seller-stream-card">
              <span>Active lot</span>
              <strong>{activeLotTitle}</strong>
              <p>{activeLotDetail}</p>
              <p>{activeLotPhotoCount} product photo{activeLotPhotoCount === 1 ? "" : "s"} staged</p>
            </div>
            <div className="seller-stream-card">
              <span>Room bidding</span>
              <strong>{sellerCurrentBid}</strong>
              <p>{streamMode === "Live" ? `${sellerBidLeader} is leading. ${sellerBidVelocityLabel}.` : countdownStatus}</p>
            </div>
            <div className="seller-stream-card">
              <span>Coverage</span>
              <strong>{activeModerators.length} moderators live</strong>
              <p>{activeModerators.map((member) => member.name).join(", ") || "No moderators assigned"}</p>
            </div>
            <div className="seller-stream-card">
              <span>Wheel control</span>
              <strong>{lockedWheelResult?.label ?? activeWheelTarget?.label ?? "Manual target not set"}</strong>
              <p>{lockedWheelListing?.title ?? activeWheelListing?.title ?? wheelStatusLabel}</p>
            </div>
            <div className="seller-stream-actions">
              <button className="button-primary" onClick={() => void handleStartCameraPreview()} type="button">
                {cameraPreviewActive ? "Refresh Camera" : "Open Camera"}
              </button>
              <button className="button-secondary" onClick={handlePinSpotlight} type="button">
                {spotlightPinned ? "Unpin Spotlight" : "Pin Spotlight"}
              </button>
              <button className="button-secondary" onClick={handleAdvanceLot} type="button">
                Advance Lot
              </button>
              <button className="button-secondary" onClick={() => setChatAlertMuted((value) => !value)} type="button">
                {chatAlertMuted ? "Unmute Chat Alerts" : "Mute Chat Alerts"}
              </button>
              <button className="button-secondary" disabled={wheelSpinState === "spinning"} onClick={handleSpinWheel} type="button">
                {wheelSpinState === "spinning" ? "Wheel Spinning" : "Spin Wheel"}
              </button>
              <button className="button-secondary" onClick={handleStopStream} type="button">
                Stop Stream
              </button>
            </div>
          </div>
        </div>
      </article>

      <article className="page-card span-4 seller-side-panel seller-stream-sidebar">
        <span className="section-label">Control Feed</span>
        <h2>What the seller needs while on camera.</h2>
        <div className="stack">
          <div className="list-card">
            <strong>Bid board</strong>
            <p>{sellerCurrentBid}</p>
            <p>{streamMode === "Live" ? `Leader: ${sellerBidLeader}. Minimum next bid is ${sellerMinimumNextBid}.` : "Go live to start accepting bids from buyers."}</p>
          </div>
          {launchQuickActions.map((item) => (
            <div className="list-card" key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
          <div className="list-card">
            <strong>Wheel manual control</strong>
            <label className="field">
              <span>Target wedge</span>
              <select onChange={(event) => setManualWheelTargetId(Number(event.target.value))} value={manualWheelTargetId}>
                {wedgeDrafts.map((wedge) => (
                  <option key={wedge.id} value={wedge.id}>
                    {wedge.label} - {wedge.kind}
                  </option>
                ))}
              </select>
            </label>
            <div className="seller-wheel-manual-actions">
              <button className="button-primary" disabled={wheelSpinState === "spinning"} onClick={handleSpinWheel} type="button">
                Trigger Spin
              </button>
              <button className="button-secondary" onClick={() => setWheelOverlayVisible((value) => !value)} type="button">
                {wheelOverlayVisible ? "Hide Wheel" : "Show Wheel"}
              </button>
              <button className="button-secondary" onClick={handleClearWheelResult} type="button">
                Clear Result
              </button>
            </div>
            <p>
              {lockedWheelResult
                ? `Current winner: ${lockedWheelResult.label}${lockedWheelListing ? ` for ${lockedWheelListing.title}` : ""}`
                : "No wheel result locked yet."}
            </p>
          </div>
          <div className="list-card">
            <strong>Chat alerts</strong>
            <p>{chatAlertMuted ? "Muted for host focus." : "Live for moderator and claim pings."}</p>
          </div>
          <div className="list-card live-chat-card seller-chat-card">
            <strong>Live chat</strong>
            <p>Messages posted here appear in the buyer room for this stream.</p>
            <div className="live-chat-thread">
              {sellerLiveChatMessages.length > 0 ? (
                sellerLiveChatMessages.slice(-7).map((message) => (
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
                  <strong>No room messages yet</strong>
                  <p>Post the opening claim rules or answer the next buyer question from here.</p>
                </div>
              )}
            </div>
            <label className="field">
              <span>Host message</span>
              <input
                maxLength={240}
                onChange={(event) => setHostChatInput(event.target.value)}
                placeholder="Drop a host note, claim rule, or moderator reply."
                type="text"
                value={hostChatInput}
              />
            </label>
            <div className="seller-stream-actions">
              <button className="button-primary" onClick={() => handleSendHostChatMessage(false)} type="button">
                Send Message
              </button>
              <button className="button-secondary" onClick={() => handleSendHostChatMessage(true)} type="button">
                Pin Message
              </button>
            </div>
            <p className="feedback">{hostChatFeedback}</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Wheel Settings</span>
        <h2>Seller page wheel settings now behave like a real control surface.</h2>
        <p>
          Adjust pacing, bidder eligibility, prize weighting, and moderation gates from one seller-only page before the
          stream starts.
        </p>
        <div className="wheel-settings-grid">
          <section className="wheel-settings-panel wheel-settings-panel-full">
            <div className="wheel-settings-header">
              <strong>Preset Control</strong>
              <p>Load a round profile, review fairness checks, and apply the wheel configuration before going live.</p>
            </div>
            <div className="wheel-preset-grid">
              {wheelPresets.map((preset) => (
                <button
                  className={`wheel-preset-card${activePresetId === preset.id ? " is-active" : ""}`}
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  type="button"
                >
                  <span className="pill-label">{preset.title}</span>
                  <strong>{preset.theme}</strong>
                  <p>{preset.detail}</p>
                  <p>
                    {formatSpinDuration(preset.spinDuration)} | ${preset.entryMinimum} entry | {preset.cooldownMinutes} min cooldown
                  </p>
                </button>
              ))}
            </div>
            <div className="wheel-action-bar">
              <div className="list-card">
                <strong>Fairness status</strong>
                <p>{fairnessState}</p>
                <p>{totalWedges} wedges total with {prizeCount} prize, {mysteryCount} mystery, and {bonusCount} bonus wedges configured.</p>
              </div>
              <div className="list-card">
                <strong>Apply state</strong>
                <p>Last seller apply: {lastAppliedAt}</p>
                <p>Preset: {wheelPresets.find((preset) => preset.id === activePresetId)?.title}</p>
              </div>
              <div className="wheel-action-buttons">
                <button className="button-secondary" onClick={handleAddWedge} type="button">
                  Add Wedge
                </button>
                <button className="button-primary" onClick={handleApplySettings} type="button">
                  Apply Wheel Settings
                </button>
                <button className="button-secondary" onClick={handleResetLayout} type="button">
                  Reset To Preset
                </button>
              </div>
            </div>
          </section>

          <section className="wheel-settings-panel">
            <div className="wheel-settings-header">
              <strong>Round Profile</strong>
              <p>Lock the wheel theme, spin pacing, and announcement style for the next live segment.</p>
            </div>
            <label className="field">
              <span>Wheel theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value as (typeof wheelThemes)[number])}>
                {wheelThemes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Spin duration: {formatSpinDuration(spinDuration)}</span>
              <input
                max={60}
                min={10}
                onChange={handleNumberInput(setSpinDuration, 10, 60)}
                type="range"
                value={spinDuration}
              />
            </label>
            <label className="field">
              <span>Winner announcement</span>
              <input
                onChange={(event) => setWinnerAnnouncement(event.target.value)}
                type="text"
                value={winnerAnnouncement}
              />
            </label>
            <div className="card-grid-3">
              <div className="list-card">
                <strong>Replay Spin</strong>
                <p>{replaySpinEnabled ? "Manual replay is allowed for test rounds." : "Replay is disabled for live fairness."}</p>
                <button className="button-secondary" onClick={() => setReplaySpinEnabled((value) => !value)} type="button">
                  {replaySpinEnabled ? "Disable Replay" : "Enable Replay"}
                </button>
              </div>
              <div className="list-card">
                <strong>Winner Queue</strong>
                <p>{autoQueueWinner ? "Winners are added to the next invoice queue automatically." : "Operator must queue winners manually."}</p>
                <button className="button-secondary" onClick={() => setAutoQueueWinner((value) => !value)} type="button">
                  {autoQueueWinner ? "Turn Off Auto Queue" : "Turn On Auto Queue"}
                </button>
              </div>
              <div className="list-card">
                <strong>Moderator Gate</strong>
                <p>{modApprovalRequired ? "Moderator confirmation is required before the result locks." : "Host can confirm outcomes without moderator approval."}</p>
                <button className="button-secondary" onClick={() => setModApprovalRequired((value) => !value)} type="button">
                  {modApprovalRequired ? "Remove Approval Gate" : "Require Approval"}
                </button>
              </div>
            </div>
          </section>

          <section className="wheel-settings-panel">
            <div className="wheel-settings-header">
              <strong>Eligibility Rules</strong>
              <p>Control who can enter the wheel and how quickly repeated wins are throttled.</p>
            </div>
            <label className="field">
              <span>Entry mode</span>
              <select value={entryMode} onChange={(event) => setEntryMode(event.target.value as (typeof entryModes)[number])}>
                {entryModes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Minimum spend to enter</span>
              <input
                max={250}
                min={0}
                onChange={handleNumberInput(setEntryMinimum, 0, 250)}
                type="number"
                value={entryMinimum}
              />
            </label>
            <label className="field">
              <span>Winner cooldown after each spin</span>
              <input
                max={30}
                min={0}
                onChange={handleNumberInput(setCooldownMinutes, 0, 30)}
                type="number"
                value={cooldownMinutes}
              />
            </label>
            <div className="card-grid-3">
              <div className="list-card">
                <strong>Payments</strong>
                <p>Entry requires verified checkout status before a bidder is eligible to spin.</p>
              </div>
              <div className="list-card">
                <strong>Cooldown</strong>
                <p>{cooldownMinutes === 0 ? "Repeat winners can spin again immediately." : `Repeat winners wait ${cooldownMinutes} minutes before re-entry.`}</p>
              </div>
              <div className="list-card">
                <strong>Announcement</strong>
                <p>{winnerAnnouncement}</p>
              </div>
            </div>
          </section>

          <section className="wheel-settings-panel wheel-settings-panel-full">
            <div className="wheel-settings-header">
              <strong>Wedge Layout</strong>
              <p>Shape the round with pinned prize wedges, mystery slots, controlled bonus surfaces, and direct product links.</p>
            </div>
            <div className="card-grid-3 wheel-stat-grid">
              <div className="list-card">
                <strong>Bonus wedges</strong>
                <p>{bonusCount} configured in the current layout.</p>
                <input
                  max={8}
                  min={0}
                  onChange={handleNumberInput(setBonusSlots, 0, 8)}
                  type="number"
                  value={bonusSlots}
                />
              </div>
              <div className="list-card">
                <strong>Pinned prize wedges</strong>
                <p>
                  {pinnedPrizeGap > 0
                    ? `${pinnedPrizeGap} more prize wedge${pinnedPrizeGap === 1 ? "" : "s"} needed to match the pinned target.`
                    : `${pinnedPrizeCount} pinned prize wedges are covered by the current layout.`}
                </p>
                <input
                  max={6}
                  min={0}
                  onChange={handleNumberInput(setPinnedPrizeCount, 0, 6)}
                  type="number"
                  value={pinnedPrizeCount}
                />
              </div>
              <div className="list-card">
                <strong>Fairness note</strong>
                <p>
                  {bonusGap > 0
                    ? `Add ${bonusGap} more bonus wedge${bonusGap === 1 ? "" : "s"} if this round must reach the configured bonus target.`
                    : "Controlled wedges stay fixed so moderators can audit the spin order during the stream."}
                </p>
              </div>
            </div>
            <div className="wheel-editor-grid">
              {wedgeDrafts.map((wedge) => (
                <div className="wheel-editor-card" key={wedge.id}>
                  <div className="wheel-editor-top">
                    <strong>Wedge {wedge.id}</strong>
                    <div className="wheel-editor-top-actions">
                      <span className="wheel-swatch" style={{ backgroundColor: wedge.color }} />
                      <button className="button-secondary wheel-editor-remove" onClick={() => handleRemoveWedge(wedge.id)} type="button">
                        Remove
                      </button>
                    </div>
                  </div>
                  <label className="field">
                    <span>Label</span>
                    <input
                      onChange={(event) => handleWedgeChange(wedge.id, "label", event.target.value)}
                      type="text"
                      value={wedge.label}
                    />
                  </label>
                  <label className="field">
                    <span>Type</span>
                    <select
                      onChange={(event) => handleWedgeChange(wedge.id, "kind", event.target.value)}
                      value={wedge.kind}
                    >
                      <option value="Prize">Prize</option>
                      <option value="Mystery">Mystery</option>
                      <option value="Bonus">Bonus</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Color</span>
                    <input
                      onChange={(event) => handleWedgeChange(wedge.id, "color", event.target.value)}
                      type="color"
                      value={wedge.color}
                    />
                  </label>
                  <label className="field">
                    <span>Linked product listing</span>
                    <select
                      onChange={(event) =>
                        handleWedgeListingChange(
                          wedge.id,
                          event.target.value ? Number(event.target.value) : null
                        )
                      }
                      value={wedge.linkedListingId ?? ""}
                    >
                      <option value="">No listing attached</option>
                      {listingQueue.map((listing) => (
                        <option key={listing.id} value={listing.id}>
                          {listing.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p>
                    {wedge.linkedListingId !== null
                      ? `${listingQueue.find((listing) => listing.id === wedge.linkedListingId)?.format ?? "Listing"} will surface when this wedge wins.`
                      : "Attach a queued listing to let the wheel route straight into a live product moment."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>

      <article className="showcase-card span-12 seller-command-card">
        <span className="section-label">Live Stream Setup</span>
        <h2>Seller stream preparation is surfaced as a first-class backend workflow.</h2>
        <p>
          Sellers can prepare a show from one page instead of jumping across mixed buyer-facing screens. This keeps live
          setup, lot pacing, and launch readiness inside the seller backend.
        </p>
        <div className="card-grid-4">
          {streamSetupSteps.map((step) => (
            <div className="list-card" key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="stream-setup-grid">
          <section className="stream-setup-panel stream-setup-panel-full">
            <div className="wheel-settings-header">
              <strong>Show Details</strong>
              <p>Set the title, category, schedule, and host opener that shape the room before viewers arrive.</p>
            </div>
            <div className="stream-form-grid">
              <label className="field">
                <span>Stream title</span>
                <input onChange={(event) => setStreamTitle(event.target.value)} type="text" value={streamTitle} />
              </label>
              <label className="field">
                <span>Category</span>
                <select value={streamCategory} onChange={(event) => handleStreamCategoryChange(event.target.value as ProductCategory)}>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Cover theme</span>
                <input onChange={(event) => setCoverTheme(event.target.value)} type="text" value={coverTheme} />
              </label>
              <label className="field">
                <span>Scheduled start</span>
                <input onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" value={scheduledAt} />
              </label>
              <label className="field stream-field-full">
                <span>Opening script</span>
                <textarea onChange={(event) => setOpeningScript(event.target.value)} value={openingScript} />
              </label>
            </div>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Broadcast Profile</strong>
              <p>Choose the stream format, scene preset, latency target, and quality profile before the room opens.</p>
            </div>
            <label className="field">
              <span>Show format</span>
              <select value={streamFormat} onChange={(event) => setStreamFormat(event.target.value as (typeof streamFormats)[number])}>
                {streamFormats.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Scene preset</span>
              <select value={scenePreset} onChange={(event) => setScenePreset(event.target.value as (typeof scenePresets)[number])}>
                {scenePresets.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Latency profile</span>
              <select
                value={latencyProfile}
                onChange={(event) => setLatencyProfile(event.target.value as (typeof latencyProfiles)[number])}
              >
                {latencyProfiles.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Output quality</span>
              <select
                value={streamQuality}
                onChange={(event) => setStreamQuality(event.target.value as (typeof streamQualities)[number])}
              >
                {streamQualities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Backstage seat capacity</span>
              <input
                max={6}
                min={1}
                onChange={handleNumberInput(setBackstageCapacity, 1, 6)}
                type="number"
                value={backstageCapacity}
              />
            </label>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Launch Controls</strong>
              <p>Configure countdown timing, promo lead time, chat mode, and seller notes for the host console.</p>
            </div>
            <label className="field">
              <span>Countdown minutes</span>
              <input
                max={30}
                min={1}
                onChange={handleNumberInput(setCountdownMinutes, 1, 30)}
                type="number"
                value={countdownMinutes}
              />
            </label>
            <label className="field">
              <span>Promo lead minutes</span>
              <input
                max={120}
                min={0}
                onChange={handleNumberInput(setPromoLeadMinutes, 0, 120)}
                type="number"
                value={promoLeadMinutes}
              />
            </label>
            <label className="field">
              <span>Chat mode</span>
              <input onChange={(event) => setChatMode(event.target.value)} type="text" value={chatMode} />
            </label>
            <label className="field">
              <span>Seller notes</span>
              <textarea onChange={(event) => setSellerNotes(event.target.value)} value={sellerNotes} />
            </label>
            <div className="toggle-grid">
              <button className={`toggle-card${overlayEnabled ? " is-active" : ""}`} onClick={() => setOverlayEnabled((value) => !value)} type="button">
                <strong>Lot overlay</strong>
                <span>{overlayEnabled ? "Enabled for pinned lots and prices." : "Disabled for a cleaner camera feed."}</span>
              </button>
              <button className={`toggle-card${autoRecordEnabled ? " is-active" : ""}`} onClick={() => setAutoRecordEnabled((value) => !value)} type="button">
                <strong>Auto record</strong>
                <span>{autoRecordEnabled ? "Cloud archive starts when the room goes live." : "Recording must be started manually."}</span>
              </button>
              <button className={`toggle-card${backupRecordingEnabled ? " is-active" : ""}`} onClick={() => setBackupRecordingEnabled((value) => !value)} type="button">
                <strong>Backup capture</strong>
                <span>{backupRecordingEnabled ? "Local backup recording is armed." : "No fallback recording is armed."}</span>
              </button>
              <button className={`toggle-card${simulcastEnabled ? " is-active" : ""}`} onClick={() => setSimulcastEnabled((value) => !value)} type="button">
                <strong>Simulcast</strong>
                <span>{simulcastEnabled ? "Overflow viewers can be mirrored to a secondary feed." : "Primary LoopLot feed only."}</span>
              </button>
            </div>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Webcam Test</strong>
              <p>Run a live browser preview, confirm framing, and lock camera readiness from the seller backend.</p>
            </div>
            <div className="camera-preview-shell">
              <div className={`camera-preview-frame${cameraPreviewActive ? " is-live" : ""}`}>
                <video
                  autoPlay
                  className={`camera-preview-video${cameraMirrorEnabled ? " is-mirrored" : ""}`}
                  muted
                  playsInline
                  ref={previewVideoRef}
                />
                {!cameraPreviewActive ? (
                  <div className="camera-preview-empty">
                    <strong>Preview offline</strong>
                    <p>Start the webcam test to validate the seller camera before the countdown opens.</p>
                  </div>
                ) : null}
              </div>
              <div className="camera-preview-toolbar">
                <label className="field">
                  <span>Camera source</span>
                  <select onChange={(event) => setSelectedCameraId(event.target.value)} value={selectedCameraId}>
                    {availableCameras.length > 0 ? (
                      availableCameras.map((camera, index) => (
                        <option key={camera.deviceId || `${camera.label}-${index}`} value={camera.deviceId}>
                          {camera.label || `Camera ${index + 1}`}
                        </option>
                      ))
                    ) : (
                      <option value="">Default camera</option>
                    )}
                  </select>
                </label>
                <div className="camera-preview-actions">
                  <button className="button-primary" disabled={cameraLoading} onClick={() => void handleStartCameraPreview()} type="button">
                    {cameraLoading ? "Starting..." : cameraPreviewActive ? "Restart Preview" : "Start Preview"}
                  </button>
                  <button className="button-secondary" disabled={!cameraPreviewActive} onClick={handleStopCameraPreview} type="button">
                    Stop Preview
                  </button>
                  <button
                    className={`button-secondary${cameraMirrorEnabled ? " is-active" : ""}`}
                    onClick={() => setCameraMirrorEnabled((value) => !value)}
                    type="button"
                  >
                    {cameraMirrorEnabled ? "Mirror On" : "Mirror Off"}
                  </button>
                </div>
              </div>
              <p className={`feedback camera-feedback${cameraPreviewActive ? "" : " is-error"}`}>{cameraStatus}</p>
            </div>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Studio Health</strong>
              <p>Track camera, audio, network, and lighting checks from the same surface used for launch approval.</p>
            </div>
            <div className="stream-checklist studio-checklist">
              {studioDevices.map((device) => (
                <button
                  className={`stream-check-item${checklistState[device.key as keyof ChecklistState] ? " is-complete" : ""}`}
                  key={device.key}
                  onClick={() => handleChecklistToggle(device.key as keyof ChecklistState)}
                  type="button"
                >
                  <div>
                    <strong>{device.label}</strong>
                    <p>{device.detail}</p>
                  </div>
                  <span>{checklistState[device.key as keyof ChecklistState] ? "Ready" : "Check required"}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Moderator Coverage</strong>
              <p>Assign launch operators so chat, claims, wheel results, and payment issues are covered before countdown.</p>
            </div>
            <div className="moderator-grid">
              {moderationTeam.map((member) => {
                const isSelected = selectedModeratorIds.includes(member.id);

                return (
                  <button
                    className={`moderator-card${isSelected ? " is-active" : ""}`}
                    key={member.id}
                    onClick={() => handleModeratorToggle(member.id)}
                    type="button"
                  >
                    <strong>{member.name}</strong>
                    <p>{member.role}</p>
                    <span>{isSelected ? "Assigned" : "Available"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="stream-setup-panel">
            <div className="wheel-settings-header">
              <strong>Readiness Gate</strong>
              <p>Every go-live dependency is tracked from this page so operators know exactly what is still blocking launch.</p>
            </div>
            <div className="stream-checklist">
              {checklistItems.map((item) => (
                <button
                  className={`stream-check-item${checklistState[item.key] ? " is-complete" : ""}`}
                  key={item.key}
                  onClick={() => handleChecklistToggle(item.key)}
                  type="button"
                >
                  <strong>{item.label}</strong>
                  <span>{checklistState[item.key] ? "Complete" : "Pending"}</span>
                </button>
              ))}
            </div>
          </section>

          {sellerTrustProfile ? (
            <section className="stream-setup-panel">
              <div className="wheel-settings-header">
                <strong>Trust Readiness</strong>
                <p>Seller verification and payout safety checks now gate launch the same way camera and lot readiness do.</p>
              </div>
              <div className="card-grid-2">
                <div className="list-card">
                  <strong>{sellerTrustProfile.verificationStatus}</strong>
                  <p>{sellerTrustProfile.reviewNote}</p>
                </div>
                <div className="list-card">
                  <strong>{sellerTrustProfile.complianceScore} trust score</strong>
                  <p>
                    {sellerTrustProfile.payoutHold
                      ? "Payouts are on hold until trust review clears the account."
                      : "No payout hold is currently blocking the seller account."}
                  </p>
                </div>
                <div className="list-card">
                  <strong>ID check: {sellerTrustProfile.idVerified ? "Complete" : "Required"}</strong>
                  <p>Identity evidence must be on file before a new seller launch is approved.</p>
                </div>
                <div className="list-card">
                  <strong>Address check: {sellerTrustProfile.addressVerified ? "Complete" : "Required"}</strong>
                  <p>Warehouse and return routing must match the seller compliance profile.</p>
                </div>
              </div>
              <div className="wheel-action-buttons">
                <button className="button-secondary" onClick={handleSubmitTrustEvidence} type="button">
                  Submit Trust Evidence
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </article>

      <article className="page-card span-8 seller-side-panel">
        <span className="section-label">Go Live Panel</span>
        <h2>One seller page handles the final stream launch workflow.</h2>
        <p>
          This page now reads like a real seller backend surface: stream setup, wheel settings, lot sequencing, and
          launch-readiness all sit together instead of being scattered across public pages.
        </p>
        <div className="card-grid-4">
          {streamControlCards.map((card) => (
            <div className="list-card" key={card.title}>
              <strong>{card.title}</strong>
              <p>{card.detail}</p>
            </div>
          ))}
        </div>
        <div className="seller-feed-grid">
          {streamActivity.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
          <div className="list-card">
            <strong>Bid pulse</strong>
            <p>{sellerBidVelocityLabel}</p>
            <p>{streamMode === "Live" ? `${sellerBidLeader} currently leads this lot at ${sellerCurrentBid}.` : "Bid activity will populate here after launch."}</p>
          </div>
        </div>
      </article>

      <article className="page-card span-4 seller-side-panel">
        <span className="section-label">Launch Checklist</span>
        <h2>Seller page setup for the next live stream.</h2>
        <div className="stack">
          {checklistItems.map((item) => (
            <div className="list-card" key={item.key}>
              <strong>{item.label}</strong>
              <p>{checklistState[item.key] ? "Complete" : "Pending confirmation"}</p>
            </div>
          ))}
          {chatHighlights.map((item) => (
            <div className="list-card" key={`${item.user}-${item.message}`}>
              <strong>{item.user}</strong>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12 seller-side-panel">
        <span className="section-label">Live Bid Feed</span>
        <h2>The seller console now reflects the active buyer bidding state.</h2>
        <div className="card-grid-4">
          <div className="list-card">
            <strong>Current bid</strong>
            <p>{sellerCurrentBid}</p>
          </div>
          <div className="list-card">
            <strong>Bid leader</strong>
            <p>{sellerBidLeader}</p>
          </div>
          <div className="list-card">
            <strong>Minimum next bid</strong>
            <p>{sellerMinimumNextBid}</p>
          </div>
          <div className="list-card">
            <strong>Total bids</strong>
            <p>{sellerBidState?.totalBids ?? 0}</p>
          </div>
        </div>
        <div className="wheel-action-buttons">
          <button className="button-secondary" onClick={handleCloseActiveLot} type="button">
            Close Lot And Save Winner
          </button>
          <button className="button-secondary" onClick={handleAdvanceLot} type="button">
            Advance To Next Lot
          </button>
        </div>
        <p className="feedback">{sellerBidVelocityLabel}</p>
        <div className="card-grid-3">
          {sellerBidState && sellerBidState.recentBids.length > 0 ? (
            sellerBidState.recentBids.map((entry) => (
              <div className="list-card" key={entry.id}>
                <span className="card-kicker">{formatBidTime(entry.createdAt)}</span>
                <strong>{formatBidCurrency(entry.amount)}</strong>
                <p>
                  {entry.bidder} placed this bid on {activeLotTitle}.
                  {entry.bidderEmail ? ` ${entry.bidderEmail}` : ""}
                </p>
              </div>
            ))
          ) : (
            <div className="list-card">
              <strong>No bids on this lot yet</strong>
              <p>The first accepted buyer bid will appear here while the room is live.</p>
            </div>
          )}
        </div>
        <div className="card-grid-3">
          {sellerBidRecords.length > 0 ? (
            sellerBidRecords.slice(0, 6).map((record) => (
              <div className="list-card" key={record.id}>
                <span className="card-kicker">{formatBidTime(record.closedAt)}</span>
                <strong>{record.lotTitle}</strong>
                <p>
                  {record.status === "sold" && record.winningBid !== null
                    ? `${record.winnerName ?? "Unknown bidder"} won at ${formatBidCurrency(record.winningBid)}.`
                    : "Lot passed without a winning bid."}
                </p>
                <p>
                  {record.winnerEmail
                    ? `${record.winnerEmail}${record.winnerRole ? ` | ${record.winnerRole}` : ""}`
                    : "No bidder details on file"}
                </p>
                <p>{record.totalBids} bid{record.totalBids === 1 ? "" : "s"} captured for reconciliation.</p>
              </div>
            ))
          ) : (
            <div className="list-card">
              <strong>No closed lot records yet</strong>
              <p>Close a live lot to save the winning bid, bidder details, and full bid history.</p>
            </div>
          )}
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Launch Console</span>
        <h2>Seller page set up live stream now behaves like an actual launch workflow.</h2>
        <p>
          Schedule, readiness, and host controls are now connected so the seller can save setup, verify blockers, and
          move the room from rehearsal into live mode on one page.
        </p>
        <div className="launch-console-grid">
          <div className="list-card launch-console-stat">
            <strong>Status</strong>
            <p>{launchStatusLabel}</p>
            <p>{formatLaunchTime(scheduledAt)}</p>
          </div>
          <div className="list-card launch-console-stat">
            <strong>Checklist Progress</strong>
            <p>
              {completedChecklistCount} of {checklistItems.length} checks completed
            </p>
            <p>
              {launchReady
                ? "All blockers cleared for launch."
                : trustGateCleared
                  ? "Launch remains gated until every setup check is complete."
                  : "Launch remains gated until setup checks and trust review are both complete."}
            </p>
          </div>
          <div className="list-card launch-console-stat">
            <strong>Host Mode</strong>
            <p>{streamMode}</p>
            <p>{sellerNotes}</p>
          </div>
          <div className="list-card launch-console-stat">
            <strong>Studio Profile</strong>
            <p>{streamQuality}</p>
            <p>{latencyProfile} | {scenePreset}</p>
          </div>
        </div>
        <div className="wheel-action-bar launch-console-actions">
          <div className="list-card">
            <strong>Opening Script</strong>
            <p>{openingScript}</p>
          </div>
          <div className="list-card">
            <strong>Room Setup</strong>
            <p>{streamTitle}</p>
            <p>
              {streamCategory} | {coverTheme}
            </p>
            <p>
              {streamFormat} | {backstageCapacity} backstage seat{backstageCapacity === 1 ? "" : "s"}
            </p>
          </div>
          <div className="list-card">
            <strong>Coverage</strong>
            <p>{studioReadinessLabel}</p>
            <p>
              {activeModerators.length > 0
                ? activeModerators.map((member) => member.name).join(", ")
                : "No moderators assigned"}
            </p>
          </div>
          <div className="wheel-action-buttons">
            <button className="button-secondary" onClick={handleSaveStreamSetup} type="button">
              Save Stream Setup
            </button>
            <button className="button-primary" onClick={handleGoLive} type="button">
              Go Live
            </button>
          </div>
        </div>
        <p className={`feedback${launchReady || streamMode === "Live" ? "" : " is-error"}`}>{launchFeedback}</p>
      </article>

      <article className="page-card span-12 seller-side-panel">
        <span className="section-label">Run Of Show</span>
        <div className="card-grid-4">
          {streamRunOfShow.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Seller Product Category</span>
        <h2>Product categories now steer stream positioning and listing prep from the seller backend.</h2>
        <p>
          Sellers can align the show category with the actual lot mix, review routing guidance, and retag listings
          without leaving the protected dashboard.
        </p>
        <div className="card-grid-3 seller-listing-grid">
          {categoryPlaybooks.map((playbook) => {
            const isActive = playbook.category === selectedProductCategory;
            const listingCount = categoryCounts.find((item) => item.category === playbook.category)?.count ?? 0;

            return (
              <button
                className={`list-card seller-listing-card${isActive ? " is-active" : ""}`}
                key={playbook.category}
                onClick={() => setSelectedProductCategory(playbook.category)}
                type="button"
              >
                <span className="card-kicker">{playbook.routing}</span>
                <strong>{playbook.category}</strong>
                <p>{playbook.focus}</p>
                <div className="seller-listing-actions">
                  <span>{listingCount} queued listing{listingCount === 1 ? "" : "s"}</span>
                  <span>{playbook.guardrail}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="launch-console-grid seller-category-console">
          <div className="list-card launch-console-stat">
            <strong>Selected category</strong>
            <p>{selectedCategoryPlaybook.category}</p>
            <p>{selectedCategoryPlaybook.routing}</p>
          </div>
          <div className="list-card launch-console-stat">
            <strong>Stream alignment</strong>
            <p>{streamCategory === selectedProductCategory ? "Aligned to active show" : "Different from current show"}</p>
            <p>{activeCategoryCount} listing(s) match the current stream category.</p>
          </div>
          <div className="list-card launch-console-stat">
            <strong>Category guardrail</strong>
            <p>{selectedCategoryPlaybook.guardrail}</p>
          </div>
          <div className="wheel-action-buttons">
            <button className="button-secondary" onClick={() => handleStreamCategoryChange(selectedProductCategory)} type="button">
              Use For Stream
            </button>
          </div>
        </div>
      </article>

      <article className="page-card span-12 seller-control-surface">
        <span className="section-label">Bid Listing Queue</span>
        <h2>Products for live bidding sit on the same seller route as stream controls, wheel settings, and launch prep.</h2>
        <p>
          The seller backend keeps listing management adjacent to stream controls so operators can tune wheel behavior,
          check the stream, and reorder lots without dropping back into buyer-facing pages.
        </p>
        <div className="wheel-badge-row">
          {categoryCounts.map((item) => (
            <button
              className={`pill-label${selectedProductCategory === item.category ? " is-active" : ""}`}
              key={item.category}
              onClick={() => setSelectedProductCategory(item.category)}
              type="button"
            >
              {item.category} · {item.count}
            </button>
          ))}
          <button className="button-primary" onClick={handleStartNewListing} type="button">
            Add New Lot
          </button>
        </div>
        <div className="card-grid-3 seller-listing-grid">
          <button
            className={`list-card seller-listing-card seller-listing-create-card${isCreatingListing ? " is-active" : ""}`}
            onClick={handleStartNewListing}
            type="button"
          >
            <span className="card-kicker">Create product</span>
            <strong>Add a new lot without leaving the queue</strong>
            <p>Stage product copy, pricing, category, and photo notes directly inside the seller queue.</p>
            <div className="seller-listing-actions">
              <span>{selectedProductCategory} template ready</span>
              <span>{listingQueue.length} total queued</span>
              <span>{isCreatingListing ? "Draft is open below" : "Open new lot draft"}</span>
            </div>
          </button>
          {visibleListings.map((item) => (
            <div className="list-card seller-listing-card" key={item.id}>
              <span className="card-kicker">{item.state}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <label className="field">
                <span>Product category</span>
                <select
                  onChange={(event) => handleListingCategoryChange(item.id, event.target.value as ProductCategory)}
                  value={item.category}
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <div className="seller-listing-actions">
                <span>{item.format} · {item.priceLabel}</span>
                <span>{item.audience}</span>
                <span>{item.photoCount} photo{item.photoCount === 1 ? "" : "s"} ready</span>
                <button
                  className={`button-secondary${editingListingId === item.id ? " is-active" : ""}`}
                  onClick={() => handleEditListing(item.id)}
                  type="button"
                >
                  Edit Lot
                </button>
              </div>
            </div>
          ))}
        </div>
        {listingEditorVisible ? (
          <div className="seller-lot-editor">
            <div className="wheel-settings-header">
              <strong>{isCreatingListing ? "Add lot" : "Edit lot"}</strong>
              <p>
                {isCreatingListing
                  ? "Create a new lot with pricing, category, and photo staging without leaving the seller queue."
                  : "Update the product copy, pricing, category, and photo staging without leaving the seller queue."}
              </p>
            </div>
            <div className="seller-lot-editor-grid">
              <label className="field">
                <span>Lot title</span>
                <input
                  onChange={(event) => handleListingDraftChange("title", event.target.value)}
                  type="text"
                  value={listingDraft.title}
                />
              </label>
              <label className="field">
                <span>Lot state</span>
                <input
                  onChange={(event) => handleListingDraftChange("state", event.target.value)}
                  type="text"
                  value={listingDraft.state}
                />
              </label>
              <label className="field stream-field-full">
                <span>Lot details</span>
                <textarea
                  onChange={(event) => handleListingDraftChange("detail", event.target.value)}
                  value={listingDraft.detail}
                />
              </label>
              <label className="field">
                <span>Product category</span>
                <select
                  onChange={(event) => handleListingDraftChange("category", event.target.value as ProductCategory)}
                  value={listingDraft.category}
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Format</span>
                <select
                  onChange={(event) => handleListingDraftChange("format", event.target.value as SellerListing["format"])}
                  value={listingDraft.format}
                >
                  <option value="Auction">Auction</option>
                  <option value="Buy Now">Buy Now</option>
                </select>
              </label>
              <label className="field">
                <span>Price label</span>
                <input
                  onChange={(event) => handleListingDraftChange("priceLabel", event.target.value)}
                  type="text"
                  value={listingDraft.priceLabel}
                />
              </label>
              <label className="field">
                <span>Target audience</span>
                <input
                  onChange={(event) => handleListingDraftChange("audience", event.target.value)}
                  type="text"
                  value={listingDraft.audience}
                />
              </label>
              <label className="field">
                <span>Photo count</span>
                <input
                  max={24}
                  min={1}
                  onChange={(event) => handleListingDraftChange("photoCount", Number(event.target.value))}
                  type="number"
                  value={listingDraft.photoCount}
                />
              </label>
              <label className="field stream-field-full">
                <span>Photo notes</span>
                <textarea
                  onChange={(event) => handleListingDraftChange("photoNotes", event.target.value)}
                  value={listingDraft.photoNotes}
                />
              </label>
            </div>
            <div className="seller-lot-editor-footer">
              <div className="list-card seller-lot-photo-summary">
                <span className="card-kicker">Photo staging</span>
                <strong>{listingDraft.photoCount} product photo{listingDraft.photoCount === 1 ? "" : "s"} prepared</strong>
                <p>{listingDraft.photoNotes || "Add notes covering angles, closeups, or proof shots for the lot."}</p>
              </div>
              <div className="wheel-action-buttons">
                <button className="button-secondary" onClick={handleCancelListingEdits} type="button">
                  {isCreatingListing ? "Cancel New Lot" : "Reset Changes"}
                </button>
                <button className="button-primary" onClick={handleSaveListingEdits} type="button">
                  {isCreatingListing ? "Add Lot To Queue" : "Save Lot Changes"}
                </button>
              </div>
            </div>
            <p className="feedback">{listingFeedback}</p>
          </div>
        ) : null}
      </article>

      <article className="page-card span-4">
        <span className="section-label">Operator Profile</span>
        <div className="stack">
          <div className="list-card">
            <strong>Name</strong>
            <p>{session?.name}</p>
          </div>
          <div className="list-card">
            <strong>Email</strong>
            <p>{session?.email}</p>
          </div>
          <div className="list-card">
            <strong>Role</strong>
            <p>{session?.role}</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seller Backend Pages</span>
        <div className="card-grid-4">
          {backendPages.map((page) => (
            <div className="list-card" key={page.title}>
              <strong>{page.title}</strong>
              <p>{page.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Why This Page Exists</span>
        <div className="card-grid-3">
          {sellerBackendPanels.map((panel) => (
            <div className="list-card" key={panel.title}>
              <strong>{panel.title}</strong>
              <p>{panel.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seller Ownership</span>
        <div className="card-grid-3">
          {setupOwnership.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Route Guard Model</span>
        <div className="card-grid-3">
          {sellerRouteRules.map((rule) => (
            <div className="list-card" key={rule.title}>
              <strong>{rule.title}</strong>
              <p>{rule.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Cross-Area Navigation</span>
        <div className="card-grid-4">
          {sellerAreaLinks.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seller Backend Outcome</span>
        <div className="card-grid-3">
          {sellerOutcome.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seller Route Scope</span>
        <div className="card-grid-3">
          {sellerRouteScope.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
