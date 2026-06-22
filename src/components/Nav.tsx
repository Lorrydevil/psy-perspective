import { Link, NavLink } from "react-router-dom";
import type { AppSession } from "../App";

const navGroups = [
  {
    title: "Shop",
    items: [
      { href: "/", label: "Home", tag: "Public", description: "Front door, account entry, and featured moments" },
      { href: "/buyer-profile", label: "Buyer Profile", tag: "Public", description: "Saved buyer identity, checkout, and bidding defaults" },
      { href: "/discover", label: "Discover", tag: "Public", description: "Collections, launches, and seller spotlights" },
      { href: "/live", label: "Live", tag: "Public", description: "Active rooms, bid energy, and buyer momentum" }
    ]
  },
  {
    title: "Operate",
    items: [
      { href: "/seller", label: "Seller Hub", tag: "Seller", description: "Wheel settings, stream setup, and lot queue" },
      { href: "/seller/postal-service", label: "Postal Setup", tag: "Seller", description: "Carrier defaults, warehouse details, and return rules" },
      { href: "/admin", label: "Admin", tag: "Admin", description: "Trust, moderation, and marketplace operations" }
    ]
  }
] as const;

const sessionMoments = [
  "Guest browsing stays on the storefront.",
  "Sellers unlock stream prep and listing controls.",
  "Admins unlock full marketplace oversight."
] as const;

const quickStats = [
  { label: "Shows Tonight", value: "24" },
  { label: "Lots Queued", value: "1.2k" },
  { label: "Trust Alerts", value: "9" }
] as const;

const headerSignals = [
  { label: "Now Live", value: "32 rooms active", detail: "Luxury, cards, and sneakers are pulling the most bidders." },
  { label: "Fast Close", value: "11 lots in final call", detail: "Momentum stays high when buyers can jump straight into live rooms." },
  { label: "Seller Queue", value: "148 lots staged", detail: "Backstage tools keep upcoming listings warm and ready to launch." },
  { label: "Buyer Energy", value: "4.8k watchers", detail: "Saved profiles, alerts, and quick bid defaults are driving repeat joins." }
] as const;

const headerSpotlights = [
  { label: "Featured Room", value: "Luxury Revival", detail: "High-intent buyers are flowing from home straight into live lots." },
  {
    label: "Fast Lane",
    value: "Guest to bid-ready",
    detail: "Jump from the front door into discovery, profiles, and live rooms without losing momentum."
  }
] as const;

const headerRunway = [
  { label: "Discover Drop", value: "12 curated launches", tone: "warm" },
  { label: "Buyer Ready", value: "Saved bids + checkout", tone: "gold" },
  { label: "Live Momentum", value: "Final-call rooms surging", tone: "ink" }
] as const;

const quickAreaJump = [
  { label: "Front Door", href: "/", detail: "Public shopper entry and account switching." },
  { label: "Buyer Profile", href: "/buyer-profile", detail: "Manage buyer identity, shipping, payment, and saved bidding defaults." },
  { label: "Discover", href: "/discover", detail: "Buyer-facing browsing and scheduled drops." },
  { label: "Live Floor", href: "/live", detail: "Public stream viewing without operator controls." },
  { label: "Seller Hub", href: "/seller", detail: "Protected stream setup, wheel settings, and listings." },
  { label: "Postal Setup", href: "/seller/postal-service", detail: "Protected seller shipping, carrier, and warehouse setup." },
  { label: "Admin Suite", href: "/admin", detail: "Restricted moderation and marketplace ops." }
] as const;

const roleNavigation = [
  { role: "Buyer", label: "Home, Discover, Live", detail: "Customer journey stays fast and visual." },
  { role: "Seller", label: "Seller Hub", detail: "Stream prep, lots, and wheel controls stay backstage." },
  { role: "Admin", label: "Admin Suite", detail: "Moderation, disputes, and health stay operational." }
] as const;

function accessState(href: string, session: AppSession | null) {
  if (href === "/admin") {
    return session?.role === "admin" ? "Open" : "Admin only";
  }

  if (href.startsWith("/seller")) {
    return session?.role === "seller" || session?.role === "admin" ? "Open" : "Seller only";
  }

  return "Open";
}

function accessCopy(session: AppSession | null) {
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

export default function Nav({
  onLogout,
  session
}: {
  onLogout: () => void;
  session: AppSession | null;
}) {
  const repeatedHeaderSignals = [...headerSignals, ...headerSignals];

  return (
    <header className="nav-shell">
      <div className="nav-animated-bar" aria-label="Marketplace activity">
        <div className="nav-animated-track">
          {repeatedHeaderSignals.map((item, index) => (
            <div className="nav-signal-card" key={`${item.label}-${index}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="nav-topbar">
        <div className="nav-brand-panel">
          <div className="nav-brand">
            <div className="nav-mark">
              <span className="nav-mark-ring" aria-hidden="true" />
              <span>L</span>
            </div>
            <div className="nav-copy">
              <span className="pill-label">LoopLot</span>
              <strong>Live shopping stays fast, bright, and buyer-first from the first glance.</strong>
              <p>An animated marketplace header keeps the storefront focused on discovery, urgency, and active rooms.</p>
            </div>
          </div>
          <div className="nav-runway" aria-label="Marketplace highlights">
            {headerRunway.map((item) => (
              <div className={`nav-runway-pill nav-runway-pill-${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="nav-brand-metrics">
            {headerSpotlights.map((item) => (
              <div className="nav-spotlight-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="nav-utility-panel">
          <div className="nav-utility-row">
            <div className="nav-session-chip">
              <span className="section-label">{session ? "Signed In" : "Guest Session"}</span>
              <strong>{session ? session.name : "No active account"}</strong>
              <p>{session ? `${session.email} - ${session.role}` : "Sign in from home or create a buyer or seller account."}</p>
            </div>
            <div className="nav-actions">
              <Link className="button-secondary" to="/">
                {session ? "Switch Account" : "Open Login"}
              </Link>
              {session ? (
                <button className="button-primary" onClick={onLogout} type="button">
                  Sign Out
                </button>
              ) : null}
            </div>
          </div>
          <div className="compact-grid compact-grid-3 nav-stats-grid">
            {quickStats.map((item) => (
              <div className="insight-panel" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="nav-main">
        <nav aria-label="Primary" className="nav-links">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-header">
                <span className="section-label">{group.title}</span>
                <p>{group.title === "Shop" ? "Buyer-facing routes and live discovery." : "Protected operator and admin workspaces."}</p>
              </div>
              <div className="nav-group-links">
                {group.items.map((item) => (
                  <NavLink className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`} key={item.href} to={item.href}>
                    <span className="nav-tag">{item.tag}</span>
                    <strong>{item.label}</strong>
                    <span className="nav-link-copy">{item.description}</span>
                    <span className="nav-link-status">{accessState(item.href, session)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <aside className="nav-profile">
          <div className="list-card nav-profile-summary">
            <strong>Access</strong>
            <p>{accessCopy(session)}</p>
          </div>
          <div className="list-card nav-profile-summary">
            <strong>Session model</strong>
            <p>{sessionMoments.join(" ")}</p>
          </div>
          <div className="nav-role-lanes">
            {roleNavigation.map((item) => (
              <div className="nav-role-card" key={item.role}>
                <span>{item.role}</span>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="stack nav-quick-jumps">
            {quickAreaJump.map((item) => (
              <Link className="list-card nav-mini-link" key={item.href} to={item.href}>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
                <p>{accessState(item.href, session)}</p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </header>
  );
}
