import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AppSession } from "../App";
import { routeGroups } from "../lib/router";
import {
  getTrustSafetySummary,
  readSellerTrustProfiles,
  readTrustIncidentReports,
  TRUST_SAFETY_UPDATED_EVENT,
  updateTrustIncidentStatus,
  upsertSellerTrustProfile,
  type SellerTrustProfile,
  type TrustIncidentReport
} from "../lib/trustSafety";

const adminLinks = [
  { title: "Public Home", detail: "Return to the buyer-facing landing page.", to: "/" },
  { title: "Discover", detail: "Inspect the public discovery experience.", to: "/discover" },
  { title: "Live", detail: "Review live rooms where new incident reports originate.", to: "/live" },
  { title: "Seller", detail: "Check the seller workflow and compliance surface.", to: "/seller" }
] as const;

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildIncidentActionSummary(status: TrustIncidentReport["status"]) {
  if (status === "Investigating") {
    return "Moderator review is active and seller follow-up is now required.";
  }

  if (status === "Resolved") {
    return "Issue resolved and closed with trust notes captured for audit.";
  }

  return "Pending moderator review.";
}

function nextVerificationProfile(profile: SellerTrustProfile, status: SellerTrustProfile["verificationStatus"]) {
  const complianceFlags = [profile.idVerified, profile.addressVerified, !profile.payoutHold].filter(Boolean).length;
  const complianceScore = Math.min(99, 58 + complianceFlags * 12 - profile.strikeCount * 8 + (status === "Verified" ? 8 : 0));

  return {
    ...profile,
    verificationStatus: status,
    complianceScore,
    watchlist: status !== "Verified" || profile.strikeCount > 0,
    lastReviewAt: new Date().toISOString(),
    reviewNote:
      status === "Verified"
        ? "Admin cleared the seller for live trading and payouts."
        : status === "Restricted"
          ? "Admin restricted the seller pending trust and safety remediation."
          : "Seller remains in the review queue until compliance blockers are cleared."
  };
}

export default function AdminDashboard({ session }: { session: AppSession | null }) {
  const [incidents, setIncidents] = useState<TrustIncidentReport[]>(() => readTrustIncidentReports());
  const [sellerProfiles, setSellerProfiles] = useState<SellerTrustProfile[]>(() => readSellerTrustProfiles());

  useEffect(() => {
    function syncTrustSafety() {
      setIncidents(readTrustIncidentReports());
      setSellerProfiles(readSellerTrustProfiles());
    }

    window.addEventListener(TRUST_SAFETY_UPDATED_EVENT, syncTrustSafety);
    return () => window.removeEventListener(TRUST_SAFETY_UPDATED_EVENT, syncTrustSafety);
  }, []);

  const summary = getTrustSafetySummary();
  const highSeverityOpenCount = incidents.filter(
    (incident) => incident.status !== "Resolved" && incident.severity === "High"
  ).length;
  const reviewQueue = sellerProfiles.filter((profile) => profile.verificationStatus !== "Verified");
  const recentIncidents = incidents.slice(0, 6);
  const publicRouteCount = Number(routeGroups.public.length);
  const sellerRouteCount = Number(routeGroups.seller.length);
  const adminRouteCount = Number(routeGroups.admin.length);

  function handleIncidentStatusChange(incidentId: string, status: TrustIncidentReport["status"]) {
    updateTrustIncidentStatus(incidentId, status, buildIncidentActionSummary(status));
    setIncidents(readTrustIncidentReports());
  }

  function handleSellerVerificationStatus(
    sellerEmail: string,
    status: SellerTrustProfile["verificationStatus"]
  ) {
    const currentProfile = sellerProfiles.find(
      (profile) => profile.sellerEmail.toLowerCase() === sellerEmail.toLowerCase()
    );

    if (!currentProfile) {
      return;
    }

    upsertSellerTrustProfile(nextVerificationProfile(currentProfile, status));
    setSellerProfiles(readSellerTrustProfiles());
  }

  return (
    <section className="page-grid">
      <article className="showcase-card span-8">
        <span className="section-label">Trust And Safety Systems</span>
        <h2>The admin route now operates as a live trust console instead of a static placeholder.</h2>
        <p>
          {session
            ? `${session.name} can now review incident intake, seller verification state, and enforcement posture from one restricted surface.`
            : "Admin access is restricted."}
        </p>
        <div className="metric-grid">
          <div className="metric-card">
            <span>Open incidents</span>
            <strong>{summary.openIncidents}</strong>
          </div>
          <div className="metric-card">
            <span>Investigations</span>
            <strong>{summary.activeInvestigations}</strong>
          </div>
          <div className="metric-card">
            <span>Review queue</span>
            <strong>{summary.verificationQueue}</strong>
          </div>
          <div className="metric-card">
            <span>Restricted sellers</span>
            <strong>{summary.restrictedSellers}</strong>
          </div>
        </div>
      </article>

      <article className="page-card span-4">
        <span className="section-label">Risk Snapshot</span>
        <div className="stack">
          <div className="list-card">
            <strong>{highSeverityOpenCount} high-severity alert{highSeverityOpenCount === 1 ? "" : "s"}</strong>
            <p>These should be reviewed before the next launch window opens.</p>
          </div>
          <div className="list-card">
            <strong>{reviewQueue.length} seller{reviewQueue.length === 1 ? "" : "s"} need action</strong>
            <p>Verification, payout, or watchlist blockers are still open.</p>
          </div>
          <div className="list-card">
            <strong>{adminRouteCount} restricted admin route</strong>
            <p>Moderation remains separated from buyer conversion and seller launch tooling.</p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Incident Queue</span>
        <div className="card-grid-2">
          {recentIncidents.map((incident) => (
            <div className="list-card" key={incident.id}>
              <span className="card-kicker">
                {incident.severity} severity · {incident.category}
              </span>
              <strong>{incident.roomTitle}</strong>
              <p>{incident.detail}</p>
              <p>
                {incident.sellerName} · Reported by {incident.reporterName} · {formatTimestamp(incident.createdAt)}
              </p>
              <p>Status: {incident.status}</p>
              <p>{incident.actionSummary}</p>
              <div className="nav-actions">
                <button
                  className="button-secondary"
                  onClick={() => handleIncidentStatusChange(incident.id, "Open")}
                  type="button"
                >
                  Mark Open
                </button>
                <button
                  className="button-secondary"
                  onClick={() => handleIncidentStatusChange(incident.id, "Investigating")}
                  type="button"
                >
                  Investigate
                </button>
                <button
                  className="button-primary"
                  onClick={() => handleIncidentStatusChange(incident.id, "Resolved")}
                  type="button"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Seller Verification</span>
        <div className="card-grid-3">
          {sellerProfiles.map((profile) => (
            <div className="list-card" key={profile.sellerEmail}>
              <span className="card-kicker">{profile.verificationStatus}</span>
              <strong>{profile.sellerName}</strong>
              <p>{profile.reviewNote}</p>
              <p>
                Compliance score {profile.complianceScore} · {profile.strikeCount} strike
                {profile.strikeCount === 1 ? "" : "s"}
              </p>
              <p>
                ID {profile.idVerified ? "verified" : "pending"} · Address{" "}
                {profile.addressVerified ? "verified" : "pending"} · Payout{" "}
                {profile.payoutHold ? "held" : "clear"}
              </p>
              <div className="nav-actions">
                <button
                  className="button-secondary"
                  onClick={() => handleSellerVerificationStatus(profile.sellerEmail, "Pending review")}
                  type="button"
                >
                  Queue Review
                </button>
                <button
                  className="button-secondary"
                  onClick={() => handleSellerVerificationStatus(profile.sellerEmail, "Restricted")}
                  type="button"
                >
                  Restrict
                </button>
                <button
                  className="button-primary"
                  onClick={() => handleSellerVerificationStatus(profile.sellerEmail, "Verified")}
                  type="button"
                >
                  Verify
                </button>
              </div>
              <p>Last reviewed {formatTimestamp(profile.lastReviewAt)}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Platform Controls</span>
        <div className="card-grid-4">
          <div className="list-card">
            <strong>Live room intake</strong>
            <p>Buyer and admin reports now enter a shared incident queue that can be updated from this page.</p>
          </div>
          <div className="list-card">
            <strong>Seller verification</strong>
            <p>Compliance states can be moved between review, verified, and restricted without leaving admin.</p>
          </div>
          <div className="list-card">
            <strong>Route separation</strong>
            <p>Admin trust tooling stays isolated from the storefront and seller launch interfaces.</p>
          </div>
          <div className="list-card">
            <strong>Coverage</strong>
            <p>
              {publicRouteCount} public routes, {sellerRouteCount} seller routes, and {adminRouteCount} admin route now
              feed one trust console.
            </p>
          </div>
        </div>
      </article>

      <article className="page-card span-12">
        <span className="section-label">Platform Navigation</span>
        <div className="card-grid-4">
          {adminLinks.map((item) => (
            <Link className="list-card" key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
