import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink } from "react-router-dom";
const navGroups = [
    {
        title: "Shop",
        items: [
            { href: "/", label: "Home", tag: "Public", description: "Front door, account entry, and featured moments" },
            { href: "/discover", label: "Discover", tag: "Public", description: "Collections, launches, and seller spotlights" },
            { href: "/live", label: "Live", tag: "Public", description: "Active rooms, bid energy, and buyer momentum" }
        ]
    },
    {
        title: "Operate",
        items: [
            { href: "/seller", label: "Seller Hub", tag: "Seller", description: "Wheel settings, stream setup, and lot queue" },
            { href: "/admin", label: "Admin", tag: "Admin", description: "Trust, moderation, and marketplace operations" }
        ]
    }
];
const sessionMoments = [
    "Guest browsing stays on the storefront.",
    "Sellers unlock stream prep and listing controls.",
    "Admins unlock full marketplace oversight."
];
const quickStats = [
    { label: "Shows Tonight", value: "24" },
    { label: "Lots Queued", value: "1.2k" },
    { label: "Trust Alerts", value: "9" }
];
const quickAreaJump = [
    { label: "Front Door", href: "/", detail: "Public shopper entry and account switching." },
    { label: "Discover", href: "/discover", detail: "Buyer-facing browsing and scheduled drops." },
    { label: "Live Floor", href: "/live", detail: "Public stream viewing without operator controls." },
    { label: "Seller Hub", href: "/seller", detail: "Protected stream setup, wheel settings, and listings." },
    { label: "Admin Suite", href: "/admin", detail: "Restricted moderation and marketplace ops." }
];
const roleNavigation = [
    { role: "Buyer", label: "Home, Discover, Live", detail: "Customer journey stays fast and visual." },
    { role: "Seller", label: "Seller Hub", detail: "Stream prep, lots, and wheel controls stay backstage." },
    { role: "Admin", label: "Admin Suite", detail: "Moderation, disputes, and health stay operational." }
];
function accessState(href, session) {
    if (href === "/admin") {
        return session?.role === "admin" ? "Open" : "Admin only";
    }
    if (href === "/seller") {
        return session?.role === "seller" || session?.role === "admin" ? "Open" : "Seller only";
    }
    return "Open";
}
function accessCopy(session) {
    if (!session) {
        return "Guest access is limited to the public shopping pages.";
    }
    if (session.role === "admin") {
        return "Admin access unlocks all platform areas.";
    }
    if (session.role === "seller") {
        return "Seller access unlocks the storefront and seller workspace.";
    }
    return "Buyer access stays on the public storefront routes.";
}
export default function Nav({ onLogout, session }) {
    return (_jsxs("header", { className: "nav-shell", children: [_jsxs("div", { className: "nav-brand", children: [_jsx("div", { className: "nav-mark", children: "L" }), _jsxs("div", { className: "nav-copy", children: [_jsx("span", { className: "pill-label", children: "LoopLot" }), _jsx("strong", { children: "Live shopping up front. Seller control room and admin ops behind the curtain." }), _jsx("p", { children: "The shell stays shared, but the experience is intentionally split into buyer, seller, and admin lanes with different visual weight." })] })] }), _jsx("nav", { "aria-label": "Primary", className: "nav-links", children: navGroups.map((group) => (_jsxs("div", { className: "nav-group", children: [_jsx("span", { className: "section-label", children: group.title }), _jsx("div", { className: "nav-group-links", children: group.items.map((item) => (_jsxs(NavLink, { className: ({ isActive }) => `nav-link${isActive ? " is-active" : ""}`, to: item.href, children: [_jsx("span", { className: "nav-tag", children: item.tag }), _jsx("strong", { children: item.label }), _jsx("span", { className: "nav-link-copy", children: item.description }), _jsx("span", { className: "nav-link-status", children: accessState(item.href, session) })] }, item.href))) })] }, group.title))) }), _jsxs("aside", { className: "nav-profile", children: [_jsx("span", { className: "section-label", children: session ? "Signed In" : "Guest Session" }), _jsx("strong", { children: session ? session.name : "No active account" }), _jsx("p", { children: session ? `${session.email} - ${session.role}` : "Use the home page to try seeded buyer, seller, and admin accounts." }), _jsx("p", { children: accessCopy(session) }), _jsx("div", { className: "nav-role-lanes", children: roleNavigation.map((item) => (_jsxs("div", { className: "nav-role-card", children: [_jsx("span", { children: item.role }), _jsx("strong", { children: item.label }), _jsx("p", { children: item.detail })] }, item.role))) }), _jsx("div", { className: "compact-grid compact-grid-3", children: quickStats.map((item) => (_jsxs("div", { className: "insight-panel", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Session model" }), _jsx("p", { children: sessionMoments.join(" ") })] }), _jsxs("div", { className: "nav-actions", children: [_jsx(Link, { className: "button-secondary", to: "/", children: session ? "Switch Account" : "Open Login" }), session ? (_jsx("button", { className: "button-primary", onClick: onLogout, type: "button", children: "Sign Out" })) : null] }), _jsx("div", { className: "stack", children: quickAreaJump.map((item) => (_jsxs(Link, { className: "list-card nav-mini-link", to: item.href, children: [_jsx("strong", { children: item.label }), _jsx("p", { children: item.detail }), _jsx("p", { children: accessState(item.href, session) })] }, item.href))) })] })] }));
}
