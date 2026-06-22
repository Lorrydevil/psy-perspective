import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { routeGroups } from "../lib/router";
const liveRooms = [
    {
        title: "Gold Room Auctions",
        metric: "18.4k watching",
        detail: "High-energy lot rotation with premium item reveals.",
        seller: "Mila Archive",
        lot: "Chanel mini flap",
        bid: "$640",
        status: "Live now"
    },
    {
        title: "Collector's Table",
        metric: "12.1k watching",
        detail: "Rapid hobby breaks with chase alerts and queue previews.",
        seller: "Break Vault",
        lot: "Jordan rookie refractor",
        bid: "$225",
        status: "Final minute"
    },
    {
        title: "Heat Check Soles",
        metric: "9.3k watching",
        detail: "Sneaker sprints with fast-closing bids and instant checkout.",
        seller: "Sole Circuit",
        lot: "SB Dunk low size 10",
        bid: "$188",
        status: "Buy now"
    }
];
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
];
const liveHandoffs = [
    { title: "Home", detail: "Switch accounts or return to the main platform entry page.", to: "/" },
    { title: "Discover", detail: "Move back to featured categories and upcoming launches.", to: "/discover" },
    { title: "Seller Dashboard", detail: "Open the seller backend for stream setup and live controls.", to: "/seller" },
    { title: "Admin Dashboard", detail: "Continue into moderation and operational oversight if permitted.", to: "/admin" }
];
const liveSeparationNotes = [
    {
        title: "Public stream surface",
        detail: "The live floor is still a customer-facing page focused on audience energy and conversion."
    },
    {
        title: "Seller controls stay backstage",
        detail: "Wheel settings, launch prep, and lot management remain in the seller dashboard."
    },
    {
        title: "Admin tools stay backstage",
        detail: "Moderation and trust operations remain in the admin suite."
    }
];
const operatorHandoff = [
    "Seller hosts prepare the show in the seller dashboard before viewers ever reach this page.",
    "Admins moderate from the admin suite instead of mixing intervention controls into the live floor.",
    "Shared navigation keeps all areas reachable while route guards preserve the boundaries."
];
const backstageAccess = [
    { area: "Seller controls", state: "Protected seller route" },
    { area: "Admin tools", state: "Restricted admin route" },
    { area: "Live floor", state: "Public route" }
];
const livePageIntent = [
    "The live page is public and conversion-focused.",
    "Seller launch tools stay on the seller dashboard.",
    "Admin intervention stays in the admin suite."
];
const liveAreaSwitching = [
    "Public viewers stay on the live floor.",
    "Hosts move into Seller Dashboard for stream controls.",
    "Operators move into Admin Dashboard for moderation and oversight."
];
export default function Live({ session }) {
    return (_jsxs("section", { className: "page-grid", children: [_jsxs("article", { className: "showcase-card span-12 live-floor-hero", children: [_jsx("span", { className: "section-label", children: "Live Marketplace" }), _jsx("h2", { children: "The live floor now reads as an active show roster instead of a generic status page." }), _jsx("p", { children: session
                            ? `${session.name} is signed in, but the live shopping floor still avoids mixing in seller setup or admin controls.`
                            : "Guests can preview the live shopping experience before signing in to any protected workspace." }), _jsx("div", { className: "metric-grid", children: pulseMetrics.map((item) => (_jsxs("div", { className: "metric-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) }), _jsx("div", { className: "feature-rail", children: activityFeed.map((item) => (_jsxs("div", { className: "feature-card", children: [_jsx("span", { children: "Live activity" }), _jsx("p", { children: item })] }, item))) })] }), liveRooms.map((room) => (_jsxs("article", { className: "page-card span-4 live-room-card", children: [_jsxs("div", { className: "auction-card-top", children: [_jsxs("div", { className: "auction-seller", children: [_jsx("div", { className: "seller-avatar", children: room.seller.charAt(0) }), _jsxs("div", { children: [_jsx("strong", { children: room.seller }), _jsx("span", { children: room.metric })] })] }), _jsx("span", { className: "auction-status-pill", children: room.status })] }), _jsxs("div", { className: "auction-card-body", children: [_jsx("span", { className: "section-label", children: "Featured Room" }), _jsx("h2", { children: room.title }), _jsx("p", { children: room.detail })] }), _jsxs("div", { className: "live-room-lot", children: [_jsxs("div", { children: [_jsx("span", { children: "Current lot" }), _jsx("strong", { children: room.lot })] }), _jsxs("div", { children: [_jsx("span", { children: "Bid" }), _jsx("strong", { children: room.bid })] })] }), _jsxs("div", { className: "auction-bid-row", children: [_jsxs("div", { children: [_jsx("span", { children: "Room pace" }), _jsx("strong", { children: room.metric })] }), _jsx("button", { className: "button-primary", type: "button", children: "Enter Room" })] })] }, room.title))), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Navigation Between Areas" }), _jsx("div", { className: "card-grid-4", children: liveHandoffs.map((item) => (_jsxs(Link, { className: "list-card", to: item.to, children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.to))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Live Floor Boundaries" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Buyer-Facing Stream View" }), _jsx("p", { children: "Live pages focus on rooms, audience energy, and conversion signals rather than operator controls." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Tools Stay Separate" }), _jsx("p", { children: "Stream setup, countdown readiness, wheel pacing, and listing management remain isolated inside the seller dashboard." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin Controls Stay Separate" }), _jsx("p", { children: "Moderation and compliance actions belong in the admin suite, not in the public live experience." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Cross-Area Count" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Shopper Flow" }), _jsx("p", { children: routeGroups.public.map((route) => route.label).join(" | ") })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Backend" }), _jsx("p", { children: routeGroups.seller.map((route) => route.label).join(" | ") })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin Suite" }), _jsx("p", { children: routeGroups.admin.map((route) => route.label).join(" | ") })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Surface Separation" }), _jsx("div", { className: "card-grid-3", children: liveSeparationNotes.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Operator Handoff" }), _jsx("div", { className: "card-grid-3", children: operatorHandoff.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Backstage Access" }), _jsx("div", { className: "card-grid-3", children: backstageAccess.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.area }), _jsx("p", { children: item.state })] }, item.area))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Live Page Intent" }), _jsx("div", { className: "card-grid-3", children: livePageIntent.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Area Switching" }), _jsx("div", { className: "card-grid-3", children: liveAreaSwitching.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] })] }));
}
