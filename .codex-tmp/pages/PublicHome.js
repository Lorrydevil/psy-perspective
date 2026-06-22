import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { routeGroups } from "../lib/router";
const highlights = [
    { label: "Live Auctions Tonight", value: "84" },
    { label: "Featured Sellers", value: "126" },
    { label: "Flash Buy-Nows", value: "312" },
    { label: "Avg Session Time", value: "19 min" }
];
const launchRail = [
    {
        title: "Luxury Revival",
        detail: "Vintage accessories with sudden-death bidding and host camera callouts.",
        meta: "Starts in 18 min"
    },
    {
        title: "Collector Break Room",
        detail: "Cards, comics, and sealed drops with bonus wheel wedges staged between lots.",
        meta: "420 lots queued"
    },
    {
        title: "Sneaker Sprint",
        detail: "Rapid-fire buy-now runs, size polling, and fast checkout on the live floor.",
        meta: "9.3k watching"
    }
];
const featuredSellerStats = [
    { label: "Sell-through", value: "91%" },
    { label: "Avg lot close", value: "23 sec" },
    { label: "Repeat buyers", value: "68%" }
];
const roleEntryPoints = [
    {
        title: "Guest / Buyer",
        detail: "Move through Home, Discover, and Live without touching seller or admin controls."
    },
    {
        title: "Seller",
        detail: "Jump into Seller Hub to prep wheel settings, stream details, and lot sequencing."
    },
    {
        title: "Admin",
        detail: "Review operations, trust, moderation, and seller health from a separate control room."
    }
];
const quickAreaRoutes = [
    { title: "Public Home", to: "/", detail: "Reset to the storefront entry and account switcher." },
    { title: "Discover", to: "/discover", detail: "Browse categories, launches, and featured sellers." },
    { title: "Live", to: "/live", detail: "Preview shopper-facing live rooms and momentum." },
    { title: "Seller Dashboard", to: "/seller", detail: "Enter the protected seller backend for stream prep." },
    { title: "Admin Dashboard", to: "/admin", detail: "Enter restricted moderation and marketplace controls." }
];
const accessMatrix = [
    { role: "Guest / Buyer", access: "Home, Discover, Live" },
    { role: "Seller", access: "Home, Discover, Live, Seller Dashboard" },
    { role: "Admin", access: "All areas including Seller Dashboard and Admin Dashboard" }
];
const shopperPromises = [
    "Clean public storefront with no seller control leakage.",
    "Direct access to discovery and live rooms for guests.",
    "Fast account switching for seeded buyer, seller, and admin sessions."
];
const routeSplitSummary = [
    "Public routes handle browsing, discovery, and live viewing.",
    "Seller Hub handles stream setup, wheel settings, and bid listing prep.",
    "Admin Suite handles moderation, disputes, and marketplace operations."
];
const livePreviewCards = [
    {
        seller: "Mila from House Archive",
        status: "Live now",
        title: "Louis Vuitton keepall start",
        bid: "$420",
        detail: "82 bids in the last two minutes with auto-extend active.",
        viewers: "2.4k watching"
    },
    {
        seller: "Rex from Break Vault",
        status: "Ending soon",
        title: "1998 Kobe insert chase lot",
        bid: "$168",
        detail: "Chat is surging after a rare parallel reveal.",
        viewers: "1.1k watching"
    },
    {
        seller: "Nori from Sole Circuit",
        status: "Buy now",
        title: "Jordan 4 Thunder size run",
        bid: "$245",
        detail: "Instant checkout enabled while the next auction is staged.",
        viewers: "860 watching"
    }
];
export default function PublicHome({ authError, defaultAccounts, onLogin, onLogout, session }) {
    const location = useLocation();
    const [email, setEmail] = useState(defaultAccounts[0]?.email ?? "");
    const [password, setPassword] = useState(defaultAccounts[0]?.password ?? "");
    const [statusMessage, setStatusMessage] = useState(null);
    useEffect(() => {
        const nextMessage = location.state && typeof location.state === "object" && "loginMessage" in location.state
            ? String(location.state.loginMessage)
            : null;
        setStatusMessage(nextMessage);
    }, [location.state]);
    function submitLogin(event) {
        event.preventDefault();
        const didLogin = onLogin({ email, password });
        if (!didLogin) {
            setStatusMessage(null);
        }
    }
    return (_jsxs("section", { className: "page-grid", children: [_jsxs("article", { className: "showcase-card span-8 marketplace-hero-card", children: [_jsx("span", { className: "section-label", children: "Welcome Floor" }), _jsxs("div", { className: "marketplace-hero-layout", children: [_jsxs("div", { className: "marketplace-hero-main", children: [_jsxs("div", { className: "marketplace-hero-kicker", children: [_jsx("span", { className: "pill-label", children: "Featured Seller" }), _jsx("span", { className: "marketplace-hero-meta", children: "House Archive is driving the floor tonight" })] }), _jsx("h2", { children: "Live shopping worth opening right now." }), _jsx("p", { children: "Watch a featured seller with active bidding, clean checkout, and the next lots already queued so the storefront feels fast the moment shoppers land." }), _jsxs("div", { className: "hero-cta-row marketplace-hero-actions", children: [_jsx(Link, { className: "button-primary", to: "/live", children: "Watch Live" }), _jsx(Link, { className: "button-secondary", to: "/discover", children: "Browse Auctions" }), _jsx(Link, { className: "button-secondary", to: "/seller", children: "Join Stream" })] }), _jsxs("div", { className: "marketplace-hero-inline-panels", children: [_jsxs("div", { className: "marketplace-info-card", children: [_jsx("span", { children: "Tonight's headline stream" }), _jsx("strong", { children: "Luxury Revival with Mila from House Archive" }), _jsx("p", { children: "Designer accessories, sudden-death endings, and host callouts every few lots." })] }), _jsxs("div", { className: "marketplace-info-card", children: [_jsx("span", { children: "Buyer flow" }), _jsx("strong", { children: "Discover a lot, join live, bid in seconds" }), _jsx("p", { children: "The top section now prioritizes the main shopper decision instead of oversized filler UI." })] })] }), _jsx("div", { className: "marketplace-stat-strip", children: highlights.map((item) => (_jsxs("div", { className: "marketplace-stat-chip", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) })] }), _jsxs("div", { className: "marketplace-hero-side", children: [_jsxs("div", { className: "featured-stream-panel", children: [_jsxs("div", { className: "featured-stream-top", children: [_jsx("span", { className: "pill-label", children: "Featured Live" }), _jsx("span", { className: "auction-status-pill", children: livePreviewCards[0].status })] }), _jsx("strong", { children: livePreviewCards[0].title }), _jsx("p", { children: livePreviewCards[0].seller }), _jsx("p", { children: livePreviewCards[0].detail }), _jsxs("div", { className: "featured-stream-meta", children: [_jsxs("div", { children: [_jsx("span", { children: "Current bid" }), _jsx("strong", { children: livePreviewCards[0].bid })] }), _jsxs("div", { children: [_jsx("span", { children: "Audience" }), _jsx("strong", { children: livePreviewCards[0].viewers })] })] }), _jsx(Link, { className: "button-primary featured-stream-button", to: "/live", children: "Join Stream" })] }), _jsxs("div", { className: "hero-support-card marketplace-seller-card", children: [_jsx("span", { children: "Featured seller profile" }), _jsx("strong", { children: "Trusted luxury host with strong close rates" }), _jsx("p", { children: "High-conviction buyers follow the stream because the pacing is tight and the lot staging stays clear." }), _jsx("div", { className: "marketplace-mini-stats", children: featuredSellerStats.map((item) => (_jsxs("div", { className: "marketplace-mini-stat", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) })] })] })] }), _jsx("div", { className: "live-auction-grid", children: livePreviewCards.map((item) => (_jsxs("div", { className: "auction-card", children: [_jsxs("div", { className: "auction-card-top", children: [_jsxs("div", { className: "auction-seller", children: [_jsx("div", { className: "seller-avatar", children: item.seller.charAt(0) }), _jsxs("div", { children: [_jsx("strong", { children: item.seller }), _jsx("span", { children: item.status })] })] }), _jsx("span", { className: "auction-status-pill", children: item.status })] }), _jsxs("div", { className: "auction-card-body", children: [_jsx("span", { className: "card-kicker", children: "Current lot" }), _jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }), _jsxs("div", { className: "auction-bid-row", children: [_jsxs("div", { children: [_jsx("span", { children: "Current bid" }), _jsx("strong", { children: item.bid })] }), _jsxs("div", { children: [_jsx("span", { children: "Audience" }), _jsx("strong", { children: item.viewers })] }), _jsx("button", { className: "button-primary", type: "button", children: "Bid Now" })] })] }, item.title))) }), _jsx("div", { className: "feature-rail", children: launchRail.map((item) => (_jsxs("div", { className: "feature-card", children: [_jsx("span", { children: item.meta }), _jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-4 home-access-card", children: [_jsx("span", { className: "section-label", children: "Account Access" }), _jsx("h2", { children: session ? `Signed in as ${session.name}` : "Get into the marketplace fast" }), _jsx("p", { children: session
                            ? `Your ${session.role} session controls which protected routes are available.`
                            : "Use a buyer, seller, or admin account to test the live storefront and protected back-office areas without leaving the home page." }), _jsxs("form", { className: "login-form", onSubmit: submitLogin, children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Email" }), _jsx("input", { onChange: (event) => setEmail(event.target.value), type: "email", value: email })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Password" }), _jsx("input", { onChange: (event) => setPassword(event.target.value), type: "password", value: password })] }), _jsxs("div", { className: "nav-actions", children: [_jsx("button", { className: "button-primary", type: "submit", children: "Sign In" }), _jsx(Link, { className: "button-secondary", to: "/discover", children: "Continue as Guest" }), session ? (_jsx("button", { className: "button-secondary", onClick: onLogout, type: "button", children: "Sign Out" })) : null] }), (statusMessage || authError) && (_jsx("p", { className: `feedback${authError ? " is-error" : ""}`, children: authError ?? statusMessage }))] }), _jsx("div", { className: "compact-grid compact-grid-1", children: roleEntryPoints.map((item) => (_jsxs("div", { className: "insight-panel", children: [_jsx("span", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Seeded Credentials" }), _jsx("div", { className: "card-grid-3", children: defaultAccounts.map((account) => (_jsxs("button", { className: "list-card credential-card", onClick: () => {
                                setEmail(account.email);
                                setPassword(account.password);
                                setStatusMessage(`Loaded ${account.role} account for ${account.name}.`);
                            }, type: "button", children: [_jsx("strong", { children: account.name }), _jsx("p", { children: account.email }), _jsxs("p", { children: ["Password: ", account.password] }), _jsxs("p", { children: ["Role: ", account.role] })] }, account.email))) })] }), _jsxs("article", { className: "page-card span-8", children: [_jsx("span", { className: "section-label", children: "Shopper Promise" }), _jsx("div", { className: "card-grid-3", children: shopperPromises.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Route Roles" }), _jsx("div", { className: "stack", children: roleEntryPoints.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Area Map" }), _jsxs("div", { className: "card-grid-4", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Public Area" }), _jsx("p", { children: "Home, Discover, and Live are open routes intended for shoppers and guest traffic." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Area" }), _jsx("p", { children: "Seller Hub contains wheel settings, live stream setup, product listing management, and go-live controls." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin Area" }), _jsx("p", { children: "Admin pages stay restricted to moderation, trust, catalog quality, and marketplace health." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Shared Navigation" }), _jsx("p", { children: "The top navigation exposes every area while route guards keep protected spaces separated." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Full Area Navigation" }), _jsx("div", { className: "card-grid-4", children: quickAreaRoutes.map((item) => (_jsxs(Link, { className: "list-card", to: item.to, children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.to))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Access Matrix" }), _jsx("div", { className: "card-grid-3", children: accessMatrix.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.role }), _jsx("p", { children: item.access })] }, item.role))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Route Split Summary" }), _jsx("div", { className: "card-grid-3", children: routeSplitSummary.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-8", children: [_jsx("span", { className: "section-label", children: "Navigation Coverage" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Public Routes" }), _jsx("p", { children: routeGroups.public.map((route) => route.label).join(" | ") })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Routes" }), _jsx("p", { children: routeGroups.seller.map((route) => route.label).join(" | ") })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin Routes" }), _jsx("p", { children: routeGroups.admin.map((route) => route.label).join(" | ") })] })] })] }), _jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Quick Navigation" }), _jsxs("div", { className: "stack", children: [_jsxs(Link, { className: "list-card", to: "/discover", children: [_jsx("strong", { children: "Open Discover" }), _jsx("p", { children: "Browse buyer-facing categories and launches." })] }), _jsxs(Link, { className: "list-card", to: "/live", children: [_jsx("strong", { children: "Open Live" }), _jsx("p", { children: "See the public live shopping floor." })] }), _jsxs(Link, { className: "list-card", to: "/seller", children: [_jsx("strong", { children: "Open Seller Dashboard" }), _jsx("p", { children: "Protected workspace for seller stream setup, wheel settings, and product listings prepared for live bidding." })] }), _jsxs(Link, { className: "list-card", to: "/admin", children: [_jsx("strong", { children: "Open Admin Dashboard" }), _jsx("p", { children: "Restricted marketplace controls and oversight." })] })] })] })] }));
}
