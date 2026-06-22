import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { routeGroups } from "../lib/router";
const discoveryRows = [
    {
        title: "Luxury Spotlight",
        detail: "Premium accessories and authenticated fashion rooms with polished previews and schedule visibility.",
        meta: "14 featured rooms"
    },
    {
        title: "Collectors Hub",
        detail: "Trading cards, comics, and memorabilia streams grouped by momentum, rarity, and release timing.",
        meta: "Rare drop at 8:00 PM"
    },
    {
        title: "Sneaker Drop Deck",
        detail: "Upcoming heat checks, size-run listings, and fast buy-now inventory in one discovery grid.",
        meta: "9.3k watchers waiting"
    }
];
const launchMoments = [
    "7:30 PM - Vintage designer wheel",
    "8:00 PM - Premium card break",
    "8:45 PM - Sneaker lightning round",
    "9:15 PM - Comic grail showcase"
];
const discoveryHandoffs = [
    {
        title: "Public Home",
        detail: "Return to the main landing page and account selector.",
        to: "/"
    },
    {
        title: "Live Rooms",
        detail: "Jump into the active shopper-facing stream floor.",
        to: "/live"
    },
    {
        title: "Seller Dashboard",
        detail: "Open the protected seller backend for stream preparation and listings.",
        to: "/seller"
    },
    {
        title: "Admin Dashboard",
        detail: "Continue into restricted marketplace operations if your account allows it.",
        to: "/admin"
    }
];
const discoveryBoundaries = [
    "Discovery remains shopper-facing and does not expose seller controls.",
    "Seller setup and listing operations stay on the protected seller route.",
    "Admin moderation remains isolated in the admin route."
];
const areaHighlights = [
    {
        title: "Public browsing",
        detail: "Discovery exists to move shoppers from interest to live conversion without back-office noise."
    },
    {
        title: "Seller backend handoff",
        detail: "Sellers can jump into a dedicated workspace when they need to schedule a show or stage lots."
    },
    {
        title: "Admin oversight handoff",
        detail: "Admins can inspect marketplace-facing surfaces while keeping operations separated."
    }
];
const merchSignals = [
    { label: "Featured channels", value: "36" },
    { label: "Drops in next hour", value: "11" },
    { label: "Categories trending", value: "8" }
];
const merchColumns = [
    {
        label: "Trending now",
        title: "Luxury sellers with bid velocity",
        detail: "High-intent rooms with authenticated goods, short timers, and premium average order values."
    },
    {
        label: "Staff picks",
        title: "Breakers with repeat attendance",
        detail: "Collectors are piling into rooms with chase mechanics, queue previews, and clean moderation."
    },
    {
        label: "Coming up",
        title: "Sneaker flash lanes after 8 PM",
        detail: "Fast buy-now runs and size polls scheduled after the main evening auctions."
    }
];
const accessStates = [
    { area: "Public pages", state: "Always open" },
    {
        area: "Seller dashboard",
        state: sessionLabel => (sessionLabel === "seller" || sessionLabel === "admin" ? "Available with current session" : "Protected")
    },
    {
        area: "Admin pages",
        state: sessionLabel => (sessionLabel === "admin" ? "Available with current session" : "Protected")
    }
];
export default function Discover({ session }) {
    return (_jsxs("section", { className: "page-grid", children: [_jsxs("article", { className: "showcase-card span-8", children: [_jsx("span", { className: "section-label", children: "Discover" }), _jsx("h2", { children: "Discovery now feels merchandised, time-aware, and clearly shopper-facing." }), _jsx("p", { children: session
                            ? `${session.name} can move through discovery while their ${session.role} permissions continue to control backend access.`
                            : "Guests can browse the marketplace before signing in, while seller stream controls and admin areas remain protected." }), _jsx("div", { className: "discovery-highlight-row", children: merchColumns.map((item) => (_jsxs("div", { className: "feature-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) }), _jsx("div", { className: "compact-grid compact-grid-3", children: merchSignals.map((item) => (_jsxs("div", { className: "insight-panel", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) }), _jsx("div", { className: "card-grid-3", children: discoveryRows.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("span", { className: "card-kicker", children: item.meta }), _jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Tonight's Schedule" }), _jsx("div", { className: "stack", children: launchMoments.map((launch) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: launch }) }, launch))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Route Handoff" }), _jsx("div", { className: "card-grid-4", children: discoveryHandoffs.map((item) => (_jsxs(Link, { className: "list-card", to: item.to, children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.to))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Public Navigation Model" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Browse First" }), _jsx("p", { children: "Discovery keeps the buyer journey focused on categories, launches, and seller visibility." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Jump to Live" }), _jsx("p", { children: "Shoppers can move from browse mode to active rooms without crossing into backend tools." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Protected Backends" }), _jsx("p", { children: "Seller and admin destinations remain visible in navigation but still enforce account-level access and route guards." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Route Coverage" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Public" }), _jsxs("p", { children: [routeGroups.public.length, " shopper-facing routes stay open to guests."] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller" }), _jsxs("p", { children: [routeGroups.seller.length, " backend route stays dedicated to stream setup and listings."] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin" }), _jsxs("p", { children: [routeGroups.admin.length, " restricted route holds moderation and marketplace controls."] })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Area Separation" }), _jsx("div", { className: "card-grid-3", children: areaHighlights.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Current Access View" }), _jsx("div", { className: "card-grid-3", children: accessStates.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.area }), _jsx("p", { children: typeof item.state === "function" ? item.state(session?.role) : item.state })] }, item.area))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Boundary Rules" }), _jsx("div", { className: "card-grid-3", children: discoveryBoundaries.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Discovery Intent" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Browse first" }), _jsx("p", { children: "Merchandise categories, launches, and channels without exposing backstage controls." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Hand off to live" }), _jsx("p", { children: "Move interested shoppers from discovery into active rooms with minimal friction." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Keep operations separate" }), _jsx("p", { children: "Seller and admin routes remain visible but operationally distinct from this page." })] })] })] })] }));
}
