import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Nav from "./components/Nav";
import { routeGroups, routeMeta } from "./lib/router";
import AdminDashboard from "./pages/AdminDashboard";
import Discover from "./pages/Discover";
import Live from "./pages/Live";
import PublicHome from "./pages/PublicHome";
import SellerDashboard from "./pages/SellerDashboard";
const SESSION_STORAGE_KEY = "looplot-session";
const publicRouteComponents = {
    "/": PublicHome,
    "/discover": Discover,
    "/live": Live
};
const publicRoutes = routeGroups.public.map((route) => ({
    path: route.path,
    element: publicRouteComponents[route.path]
}));
const dashboardRoutes = {
    seller: "/seller",
    admin: "/admin"
};
const seedAccounts = [
    { email: "shopper@looplot.com", password: "buyer123", name: "Demo Buyer", role: "buyer" },
    { email: "seller@looplot.com", password: "seller123", name: "Studio Seller", role: "seller" },
    { email: "admin@looplot.com", password: "admin123", name: "Default Admin", role: "admin" }
];
const routeCounts = {
    public: routeGroups.public.length,
    seller: routeGroups.seller.length,
    admin: routeGroups.admin.length
};
const areaLandingCards = [
    {
        label: "Public pages",
        path: "/discover",
        detail: "Browse drops, watch live rooms, and move through the shopper flow without operator clutter."
    },
    {
        label: "Seller dashboard",
        path: "/seller",
        detail: "Run wheel settings, stream setup, and lot prep from one protected workspace."
    },
    {
        label: "Admin pages",
        path: "/admin",
        detail: "Keep moderation and marketplace operations isolated from storefront traffic."
    }
];
const workspaceSignals = [
    {
        label: "Public flow",
        value: "Open",
        detail: "Home, Discover, and Live stay guest-friendly."
    },
    {
        label: "Seller tools",
        value: "Protected",
        detail: "Stream prep and lot control stay backstage."
    },
    {
        label: "Admin ops",
        value: "Restricted",
        detail: "Oversight remains separate from selling and shopping."
    }
];
const heroSpotlights = [
    { label: "Trending room", value: "Luxury Revival", detail: "1.8k bidders warming up" },
    { label: "Seller control", value: "Backstage Ready", detail: "Wheel, lots, and launch checks staged" },
    { label: "Ops watch", value: "9 open alerts", detail: "Admin moderation stays separate" }
];
const marketPulse = [
    { label: "Rooms live", value: "24", detail: "Buyer traffic is strongest in luxury and collectibles." },
    { label: "Seller prep", value: "14 queued", detail: "Backstage shows are staged for tonight's launch window." },
    { label: "Trust alerts", value: "9 open", detail: "Admin oversight stays isolated from the storefront." }
];
const routeStageDeck = {
    Public: [
        { label: "Front-door energy", value: "High intent", detail: "Discovery and live bidding stay prominent for guests." },
        { label: "Conversion lane", value: "Browse -> Bid", detail: "Public pages move viewers into rooms without backend noise." },
        { label: "Account switching", value: "Seeded access", detail: "Buyer, seller, and admin sessions can be tested quickly." }
    ],
    Seller: [
        { label: "Launch state", value: "Backstage ready", detail: "Wheel, lots, and stream setup remain on the protected route." },
        { label: "Host tooling", value: "Unified control", detail: "Operators can prep the show without leaving seller space." },
        { label: "Buyer boundary", value: "Protected", detail: "Guests do not cross into stream controls or listing prep." }
    ],
    Admin: [
        { label: "Ops posture", value: "Restricted", detail: "Moderation and marketplace health stay isolated from conversion UI." },
        { label: "Read-across", value: "Full visibility", detail: "Admins can inspect public and seller areas from one shell." },
        { label: "Intervention lane", value: "Live oversight", detail: "Trust actions remain backstage instead of leaking into buyer flows." }
    ]
};
const routeActionDeck = {
    Public: [
        { label: "Open Discover", path: "/discover" },
        { label: "Watch Live", path: "/live" },
        { label: "Seller Hub", path: "/seller" }
    ],
    Seller: [
        { label: "Seller Hub", path: "/seller" },
        { label: "Public Home", path: "/" },
        { label: "Admin Suite", path: "/admin" }
    ],
    Admin: [
        { label: "Admin Suite", path: "/admin" },
        { label: "Live Floor", path: "/live" },
        { label: "Seller Hub", path: "/seller" }
    ]
};
function readStoredSession() {
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSession) {
        return null;
    }
    try {
        return JSON.parse(storedSession);
    }
    catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}
function roleHome(role) {
    if (role === "admin") {
        return dashboardRoutes.admin;
    }
    if (role === "seller") {
        return dashboardRoutes.seller;
    }
    return "/discover";
}
function getCurrentRoute(pathname) {
    if (pathname in routeMeta) {
        return routeMeta[pathname];
    }
    return routeMeta["/"];
}
function formatAreaPath(pathname) {
    if (pathname === "/") {
        return "Public / Home";
    }
    return pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" / ");
}
function formatAccessLabel(session) {
    if (!session) {
        return "Guest";
    }
    return `${session.role.charAt(0).toUpperCase()}${session.role.slice(1)} Access`;
}
function formatRouteAvailability(session) {
    if (!session) {
        return "Public only";
    }
    if (session.role === "admin") {
        return "Public + Seller + Admin";
    }
    if (session.role === "seller") {
        return "Public + Seller";
    }
    return "Public only";
}
function routeAccessSummary(session) {
    if (!session) {
        return "Guest route access is limited to the storefront.";
    }
    if (session.role === "admin") {
        return "Admin access spans every public and protected surface.";
    }
    if (session.role === "seller") {
        return "Seller access unlocks the storefront plus the seller workspace.";
    }
    return "Buyer access stays focused on the public shopping flow.";
}
class RouteSurfaceBoundary extends Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { hasError: false }
        });
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(_error, _info) { }
    render() {
        if (this.state.hasError) {
            return (_jsx("section", { className: "page-grid", children: _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Route Recovery" }), _jsxs("h2", { children: [this.props.routeLabel, " could not be rendered."] }), _jsx("p", { children: "The app recovered from a route failure instead of leaving a blank page. Refresh the page or return to the storefront, then reopen this area." })] }) }));
        }
        return this.props.children;
    }
}
function ProtectedRouteFallback({ allowedRoles, session }) {
    const allowedLabel = allowedRoles.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(" or ");
    const sellerAccount = seedAccounts.find((account) => account.role === "seller");
    return (_jsx("section", { className: "page-grid", children: _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Protected Route" }), _jsxs("h2", { children: [allowedLabel, " access is required for this page."] }), _jsx("p", { children: session
                        ? `${session.name} is signed in as ${session.role}. This route stays limited to ${allowedLabel.toLowerCase()} accounts.`
                        : "This route is no longer left blank for guests. Sign in from the home page with a seeded seller or admin account to continue." }), !session && sellerAccount ? (_jsxs("p", { children: ["Seller demo account: ", sellerAccount.email, " / ", sellerAccount.password] })) : null] }) }));
}
function ProtectedRoute({ allowedRoles, children, session }) {
    if (!session) {
        return _jsx(ProtectedRouteFallback, { allowedRoles: allowedRoles, session: session });
    }
    if (!allowedRoles.includes(session.role)) {
        return _jsx(ProtectedRouteFallback, { allowedRoles: allowedRoles, session: session });
    }
    return children;
}
export default function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const [session, setSession] = useState(() => readStoredSession());
    const [authError, setAuthError] = useState(null);
    const currentRoute = getCurrentRoute(location.pathname);
    const stageCards = routeStageDeck[currentRoute.area];
    const actionCards = routeActionDeck[currentRoute.area];
    useEffect(() => {
        if (session) {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            return;
        }
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }, [session]);
    function handleLogin(credentials) {
        const matchedAccount = seedAccounts.find((account) => account.email.toLowerCase() === credentials.email.trim().toLowerCase() &&
            account.password === credentials.password);
        if (!matchedAccount) {
            setAuthError("Email or password was incorrect. Use one of the seeded accounts below.");
            return false;
        }
        setSession({
            email: matchedAccount.email,
            name: matchedAccount.name,
            role: matchedAccount.role
        });
        setAuthError(null);
        navigate(roleHome(matchedAccount.role), true);
        return true;
    }
    function handleLogout() {
        setSession(null);
        setAuthError(null);
        navigate("/", true, { loginMessage: "You have been signed out." });
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsx("div", { className: "app-backdrop" }), _jsx(Nav, { onLogout: handleLogout, session: session }), _jsxs("main", { className: "app-main", children: [_jsxs("section", { className: "hero-banner", children: [_jsxs("div", { className: `hero-copy hero-copy-${currentRoute.area.toLowerCase()}`, children: [_jsx("span", { className: "hero-badge", children: currentRoute.eyebrow }), _jsx("h1", { children: currentRoute.title }), _jsx("p", { children: currentRoute.description }), _jsxs("div", { className: "hero-route-meta", children: [_jsxs("span", { className: "pill-label", children: [currentRoute.area, " Area"] }), _jsx("span", { className: "route-path", children: formatAreaPath(location.pathname) })] }), _jsxs("div", { className: "hero-cta-row", children: [_jsx("button", { className: "button-primary", onClick: () => navigate("/live"), type: "button", children: "Watch Live Auctions" }), _jsx("button", { className: "button-secondary", onClick: () => navigate("/seller"), type: "button", children: "Open Seller Control" })] }), _jsxs("div", { className: "hero-stat-strip", children: [_jsxs("div", { className: "hero-stat-chip", children: [_jsx("span", { children: "Public" }), _jsxs("strong", { children: [routeCounts.public, " routes"] })] }), _jsxs("div", { className: "hero-stat-chip", children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: session?.role === "seller" || session?.role === "admin" ? "Unlocked" : "Protected" })] }), _jsxs("div", { className: "hero-stat-chip", children: [_jsx("span", { children: "Admin" }), _jsx("strong", { children: session?.role === "admin" ? "Unlocked" : "Restricted" })] })] }), _jsx("div", { className: "hero-spotlight-grid", children: heroSpotlights.map((item) => (_jsxs("div", { className: "hero-spotlight-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value }), _jsx("p", { children: item.detail })] }, item.label))) }), _jsxs("div", { className: "hero-scene-grid", children: [_jsxs("div", { className: "hero-scene-panel", children: [_jsxs("div", { className: "hero-scene-topline", children: [_jsx("span", { className: "pill-label", children: "Route Stage" }), _jsxs("span", { className: "hero-scene-status", children: [currentRoute.area, " surface"] })] }), _jsx("strong", { children: formatAccessLabel(session) }), _jsx("p", { children: session
                                                            ? `${session.name} is navigating the ${currentRoute.area.toLowerCase()} lane while route guards preserve area boundaries.`
                                                            : "Guest access stays centered on storefront browsing until a seller or admin session is loaded." }), _jsx("div", { className: "hero-stage-card-grid", children: stageCards.map((card) => (_jsxs("div", { className: "hero-stage-card", children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value }), _jsx("p", { children: card.detail })] }, card.label))) })] }), _jsx("div", { className: "hero-stage-rail", children: actionCards.map((card) => (_jsxs("button", { className: "hero-stage-link", onClick: () => navigate(card.path), type: "button", children: [_jsx("span", { children: card.path }), _jsx("strong", { children: card.label })] }, `${currentRoute.area}-${card.path}`))) })] })] }), _jsxs("aside", { className: "hero-status-card", children: [_jsx("span", { className: "section-label", children: "Current Access" }), _jsx("strong", { children: session ? session.name : "Guest Visitor" }), _jsx("p", { children: session ? `${session.email} - ${session.role}` : "Browsing public routes only." }), _jsxs("div", { className: "access-lane-grid", children: [_jsxs("div", { className: "access-lane-card", children: [_jsx("span", { children: "Buyer lane" }), _jsx("strong", { children: "Discover + Live" })] }), _jsxs("div", { className: "access-lane-card", children: [_jsx("span", { children: "Seller lane" }), _jsx("strong", { children: "Backstage tools" })] }), _jsxs("div", { className: "access-lane-card", children: [_jsx("span", { children: "Admin lane" }), _jsx("strong", { children: "Trust + ops" })] })] }), _jsxs("div", { className: "hero-status-grid", children: [_jsxs("div", { children: [_jsx("span", { children: "Area" }), _jsx("strong", { children: currentRoute.area })] }), _jsxs("div", { children: [_jsx("span", { children: "Session" }), _jsx("strong", { children: formatAccessLabel(session) })] }), _jsxs("div", { children: [_jsx("span", { children: "Routes" }), _jsx("strong", { children: formatRouteAvailability(session) })] }), _jsxs("div", { children: [_jsx("span", { children: "Public" }), _jsxs("strong", { children: [routeCounts.public, " pages"] })] }), _jsxs("div", { children: [_jsx("span", { children: "Seller" }), _jsx("strong", { children: session?.role === "seller" || session?.role === "admin" ? `${routeCounts.seller} unlocked` : "Locked" })] }), _jsxs("div", { children: [_jsx("span", { children: "Admin" }), _jsx("strong", { children: session?.role === "admin" ? `${routeCounts.admin} unlocked` : "Locked" })] })] }), _jsxs("div", { className: "insight-panel", children: [_jsx("strong", { children: "Route separation" }), _jsx("p", { children: routeAccessSummary(session) })] }), _jsx("div", { className: "compact-grid compact-grid-3", children: workspaceSignals.map((signal) => (_jsxs("div", { className: "insight-panel", children: [_jsx("span", { children: signal.label }), _jsx("strong", { children: signal.value }), _jsx("p", { children: signal.detail })] }, signal.label))) }), _jsx("div", { className: "compact-grid compact-grid-3", children: areaLandingCards.map((card) => (_jsxs("div", { className: "insight-panel", children: [_jsx("span", { children: card.path }), _jsx("strong", { children: card.label }), _jsx("p", { children: card.detail })] }, card.path))) }), _jsxs("div", { className: "route-pill-row", children: [routeGroups.public.map((route) => (_jsx("span", { className: "route-pill", children: route.label }, route.path))), routeGroups.seller.map((route) => (_jsx("span", { className: "route-pill", children: route.label }, route.path))), routeGroups.admin.map((route) => (_jsx("span", { className: "route-pill", children: route.label }, route.path)))] })] })] }), _jsx("section", { className: "market-pulse-strip", "aria-label": "Marketplace pulse", children: marketPulse.map((item) => (_jsxs("article", { className: "market-pulse-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value }), _jsx("p", { children: item.detail })] }, item.label))) }), _jsxs(Routes, { children: [publicRoutes.map((route) => {
                                const Page = route.element;
                                return (_jsx(Route, { element: _jsx(Page, { authError: route.path === "/" ? authError : undefined, defaultAccounts: route.path === "/" ? seedAccounts : undefined, onLogin: route.path === "/" ? handleLogin : undefined, onLogout: route.path === "/" ? handleLogout : undefined, session: session }), path: route.path }, route.path));
                            }), _jsx(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["seller", "admin"], session: session, children: _jsx(RouteSurfaceBoundary, { routeLabel: "Seller dashboard", children: _jsx(SellerDashboard, { session: session }) }) }), path: dashboardRoutes.seller }), _jsx(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ["admin"], session: session, children: _jsx(RouteSurfaceBoundary, { routeLabel: "Admin dashboard", children: _jsx(AdminDashboard, { session: session }) }) }), path: dashboardRoutes.admin }), _jsx(Route, { element: _jsx(Navigate, { replace: true, to: "/" }), path: "*" })] })] })] }));
}
