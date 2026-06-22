import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
];
const initialListingQueue = [
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
];
const chatHighlights = [
    { user: "mod-rhea", message: "Opening claim script is pinned and payments reminder is loaded." },
    { user: "vip-jamie", message: "Watching for the first bracelet lot. Ready to bid as soon as countdown clears." },
    { user: "mod-jules", message: "Wheel approval stays on me for the first result lock." }
];
const launchQuickActions = [
    { label: "Run countdown", detail: "Push promo and move the room into waiting mode." },
    { label: "Pin current lot", detail: "Highlight the active lot overlay for shoppers." },
    { label: "Drop wheel", detail: "Switch from auction pace into the wheel moment." }
];
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
];
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
];
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
];
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
        title: "Admin",
        detail: "Admins can continue into marketplace controls from here.",
        to: "/admin"
    }
];
const setupOwnership = [
    { title: "Wheel settings", detail: "Seller-owned configuration before the stream opens." },
    { title: "Live stream setup", detail: "Seller-owned launch readiness, timing, and moderation prep." },
    { title: "Bid listings", detail: "Seller-owned lot queue and buy-now setup for live conversion." }
];
const sellerOutcome = [
    "One seller backend route now groups wheel settings, stream setup, and bid-ready listings.",
    "The seller page is protected from guest and buyer traffic.",
    "Navigation still makes the full app structure clear from inside the backend."
];
const sellerRouteScope = [
    "Wheel settings stay on the seller backend.",
    "Live stream setup stays on the seller backend.",
    "Bid listing preparation stays on the seller backend."
];
const wheelThemes = ["Luxury Gold Night", "Sunset Arcade", "Electric Mint"];
const entryModes = ["Verified Payment", "VIP Members", "Previous Buyers"];
const wheelPresets = [
    {
        id: "high-velocity",
        title: "High Velocity",
        detail: "Fast wheel rounds for rapid-fire streams with low cooldown and replay disabled.",
        theme: "Electric Mint",
        spinDuration: 18,
        entryMinimum: 10,
        bonusSlots: 3,
        pinnedPrizeCount: 1,
        cooldownMinutes: 2,
        entryMode: "Verified Payment",
        winnerAnnouncement: "Chat pin plus auto invoice banner"
    },
    {
        id: "vip-hype",
        title: "VIP Hype",
        detail: "A premium round for members with slower pacing and more featured prize wedges.",
        theme: "Luxury Gold Night",
        spinDuration: 36,
        entryMinimum: 40,
        bonusSlots: 2,
        pinnedPrizeCount: 3,
        cooldownMinutes: 8,
        entryMode: "VIP Members",
        winnerAnnouncement: "VIP banner callout on stream overlay"
    },
    {
        id: "buyer-recovery",
        title: "Buyer Recovery",
        detail: "Rewards returning buyers and adds more mystery energy between auction lots.",
        theme: "Sunset Arcade",
        spinDuration: 24,
        entryMinimum: 20,
        bonusSlots: 4,
        pinnedPrizeCount: 2,
        cooldownMinutes: 4,
        entryMode: "Previous Buyers",
        winnerAnnouncement: "Camera lower-third with bundle upsell prompt"
    }
];
const streamFormats = ["Auction + Wheel", "Flash Sale", "Single Collection Drop"];
const latencyProfiles = ["Ultra Low", "Balanced", "Quality First"];
const streamQualities = ["1080p / 30fps", "1080p / 60fps", "4K Showcase"];
const scenePresets = ["Gold Drop Countdown", "Split Lot Cam", "Full Screen Product"];
const categoryPlaybooks = [
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
];
const studioDevices = [
    { key: "cameraReady", label: "Primary camera", detail: "Main overhead and host shot are both framed." },
    { key: "backupMicReady", label: "Backup mic", detail: "Secondary audio path is armed if the host mic drops." },
    { key: "networkReady", label: "Upload bandwidth", detail: "Connection can hold stable video during bidding spikes." },
    { key: "lightingReady", label: "Lighting scene", detail: "Product table and host lighting match the cover theme." }
];
const initialWedges = [
    { id: 1, label: "Mystery Pack", kind: "Mystery", color: "#f3c96b", linkedListingId: null },
    { id: 2, label: "10% Credit", kind: "Bonus", color: "#d78d2f", linkedListingId: null },
    { id: 3, label: "Vintage Bracelet", kind: "Prize", color: "#b66a1d", linkedListingId: 1 },
    { id: 4, label: "Free Shipping", kind: "Bonus", color: "#8a4e16", linkedListingId: null },
    { id: 5, label: "Designer Wallet", kind: "Prize", color: "#6b390e", linkedListingId: 2 },
    { id: 6, label: "Mystery Vault", kind: "Mystery", color: "#f0b85a", linkedListingId: null }
];
const wedgeColorCycle = ["#f3c96b", "#d78d2f", "#b66a1d", "#8a4e16", "#6b390e", "#f0b85a"];
function formatSpinDuration(duration) {
    return `${duration} sec`;
}
function formatLaunchTime(value) {
    if (!value) {
        return "Not scheduled";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Not scheduled";
    }
    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}
function describeCameraError(error) {
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
function buildWheelGradient(wedges) {
    if (wedges.length === 0) {
        return "conic-gradient(from -90deg, #d6b066 0deg 360deg)";
    }
    const sliceAngle = 360 / wedges.length;
    return `conic-gradient(from -90deg, ${wedges
        .map((wedge, index) => `${wedge.color} ${index * sliceAngle}deg ${(index + 1) * sliceAngle}deg`)
        .join(", ")})`;
}
function createListingDraft(listing) {
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
function createEmptyListingDraft(category) {
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
function compactListingLabel(title) {
    return title.replace(/^(Lot\s*\d+\s*-\s*|Buy Now\s*-\s*)/i, "").trim() || "Linked Listing";
}
export default function SellerDashboard({ session }) {
    const streamWindowVideoRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewStreamRef = useRef(null);
    const [theme, setTheme] = useState("Luxury Gold Night");
    const [spinDuration, setSpinDuration] = useState(30);
    const [entryMinimum, setEntryMinimum] = useState(25);
    const [bonusSlots, setBonusSlots] = useState(4);
    const [pinnedPrizeCount, setPinnedPrizeCount] = useState(2);
    const [cooldownMinutes, setCooldownMinutes] = useState(6);
    const [winnerAnnouncement, setWinnerAnnouncement] = useState("Studio camera lower-third plus chat pin");
    const [entryMode, setEntryMode] = useState("Verified Payment");
    const [autoQueueWinner, setAutoQueueWinner] = useState(true);
    const [modApprovalRequired, setModApprovalRequired] = useState(true);
    const [replaySpinEnabled, setReplaySpinEnabled] = useState(false);
    const [wedgeDrafts, setWedgeDrafts] = useState(initialWedges);
    const [activePresetId, setActivePresetId] = useState("vip-hype");
    const [lastAppliedAt, setLastAppliedAt] = useState("Not applied yet");
    const [streamTitle, setStreamTitle] = useState("Luxury Accessories Sunday Live");
    const [streamCategory, setStreamCategory] = useState("Luxury");
    const [selectedProductCategory, setSelectedProductCategory] = useState("Luxury");
    const [coverTheme, setCoverTheme] = useState("Gold Drop Countdown");
    const [scheduledAt, setScheduledAt] = useState("2026-04-26T19:30");
    const [openingScript, setOpeningScript] = useState("Welcome back to LoopLot. We are opening with a fast wheel drop, then moving straight into pinned luxury lots.");
    const [streamFormat, setStreamFormat] = useState("Auction + Wheel");
    const [latencyProfile, setLatencyProfile] = useState("Ultra Low");
    const [streamQuality, setStreamQuality] = useState("1080p / 60fps");
    const [scenePreset, setScenePreset] = useState("Split Lot Cam");
    const [backstageCapacity, setBackstageCapacity] = useState(3);
    const [countdownMinutes, setCountdownMinutes] = useState(10);
    const [promoLeadMinutes, setPromoLeadMinutes] = useState(30);
    const [chatMode, setChatMode] = useState("Followers only for countdown");
    const [sellerNotes, setSellerNotes] = useState("Moderator pins payout reminder before Lot 01.");
    const [selectedModeratorIds, setSelectedModeratorIds] = useState(["mod-rhea", "mod-jules"]);
    const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
    const [simulcastEnabled, setSimulcastEnabled] = useState(false);
    const [overlayEnabled, setOverlayEnabled] = useState(true);
    const [backupRecordingEnabled, setBackupRecordingEnabled] = useState(true);
    const [streamMode, setStreamMode] = useState("Rehearsal");
    const [launchFeedback, setLaunchFeedback] = useState("Countdown is staged. Finish readiness checks to unlock go-live.");
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [cameraPreviewActive, setCameraPreviewActive] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraMirrorEnabled, setCameraMirrorEnabled] = useState(true);
    const [cameraStatus, setCameraStatus] = useState("Preview is offline. Start a test stream to validate the webcam.");
    const [listingQueue, setListingQueue] = useState(initialListingQueue);
    const [editingListingId, setEditingListingId] = useState(initialListingQueue[0]?.id ?? null);
    const [listingDraft, setListingDraft] = useState(() => initialListingQueue[0] ? createListingDraft(initialListingQueue[0]) : createEmptyListingDraft("Luxury"));
    const [listingFeedback, setListingFeedback] = useState("Select a lot to update details, pricing, category, and photos.");
    const [activeLotIndex, setActiveLotIndex] = useState(0);
    const [spotlightPinned, setSpotlightPinned] = useState(true);
    const [chatAlertMuted, setChatAlertMuted] = useState(false);
    const [wheelOverlayVisible, setWheelOverlayVisible] = useState(true);
    const [manualWheelTargetId, setManualWheelTargetId] = useState(initialWedges[0]?.id ?? 1);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [wheelSpinState, setWheelSpinState] = useState("idle");
    const [lockedWheelResultId, setLockedWheelResultId] = useState(null);
    const [checklistState, setChecklistState] = useState({
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
        async function loadDevices() {
            if (!navigator.mediaDevices?.enumerateDevices) {
                return;
            }
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter((device) => device.kind === "videoinput");
                setAvailableCameras(cameras);
                setSelectedCameraId((current) => current || cameras[0]?.deviceId || "");
            }
            catch {
                setAvailableCameras([]);
            }
        }
        void loadDevices();
    }, []);
    useEffect(() => {
        [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
            if (videoElement) {
                videoElement.srcObject = previewStreamRef.current;
            }
        });
        return () => {
            previewStreamRef.current?.getTracks().forEach((track) => track.stop());
            previewStreamRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (!wedgeDrafts.some((wedge) => wedge.id === manualWheelTargetId)) {
            setManualWheelTargetId(wedgeDrafts[0]?.id ?? 1);
        }
    }, [manualWheelTargetId, wedgeDrafts]);
    function handleWedgeChange(id, field, value) {
        setWedgeDrafts((current) => current.map((wedge) => (wedge.id === id ? { ...wedge, [field]: value } : wedge)));
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
    function handleRemoveWedge(id) {
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
    function handleWedgeListingChange(wedgeId, nextListingId) {
        const nextListing = nextListingId === null ? null : listingQueue.find((listing) => listing.id === nextListingId) ?? null;
        setWedgeDrafts((current) => current.map((wedge) => wedge.id === wedgeId
            ? {
                ...wedge,
                linkedListingId: nextListing?.id ?? null,
                label: nextListing ? compactListingLabel(nextListing.title) : wedge.label
            }
            : wedge));
    }
    function handleNumberInput(setter, minimum, maximum) {
        return (event) => {
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
    const fairnessState = pinnedPrizeGap <= 0 && bonusGap <= 0
        ? "Balanced for moderation review"
        : "Needs wedge alignment before the round is locked";
    function applyPreset(presetId) {
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
        setLastAppliedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
    function handleResetLayout() {
        setWedgeDrafts(initialWedges);
        applyPreset(activePresetId);
        setReplaySpinEnabled(false);
        setAutoQueueWinner(true);
        setModApprovalRequired(true);
        setLastAppliedAt("Reset to preset defaults");
    }
    function handleChecklistToggle(key) {
        setChecklistState((current) => ({ ...current, [key]: !current[key] }));
    }
    function handleModeratorToggle(moderatorId) {
        setSelectedModeratorIds((current) => current.includes(moderatorId) ? current.filter((id) => id !== moderatorId) : [...current, moderatorId]);
    }
    function handleStreamCategoryChange(category) {
        setStreamCategory(category);
        setSelectedProductCategory(category);
        setChecklistState((current) => ({ ...current, titleReady: true }));
    }
    function handleListingCategoryChange(listingId, category) {
        setListingQueue((current) => current.map((listing) => (listing.id === listingId ? { ...listing, category } : listing)));
        setSelectedProductCategory(category);
    }
    function handleEditListing(listingId) {
        const listing = listingQueue.find((item) => item.id === listingId);
        if (!listing) {
            return;
        }
        setEditingListingId(listingId);
        setListingDraft(createListingDraft(listing));
        setSelectedProductCategory(listing.category);
        setListingFeedback(`Editing ${listing.title}. Update lot details and save when ready.`);
    }
    function handleListingDraftChange(field, value) {
        setListingDraft((current) => ({ ...current, [field]: value }));
    }
    function handleSaveListingEdits() {
        if (editingListingId === null) {
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
        setListingQueue((current) => current.map((listing) => listing.id === editingListingId
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
            : listing));
        setSelectedProductCategory(listingDraft.category);
        setListingDraft((current) => ({ ...current, photoCount: nextPhotoCount, photoNotes: trimmedPhotoNotes }));
        setListingFeedback(`Saved changes to ${trimmedTitle}. ${nextPhotoCount} product photo${nextPhotoCount === 1 ? "" : "s"} staged for this lot.`);
    }
    function handleCancelListingEdits() {
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
        if (!navigator.mediaDevices?.enumerateDevices) {
            return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        setAvailableCameras(cameras);
        setSelectedCameraId((current) => current || cameras[0]?.deviceId || "");
    }
    async function handleStartCameraPreview() {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus("This browser does not support webcam testing.");
            return;
        }
        setCameraLoading(true);
        setCameraStatus("Starting webcam preview...");
        try {
            previewStreamRef.current?.getTracks().forEach((track) => track.stop());
            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
                audio: false
            });
            previewStreamRef.current = stream;
            [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
                if (videoElement) {
                    videoElement.srcObject = stream;
                }
            });
            setCameraPreviewActive(true);
            setChecklistState((current) => ({ ...current, cameraReady: true }));
            setCameraStatus("Webcam is live in preview. Framing is ready for a test stream.");
            await refreshCameraList();
        }
        catch (error) {
            setCameraPreviewActive(false);
            setChecklistState((current) => ({ ...current, cameraReady: false }));
            setCameraStatus(describeCameraError(error));
        }
        finally {
            setCameraLoading(false);
        }
    }
    function handleStopCameraPreview() {
        previewStreamRef.current?.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
        [streamWindowVideoRef.current, previewVideoRef.current].forEach((videoElement) => {
            if (videoElement) {
                videoElement.srcObject = null;
            }
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
    ];
    const completedChecklistCount = checklistItems.filter((item) => checklistState[item.key]).length;
    const launchReady = checklistItems.every((item) => checklistState[item.key]);
    const launchStatusLabel = streamMode === "Live" ? "Live now" : launchReady ? "Ready to launch" : "Needs setup";
    const activeModerators = moderationTeam.filter((member) => selectedModeratorIds.includes(member.id));
    const activeLot = listingQueue[activeLotIndex] ?? listingQueue[0] ?? null;
    const activeWheelTarget = wedgeDrafts.find((wedge) => wedge.id === manualWheelTargetId) ?? wedgeDrafts[0];
    const lockedWheelResult = wedgeDrafts.find((wedge) => wedge.id === lockedWheelResultId) ?? null;
    const activeWheelListing = activeWheelTarget?.linkedListingId !== null
        ? listingQueue.find((listing) => listing.id === activeWheelTarget.linkedListingId) ?? null
        : null;
    const lockedWheelListing = lockedWheelResult?.linkedListingId !== null
        ? listingQueue.find((listing) => listing.id === lockedWheelResult.linkedListingId) ?? null
        : null;
    const selectedCategoryPlaybook = categoryPlaybooks.find((playbook) => playbook.category === selectedProductCategory) ?? categoryPlaybooks[0];
    const categoryCounts = productCategories.map((category) => ({
        category,
        count: listingQueue.filter((listing) => listing.category === category).length
    }));
    const filteredListings = listingQueue.filter((listing) => listing.category === selectedProductCategory);
    const readyStudioDevices = studioDevices.filter((device) => checklistState[device.key]).length;
    const studioReadinessLabel = readyStudioDevices === studioDevices.length ? "Studio checks cleared" : `${readyStudioDevices}/${studioDevices.length} studio checks cleared`;
    const countdownStatus = streamMode === "Live"
        ? "Stream is live"
        : `${countdownMinutes} minute countdown with promo push ${promoLeadMinutes} minutes before launch`;
    const visualSpinDuration = Math.min(8, Math.max(4, Math.round(spinDuration / 4)));
    const wheelGradient = buildWheelGradient(wedgeDrafts);
    const wheelSegmentAngle = wedgeDrafts.length > 0 ? 360 / wedgeDrafts.length : 360;
    const wheelStatusLabel = wheelSpinState === "spinning"
        ? `Wheel spinning to ${activeWheelTarget?.label ?? "next result"}`
        : lockedWheelResult
            ? `Locked result: ${lockedWheelResult.label}${lockedWheelListing ? ` linked to ${lockedWheelListing.title}` : ""}`
            : "Wheel ready for the next manual spin";
    const activeCategoryCount = listingQueue.filter((listing) => listing.category === streamCategory).length;
    const visibleListings = filteredListings.length > 0 ? filteredListings : listingQueue;
    const editingListing = listingQueue.find((listing) => listing.id === editingListingId) ?? null;
    const activeLotTitle = activeLot?.title ?? "No active lot selected";
    const activeLotState = activeLot?.state ?? "Queue a lot to show stream spotlight details.";
    const activeLotDetail = activeLot?.detail ?? "Add a listing to populate the active lot panel.";
    const activeLotPhotoCount = activeLot?.photoCount ?? 0;
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
            title: "Broadcast Profile",
            detail: `${streamQuality} in ${latencyProfile.toLowerCase()} mode with ${scenePreset} loaded for ${streamFormat.toLowerCase()}.`
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
        }
    ];
    const estimatedViewerCount = streamMode === "Live" ? 1842 : streamMode === "Ready" ? 612 : 184;
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
        setLaunchFeedback(spotlightPinned
            ? "Current lot spotlight removed from the stream overlay."
            : `${activeLot?.title ?? "The active lot"} is now pinned in the seller stream window.`);
    }
    function handleSaveStreamSetup() {
        setStreamMode(launchReady ? "Ready" : "Rehearsal");
        setLaunchFeedback(launchReady
            ? `Setup saved. ${streamTitle} is ready for launch at ${formatLaunchTime(scheduledAt)}.`
            : `Setup saved. ${checklistItems.length - completedChecklistCount} launch check(s) still need attention before go-live.`);
    }
    function handleGoLive() {
        if (!launchReady) {
            setLaunchFeedback("Go-live is locked until every launch checklist item is confirmed.");
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
    return (_jsxs("section", { className: "page-grid seller-page-grid", children: [_jsxs("article", { className: "showcase-card span-8 seller-command-card", children: [_jsx("span", { className: "section-label", children: "Seller Backend" }), _jsx("h2", { children: "A dedicated control panel for running the show before buyers ever hit the live floor." }), _jsx("p", { children: session
                            ? `${session.name} is authenticated as ${session.role}. Seller operations stay separated from the storefront while remaining easy to reach through shared navigation.`
                            : "Seller tools require seller or admin access." }), _jsxs("div", { className: "seller-command-strip", children: [_jsxs("div", { className: "seller-command-item", children: [_jsx("span", { children: "Show status" }), _jsx("strong", { children: launchStatusLabel }), _jsx("p", { children: formatLaunchTime(scheduledAt) })] }), _jsxs("div", { className: "seller-command-item", children: [_jsx("span", { children: "Live format" }), _jsx("strong", { children: streamFormat }), _jsx("p", { children: scenePreset })] }), _jsxs("div", { className: "seller-command-item", children: [_jsx("span", { children: "Moderator coverage" }), _jsxs("strong", { children: [activeModerators.length, " assigned"] }), _jsx("p", { children: studioReadinessLabel })] })] }), _jsx("div", { className: "metric-grid", children: sellerMetrics.map((item) => (_jsxs("div", { className: "metric-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) })] }), _jsxs("article", { className: "page-card span-4 wheel-preview-card seller-side-panel", children: [_jsx("span", { className: "section-label", children: "Wheel Summary" }), _jsx("h2", { children: "Current round rules" }), _jsxs("div", { className: "stack", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: theme }), _jsxs("p", { children: [formatSpinDuration(spinDuration), " spin with ", bonusSlots, " bonus wedges and ", pinnedPrizeCount, " pinned prizes."] })] }), _jsxs("div", { className: "wheel-badge-row", children: [_jsx("span", { className: "pill-label", children: entryMode }), _jsxs("span", { className: "pill-label", children: ["$", entryMinimum, " entry"] }), _jsxs("span", { className: "pill-label", children: [cooldownMinutes, " min cooldown"] })] }), _jsx("div", { className: "wheel-mini-preview", "aria-label": "Wheel preview", children: wedgeDrafts.map((wedge) => (_jsxs("div", { className: "wheel-mini-slice", style: { background: `linear-gradient(135deg, ${wedge.color}, rgba(255,255,255,0.96))` }, children: [_jsx("span", { children: wedge.label }), _jsx("strong", { children: wedge.kind }), _jsx("p", { children: wedge.linkedListingId !== null
                                                ? listingQueue.find((listing) => listing.id === wedge.linkedListingId)?.title ?? "Linked listing"
                                                : "No linked listing" })] }, wedge.id))) })] })] }), _jsxs("article", { className: "page-card span-8 seller-control-surface seller-stream-window", children: [_jsx("span", { className: "section-label", children: "Stream Window" }), _jsx("h2", { children: "The seller now has an actual on-air window instead of only preflight forms." }), _jsx("p", { children: "Preview, active lot, viewer pulse, and quick host actions stay in one focused stream surface so the seller can operate the show while staying inside the dashboard." }), _jsxs("div", { className: "seller-stream-stage", children: [_jsxs("div", { className: `camera-preview-frame seller-stream-frame${streamMode === "Live" ? " is-live" : ""}`, children: [_jsx("video", { autoPlay: true, className: `camera-preview-video${cameraMirrorEnabled ? " is-mirrored" : ""}`, muted: true, playsInline: true, ref: streamWindowVideoRef }), !cameraPreviewActive ? (_jsxs("div", { className: "camera-preview-empty", children: [_jsx("strong", { children: streamMode === "Live" ? "Live room awaiting camera feed" : "Seller preview offline" }), _jsx("p", { children: "Start the webcam preview to validate framing, overlay placement, and lot transitions before buyers join." })] })) : null, overlayEnabled && wheelOverlayVisible ? (_jsxs("div", { className: "seller-wheel-overlay", "aria-live": "polite", children: [_jsxs("div", { className: "seller-wheel-shell", children: [_jsx("div", { className: "seller-wheel-pointer" }), _jsx("div", { className: `seller-wheel${wheelSpinState === "spinning" ? " is-spinning" : ""}`, style: {
                                                            background: wheelGradient,
                                                            transform: `rotate(${wheelRotation}deg)`,
                                                            transitionDuration: `${visualSpinDuration}s`
                                                        }, children: wedgeDrafts.map((wedge, index) => {
                                                            const angle = index * wheelSegmentAngle + wheelSegmentAngle / 2;
                                                            const linkedListing = wedge.linkedListingId !== null
                                                                ? listingQueue.find((listing) => listing.id === wedge.linkedListingId) ?? null
                                                                : null;
                                                            return (_jsx("div", { className: "seller-wheel-label", style: { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-34%)` }, children: _jsxs("span", { style: { transform: `rotate(${-angle}deg)` }, children: [_jsx("strong", { children: wedge.label }), linkedListing ? _jsx("em", { children: linkedListing.format }) : null] }) }, wedge.id));
                                                        }) })] }), _jsxs("div", { className: "seller-wheel-readout", children: [_jsx("span", { children: wheelSpinState === "spinning" ? "Wheel in motion" : "Wheel overlay" }), _jsx("strong", { children: lockedWheelResult?.label ?? activeWheelTarget?.label ?? "No wedge selected" }), _jsx("p", { className: "seller-wheel-readout-detail", children: lockedWheelListing?.title ?? activeWheelListing?.title ?? "Assign a listing to a wedge to feature a product on the wheel." }), _jsx("p", { children: wheelStatusLabel })] })] })) : null, _jsxs("div", { className: "seller-stream-overlay", children: [_jsxs("div", { className: "seller-stream-pill-row", children: [_jsx("span", { className: "pill-label", children: streamMode }), _jsxs("span", { className: "pill-label", children: [estimatedViewerCount.toLocaleString(), " watching"] }), _jsx("span", { className: "pill-label", children: overlayEnabled ? "Overlay on" : "Overlay off" })] }), _jsxs("div", { className: "seller-stream-lower-third", children: [_jsx("span", { children: spotlightPinned ? "Pinned lot" : "Next up" }), _jsx("strong", { children: activeLotTitle }), _jsx("p", { children: activeLotState })] })] })] }), _jsxs("div", { className: "seller-stream-console", children: [_jsxs("div", { className: "seller-stream-card", children: [_jsx("span", { children: "Active lot" }), _jsx("strong", { children: activeLotTitle }), _jsx("p", { children: activeLotDetail }), _jsxs("p", { children: [activeLotPhotoCount, " product photo", activeLotPhotoCount === 1 ? "" : "s", " staged"] })] }), _jsxs("div", { className: "seller-stream-card", children: [_jsx("span", { children: "Room pacing" }), _jsx("strong", { children: streamFormat }), _jsx("p", { children: countdownStatus })] }), _jsxs("div", { className: "seller-stream-card", children: [_jsx("span", { children: "Coverage" }), _jsxs("strong", { children: [activeModerators.length, " moderators live"] }), _jsx("p", { children: activeModerators.map((member) => member.name).join(", ") || "No moderators assigned" })] }), _jsxs("div", { className: "seller-stream-card", children: [_jsx("span", { children: "Wheel control" }), _jsx("strong", { children: lockedWheelResult?.label ?? activeWheelTarget?.label ?? "Manual target not set" }), _jsx("p", { children: lockedWheelListing?.title ?? activeWheelListing?.title ?? wheelStatusLabel })] }), _jsxs("div", { className: "seller-stream-actions", children: [_jsx("button", { className: "button-primary", onClick: () => void handleStartCameraPreview(), type: "button", children: cameraPreviewActive ? "Refresh Camera" : "Open Camera" }), _jsx("button", { className: "button-secondary", onClick: handlePinSpotlight, type: "button", children: spotlightPinned ? "Unpin Spotlight" : "Pin Spotlight" }), _jsx("button", { className: "button-secondary", onClick: handleAdvanceLot, type: "button", children: "Advance Lot" }), _jsx("button", { className: "button-secondary", onClick: () => setChatAlertMuted((value) => !value), type: "button", children: chatAlertMuted ? "Unmute Chat Alerts" : "Mute Chat Alerts" }), _jsx("button", { className: "button-secondary", disabled: wheelSpinState === "spinning", onClick: handleSpinWheel, type: "button", children: wheelSpinState === "spinning" ? "Wheel Spinning" : "Spin Wheel" }), _jsx("button", { className: "button-secondary", onClick: handleStopStream, type: "button", children: "Stop Stream" })] })] })] })] }), _jsxs("article", { className: "page-card span-4 seller-side-panel seller-stream-sidebar", children: [_jsx("span", { className: "section-label", children: "Control Feed" }), _jsx("h2", { children: "What the seller needs while on camera." }), _jsxs("div", { className: "stack", children: [launchQuickActions.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.label }), _jsx("p", { children: item.detail })] }, item.label))), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Wheel manual control" }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Target wedge" }), _jsx("select", { onChange: (event) => setManualWheelTargetId(Number(event.target.value)), value: manualWheelTargetId, children: wedgeDrafts.map((wedge) => (_jsxs("option", { value: wedge.id, children: [wedge.label, " - ", wedge.kind] }, wedge.id))) })] }), _jsxs("div", { className: "seller-wheel-manual-actions", children: [_jsx("button", { className: "button-primary", disabled: wheelSpinState === "spinning", onClick: handleSpinWheel, type: "button", children: "Trigger Spin" }), _jsx("button", { className: "button-secondary", onClick: () => setWheelOverlayVisible((value) => !value), type: "button", children: wheelOverlayVisible ? "Hide Wheel" : "Show Wheel" }), _jsx("button", { className: "button-secondary", onClick: handleClearWheelResult, type: "button", children: "Clear Result" })] }), _jsx("p", { children: lockedWheelResult
                                            ? `Current winner: ${lockedWheelResult.label}${lockedWheelListing ? ` for ${lockedWheelListing.title}` : ""}`
                                            : "No wheel result locked yet." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Chat alerts" }), _jsx("p", { children: chatAlertMuted ? "Muted for host focus." : "Live for moderator and claim pings." })] })] })] }), _jsxs("article", { className: "page-card span-12 seller-control-surface", children: [_jsx("span", { className: "section-label", children: "Wheel Settings" }), _jsx("h2", { children: "Seller page wheel settings now behave like a real control surface." }), _jsx("p", { children: "Adjust pacing, bidder eligibility, prize weighting, and moderation gates from one seller-only page before the stream starts." }), _jsxs("div", { className: "wheel-settings-grid", children: [_jsxs("section", { className: "wheel-settings-panel wheel-settings-panel-full", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Preset Control" }), _jsx("p", { children: "Load a round profile, review fairness checks, and apply the wheel configuration before going live." })] }), _jsx("div", { className: "wheel-preset-grid", children: wheelPresets.map((preset) => (_jsxs("button", { className: `wheel-preset-card${activePresetId === preset.id ? " is-active" : ""}`, onClick: () => applyPreset(preset.id), type: "button", children: [_jsx("span", { className: "pill-label", children: preset.title }), _jsx("strong", { children: preset.theme }), _jsx("p", { children: preset.detail }), _jsxs("p", { children: [formatSpinDuration(preset.spinDuration), " | $", preset.entryMinimum, " entry | ", preset.cooldownMinutes, " min cooldown"] })] }, preset.id))) }), _jsxs("div", { className: "wheel-action-bar", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Fairness status" }), _jsx("p", { children: fairnessState }), _jsxs("p", { children: [totalWedges, " wedges total with ", prizeCount, " prize, ", mysteryCount, " mystery, and ", bonusCount, " bonus wedges configured."] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Apply state" }), _jsxs("p", { children: ["Last seller apply: ", lastAppliedAt] }), _jsxs("p", { children: ["Preset: ", wheelPresets.find((preset) => preset.id === activePresetId)?.title] })] }), _jsxs("div", { className: "wheel-action-buttons", children: [_jsx("button", { className: "button-secondary", onClick: handleAddWedge, type: "button", children: "Add Wedge" }), _jsx("button", { className: "button-primary", onClick: handleApplySettings, type: "button", children: "Apply Wheel Settings" }), _jsx("button", { className: "button-secondary", onClick: handleResetLayout, type: "button", children: "Reset To Preset" })] })] })] }), _jsxs("section", { className: "wheel-settings-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Round Profile" }), _jsx("p", { children: "Lock the wheel theme, spin pacing, and announcement style for the next live segment." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Wheel theme" }), _jsx("select", { value: theme, onChange: (event) => setTheme(event.target.value), children: wheelThemes.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { children: ["Spin duration: ", formatSpinDuration(spinDuration)] }), _jsx("input", { max: 60, min: 10, onChange: handleNumberInput(setSpinDuration, 10, 60), type: "range", value: spinDuration })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Winner announcement" }), _jsx("input", { onChange: (event) => setWinnerAnnouncement(event.target.value), type: "text", value: winnerAnnouncement })] }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Replay Spin" }), _jsx("p", { children: replaySpinEnabled ? "Manual replay is allowed for test rounds." : "Replay is disabled for live fairness." }), _jsx("button", { className: "button-secondary", onClick: () => setReplaySpinEnabled((value) => !value), type: "button", children: replaySpinEnabled ? "Disable Replay" : "Enable Replay" })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Winner Queue" }), _jsx("p", { children: autoQueueWinner ? "Winners are added to the next invoice queue automatically." : "Operator must queue winners manually." }), _jsx("button", { className: "button-secondary", onClick: () => setAutoQueueWinner((value) => !value), type: "button", children: autoQueueWinner ? "Turn Off Auto Queue" : "Turn On Auto Queue" })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Moderator Gate" }), _jsx("p", { children: modApprovalRequired ? "Moderator confirmation is required before the result locks." : "Host can confirm outcomes without moderator approval." }), _jsx("button", { className: "button-secondary", onClick: () => setModApprovalRequired((value) => !value), type: "button", children: modApprovalRequired ? "Remove Approval Gate" : "Require Approval" })] })] })] }), _jsxs("section", { className: "wheel-settings-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Eligibility Rules" }), _jsx("p", { children: "Control who can enter the wheel and how quickly repeated wins are throttled." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Entry mode" }), _jsx("select", { value: entryMode, onChange: (event) => setEntryMode(event.target.value), children: entryModes.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Minimum spend to enter" }), _jsx("input", { max: 250, min: 0, onChange: handleNumberInput(setEntryMinimum, 0, 250), type: "number", value: entryMinimum })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Winner cooldown after each spin" }), _jsx("input", { max: 30, min: 0, onChange: handleNumberInput(setCooldownMinutes, 0, 30), type: "number", value: cooldownMinutes })] }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Payments" }), _jsx("p", { children: "Entry requires verified checkout status before a bidder is eligible to spin." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Cooldown" }), _jsx("p", { children: cooldownMinutes === 0 ? "Repeat winners can spin again immediately." : `Repeat winners wait ${cooldownMinutes} minutes before re-entry.` })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Announcement" }), _jsx("p", { children: winnerAnnouncement })] })] })] }), _jsxs("section", { className: "wheel-settings-panel wheel-settings-panel-full", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Wedge Layout" }), _jsx("p", { children: "Shape the round with pinned prize wedges, mystery slots, controlled bonus surfaces, and direct product links." })] }), _jsxs("div", { className: "card-grid-3 wheel-stat-grid", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Bonus wedges" }), _jsxs("p", { children: [bonusCount, " configured in the current layout."] }), _jsx("input", { max: 8, min: 0, onChange: handleNumberInput(setBonusSlots, 0, 8), type: "number", value: bonusSlots })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Pinned prize wedges" }), _jsx("p", { children: pinnedPrizeGap > 0
                                                            ? `${pinnedPrizeGap} more prize wedge${pinnedPrizeGap === 1 ? "" : "s"} needed to match the pinned target.`
                                                            : `${pinnedPrizeCount} pinned prize wedges are covered by the current layout.` }), _jsx("input", { max: 6, min: 0, onChange: handleNumberInput(setPinnedPrizeCount, 0, 6), type: "number", value: pinnedPrizeCount })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Fairness note" }), _jsx("p", { children: bonusGap > 0
                                                            ? `Add ${bonusGap} more bonus wedge${bonusGap === 1 ? "" : "s"} if this round must reach the configured bonus target.`
                                                            : "Controlled wedges stay fixed so moderators can audit the spin order during the stream." })] })] }), _jsx("div", { className: "wheel-editor-grid", children: wedgeDrafts.map((wedge) => (_jsxs("div", { className: "wheel-editor-card", children: [_jsxs("div", { className: "wheel-editor-top", children: [_jsxs("strong", { children: ["Wedge ", wedge.id] }), _jsxs("div", { className: "wheel-editor-top-actions", children: [_jsx("span", { className: "wheel-swatch", style: { backgroundColor: wedge.color } }), _jsx("button", { className: "button-secondary wheel-editor-remove", onClick: () => handleRemoveWedge(wedge.id), type: "button", children: "Remove" })] })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Label" }), _jsx("input", { onChange: (event) => handleWedgeChange(wedge.id, "label", event.target.value), type: "text", value: wedge.label })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Type" }), _jsxs("select", { onChange: (event) => handleWedgeChange(wedge.id, "kind", event.target.value), value: wedge.kind, children: [_jsx("option", { value: "Prize", children: "Prize" }), _jsx("option", { value: "Mystery", children: "Mystery" }), _jsx("option", { value: "Bonus", children: "Bonus" })] })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Color" }), _jsx("input", { onChange: (event) => handleWedgeChange(wedge.id, "color", event.target.value), type: "color", value: wedge.color })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Linked product listing" }), _jsxs("select", { onChange: (event) => handleWedgeListingChange(wedge.id, event.target.value ? Number(event.target.value) : null), value: wedge.linkedListingId ?? "", children: [_jsx("option", { value: "", children: "No listing attached" }), listingQueue.map((listing) => (_jsx("option", { value: listing.id, children: listing.title }, listing.id)))] })] }), _jsx("p", { children: wedge.linkedListingId !== null
                                                        ? `${listingQueue.find((listing) => listing.id === wedge.linkedListingId)?.format ?? "Listing"} will surface when this wedge wins.`
                                                        : "Attach a queued listing to let the wheel route straight into a live product moment." })] }, wedge.id))) })] })] })] }), _jsxs("article", { className: "showcase-card span-12 seller-command-card", children: [_jsx("span", { className: "section-label", children: "Live Stream Setup" }), _jsx("h2", { children: "Seller stream preparation is surfaced as a first-class backend workflow." }), _jsx("p", { children: "Sellers can prepare a show from one page instead of jumping across mixed buyer-facing screens. This keeps live setup, lot pacing, and launch readiness inside the seller backend." }), _jsx("div", { className: "card-grid-4", children: streamSetupSteps.map((step) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: step.title }), _jsx("p", { children: step.detail })] }, step.title))) }), _jsxs("div", { className: "stream-setup-grid", children: [_jsxs("section", { className: "stream-setup-panel stream-setup-panel-full", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Show Details" }), _jsx("p", { children: "Set the title, category, schedule, and host opener that shape the room before viewers arrive." })] }), _jsxs("div", { className: "stream-form-grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Stream title" }), _jsx("input", { onChange: (event) => setStreamTitle(event.target.value), type: "text", value: streamTitle })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Category" }), _jsx("select", { value: streamCategory, onChange: (event) => handleStreamCategoryChange(event.target.value), children: productCategories.map((category) => (_jsx("option", { value: category, children: category }, category))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Cover theme" }), _jsx("input", { onChange: (event) => setCoverTheme(event.target.value), type: "text", value: coverTheme })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Scheduled start" }), _jsx("input", { onChange: (event) => setScheduledAt(event.target.value), type: "datetime-local", value: scheduledAt })] }), _jsxs("label", { className: "field stream-field-full", children: [_jsx("span", { children: "Opening script" }), _jsx("textarea", { onChange: (event) => setOpeningScript(event.target.value), value: openingScript })] })] })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Broadcast Profile" }), _jsx("p", { children: "Choose the stream format, scene preset, latency target, and quality profile before the room opens." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Show format" }), _jsx("select", { value: streamFormat, onChange: (event) => setStreamFormat(event.target.value), children: streamFormats.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Scene preset" }), _jsx("select", { value: scenePreset, onChange: (event) => setScenePreset(event.target.value), children: scenePresets.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Latency profile" }), _jsx("select", { value: latencyProfile, onChange: (event) => setLatencyProfile(event.target.value), children: latencyProfiles.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Output quality" }), _jsx("select", { value: streamQuality, onChange: (event) => setStreamQuality(event.target.value), children: streamQualities.map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Backstage seat capacity" }), _jsx("input", { max: 6, min: 1, onChange: handleNumberInput(setBackstageCapacity, 1, 6), type: "number", value: backstageCapacity })] })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Launch Controls" }), _jsx("p", { children: "Configure countdown timing, promo lead time, chat mode, and seller notes for the host console." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Countdown minutes" }), _jsx("input", { max: 30, min: 1, onChange: handleNumberInput(setCountdownMinutes, 1, 30), type: "number", value: countdownMinutes })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Promo lead minutes" }), _jsx("input", { max: 120, min: 0, onChange: handleNumberInput(setPromoLeadMinutes, 0, 120), type: "number", value: promoLeadMinutes })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Chat mode" }), _jsx("input", { onChange: (event) => setChatMode(event.target.value), type: "text", value: chatMode })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Seller notes" }), _jsx("textarea", { onChange: (event) => setSellerNotes(event.target.value), value: sellerNotes })] }), _jsxs("div", { className: "toggle-grid", children: [_jsxs("button", { className: `toggle-card${overlayEnabled ? " is-active" : ""}`, onClick: () => setOverlayEnabled((value) => !value), type: "button", children: [_jsx("strong", { children: "Lot overlay" }), _jsx("span", { children: overlayEnabled ? "Enabled for pinned lots and prices." : "Disabled for a cleaner camera feed." })] }), _jsxs("button", { className: `toggle-card${autoRecordEnabled ? " is-active" : ""}`, onClick: () => setAutoRecordEnabled((value) => !value), type: "button", children: [_jsx("strong", { children: "Auto record" }), _jsx("span", { children: autoRecordEnabled ? "Cloud archive starts when the room goes live." : "Recording must be started manually." })] }), _jsxs("button", { className: `toggle-card${backupRecordingEnabled ? " is-active" : ""}`, onClick: () => setBackupRecordingEnabled((value) => !value), type: "button", children: [_jsx("strong", { children: "Backup capture" }), _jsx("span", { children: backupRecordingEnabled ? "Local backup recording is armed." : "No fallback recording is armed." })] }), _jsxs("button", { className: `toggle-card${simulcastEnabled ? " is-active" : ""}`, onClick: () => setSimulcastEnabled((value) => !value), type: "button", children: [_jsx("strong", { children: "Simulcast" }), _jsx("span", { children: simulcastEnabled ? "Overflow viewers can be mirrored to a secondary feed." : "Primary LoopLot feed only." })] })] })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Webcam Test" }), _jsx("p", { children: "Run a live browser preview, confirm framing, and lock camera readiness from the seller backend." })] }), _jsxs("div", { className: "camera-preview-shell", children: [_jsxs("div", { className: `camera-preview-frame${cameraPreviewActive ? " is-live" : ""}`, children: [_jsx("video", { autoPlay: true, className: `camera-preview-video${cameraMirrorEnabled ? " is-mirrored" : ""}`, muted: true, playsInline: true, ref: previewVideoRef }), !cameraPreviewActive ? (_jsxs("div", { className: "camera-preview-empty", children: [_jsx("strong", { children: "Preview offline" }), _jsx("p", { children: "Start the webcam test to validate the seller camera before the countdown opens." })] })) : null] }), _jsxs("div", { className: "camera-preview-toolbar", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Camera source" }), _jsx("select", { onChange: (event) => setSelectedCameraId(event.target.value), value: selectedCameraId, children: availableCameras.length > 0 ? (availableCameras.map((camera, index) => (_jsx("option", { value: camera.deviceId, children: camera.label || `Camera ${index + 1}` }, camera.deviceId || `${camera.label}-${index}`)))) : (_jsx("option", { value: "", children: "Default camera" })) })] }), _jsxs("div", { className: "camera-preview-actions", children: [_jsx("button", { className: "button-primary", disabled: cameraLoading, onClick: () => void handleStartCameraPreview(), type: "button", children: cameraLoading ? "Starting..." : cameraPreviewActive ? "Restart Preview" : "Start Preview" }), _jsx("button", { className: "button-secondary", disabled: !cameraPreviewActive, onClick: handleStopCameraPreview, type: "button", children: "Stop Preview" }), _jsx("button", { className: `button-secondary${cameraMirrorEnabled ? " is-active" : ""}`, onClick: () => setCameraMirrorEnabled((value) => !value), type: "button", children: cameraMirrorEnabled ? "Mirror On" : "Mirror Off" })] })] }), _jsx("p", { className: `feedback camera-feedback${cameraPreviewActive ? "" : " is-error"}`, children: cameraStatus })] })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Studio Health" }), _jsx("p", { children: "Track camera, audio, network, and lighting checks from the same surface used for launch approval." })] }), _jsx("div", { className: "stream-checklist studio-checklist", children: studioDevices.map((device) => (_jsxs("button", { className: `stream-check-item${checklistState[device.key] ? " is-complete" : ""}`, onClick: () => handleChecklistToggle(device.key), type: "button", children: [_jsxs("div", { children: [_jsx("strong", { children: device.label }), _jsx("p", { children: device.detail })] }), _jsx("span", { children: checklistState[device.key] ? "Ready" : "Check required" })] }, device.key))) })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Moderator Coverage" }), _jsx("p", { children: "Assign launch operators so chat, claims, wheel results, and payment issues are covered before countdown." })] }), _jsx("div", { className: "moderator-grid", children: moderationTeam.map((member) => {
                                            const isSelected = selectedModeratorIds.includes(member.id);
                                            return (_jsxs("button", { className: `moderator-card${isSelected ? " is-active" : ""}`, onClick: () => handleModeratorToggle(member.id), type: "button", children: [_jsx("strong", { children: member.name }), _jsx("p", { children: member.role }), _jsx("span", { children: isSelected ? "Assigned" : "Available" })] }, member.id));
                                        }) })] }), _jsxs("section", { className: "stream-setup-panel", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Readiness Gate" }), _jsx("p", { children: "Every go-live dependency is tracked from this page so operators know exactly what is still blocking launch." })] }), _jsx("div", { className: "stream-checklist", children: checklistItems.map((item) => (_jsxs("button", { className: `stream-check-item${checklistState[item.key] ? " is-complete" : ""}`, onClick: () => handleChecklistToggle(item.key), type: "button", children: [_jsx("strong", { children: item.label }), _jsx("span", { children: checklistState[item.key] ? "Complete" : "Pending" })] }, item.key))) })] })] })] }), _jsxs("article", { className: "page-card span-8 seller-side-panel", children: [_jsx("span", { className: "section-label", children: "Go Live Panel" }), _jsx("h2", { children: "One seller page handles the final stream launch workflow." }), _jsx("p", { children: "This page now reads like a real seller backend surface: stream setup, wheel settings, lot sequencing, and launch-readiness all sit together instead of being scattered across public pages." }), _jsx("div", { className: "card-grid-4", children: streamControlCards.map((card) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: card.title }), _jsx("p", { children: card.detail })] }, card.title))) }), _jsx("div", { className: "seller-feed-grid", children: streamActivity.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-4 seller-side-panel", children: [_jsx("span", { className: "section-label", children: "Launch Checklist" }), _jsx("h2", { children: "Seller page setup for the next live stream." }), _jsxs("div", { className: "stack", children: [checklistItems.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.label }), _jsx("p", { children: checklistState[item.key] ? "Complete" : "Pending confirmation" })] }, item.key))), chatHighlights.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.user }), _jsx("p", { children: item.message })] }, `${item.user}-${item.message}`)))] })] }), _jsxs("article", { className: "page-card span-12 seller-control-surface", children: [_jsx("span", { className: "section-label", children: "Launch Console" }), _jsx("h2", { children: "Seller page set up live stream now behaves like an actual launch workflow." }), _jsx("p", { children: "Schedule, readiness, and host controls are now connected so the seller can save setup, verify blockers, and move the room from rehearsal into live mode on one page." }), _jsxs("div", { className: "launch-console-grid", children: [_jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Status" }), _jsx("p", { children: launchStatusLabel }), _jsx("p", { children: formatLaunchTime(scheduledAt) })] }), _jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Checklist Progress" }), _jsxs("p", { children: [completedChecklistCount, " of ", checklistItems.length, " checks completed"] }), _jsx("p", { children: launchReady ? "All blockers cleared for launch." : "Launch remains gated until every check is complete." })] }), _jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Host Mode" }), _jsx("p", { children: streamMode }), _jsx("p", { children: sellerNotes })] }), _jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Studio Profile" }), _jsx("p", { children: streamQuality }), _jsxs("p", { children: [latencyProfile, " | ", scenePreset] })] })] }), _jsxs("div", { className: "wheel-action-bar launch-console-actions", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Opening Script" }), _jsx("p", { children: openingScript })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Room Setup" }), _jsx("p", { children: streamTitle }), _jsxs("p", { children: [streamCategory, " | ", coverTheme] }), _jsxs("p", { children: [streamFormat, " | ", backstageCapacity, " backstage seat", backstageCapacity === 1 ? "" : "s"] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Coverage" }), _jsx("p", { children: studioReadinessLabel }), _jsx("p", { children: activeModerators.length > 0
                                            ? activeModerators.map((member) => member.name).join(", ")
                                            : "No moderators assigned" })] }), _jsxs("div", { className: "wheel-action-buttons", children: [_jsx("button", { className: "button-secondary", onClick: handleSaveStreamSetup, type: "button", children: "Save Stream Setup" }), _jsx("button", { className: "button-primary", onClick: handleGoLive, type: "button", children: "Go Live" })] })] }), _jsx("p", { className: `feedback${launchReady || streamMode === "Live" ? "" : " is-error"}`, children: launchFeedback })] }), _jsxs("article", { className: "page-card span-12 seller-side-panel", children: [_jsx("span", { className: "section-label", children: "Run Of Show" }), _jsx("div", { className: "card-grid-4", children: streamRunOfShow.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12 seller-control-surface", children: [_jsx("span", { className: "section-label", children: "Seller Product Category" }), _jsx("h2", { children: "Product categories now steer stream positioning and listing prep from the seller backend." }), _jsx("p", { children: "Sellers can align the show category with the actual lot mix, review routing guidance, and retag listings without leaving the protected dashboard." }), _jsx("div", { className: "card-grid-3 seller-listing-grid", children: categoryPlaybooks.map((playbook) => {
                            const isActive = playbook.category === selectedProductCategory;
                            const listingCount = categoryCounts.find((item) => item.category === playbook.category)?.count ?? 0;
                            return (_jsxs("button", { className: `list-card seller-listing-card${isActive ? " is-active" : ""}`, onClick: () => setSelectedProductCategory(playbook.category), type: "button", children: [_jsx("span", { className: "card-kicker", children: playbook.routing }), _jsx("strong", { children: playbook.category }), _jsx("p", { children: playbook.focus }), _jsxs("div", { className: "seller-listing-actions", children: [_jsxs("span", { children: [listingCount, " queued listing", listingCount === 1 ? "" : "s"] }), _jsx("span", { children: playbook.guardrail })] })] }, playbook.category));
                        }) }), _jsxs("div", { className: "launch-console-grid seller-category-console", children: [_jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Selected category" }), _jsx("p", { children: selectedCategoryPlaybook.category }), _jsx("p", { children: selectedCategoryPlaybook.routing })] }), _jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Stream alignment" }), _jsx("p", { children: streamCategory === selectedProductCategory ? "Aligned to active show" : "Different from current show" }), _jsxs("p", { children: [activeCategoryCount, " listing(s) match the current stream category."] })] }), _jsxs("div", { className: "list-card launch-console-stat", children: [_jsx("strong", { children: "Category guardrail" }), _jsx("p", { children: selectedCategoryPlaybook.guardrail })] }), _jsx("div", { className: "wheel-action-buttons", children: _jsx("button", { className: "button-secondary", onClick: () => handleStreamCategoryChange(selectedProductCategory), type: "button", children: "Use For Stream" }) })] })] }), _jsxs("article", { className: "page-card span-12 seller-control-surface", children: [_jsx("span", { className: "section-label", children: "Bid Listing Queue" }), _jsx("h2", { children: "Products for live bidding sit on the same seller route as stream controls, wheel settings, and launch prep." }), _jsx("p", { children: "The seller backend keeps listing management adjacent to stream controls so operators can tune wheel behavior, check the stream, and reorder lots without dropping back into buyer-facing pages." }), _jsx("div", { className: "wheel-badge-row", children: categoryCounts.map((item) => (_jsxs("button", { className: `pill-label${selectedProductCategory === item.category ? " is-active" : ""}`, onClick: () => setSelectedProductCategory(item.category), type: "button", children: [item.category, " \u00B7 ", item.count] }, item.category))) }), _jsx("div", { className: "card-grid-3 seller-listing-grid", children: visibleListings.map((item) => (_jsxs("div", { className: "list-card seller-listing-card", children: [_jsx("span", { className: "card-kicker", children: item.state }), _jsx("strong", { children: item.title }), _jsx("p", { children: item.detail }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Product category" }), _jsx("select", { onChange: (event) => handleListingCategoryChange(item.id, event.target.value), value: item.category, children: productCategories.map((category) => (_jsx("option", { value: category, children: category }, category))) })] }), _jsxs("div", { className: "seller-listing-actions", children: [_jsxs("span", { children: [item.format, " \u00B7 ", item.priceLabel] }), _jsx("span", { children: item.audience }), _jsxs("span", { children: [item.photoCount, " photo", item.photoCount === 1 ? "" : "s", " ready"] }), _jsx("button", { className: `button-secondary${editingListingId === item.id ? " is-active" : ""}`, onClick: () => handleEditListing(item.id), type: "button", children: "Edit Lot" })] })] }, item.id))) }), editingListing ? (_jsxs("div", { className: "seller-lot-editor", children: [_jsxs("div", { className: "wheel-settings-header", children: [_jsx("strong", { children: "Edit lot" }), _jsx("p", { children: "Update the product copy, pricing, category, and photo staging without leaving the seller queue." })] }), _jsxs("div", { className: "seller-lot-editor-grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Lot title" }), _jsx("input", { onChange: (event) => handleListingDraftChange("title", event.target.value), type: "text", value: listingDraft.title })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Lot state" }), _jsx("input", { onChange: (event) => handleListingDraftChange("state", event.target.value), type: "text", value: listingDraft.state })] }), _jsxs("label", { className: "field stream-field-full", children: [_jsx("span", { children: "Lot details" }), _jsx("textarea", { onChange: (event) => handleListingDraftChange("detail", event.target.value), value: listingDraft.detail })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Product category" }), _jsx("select", { onChange: (event) => handleListingDraftChange("category", event.target.value), value: listingDraft.category, children: productCategories.map((category) => (_jsx("option", { value: category, children: category }, category))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Format" }), _jsxs("select", { onChange: (event) => handleListingDraftChange("format", event.target.value), value: listingDraft.format, children: [_jsx("option", { value: "Auction", children: "Auction" }), _jsx("option", { value: "Buy Now", children: "Buy Now" })] })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Price label" }), _jsx("input", { onChange: (event) => handleListingDraftChange("priceLabel", event.target.value), type: "text", value: listingDraft.priceLabel })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Target audience" }), _jsx("input", { onChange: (event) => handleListingDraftChange("audience", event.target.value), type: "text", value: listingDraft.audience })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Photo count" }), _jsx("input", { max: 24, min: 1, onChange: (event) => handleListingDraftChange("photoCount", Number(event.target.value)), type: "number", value: listingDraft.photoCount })] }), _jsxs("label", { className: "field stream-field-full", children: [_jsx("span", { children: "Photo notes" }), _jsx("textarea", { onChange: (event) => handleListingDraftChange("photoNotes", event.target.value), value: listingDraft.photoNotes })] })] }), _jsxs("div", { className: "seller-lot-editor-footer", children: [_jsxs("div", { className: "list-card seller-lot-photo-summary", children: [_jsx("span", { className: "card-kicker", children: "Photo staging" }), _jsxs("strong", { children: [listingDraft.photoCount, " product photo", listingDraft.photoCount === 1 ? "" : "s", " prepared"] }), _jsx("p", { children: listingDraft.photoNotes || "Add notes covering angles, closeups, or proof shots for the lot." })] }), _jsxs("div", { className: "wheel-action-buttons", children: [_jsx("button", { className: "button-secondary", onClick: handleCancelListingEdits, type: "button", children: "Reset Changes" }), _jsx("button", { className: "button-primary", onClick: handleSaveListingEdits, type: "button", children: "Save Lot Changes" })] })] }), _jsx("p", { className: "feedback", children: listingFeedback })] })) : null] }), _jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Operator Profile" }), _jsxs("div", { className: "stack", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Name" }), _jsx("p", { children: session?.name })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Email" }), _jsx("p", { children: session?.email })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Role" }), _jsx("p", { children: session?.role })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Seller Backend Pages" }), _jsx("div", { className: "card-grid-4", children: backendPages.map((page) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: page.title }), _jsx("p", { children: page.detail })] }, page.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Why This Page Exists" }), _jsx("div", { className: "card-grid-3", children: sellerBackendPanels.map((panel) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: panel.title }), _jsx("p", { children: panel.detail })] }, panel.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Seller Ownership" }), _jsx("div", { className: "card-grid-3", children: setupOwnership.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Route Guard Model" }), _jsx("div", { className: "card-grid-3", children: sellerRouteRules.map((rule) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: rule.title }), _jsx("p", { children: rule.detail })] }, rule.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Cross-Area Navigation" }), _jsx("div", { className: "card-grid-4", children: sellerAreaLinks.map((item) => (_jsxs(Link, { className: "list-card", to: item.to, children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.to))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Seller Backend Outcome" }), _jsx("div", { className: "card-grid-3", children: sellerOutcome.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Seller Route Scope" }), _jsx("div", { className: "card-grid-3", children: sellerRouteScope.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] })] }));
}
