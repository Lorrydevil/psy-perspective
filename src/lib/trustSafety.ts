import { readStorageJSON, writeStorageJSON } from "./storage";

export const TRUST_INCIDENTS_STORAGE_KEY = "looplot-trust-incidents";
export const TRUST_SELLER_PROFILES_STORAGE_KEY = "looplot-trust-seller-profiles";
export const TRUST_SAFETY_UPDATED_EVENT = "looplot:trust-safety-updated";

export type TrustIncidentCategory =
  | "Counterfeit risk"
  | "Harassment"
  | "Payment issue"
  | "Misleading listing"
  | "Spam"
  | "Other";

export type TrustIncidentSeverity = "Low" | "Medium" | "High";
export type TrustIncidentStatus = "Open" | "Investigating" | "Resolved";
export type SellerVerificationStatus = "Verified" | "Pending review" | "Restricted";

export type TrustIncidentReport = {
  id: string;
  roomId: string;
  roomTitle: string;
  sellerName: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: "guest" | "buyer" | "seller" | "admin";
  category: TrustIncidentCategory;
  severity: TrustIncidentSeverity;
  detail: string;
  createdAt: string;
  status: TrustIncidentStatus;
  actionSummary: string;
};

export type SellerTrustProfile = {
  sellerEmail: string;
  sellerName: string;
  verificationStatus: SellerVerificationStatus;
  complianceScore: number;
  strikeCount: number;
  payoutHold: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  watchlist: boolean;
  lastReviewAt: string;
  reviewNote: string;
};

type CreateIncidentInput = {
  roomId: string;
  roomTitle: string;
  sellerName: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: TrustIncidentReport["reporterRole"];
  category: TrustIncidentCategory;
  severity: TrustIncidentSeverity;
  detail: string;
};

const seededSellerProfiles: SellerTrustProfile[] = [
  {
    sellerEmail: "seller@looplot.com",
    sellerName: "Studio Seller",
    verificationStatus: "Verified",
    complianceScore: 94,
    strikeCount: 0,
    payoutHold: false,
    idVerified: true,
    addressVerified: true,
    watchlist: false,
    lastReviewAt: "2026-05-18T09:00:00.000Z",
    reviewNote: "Identity, address, and payout onboarding were cleared for live selling."
  }
];

const seededIncidentReports: TrustIncidentReport[] = [
  {
    id: "incident-seeded-1",
    roomId: "seller-live-seller-looplot-com",
    roomTitle: "Studio Seller Launch Room",
    sellerName: "Studio Seller",
    reporterName: "Buyer Ops Monitor",
    reporterEmail: "buyerops@looplot.com",
    reporterRole: "admin",
    category: "Misleading listing",
    severity: "Medium",
    detail: "Opening lot copy mentioned a certificate photo that was not visible in the room preview.",
    createdAt: "2026-05-18T07:40:00.000Z",
    status: "Investigating",
    actionSummary: "Moderator asked the seller to pin proof photos before relisting the lot."
  },
  {
    id: "incident-seeded-2",
    roomId: "seeded-luxury-revival",
    roomTitle: "Luxury Revival",
    sellerName: "Gold Room Auctions",
    reporterName: "Guest Viewer",
    reporterEmail: "guest@looplot.local",
    reporterRole: "guest",
    category: "Harassment",
    severity: "High",
    detail: "Viewer reported aggressive callouts in live chat during final call on lot 42.",
    createdAt: "2026-05-17T22:15:00.000Z",
    status: "Open",
    actionSummary: "Pending moderator review."
  }
];

function readStorage<T>(key: string): T[] {
  return readStorageJSON(
    key,
    [] as T[],
    (value) => (Array.isArray(value) ? (value as T[]) : []),
    { clearInvalid: false }
  );
}

function writeStorage<T>(key: string, value: T[]) {
  writeStorageJSON(key, value, TRUST_SAFETY_UPDATED_EVENT);
}

export function readTrustIncidentReports() {
  const storedReports = readStorage<TrustIncidentReport>(TRUST_INCIDENTS_STORAGE_KEY);
  return storedReports.length > 0 ? storedReports : seededIncidentReports;
}

export function createTrustIncidentReport(input: CreateIncidentInput) {
  const nextReports = [
    {
      id: `incident-${Date.now()}`,
      roomId: input.roomId,
      roomTitle: input.roomTitle,
      sellerName: input.sellerName,
      reporterName: input.reporterName.trim() || "Guest Viewer",
      reporterEmail: input.reporterEmail.trim() || "guest@looplot.local",
      reporterRole: input.reporterRole,
      category: input.category,
      severity: input.severity,
      detail: input.detail.trim(),
      createdAt: new Date().toISOString(),
      status: "Open" as const,
      actionSummary: "Awaiting trust and safety review."
    },
    ...readTrustIncidentReports()
  ];

  writeStorage(TRUST_INCIDENTS_STORAGE_KEY, nextReports);
  return nextReports[0];
}

export function updateTrustIncidentStatus(
  incidentId: string,
  status: TrustIncidentStatus,
  actionSummary: string
) {
  const nextReports = readTrustIncidentReports().map((incident) =>
    incident.id === incidentId
      ? {
          ...incident,
          status,
          actionSummary: actionSummary.trim() || incident.actionSummary
        }
      : incident
  );

  writeStorage(TRUST_INCIDENTS_STORAGE_KEY, nextReports);
}

export function readSellerTrustProfiles() {
  const storedProfiles = readStorage<SellerTrustProfile>(TRUST_SELLER_PROFILES_STORAGE_KEY);
  return storedProfiles.length > 0 ? storedProfiles : seededSellerProfiles;
}

export function getSellerTrustProfile(session: { email?: string | null; name?: string | null } | null) {
  if (!session?.email) {
    return null;
  }

  const email = session.email.trim().toLowerCase();
  const storedProfiles = readSellerTrustProfiles();
  const matchedProfile = storedProfiles.find((profile) => profile.sellerEmail.toLowerCase() === email);

  if (matchedProfile) {
    return matchedProfile;
  }

  return {
    sellerEmail: email,
    sellerName: session.name?.trim() || "Seller",
    verificationStatus: "Pending review" as const,
    complianceScore: 72,
    strikeCount: 0,
    payoutHold: false,
    idVerified: false,
    addressVerified: false,
    watchlist: false,
    lastReviewAt: new Date().toISOString(),
    reviewNote: "Seller profile has not completed trust review yet."
  };
}

export function upsertSellerTrustProfile(profile: SellerTrustProfile) {
  const nextProfiles = [...readSellerTrustProfiles()];
  const existingIndex = nextProfiles.findIndex(
    (currentProfile) => currentProfile.sellerEmail.toLowerCase() === profile.sellerEmail.toLowerCase()
  );

  if (existingIndex >= 0) {
    nextProfiles[existingIndex] = profile;
  } else {
    nextProfiles.push(profile);
  }

  writeStorage(TRUST_SELLER_PROFILES_STORAGE_KEY, nextProfiles);
}

export function getTrustSafetySummary() {
  const incidents = readTrustIncidentReports();
  const sellers = readSellerTrustProfiles();

  return {
    openIncidents: incidents.filter((incident) => incident.status === "Open").length,
    activeInvestigations: incidents.filter((incident) => incident.status === "Investigating").length,
    restrictedSellers: sellers.filter((profile) => profile.verificationStatus === "Restricted").length,
    verificationQueue: sellers.filter((profile) => profile.verificationStatus === "Pending review").length
  };
}
