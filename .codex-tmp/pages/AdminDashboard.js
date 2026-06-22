import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { routeGroups } from "../lib/router";
const adminMetrics = [
    { label: "Active Sellers", value: "428" },
    { label: "Open Incidents", value: "9" },
    { label: "Verification Queue", value: "12" },
    { label: "GMV Today", value: "$184k" }
];
const adminQueues = [
    {
        title: "Trust and Safety",
        detail: "Review seller verification issues, suspicious buyer activity, and reported stream incidents."
    },
    {
        title: "Catalog Quality",
        detail: "Fix uncategorized listings, missing metadata, and risky pricing anomalies before they surface publicly."
    },
    {
        title: "Disputes and Recovery",
        detail: "Handle chargebacks, shipment escalations, and seller support interventions from one control room."
    }
];
const adminLinks = [
    { title: "Public Home", detail: "Return to the buyer-facing landing page.", to: "/" },
    { title: "Discover", detail: "Inspect the public discovery experience.", to: "/discover" },
    { title: "Live", detail: "Preview the public stream environment.", to: "/live" },
    { title: "Seller", detail: "Check the operational seller backend from the admin side.", to: "/seller" }
];
const adminControlRules = [
    {
        title: "Restricted entry",
        detail: "Only the admin seeded account can access this route."
    },
    {
        title: "Separated operations",
        detail: "Moderation and marketplace controls do not mix into shopper or seller pages."
    },
    {
        title: "Cross-area visibility",
        detail: "Admins can inspect public and seller areas via shared navigation without collapsing the IA."
    }
];
const adminCoverage = [
    {
        title: "Public pages",
        detail: "Audit the storefront experience, featured categories, and live-room presentation."
    },
    {
        title: "Seller backend",
        detail: "Inspect stream setup, listing quality, and seller workflow health from a platform-ops lens."
    },
    {
        title: "Admin suite",
        detail: "Keep moderation, compliance, and recovery work restricted to one operations surface."
    }
];
const controlZones = [
    { title: "Moderation", detail: "Intervene on reports and risky live activity." },
    { title: "Seller compliance", detail: "Manage verification, policy, and trust requirements." },
    { title: "Marketplace health", detail: "Monitor disputes, catalog quality, and GMV signals." }
];
const adminIntent = [
    "Admin pages stay operational and restricted.",
    "Shared navigation allows inspection of public and seller surfaces without merging the UIs.",
    "Oversight remains separated from both shopper conversion flow and seller launch flow."
];
const adminRouteScope = [
    "Moderation remains on the admin route.",
    "Compliance remains on the admin route.",
    "Marketplace health operations remain on the admin route."
];
export default function AdminDashboard({ session }) {
    return (_jsxs("section", { className: "page-grid", children: [_jsxs("article", { className: "showcase-card span-8", children: [_jsx("span", { className: "section-label", children: "Admin Suite" }), _jsx("h2", { children: "Marketplace oversight stays restricted and independent from shopper and seller pages." }), _jsx("p", { children: session
                            ? `${session.name} is operating with admin access. This page is reserved for platform oversight, seller compliance, and marketplace health.`
                            : "Admin access is restricted." }), _jsx("div", { className: "metric-grid", children: adminMetrics.map((item) => (_jsxs("div", { className: "metric-card", children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value })] }, item.label))) })] }), _jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Admin Identity" }), _jsxs("div", { className: "stack", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Name" }), _jsx("p", { children: session?.name })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Email" }), _jsx("p", { children: session?.email })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Role" }), _jsx("p", { children: session?.role })] })] })] }), adminQueues.map((queue) => (_jsxs("article", { className: "page-card span-4", children: [_jsx("span", { className: "section-label", children: "Ops Queue" }), _jsx("h2", { children: queue.title }), _jsx("p", { children: queue.detail })] }, queue.title))), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Admin Responsibilities" }), _jsxs("div", { className: "card-grid-4", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Compliance" }), _jsx("p", { children: "Review onboarding, tax status, and policy issues before sellers can keep streaming." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Live Moderation" }), _jsx("p", { children: "Monitor reports, intervene on risky rooms, and enforce platform-wide behavior standards." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Catalog Health" }), _jsx("p", { children: "Correct listing issues that would otherwise degrade the buyer discovery experience." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Marketplace Recovery" }), _jsx("p", { children: "Manage disputes, payouts, and trust incidents from a dedicated operations surface." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Platform Navigation" }), _jsx("div", { className: "card-grid-4", children: adminLinks.map((item) => (_jsxs(Link, { className: "list-card", to: item.to, children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.to))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Area Oversight" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Public Surface" }), _jsxs("p", { children: [routeGroups.public.length, " public routes require catalog and moderation visibility from admin."] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Seller Surface" }), _jsxs("p", { children: [routeGroups.seller.length, " seller route exposes stream setup, wheel settings, live controls, and listing operations."] })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Admin Surface" }), _jsxs("p", { children: [routeGroups.admin.length, " restricted control room keeps marketplace intervention separated from shopper traffic."] })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Control Boundaries" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "No Buyer UI Mixing" }), _jsx("p", { children: "Admin moderation and operations stay off the public shopper pages to avoid clutter and accidental actions." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "No Seller UI Mixing" }), _jsx("p", { children: "Seller launch workflows remain in the seller hub while admin retains read-across visibility and escalation controls." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Shared Navigation" }), _jsx("p", { children: "Navigation between areas stays explicit, while route protection continues to enforce account permissions." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Admin Purpose" }), _jsxs("div", { className: "card-grid-3", children: [_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Operational Only" }), _jsx("p", { children: "This page is for marketplace controls, not buyer discovery or seller launch flow." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Read Across Areas" }), _jsx("p", { children: "Admins can inspect public and seller surfaces from shared navigation without collapsing them into one UI." })] }), _jsxs("div", { className: "list-card", children: [_jsx("strong", { children: "Restricted Entry" }), _jsx("p", { children: "Only the admin seeded account can access this route directly." })] })] })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Access Model" }), _jsx("div", { className: "card-grid-3", children: adminControlRules.map((rule) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: rule.title }), _jsx("p", { children: rule.detail })] }, rule.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Area Coverage" }), _jsx("div", { className: "card-grid-3", children: adminCoverage.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Control Zones" }), _jsx("div", { className: "card-grid-3", children: controlZones.map((item) => (_jsxs("div", { className: "list-card", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.detail })] }, item.title))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Admin Intent" }), _jsx("div", { className: "card-grid-3", children: adminIntent.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] }), _jsxs("article", { className: "page-card span-12", children: [_jsx("span", { className: "section-label", children: "Admin Route Scope" }), _jsx("div", { className: "card-grid-3", children: adminRouteScope.map((item) => (_jsx("div", { className: "list-card", children: _jsx("strong", { children: item }) }, item))) })] })] }));
}
