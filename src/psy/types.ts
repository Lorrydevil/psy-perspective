export type UserRole = "creator" | "viewer" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  source: "seeded" | "registered";
  createdAt: string;
};

export type AccountSettings = {
  communityAlias: string;
  profileNote: string;
  focusMode: "structured" | "freeform";
  revealAlerts: boolean;
};

export type UserMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  exerciseId: string | null;
  subject: string;
  body: string;
  createdAt: string;
  readBy: string[];
};

export type MessageDraft = {
  recipientId: string;
  exerciseId: string;
  subject: string;
  body: string;
};

export type Prediction = {
  id: string;
  userId: string;
  submittedAt: string;
  imageData: string;
  notes: string;
  entryNumber: number;
};

export type Score = {
  predictionId: string;
  userId: string;
  accuracy: number;
  comment: string;
};

export type Exercise = {
  id: string;
  exerciseNumber: number;
  title: string;
  blindCue: string;
  viewerPrompt: string;
  hiddenTarget: string;
  revealSummary: string;
  targetImageData: string;
  targetImageName: string;
  creatorId: string;
  coCreatorIds: string[];
  createdAt: string;
  startsAt: string;
  closesAt: string;
  status: "draft" | "scheduled" | "active" | "closed";
  revealPolicy: "on_expiry" | "on_completion" | "on_start";
  maxEntriesPerViewer: number;
  predictions: Prediction[];
  scores: Score[];
};

export type CreateFormState = {
  exerciseId: string;
  exerciseNumber: number | null;
  title: string;
  blindCue: string;
  viewerPrompt: string;
  hiddenTarget: string;
  revealSummary: string;
  targetImageData: string;
  targetImageName: string;
  startsAt: string;
  durationHours: string;
  maxEntriesPerViewer: string;
  revealPolicy: Exercise["revealPolicy"];
  coCreatorIds: string[];
  publishMode: "draft" | "publish";
};

export type AppState = {
  activeUserId: string;
  exercises: Exercise[];
};

export type AuthState = {
  accounts: User[];
  activeUserId: string | null;
};

export type PersistedState = {
  version: number;
  appState: AppState;
  authState: AuthState;
  accountSettings: Record<string, AccountSettings>;
  messages: UserMessage[];
  createDrafts: Record<string, CreateFormState>;
  socialState: SocialState;
};

export type AccountFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  communityAlias: string;
  profileNote: string;
  focusMode: AccountSettings["focusMode"];
  revealAlerts: boolean;
};

export type ScoreDraft = {
  accuracy: number;
  comment: string;
};

export const appPaths = ["/", "/account", "/messages", "/social", "/exercises", "/workspace", "/review", "/analytics", "/console"] as const;

export type AppPath = (typeof appPaths)[number];

export type SidebarItem = {
  path: AppPath;
  label: string;
  detail: string;
};

export type SocialPost = {
  id: string;
  authorId: string;
  kind: "creator_update" | "viewer_spotlight" | "reveal" | "system";
  headline: string;
  body: string;
  createdAt: string;
  exerciseId: string | null;
  statsLabel: string;
  audience: string;
  ctaLabel: string;
  ctaPath: AppPath;
};

export type SocialReactionKey = "resonates" | "curious" | "sharp";

export type SocialComment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type SocialPostInteraction = {
  reactions: Record<SocialReactionKey, string[]>;
  comments: SocialComment[];
};

export type SocialPostDraft = {
  headline: string;
  body: string;
  exerciseId: string;
};

export type SocialState = {
  customPosts: Array<SocialPost & { kind: "creator_update" }>;
  interactions: Record<string, SocialPostInteraction>;
};

export function isAppPath(pathname: string): pathname is AppPath {
  return (appPaths as readonly string[]).includes(pathname);
}

export function isCreatorRole(role: UserRole) {
  return role === "creator" || role === "admin";
}

export function getRoleLabel(role: UserRole) {
  if (role === "admin") {
    return "Admin";
  }

  return role === "creator" ? "Target Creator" : "Viewer";
}

export function getWorkspaceLabel(role: UserRole) {
  if (role === "admin") {
    return "Admin Console";
  }

  return role === "creator" ? "Creator Console" : "Prediction Pad";
}
