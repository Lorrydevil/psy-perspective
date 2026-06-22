import type {
  AccountSettings,
  CreateFormState,
  Exercise,
  MessageDraft,
  PersistedState,
  ScoreDraft,
  SocialComment,
  SocialPost,
  SocialReactionKey,
  SocialState
} from "../psy/types";

const SESSION_TOKEN_KEY = "psy-perspective-session-token";
const MIGRATION_FLAG_KEY = "psy-perspective-backend-migration-complete";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

type BootstrapPayload = Pick<
  PersistedState,
  "appState" | "authState" | "accountSettings" | "messages" | "createDrafts" | "socialState"
>;

async function request<T>(path: string, init?: RequestInit) {
  const token = getSessionToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Not found");
    }

    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error || `Request failed: ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Not found");
  }

  return (await response.json()) as T;
}

export function getSessionToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(SESSION_TOKEN_KEY) ?? "";
}

function setSessionToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export function hasCompletedLegacyMigration() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
}

export function markLegacyMigrationComplete() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MIGRATION_FLAG_KEY, "true");
}

export async function getBootstrap() {
  return request<BootstrapPayload>("/api/bootstrap", { method: "GET" });
}

export async function login(email: string, password: string) {
  const payload = await request<{ token: string; bootstrap: BootstrapPayload }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setSessionToken(payload.token);
  return payload.bootstrap;
}

export async function register(name: string, email: string, password: string, role: string) {
  const payload = await request<{ token: string; bootstrap: BootstrapPayload }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role })
  });
  setSessionToken(payload.token);
  return payload.bootstrap;
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  setSessionToken("");
}

export async function migrateLegacyData(payload: PersistedState) {
  return request<{ migrated: boolean }>("/api/migration/import", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function saveAccount(
  name: string,
  email: string,
  password: string,
  accountSettings: AccountSettings
) {
  const payload = await request<{ bootstrap: BootstrapPayload }>("/api/account", {
    method: "PUT",
    body: JSON.stringify({ name, email, password, accountSettings })
  });
  return payload.bootstrap;
}

export async function saveCreateDraft(draft: CreateFormState) {
  await request("/api/drafts/create", {
    method: "PUT",
    body: JSON.stringify(draft)
  });
}

export async function createExercise(
  exercise: Omit<Exercise, "id" | "exerciseNumber" | "creatorId" | "createdAt" | "predictions" | "scores" | "status">
) {
  const payload = await request<{ exercise: Exercise }>("/api/exercises", {
    method: "POST",
    body: JSON.stringify(exercise)
  });
  return payload.exercise;
}

export async function updateExercise(
  exerciseId: string,
  exercise: Omit<Exercise, "id" | "exerciseNumber" | "creatorId" | "createdAt" | "predictions" | "scores" | "status">
) {
  const payload = await request<{ exercise: Exercise }>(`/api/exercises/${exerciseId}`, {
    method: "PUT",
    body: JSON.stringify(exercise)
  });
  return payload.exercise;
}

export async function savePrediction(exerciseId: string, prediction: { id?: string; imageData: string; notes: string }) {
  const payload = await request<{ exercise: Exercise }>(`/api/exercises/${exerciseId}/prediction`, {
    method: "PUT",
    body: JSON.stringify(prediction)
  });
  return payload.exercise;
}

export async function saveScore(exerciseId: string, predictionId: string, score: ScoreDraft) {
  const payload = await request<{ exercise: Exercise }>(`/api/exercises/${exerciseId}/scores/${predictionId}`, {
    method: "PUT",
    body: JSON.stringify(score)
  });
  return payload.exercise;
}

export async function sendMessage(message: MessageDraft & { subject: string; body: string }) {
  const payload = await request<{ message: PersistedState["messages"][number] }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(message)
  });
  return payload.message;
}

export async function markMessagesRead(messageIds: string[]) {
  if (messageIds.length === 0) {
    return;
  }

  await request("/api/messages/read", {
    method: "PUT",
    body: JSON.stringify({ messageIds })
  });
}

export async function publishSocialPost(post: { headline: string; body: string; exerciseId: string }) {
  const payload = await request<{ post: SocialPost; socialState: SocialState }>("/api/social/posts", {
    method: "POST",
    body: JSON.stringify(post)
  });
  return payload;
}

export async function getSocialState() {
  const payload = await request<{ socialState: SocialState }>("/api/social/state", {
    method: "GET"
  });
  return payload.socialState;
}

export async function toggleSocialReaction(postId: string, reaction: SocialReactionKey) {
  const payload = await request<{ socialState: SocialState }>(`/api/social/posts/${postId}/reactions`, {
    method: "PUT",
    body: JSON.stringify({ reaction })
  });
  return payload.socialState;
}

export async function addSocialComment(postId: string, body: string) {
  const payload = await request<{ comment: SocialComment; socialState: SocialState }>(`/api/social/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
  return payload;
}
