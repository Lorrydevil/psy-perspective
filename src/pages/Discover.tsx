import { Link } from "react-router-dom";
import type { AppSession } from "../App";
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
] as const;

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
] as const;

const merchSignals = [
  { label: "Featured channels", value: "36" },
  { label: "Drops in next hour", value: "11" },
  { label: "Categories trending", value: "8" }
] as const;

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
] as const;

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
] as const;

export default function Discover({ session }: { session: AppSession | null }) {
  return (
    <section className="page-grid">
      <article className="showcase-card span-8">
        <span className="section-label">Discover</span>
        <h2>Discovery now feels merchandised, time-aware, and clearly shopper-facing.</h2>
        <p>
          {session
            ? `${session.name} can move through discovery while their ${session.role} permissions continue to control backend access.`
            : "Guests can browse the marketplace before signing in, while seller stream controls and admin areas remain protected."}
        </p>
        <div className="discovery-highlight-row">
          {merchColumns.map((item) => (
            <div className="feature-card" key={item.title}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
        <div className="compact-grid compact-grid-3">
          {merchSignals.map((item) => (
            <div className="insight-panel" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className="card-grid-3">
          {discoveryRows.map((item) => (
            <div className="list-card" key={item.title}>
              <span className="card-kicker">{item.meta}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-4">
        <span className="section-label">Tonight's Schedule</span>
        <div className="stack">
          {launchMoments.map((launch) => (
            <div className="list-card" key={launch}>
              <strong>{launch}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Route Handoff</span>
        <div className="card-grid-4">
          {discoveryHandoffs.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Public Navigation Model</span>
        <div className="card-grid-3">
          <div className="list-card">
            <strong>Browse First</strong>
            <p>Discovery keeps the buyer journey focused on categories, launches, and seller visibility.</p>
          </div>
          <div className="list-card">
            <strong>Jump to Live</strong>
            <p>Shoppers can move from browse mode to active rooms without crossing into backend tools.</p>
          </div>
          <div className="list-card">
            <strong>Protected Backends</strong>
            <p>Seller and admin destinations remain visible in navigation but still enforce account-level access and route guards.</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Route Coverage</span>
        <div className="card-grid-3">
          <div className="list-card">
            <strong>Public</strong>
            <p>{routeGroups.public.length} shopper-facing routes stay open to guests.</p>
          </div>
          <div className="list-card">
            <strong>Seller</strong>
            <p>{routeGroups.seller.length} backend route stays dedicated to stream setup and listings.</p>
          </div>
          <div className="list-card">
            <strong>Admin</strong>
            <p>{routeGroups.admin.length} restricted route holds moderation and marketplace controls.</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Area Separation</span>
        <div className="card-grid-3">
          {areaHighlights.map((item) => (
            <div className="list-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Current Access View</span>
        <div className="card-grid-3">
          {accessStates.map((item) => (
            <div className="list-card" key={item.area}>
              <strong>{item.area}</strong>
              <p>{typeof item.state === "function" ? item.state(session?.role) : item.state}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Boundary Rules</span>
        <div className="card-grid-3">
          {discoveryBoundaries.map((item) => (
            <div className="list-card" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Discovery Intent</span>
        <div className="card-grid-3">
          <div className="list-card">
            <strong>Browse first</strong>
            <p>Merchandise categories, launches, and channels without exposing backstage controls.</p>
          </div>
          <div className="list-card">
            <strong>Hand off to live</strong>
            <p>Move interested shoppers from discovery into active rooms with minimal friction.</p>
          </div>
          <div className="list-card">
            <strong>Keep operations separate</strong>
            <p>Seller and admin routes remain visible but operationally distinct from this page.</p>
          </div>
        </div>
      </article>
    </section>
  );
}
