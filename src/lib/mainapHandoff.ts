const ACCESS_TOKEN_KEY = "mainap-access-token";
const REFRESH_TOKEN_KEY = "mainap-refresh-token";
const HANDOFF_MARKER_KEY = "mainap-auth-handoff";

type JwtPayload = {
  email?: unknown;
  role?: unknown;
  app_metadata?: {
    role?: unknown;
    user_role?: unknown;
  };
  user_metadata?: {
    name?: unknown;
    full_name?: unknown;
    display_name?: unknown;
    role?: unknown;
  };
  user_role?: unknown;
  name?: unknown;
  full_name?: unknown;
};

export type MainapHandoffSession = {
  accessToken: string;
  refreshToken: string;
  actorEmail: string;
  actorName?: string;
  actorRole: "admin" | "member";
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return window.atob(`${normalized}${"=".repeat(padding)}`);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(segments[1])) as JwtPayload;
  } catch (error) {
    console.error("[psyperspective] Failed to decode MainAP handoff JWT payload.", error);
    return null;
  }
}

function normalizeRole(payload: JwtPayload | null): "admin" | "member" {
  const roleCandidate =
    payload?.role ??
    payload?.user_role ??
    payload?.app_metadata?.role ??
    payload?.app_metadata?.user_role ??
    payload?.user_metadata?.role;

  return typeof roleCandidate === "string" && roleCandidate.toLowerCase() === "admin" ? "admin" : "member";
}

function normalizeName(payload: JwtPayload | null) {
  const nameCandidate =
    payload?.user_metadata?.full_name ??
    payload?.user_metadata?.display_name ??
    payload?.user_metadata?.name ??
    payload?.full_name ??
    payload?.name;

  return typeof nameCandidate === "string" && nameCandidate.trim() ? nameCandidate.trim() : undefined;
}

function clearHandoffParams(url: URL) {
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  hashParams.delete(ACCESS_TOKEN_KEY);
  hashParams.delete(REFRESH_TOKEN_KEY);
  hashParams.delete(HANDOFF_MARKER_KEY);
  url.searchParams.delete(ACCESS_TOKEN_KEY);
  url.searchParams.delete(REFRESH_TOKEN_KEY);
  url.searchParams.delete(HANDOFF_MARKER_KEY);

  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : "";
  window.history.replaceState({}, document.title, url.toString());
}

export function readMainapHandoffSession(): MainapHandoffSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const searchParams = url.searchParams;
  const accessToken = hashParams.get(ACCESS_TOKEN_KEY) || searchParams.get(ACCESS_TOKEN_KEY) || "";
  const refreshToken = hashParams.get(REFRESH_TOKEN_KEY) || searchParams.get(REFRESH_TOKEN_KEY) || "";
  const hasHandoffMarker =
    hashParams.get(HANDOFF_MARKER_KEY) === "1" || searchParams.get(HANDOFF_MARKER_KEY) === "1";

  console.log("[psyperspective] MainAP handoff params detected.", {
    hasHandoffMarker,
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken)
  });

  if (!hasHandoffMarker && !accessToken && !refreshToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const actorEmail = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";

  clearHandoffParams(url);

  if (!actorEmail) {
    console.warn("[psyperspective] MainAP handoff token did not include an email claim.");
    return null;
  }

  const session = {
    accessToken,
    refreshToken,
    actorEmail,
    actorName: normalizeName(payload),
    actorRole: normalizeRole(payload)
  } satisfies MainapHandoffSession;

  console.log("[psyperspective] MainAP handoff session imported.", {
    actorEmail: session.actorEmail,
    actorRole: session.actorRole
  });

  return session;
}
