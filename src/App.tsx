import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "../styles.css";
import PsySidebar from "./components/PsySidebar";
import {
  addSocialComment as addSocialCommentRequest,
  createExercise as createExerciseRequest,
  getBootstrap,
  getSocialState as getSocialStateRequest,
  getSessionToken,
  hasCompletedLegacyMigration,
  login,
  logout,
  markLegacyMigrationComplete,
  markMessagesRead,
  migrateLegacyData,
  register,
  saveAccount,
  saveCreateDraft,
  publishSocialPost as publishSocialPostRequest,
  savePrediction as savePredictionRequest,
  saveScore as saveScoreRequest,
  sendMessage as sendMessageRequest,
  toggleSocialReaction as toggleSocialReactionRequest,
  updateExercise as updateExerciseRequest
} from "./lib/api";
import { readDatabaseJSON, readStorageJSON, writeDatabaseJSON, writeStorageJSON } from "./lib/storage";
import AccountSettingsPage from "./pages/psy/AccountSettingsPage";
import AnalyticsPage from "./pages/psy/AnalyticsPage";
import ExerciseConsolePage from "./pages/psy/ExerciseConsolePage";
import ExercisesPage from "./pages/psy/ExercisesPage";
import MessagesPage from "./pages/psy/MessagesPage";
import OverviewPage from "./pages/psy/OverviewPage";
import ReviewPage from "./pages/psy/ReviewPage";
import SocialPostsPage from "./pages/psy/SocialPostsPage";
import WorkspacePage from "./pages/psy/WorkspacePage";
import type {
  AccountFormState,
  AccountSettings,
  AppState,
  AuthState,
  CreateFormState,
  Exercise,
  MessageDraft,
  PersistedState,
  Prediction,
  Score,
  ScoreDraft,
  SidebarItem,
  SocialComment,
  SocialPost,
  SocialPostDraft,
  SocialPostInteraction,
  SocialReactionKey,
  SocialState,
  User,
  UserMessage
} from "./psy/types";
import { getRoleLabel, getWorkspaceLabel, isAppPath, isCreatorRole } from "./psy/types";

const CENTRAL_STORAGE_KEY = "psy-perspective-store";
const CENTRAL_STORAGE_VERSION = 1;
const EXERCISES_DATABASE_KEY = "psy-perspective-exercises";
const LEGACY_APP_STORAGE_KEY = "psy-perspective-app";
const LEGACY_AUTH_STORAGE_KEY = "psy-perspective-auth";
const LEGACY_ACCOUNT_SETTINGS_STORAGE_KEY = "psy-perspective-account-settings";
const LEGACY_CREATE_DRAFT_STORAGE_KEY = "psy-perspective-create-draft";
const LEGACY_USER_MESSAGES_STORAGE_KEY = "psy-perspective-user-messages";
const LEGACY_SOCIAL_STATE_STORAGE_KEY = "psy-perspective-social-state";
const SOCIAL_STATE_DATABASE_KEY = "psy-perspective-social-state-db";
const SOCIAL_STATE_UPDATED_EVENT = "psy-perspective-social-state-updated";
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 500;
const TARGET_IMAGE_LIMIT_BYTES = 2 * 1024 * 1024;

type AppProps = {
  embedded?: boolean;
  embeddedActorName?: string;
  embeddedUserEmail?: string;
  embeddedUserRole?: "admin" | "member";
};

const users: User[] = [
  {
    id: "creator-mara",
    name: "Mara Quill",
    email: "mara@psyperspective.app",
    password: "creator-demo",
    role: "creator",
    source: "seeded",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "viewer-jo",
    name: "Jo Vale",
    email: "jo@psyperspective.app",
    password: "viewer-demo",
    role: "viewer",
    source: "seeded",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "viewer-elin",
    name: "Elin Shaw",
    email: "elin@psyperspective.app",
    password: "viewer-demo",
    role: "viewer",
    source: "seeded",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "admin-rhea",
    name: "Rhea Hart",
    email: "admin@psyperspective.app",
    password: "admin-demo",
    role: "admin",
    source: "seeded",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "viewer-tess",
    name: "Tess Vale",
    email: "tess@psyperspective.app",
    password: "viewer-demo",
    role: "viewer",
    source: "seeded",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

function createEmptyCreateForm(): CreateFormState {
  return {
    exerciseId: "",
    exerciseNumber: null,
    title: "",
    blindCue: "",
    viewerPrompt: "",
    hiddenTarget: "",
    revealSummary: "",
    targetImageData: "",
    targetImageName: "",
    startsAt: "",
    durationHours: "24",
    maxEntriesPerViewer: "1",
    revealPolicy: "on_expiry",
    coCreatorIds: [],
    publishMode: "publish"
  };
}

function createDefaultAccountSettings(user: User): AccountSettings {
  return {
    communityAlias: user.name.split(" ")[0] || user.name,
    profileNote:
      isCreatorRole(user.role)
        ? "Publishing blind targets and managing reveals."
        : "Practising blind impressions and scoring closed sessions.",
    focusMode: isCreatorRole(user.role) ? "structured" : "freeform",
    revealAlerts: isCreatorRole(user.role)
  };
}

function createEmptyMessageDraft(recipientId = "", exerciseId = ""): MessageDraft {
  return {
    recipientId,
    exerciseId,
    subject: "",
    body: ""
  };
}

function createEmptySocialPostDraft(exerciseId = ""): SocialPostDraft {
  return {
    headline: "",
    body: "",
    exerciseId
  };
}

function createEmptySocialInteraction(): SocialPostInteraction {
  return {
    reactions: {
      resonates: [],
      curious: [],
      sharp: []
    },
    comments: []
  };
}

function isRouteNotFoundError(error: unknown) {
  return error instanceof Error && error.message.trim().toLowerCase() === "not found";
}

function isBackendUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim().toLowerCase();
  return (
    message === "not found" ||
    message === "failed to fetch" ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}

function areSocialStatesEqual(left: SocialState, right: SocialState) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeSocialComment(value: unknown): SocialComment | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const comment = value as Partial<SocialComment>;

  if (
    typeof comment.id !== "string" ||
    typeof comment.authorId !== "string" ||
    typeof comment.body !== "string" ||
    typeof comment.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: comment.id,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: comment.createdAt
  };
}

function normalizeSocialInteraction(value: unknown): SocialPostInteraction {
  if (!value || typeof value !== "object") {
    return createEmptySocialInteraction();
  }

  const interaction = value as Partial<SocialPostInteraction> & {
    reactions?: Partial<Record<SocialReactionKey, unknown>>;
    comments?: unknown;
  };

  const normalizeReactionUsers = (users: unknown) =>
    Array.isArray(users) ? users.filter((entry): entry is string => typeof entry === "string") : [];

  return {
    reactions: {
      resonates: normalizeReactionUsers(interaction.reactions?.resonates),
      curious: normalizeReactionUsers(interaction.reactions?.curious),
      sharp: normalizeReactionUsers(interaction.reactions?.sharp)
    },
    comments: Array.isArray(interaction.comments)
      ? interaction.comments.map(normalizeSocialComment).filter((comment): comment is SocialComment => comment !== null)
      : []
  };
}

function normalizeSocialState(value: unknown, accounts: User[]): SocialState {
  const validUserIds = new Set(accounts.map((account) => account.id));

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { customPosts: [], interactions: {} };
  }

  const parsed = value as Partial<SocialState> & {
    interactions?: Record<string, unknown>;
  };

  const customPosts = Array.isArray(parsed.customPosts)
    ? parsed.customPosts
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const post = entry as Partial<SocialPost> & { statsLabel?: string };

          if (
            typeof post.id !== "string" ||
            typeof post.authorId !== "string" ||
            !validUserIds.has(post.authorId) ||
            typeof post.headline !== "string" ||
            typeof post.body !== "string" ||
            typeof post.createdAt !== "string" ||
            (typeof post.exerciseId !== "string" && post.exerciseId !== null && post.exerciseId !== undefined) ||
            typeof post.audience !== "string" ||
            typeof post.ctaLabel !== "string" ||
            !isAppPath(post.ctaPath ?? "")
          ) {
            return null;
          }

          return {
            id: post.id,
            authorId: post.authorId,
            kind: "creator_update" as const,
            headline: post.headline,
            body: post.body,
            createdAt: post.createdAt,
            exerciseId: post.exerciseId ?? null,
            statsLabel: typeof post.statsLabel === "string" ? post.statsLabel : "Community post",
            audience: post.audience,
            ctaLabel: post.ctaLabel,
            ctaPath: post.ctaPath
          };
        })
        .filter((post): post is SocialState["customPosts"][number] => post !== null)
    : [];

  const interactions = Object.fromEntries(
    Object.entries(parsed.interactions ?? {}).map(([postId, interaction]) => [
      postId,
      {
        ...normalizeSocialInteraction(interaction),
        reactions: {
          resonates: normalizeSocialInteraction(interaction).reactions.resonates.filter((userId) => validUserIds.has(userId)),
          curious: normalizeSocialInteraction(interaction).reactions.curious.filter((userId) => validUserIds.has(userId)),
          sharp: normalizeSocialInteraction(interaction).reactions.sharp.filter((userId) => validUserIds.has(userId))
        },
        comments: normalizeSocialInteraction(interaction).comments.filter((comment) => validUserIds.has(comment.authorId))
      }
    ])
  ) as Record<string, SocialPostInteraction>;

  return {
    customPosts,
    interactions
  };
}

function mergeSocialStates(primary: SocialState, secondary: SocialState): SocialState {
  const postsById = new Map<string, SocialState["customPosts"][number]>();

  for (const post of primary.customPosts) {
    postsById.set(post.id, post);
  }

  for (const post of secondary.customPosts) {
    if (!postsById.has(post.id)) {
      postsById.set(post.id, post);
    }
  }

  return {
    customPosts: [...postsById.values()].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ),
    interactions: {
      ...secondary.interactions,
      ...primary.interactions
    }
  };
}

async function readStoredSocialState(accounts: User[]) {
  return readDatabaseJSON<SocialState>(SOCIAL_STATE_DATABASE_KEY, { customPosts: [], interactions: {} }, (value) =>
    normalizeSocialState(value, accounts)
  );
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isoHoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Schedule pending";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function getValidTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function toISOStringOrFallback(value: string, fallback: string) {
  const timestamp = getValidTimestamp(value);
  return timestamp === null ? fallback : new Date(timestamp).toISOString();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function formatFallbackName(email: string) {
  const localPart = email.split("@")[0] || "PsyPerspective User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mergeOfflineAccounts(accounts: User[]) {
  return normalizeStoredAccounts([...users, ...accounts.filter((account) => hasText(account.password))]);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeStoredAccounts(value: unknown) {
  if (!Array.isArray(value)) {
    return users;
  }

  const accountMap = new Map(users.map((user) => [user.id, user]));
  const emailMap = new Map(users.map((user) => [normalizeEmail(user.email), user.id]));

  value.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const account = entry as Partial<User>;

    if (
      typeof account.id !== "string" ||
      typeof account.name !== "string" ||
      typeof account.email !== "string" ||
      (account.role !== "creator" && account.role !== "viewer" && account.role !== "admin") ||
      (account.source !== "seeded" && account.source !== "registered") ||
      typeof account.createdAt !== "string"
    ) {
      return;
    }

    const normalizedEmail = normalizeEmail(account.email);
    const existingAccountId = emailMap.get(normalizedEmail);
    const nextAccountId =
      account.source === "registered" && existingAccountId && existingAccountId !== account.id
        ? existingAccountId
        : account.id;
    const fallbackAccount = accountMap.get(nextAccountId);
    const nextPassword = typeof account.password === "string" ? account.password : fallbackAccount?.password ?? "";

    accountMap.set(nextAccountId, {
      id: nextAccountId,
      name: account.name,
      email: normalizedEmail,
      password: nextPassword,
      role: account.role,
      source: account.source,
      createdAt: account.createdAt
    });
    emailMap.set(normalizedEmail, nextAccountId);
  });

  return Array.from(accountMap.values());
}

function createAuthState(accounts: User[], activeUserId: string | null): AuthState {
  const normalizedAccounts = normalizeStoredAccounts(accounts);
  const nextActiveUserId =
    typeof activeUserId === "string" && normalizedAccounts.some((account) => account.id === activeUserId)
      ? activeUserId
      : null;

  return {
    accounts: normalizedAccounts,
    activeUserId: nextActiveUserId
  };
}

function normalizeAccountSettingsMap(value: unknown, accounts: User[]) {
  const parsed =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, Partial<AccountSettings>>)
      : {};

  return accounts.reduce<Record<string, AccountSettings>>((result, account) => {
    const defaults = createDefaultAccountSettings(account);
    const candidate = parsed[account.id];

    result[account.id] = {
      communityAlias:
        typeof candidate?.communityAlias === "string" && candidate.communityAlias.trim()
          ? candidate.communityAlias
          : defaults.communityAlias,
      profileNote: typeof candidate?.profileNote === "string" ? candidate.profileNote : defaults.profileNote,
      focusMode:
        candidate?.focusMode === "structured" || candidate?.focusMode === "freeform"
          ? candidate.focusMode
          : defaults.focusMode,
      revealAlerts: typeof candidate?.revealAlerts === "boolean" ? candidate.revealAlerts : defaults.revealAlerts
    };

    return result;
  }, {});
}

function normalizeCreateFormState(value: unknown): CreateFormState {
  const parsed = value && typeof value === "object" ? (value as Partial<CreateFormState>) : {};

  return {
    exerciseId: typeof parsed.exerciseId === "string" ? parsed.exerciseId : "",
    exerciseNumber: typeof parsed.exerciseNumber === "number" ? parsed.exerciseNumber : null,
    title: typeof parsed.title === "string" ? parsed.title : "",
    blindCue: typeof parsed.blindCue === "string" ? parsed.blindCue : "",
    viewerPrompt: typeof parsed.viewerPrompt === "string" ? parsed.viewerPrompt : "",
    hiddenTarget: typeof parsed.hiddenTarget === "string" ? parsed.hiddenTarget : "",
    revealSummary: typeof parsed.revealSummary === "string" ? parsed.revealSummary : "",
    targetImageData: typeof parsed.targetImageData === "string" ? parsed.targetImageData : "",
    targetImageName: typeof parsed.targetImageName === "string" ? parsed.targetImageName : "",
    startsAt: typeof parsed.startsAt === "string" ? parsed.startsAt : "",
    durationHours: typeof parsed.durationHours === "string" ? parsed.durationHours : "24",
    maxEntriesPerViewer: typeof parsed.maxEntriesPerViewer === "string" ? parsed.maxEntriesPerViewer : "1",
    revealPolicy:
      parsed.revealPolicy === "on_completion" || parsed.revealPolicy === "on_start"
        ? parsed.revealPolicy
        : "on_expiry",
    coCreatorIds: Array.isArray(parsed.coCreatorIds) ? parsed.coCreatorIds.filter((entry): entry is string => typeof entry === "string") : [],
    publishMode: parsed.publishMode === "draft" ? "draft" : "publish"
  };
}

function isCreateFormEmpty(form: CreateFormState) {
  return (
    !form.exerciseId &&
    form.exerciseNumber === null &&
    !form.title.trim() &&
    !form.blindCue.trim() &&
    !form.viewerPrompt.trim() &&
    !form.hiddenTarget.trim() &&
    !form.revealSummary.trim() &&
    !form.targetImageData &&
    !form.targetImageName &&
    !form.startsAt &&
    form.durationHours === "24" &&
    form.maxEntriesPerViewer === "1" &&
    form.revealPolicy === "on_expiry" &&
    form.coCreatorIds.length === 0 &&
    form.publishMode === "publish"
  );
}

function areCreateFormsEqual(left: CreateFormState, right: CreateFormState) {
  return (
    left.exerciseId === right.exerciseId &&
    left.exerciseNumber === right.exerciseNumber &&
    left.title === right.title &&
    left.blindCue === right.blindCue &&
    left.viewerPrompt === right.viewerPrompt &&
    left.hiddenTarget === right.hiddenTarget &&
    left.revealSummary === right.revealSummary &&
    left.targetImageData === right.targetImageData &&
    left.targetImageName === right.targetImageName &&
    left.startsAt === right.startsAt &&
    left.durationHours === right.durationHours &&
    left.maxEntriesPerViewer === right.maxEntriesPerViewer &&
    left.revealPolicy === right.revealPolicy &&
    left.publishMode === right.publishMode &&
    left.coCreatorIds.join("|") === right.coCreatorIds.join("|")
  );
}

function createSeedTargetImage(label: string, topColor: string, bottomColor: string, accentColor: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="sky" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${topColor}" />
          <stop offset="100%" stop-color="${bottomColor}" />
        </linearGradient>
      </defs>
      <rect width="960" height="640" fill="url(#sky)" />
      <circle cx="724" cy="152" r="82" fill="${accentColor}" opacity="0.85" />
      <path d="M110 498h740v62H110z" fill="rgba(17, 38, 60, 0.18)" />
      <path d="M132 496c68-58 136-102 204-132 62 44 126 90 190 132H132z" fill="rgba(255,255,255,0.74)" />
      <path d="M436 496l124-228 92 228H436z" fill="rgba(20,46,74,0.76)" />
      <path d="M548 300h22v196h-22z" fill="#f7fafc" />
      <path d="M510 252h98l-48-54-50 54z" fill="#f7fafc" />
      <text x="70" y="96" fill="#ffffff" font-family="Space Grotesk, Segoe UI, sans-serif" font-size="48" font-weight="700">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeStoredExercises(value: unknown) {
  if (!Array.isArray(value)) {
    return generateSeedExercises();
  }

  const exercises = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const exercise = entry as Partial<Exercise> & {
      predictions?: unknown;
      scores?: unknown;
    };

    if (
      typeof exercise.id !== "string" ||
      typeof exercise.title !== "string" ||
      typeof exercise.blindCue !== "string" ||
      typeof exercise.hiddenTarget !== "string" ||
      typeof exercise.revealSummary !== "string" ||
      typeof exercise.creatorId !== "string" ||
      typeof exercise.createdAt !== "string" ||
      typeof exercise.closesAt !== "string"
    ) {
      return [];
    }

    return [
      {
        id: exercise.id,
        exerciseNumber: typeof exercise.exerciseNumber === "number" ? exercise.exerciseNumber : 0,
        title: exercise.title,
        blindCue: exercise.blindCue,
        viewerPrompt: typeof exercise.viewerPrompt === "string" ? exercise.viewerPrompt : "",
        hiddenTarget: exercise.hiddenTarget,
        revealSummary: exercise.revealSummary,
        targetImageData: typeof exercise.targetImageData === "string" ? exercise.targetImageData : "",
        targetImageName: typeof exercise.targetImageName === "string" ? exercise.targetImageName : "",
        creatorId: exercise.creatorId,
        coCreatorIds: Array.isArray(exercise.coCreatorIds)
          ? exercise.coCreatorIds.filter((entry): entry is string => typeof entry === "string")
          : [],
        createdAt: exercise.createdAt,
        startsAt: typeof exercise.startsAt === "string" ? exercise.startsAt : exercise.createdAt,
        closesAt: exercise.closesAt,
        status:
          exercise.status === "draft" || exercise.status === "scheduled" || exercise.status === "active" || exercise.status === "closed"
            ? exercise.status
            : "active",
        revealPolicy:
          exercise.revealPolicy === "on_completion" || exercise.revealPolicy === "on_start"
            ? exercise.revealPolicy
            : "on_expiry",
        maxEntriesPerViewer:
          typeof exercise.maxEntriesPerViewer === "number" && Number.isFinite(exercise.maxEntriesPerViewer)
            ? Math.max(1, exercise.maxEntriesPerViewer)
            : 1,
        predictions: Array.isArray(exercise.predictions)
          ? exercise.predictions.flatMap((prediction) => {
              if (!prediction || typeof prediction !== "object") {
                return [];
              }

              const item = prediction as Partial<Prediction>;

              if (
                typeof item.id !== "string" ||
                typeof item.userId !== "string" ||
                typeof item.submittedAt !== "string"
              ) {
                return [];
              }

              return [
                {
                  id: item.id,
                  userId: item.userId,
                  submittedAt: item.submittedAt,
                  imageData: typeof item.imageData === "string" ? item.imageData : "",
                  notes: typeof item.notes === "string" ? item.notes : "",
                  entryNumber: typeof item.entryNumber === "number" && Number.isFinite(item.entryNumber) ? item.entryNumber : 1
                }
              ];
            })
          : [],
        scores: Array.isArray(exercise.scores)
          ? exercise.scores.flatMap((score) => {
              if (!score || typeof score !== "object") {
                return [];
              }

              const item = score as Partial<Score>;

              if (
                typeof item.predictionId !== "string" ||
                typeof item.userId !== "string" ||
                typeof item.accuracy !== "number"
              ) {
                return [];
              }

              return [
                {
                  predictionId: item.predictionId,
                  userId: item.userId,
                  accuracy: item.accuracy,
                  comment: typeof item.comment === "string" ? item.comment : ""
                }
              ];
            })
          : []
      } satisfies Exercise
    ];
  });

  return exercises.length > 0 ? exercises : generateSeedExercises();
}

function normalizeStoredMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as UserMessage[];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const message = entry as Partial<UserMessage> & { readBy?: unknown };

    if (
      typeof message.id !== "string" ||
      typeof message.senderId !== "string" ||
      typeof message.recipientId !== "string" ||
      (typeof message.exerciseId !== "string" && message.exerciseId !== null && message.exerciseId !== undefined) ||
      typeof message.subject !== "string" ||
      typeof message.body !== "string" ||
      typeof message.createdAt !== "string"
    ) {
      return [];
    }

    return [
      {
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        exerciseId: message.exerciseId ?? null,
        subject: message.subject,
        body: message.body,
        createdAt: message.createdAt,
        readBy: Array.isArray(message.readBy)
          ? message.readBy.filter((entry): entry is string => typeof entry === "string")
          : []
      } satisfies UserMessage
    ];
  });
}

function createLegacyDraftStorageKey(userId: string) {
  return `${LEGACY_CREATE_DRAFT_STORAGE_KEY}:${userId}`;
}

function normalizeStoredCreateDrafts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, CreateFormState>;
  }

  return Object.entries(value).reduce<Record<string, CreateFormState>>((result, [userId, draft]) => {
    const normalizedDraft = normalizeCreateFormState(draft);

    if (!isCreateFormEmpty(normalizedDraft)) {
      result[userId] = normalizedDraft;
    }

    return result;
  }, {});
}

function generateSeedExercises(): Exercise[] {
  const activeExerciseId = createId("exercise");
  const closedExerciseId = createId("exercise");

  const closedPredictionA = createId("prediction");
  const closedPredictionB = createId("prediction");
  const bridgeTargetImage = createSeedTargetImage("Bridge Target", "#efc178", "#d6694f", "#ffe8b8");
  const lighthouseTargetImage = createSeedTargetImage("Lighthouse Target", "#89b6ff", "#17395e", "#fef0b0");

  return [
    {
      id: activeExerciseId,
      exerciseNumber: 1001,
      title: "Quiet Structure",
      blindCue: "Target 241",
      viewerPrompt: "Focus on the largest shape first, then any motion, temperature, or structural rhythm that follows.",
      hiddenTarget: "A red suspension bridge stretching over misty water at sunrise.",
      revealSummary: "Bridge silhouette, cables, fog and warm dawn light over water.",
      targetImageData: bridgeTargetImage,
      targetImageName: "quiet-structure-target.svg",
      creatorId: "creator-mara",
      coCreatorIds: [],
      createdAt: new Date().toISOString(),
      startsAt: new Date().toISOString(),
      closesAt: isoHoursFromNow(18),
      status: "active",
      revealPolicy: "on_expiry",
      maxEntriesPerViewer: 1,
      predictions: [],
      scores: []
    },
    {
      id: closedExerciseId,
      exerciseNumber: 1002,
      title: "Cold Signal",
      blindCue: "Target 118",
      viewerPrompt: "Stay with cold textures, vertical forms, and any isolation or warning feel before naming objects.",
      hiddenTarget: "A lone lighthouse on a cliff above rough ocean waves.",
      revealSummary: "White lighthouse, dark cliffs, foam, ocean spray, isolated coast.",
      targetImageData: lighthouseTargetImage,
      targetImageName: "cold-signal-target.svg",
      creatorId: "creator-mara",
      coCreatorIds: [],
      createdAt: isoHoursFromNow(-48),
      startsAt: isoHoursFromNow(-36),
      closesAt: isoHoursFromNow(-6),
      status: "closed",
      revealPolicy: "on_expiry",
      maxEntriesPerViewer: 1,
      predictions: [
        {
          id: closedPredictionA,
          userId: "viewer-jo",
          submittedAt: isoHoursFromNow(-20),
          imageData: "",
          notes: "Saw a vertical tower, hard edge of rock, white spray and distance.",
          entryNumber: 1
        },
        {
          id: closedPredictionB,
          userId: "viewer-elin",
          submittedAt: isoHoursFromNow(-18),
          imageData: "",
          notes: "Felt cold air, ocean movement, a bright pillar and warning energy.",
          entryNumber: 1
        }
      ],
      scores: [
        {
          predictionId: closedPredictionA,
          userId: "viewer-tess",
          accuracy: 5,
          comment: "Strong lighthouse and cliff hit."
        },
        {
          predictionId: closedPredictionA,
          userId: "creator-mara",
          accuracy: 4,
          comment: "Very close on composition."
        },
        {
          predictionId: closedPredictionB,
          userId: "viewer-tess",
          accuracy: 4,
          comment: "Ocean and warning cue were solid."
        }
      ]
    }
  ];
}

function createDefaultAppState(): AppState {
  return {
    activeUserId: users[1].id,
    exercises: generateSeedExercises()
  };
}

function normalizeStoredAppState(value: unknown): AppState {
  const parsed = value as Partial<AppState>;

  return {
    activeUserId:
      typeof parsed.activeUserId === "string" && users.some((user) => user.id === parsed.activeUserId)
        ? parsed.activeUserId
        : users[1].id,
    exercises: normalizeStoredExercises(parsed.exercises)
  };
}

function normalizeStoredAuthState(value: unknown): AuthState {
  const parsed = value as Partial<AuthState>;
  return createAuthState(Array.isArray(parsed.accounts) ? parsed.accounts : users, parsed.activeUserId ?? null);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function createPersistedState({
  appState,
  authState,
  accountSettings,
  messages,
  createDrafts,
  socialState
}: Omit<PersistedState, "version">): PersistedState {
  return {
    version: CENTRAL_STORAGE_VERSION,
    appState: normalizeStoredAppState(appState),
    authState: normalizeStoredAuthState(authState),
    accountSettings: normalizeAccountSettingsMap(accountSettings, authState.accounts),
    messages: normalizeStoredMessages(messages),
    createDrafts: normalizeStoredCreateDrafts(createDrafts),
    socialState: normalizeSocialState(socialState, authState.accounts)
  };
}

function loadLegacyAppState() {
  return readStorageJSON(LEGACY_APP_STORAGE_KEY, createDefaultAppState(), (value) => normalizeStoredAppState(value));
}

function loadLegacyAuthState() {
  return readStorageJSON(LEGACY_AUTH_STORAGE_KEY, createAuthState(users, null), (value) =>
    normalizeStoredAuthState(value)
  );
}

function loadLegacyMessages() {
  return readStorageJSON(LEGACY_USER_MESSAGES_STORAGE_KEY, [] as UserMessage[], (value) =>
    normalizeStoredMessages(value)
  );
}

function loadLegacyCreateDrafts(accounts: User[]) {
  return accounts.reduce<Record<string, CreateFormState>>((result, account) => {
    const draft = readStorageJSON(createLegacyDraftStorageKey(account.id), createEmptyCreateForm(), (value) =>
      normalizeCreateFormState(value)
    );

    if (!isCreateFormEmpty(draft)) {
      result[account.id] = draft;
    }

    return result;
  }, {});
}

function loadLegacyPersistedState() {
  const authState = loadLegacyAuthState();

  return createPersistedState({
    appState: loadLegacyAppState(),
    authState,
    accountSettings: readStorageJSON(LEGACY_ACCOUNT_SETTINGS_STORAGE_KEY, {}, (value) =>
      normalizeAccountSettingsMap(value, authState.accounts)
    ),
    messages: loadLegacyMessages(),
    createDrafts: loadLegacyCreateDrafts(authState.accounts),
    socialState: readStorageJSON<SocialState>(
      LEGACY_SOCIAL_STATE_STORAGE_KEY,
      { customPosts: [], interactions: {} },
      (value) => normalizeSocialState(value, authState.accounts)
    )
  });
}

function normalizeStoredPersistedState(value: unknown): PersistedState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const parsed = value as Partial<PersistedState>;
  const authState = normalizeStoredAuthState(parsed.authState);

  return createPersistedState({
    appState: normalizeStoredAppState(parsed.appState),
    authState,
    accountSettings: parsed.accountSettings,
    messages: parsed.messages,
    createDrafts: parsed.createDrafts,
    socialState: parsed.socialState
  });
}

function loadPersistedState() {
  const storedState = readStorageJSON<PersistedState | null>(CENTRAL_STORAGE_KEY, null, (value) =>
    normalizeStoredPersistedState(value)
  );

  return storedState ?? loadLegacyPersistedState();
}

function createDatabaseBootstrapState(persistedState: PersistedState): PersistedState {
  return createPersistedState({
    ...persistedState,
    appState: {
      ...persistedState.appState,
      exercises: []
    }
  });
}

function loadStoredExercisesSnapshot() {
  const storedState = readStorageJSON<PersistedState | null>(CENTRAL_STORAGE_KEY, null, (value) =>
    normalizeStoredPersistedState(value)
  );

  if (storedState) {
    return storedState.appState.exercises;
  }

  return loadLegacyAppState().exercises;
}

function createBackendFallbackState() {
  return createPersistedState({
    appState: {
      activeUserId: "",
      exercises: generateSeedExercises()
    },
    authState: createAuthState(users, null),
    accountSettings: {},
    messages: [],
    createDrafts: {},
    socialState: { customPosts: [], interactions: {} }
  });
}

function createEmbeddedAccount({
  email,
  name,
  role
}: {
  email: string;
  name?: string;
  role?: "admin" | "member";
}): User {
  const normalizedEmail = normalizeEmail(email);

  return {
    id: `mainap-${normalizedEmail.replace(/[^a-z0-9]+/g, "-")}`,
    name: name?.trim() || formatFallbackName(normalizedEmail),
    email: normalizedEmail,
    password: "",
    role: role === "admin" ? "admin" : "viewer",
    source: "registered",
    createdAt: new Date().toISOString()
  };
}

function createLegacyMigrationSnapshot() {
  const legacyState = loadLegacyPersistedState();

  return createPersistedState({
    ...legacyState,
    appState: {
      ...legacyState.appState,
      exercises: loadStoredExercisesSnapshot()
    }
  });
}

function shouldMigrateLegacyState(state: PersistedState) {
  const hasRegisteredAccounts = state.authState.accounts.some((account) => account.source === "registered");
  const hasMessages = state.messages.length > 0;
  const hasDrafts = Object.keys(state.createDrafts).length > 0;
  const hasSocialActivity =
    state.socialState.customPosts.length > 0 || Object.keys(state.socialState.interactions).length > 0;
  const hasNonSeedExercise =
    state.appState.exercises.length > 2 ||
    state.appState.exercises.some((exercise) => {
      if (exercise.creatorId !== "creator-mara") {
        return true;
      }

      if (exercise.title === "Quiet Structure") {
        return exercise.predictions.length > 0 || exercise.scores.length > 0;
      }

      if (exercise.title === "Cold Signal") {
        return exercise.predictions.length !== 2 || exercise.scores.length !== 3;
      }

      return true;
    });

  return hasRegisteredAccounts || hasMessages || hasDrafts || hasSocialActivity || hasNonSeedExercise;
}

function normalizeBootstrapPayload(
  payload: Partial<Pick<PersistedState, "appState" | "authState" | "accountSettings" | "messages" | "createDrafts" | "socialState">>
) {
  const fallbackState = createBackendFallbackState();

  return createPersistedState({
    appState: payload.appState ?? fallbackState.appState,
    authState: payload.authState ?? fallbackState.authState,
    accountSettings: payload.accountSettings ?? {},
    messages: payload.messages ?? [],
    createDrafts: payload.createDrafts ?? {},
    socialState: payload.socialState ?? fallbackState.socialState
  });
}

function App({
  embedded = false,
  embeddedActorName,
  embeddedUserEmail,
  embeddedUserRole
}: AppProps = {}) {
  const [initialPersistedState] = useState<PersistedState>(() => createBackendFallbackState());
  const [appState, setAppState] = useState<AppState>(() => initialPersistedState.appState);
  const [authState, setAuthState] = useState<AuthState>(() => initialPersistedState.authState);
  const [accountSettings, setAccountSettings] = useState<Record<string, AccountSettings>>(
    () => initialPersistedState.accountSettings
  );
  const [messages, setMessages] = useState<UserMessage[]>(() => initialPersistedState.messages);
  const [createDrafts, setCreateDrafts] = useState<Record<string, CreateFormState>>(
    () => initialPersistedState.createDrafts
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [feedback, setFeedback] = useState("Viewer workspace ready. Pick a target and submit an impression.");
  const [predictionNotes, setPredictionNotes] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, ScoreDraft>>({});
  const [loginEmail, setLoginEmail] = useState(users[1].email);
  const [loginPassword, setLoginPassword] = useState(users[1].password);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
      role: "viewer" as User["role"]
  });
  const [authFeedback, setAuthFeedback] = useState("Sign in with a demo account or register a new creator/viewer profile.");
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    communityAlias: "",
    profileNote: "",
    focusMode: "freeform" as AccountSettings["focusMode"],
    revealAlerts: false
  });
  const [accountFeedback, setAccountFeedback] = useState("Update your profile, password, and practice preferences.");
  const [messageDraft, setMessageDraft] = useState<MessageDraft>(() => createEmptyMessageDraft());
  const [messageFeedback, setMessageFeedback] = useState("Direct messages sync through the shared backend account data.");
  const [socialState, setSocialState] = useState<SocialState>(() => initialPersistedState.socialState);
  const [socialDraft, setSocialDraft] = useState<SocialPostDraft>(() => createEmptySocialPostDraft());
  const [socialFeedback, setSocialFeedback] = useState("Share a blind-safe update, react to community posts, or discuss reveals after closure.");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPublishingSocialPost, setIsPublishingSocialPost] = useState(false);
  const [postingCommentIds, setPostingCommentIds] = useState<string[]>([]);
  const [databaseHydrated, setDatabaseHydrated] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isEmbedded = embedded && hasText(embeddedUserEmail);
  const embeddedAccount = useMemo(
    () =>
      isEmbedded && embeddedUserEmail
        ? createEmbeddedAccount({
            email: embeddedUserEmail,
            name: embeddedActorName,
            role: embeddedUserRole
          })
        : null,
    [embeddedActorName, embeddedUserEmail, embeddedUserRole, isEmbedded]
  );

  const activeUser = authState.accounts.find((user) => user.id === authState.activeUserId) ?? null;
  const currentPath = isAppPath(location.pathname) ? location.pathname : "/";
  const activeCreatorId = activeUser && isCreatorRole(activeUser.role) ? activeUser.id : null;
  const createForm = useMemo(() => {
    if (!activeCreatorId) {
      return createEmptyCreateForm();
    }

    return createDrafts[activeCreatorId] ?? createEmptyCreateForm();
  }, [activeCreatorId, createDrafts]);
  const sortedExercises = useMemo(
    () =>
      appState.exercises
        .slice()
        .sort(
          (left, right) =>
            (getValidTimestamp(right.createdAt) ?? 0) - (getValidTimestamp(left.createdAt) ?? 0)
        ),
    [appState.exercises]
  );
  const feedExercises = sortedExercises.filter((exercise) => exercise.status !== "draft");

  const selectedExercise =
    feedExercises.find((exercise) => exercise.id === selectedExerciseId) ?? feedExercises[0] ?? null;

  const activeExercises = sortedExercises.filter((exercise) => {
    const closesAt = getValidTimestamp(exercise.closesAt);
    return closesAt !== null && closesAt > Date.now();
  });
  const closedExercises = sortedExercises.filter((exercise) => {
    const closesAt = getValidTimestamp(exercise.closesAt);
    return closesAt !== null && closesAt <= Date.now();
  });
  const managedExercises = useMemo(
    () =>
      sortedExercises.filter((exercise) =>
        activeUser
          ? activeUser.role === "admin" ||
            exercise.creatorId === activeUser.id ||
            exercise.coCreatorIds.includes(activeUser.id)
          : false
      ),
    [activeUser, sortedExercises]
  );
  const selectedManagedExercise =
    managedExercises.find((exercise) => exercise.id === selectedExerciseId) ?? managedExercises[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    if (isEmbedded) {
      setDatabaseHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    const sessionTokenAtStart = getSessionToken();

    async function hydratePersistedState() {
      try {
        const legacyState = createLegacyMigrationSnapshot();

        if (!hasCompletedLegacyMigration() && shouldMigrateLegacyState(legacyState)) {
          const migrationResult = await migrateLegacyData(legacyState);

          if (migrationResult.migrated) {
            markLegacyMigrationComplete();
          }
        }

        const bootstrap = await getBootstrap();
        const sessionTokenAfterBootstrap = getSessionToken();

        if (cancelled || sessionTokenAtStart !== sessionTokenAfterBootstrap) {
          return;
        }

        const storedSocialState = await readStoredSocialState(
          normalizeBootstrapPayload(bootstrap).authState.accounts
        );

        if (cancelled || sessionTokenAtStart !== getSessionToken()) {
          return;
        }

        applyBootstrapState({
          ...bootstrap,
          socialState: mergeSocialStates(normalizeBootstrapPayload(bootstrap).socialState, storedSocialState)
        });
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setAuthFeedback("Shared API offline. Demo accounts still work in local mode, and social posts stay browser-backed.");
          setMessageFeedback("Shared API offline. Messages will resume syncing when the backend is available again.");
          const storedSocialState = await readStoredSocialState(authState.accounts);

          if (!cancelled && (storedSocialState.customPosts.length > 0 || Object.keys(storedSocialState.interactions).length > 0)) {
            setSocialState((current) => mergeSocialStates(current, storedSocialState));
            setSocialFeedback("Offline social feed restored from the browser database.");
          }
        }
      } finally {
        if (!cancelled) {
          setDatabaseHydrated(true);
        }
      }
    }

    void hydratePersistedState();

    return () => {
      cancelled = true;
    };
  }, [initialPersistedState, isEmbedded]);

  useEffect(() => {
    let cancelled = false;

    async function syncStoredSocialState() {
      const storedSocialState = await readStoredSocialState(authState.accounts);

      if (cancelled) {
        return;
      }

      setSocialState((current) => {
        const mergedSocialState = mergeSocialStates(current, storedSocialState);
        return areSocialStatesEqual(current, mergedSocialState) ? current : mergedSocialState;
      });
    }

    void syncStoredSocialState();
    window.addEventListener(SOCIAL_STATE_UPDATED_EVENT, syncStoredSocialState);

    return () => {
      cancelled = true;
      window.removeEventListener(SOCIAL_STATE_UPDATED_EVENT, syncStoredSocialState);
    };
  }, [authState.accounts]);

  useEffect(() => {
    if (isEmbedded && !getSessionToken()) {
      return;
    }

    let cancelled = false;

    async function syncRemoteSocialState() {
      try {
        const remoteSocialState = normalizeSocialState(await getSocialStateRequest(), authState.accounts);

        if (cancelled) {
          return;
        }

        setSocialState((current) => {
          const mergedSocialState = mergeSocialStates(remoteSocialState, current);
          return areSocialStatesEqual(current, mergedSocialState) ? current : mergedSocialState;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncRemoteSocialState();
      }
    }

    void syncRemoteSocialState();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncRemoteSocialState();
      }
    }, 15000);
    window.addEventListener("focus", syncRemoteSocialState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncRemoteSocialState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authState.accounts, isEmbedded]);

  useEffect(() => {
    setAccountSettings((current) => normalizeAccountSettingsMap(current, authState.accounts));
  }, [authState.accounts]);

  useEffect(() => {
    const validUserIds = new Set(authState.accounts.map((account) => account.id));
    const validExerciseIds = new Set(appState.exercises.map((exercise) => exercise.id));

    setMessages((current) => {
      let changed = false;
      const nextMessages = current
        .filter((message) => {
          const keep =
            validUserIds.has(message.senderId) &&
            validUserIds.has(message.recipientId) &&
            (!message.exerciseId || validExerciseIds.has(message.exerciseId));

          if (!keep) {
            changed = true;
          }

          return keep;
        })
        .map((message) => {
          const nextReadBy = message.readBy.filter((userId) => validUserIds.has(userId));

          if (nextReadBy.length !== message.readBy.length) {
            changed = true;
            return {
              ...message,
              readBy: nextReadBy
            };
          }

          return message;
        });

      return changed ? nextMessages : current;
    });
  }, [appState.exercises, authState.accounts]);

  useEffect(() => {
    const validUserIds = new Set(authState.accounts.map((account) => account.id));

    setCreateDrafts((current) => {
      const nextDrafts = Object.fromEntries(
        Object.entries(current).filter(([userId]) => validUserIds.has(userId))
      ) as Record<string, CreateFormState>;

      return Object.keys(nextDrafts).length === Object.keys(current).length ? current : nextDrafts;
    });
  }, [authState.accounts]);

  useEffect(() => {
    setSocialState((current) => normalizeSocialState(current, authState.accounts));
  }, [authState.accounts]);

  useEffect(() => {
    if (!selectedExerciseId && feedExercises[0]) {
      setSelectedExerciseId(feedExercises[0].id);
      return;
    }

    if (
      selectedExerciseId &&
      !feedExercises.some((exercise) => exercise.id === selectedExerciseId) &&
      !managedExercises.some((exercise) => exercise.id === selectedExerciseId)
    ) {
      setSelectedExerciseId(feedExercises[0]?.id ?? managedExercises[0]?.id ?? "");
    }
  }, [feedExercises, managedExercises, selectedExerciseId]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#fbf7ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#17324d";
    context.lineWidth = 3;
  }, []);

  useEffect(() => {
    if (!activeUser) {
      return;
    }

    const settings = accountSettings[activeUser.id] ?? createDefaultAccountSettings(activeUser);
    setAccountForm({
      name: activeUser.name,
      email: activeUser.email,
      password: "",
      confirmPassword: "",
      communityAlias: settings.communityAlias,
      profileNote: settings.profileNote,
      focusMode: settings.focusMode,
      revealAlerts: settings.revealAlerts
    });
  }, [accountSettings, activeUser]);

  useEffect(() => {
    if (!activeUser) {
      setMessageDraft(createEmptyMessageDraft());
      setMessageFeedback("Direct messages sync through the shared backend account data.");
      return;
    }

    const defaultRecipientId = authState.accounts.find((account) => account.id !== activeUser.id)?.id ?? "";

    setMessageDraft(createEmptyMessageDraft(defaultRecipientId, selectedExerciseId));
    setMessageFeedback("Direct messages sync through the shared backend account data.");
  }, [activeUser?.id, authState.accounts, selectedExerciseId]);

  useEffect(() => {
    if (!activeUser) {
      setSocialDraft(createEmptySocialPostDraft());
      setSocialFeedback("Sign in to publish community posts, react, and comment on reveals.");
      return;
    }

    setSocialDraft((current) => ({
      ...current,
      exerciseId:
        current.exerciseId && sortedExercises.some((exercise) => exercise.id === current.exerciseId)
          ? current.exerciseId
          : selectedExerciseId
    }));
    setSocialFeedback("Share a blind-safe update, react to community posts, or discuss reveals after closure.");
  }, [activeUser?.id, selectedExerciseId, sortedExercises]);

  useEffect(() => {
    if (activeUser && !isAppPath(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [activeUser, location.pathname, navigate]);

  useEffect(() => {
    if (!activeUser || currentPath !== "/messages") {
      return;
    }

    const unreadIds: string[] = [];
    setMessages((current) => {
      let changed = false;
      const nextMessages = current.map((message) => {
        if (message.recipientId !== activeUser.id || message.readBy.includes(activeUser.id)) {
          return message;
        }

        changed = true;
        unreadIds.push(message.id);
        return {
          ...message,
          readBy: [...message.readBy, activeUser.id]
        };
      });

      return changed ? nextMessages : current;
    });

    if (unreadIds.length > 0) {
      void markMessagesRead(unreadIds).catch((error) => {
        console.error(error);
      });
    }
  }, [activeUser, currentPath]);

  const selectedPrediction = activeUser
    ? [...(selectedExercise?.predictions.filter((prediction) => prediction.userId === activeUser.id) ?? [])].sort(
        (left, right) => right.entryNumber - left.entryNumber
      )[0]
    : undefined;
  const messageRecipients = activeUser
    ? authState.accounts.filter((account) => account.id !== activeUser.id)
    : [];
  function applyBootstrapState(
    payload: Partial<
      Pick<PersistedState, "appState" | "authState" | "accountSettings" | "messages" | "createDrafts" | "socialState">
    >
  ) {
    const normalized = normalizeBootstrapPayload(payload);
    setAppState(normalized.appState);
    setAuthState(normalized.authState);
    setAccountSettings(normalized.accountSettings);
    setMessages(normalized.messages);
    setCreateDrafts(normalized.createDrafts);
    setSocialState(normalized.socialState);
    return normalized;
  }

  function buildLocalBootstrap(activeAccount: User, accounts = mergeOfflineAccounts(authState.accounts)) {
    return createPersistedState({
      appState: {
        ...appState,
        activeUserId: activeAccount.id
      },
      authState: createAuthState(accounts, activeAccount.id),
      accountSettings: {
        ...accountSettings,
        [activeAccount.id]: accountSettings[activeAccount.id] ?? createDefaultAccountSettings(activeAccount)
      },
      messages,
      createDrafts,
      socialState
    });
  }

  function buildEmbeddedBootstrap(activeAccount: User) {
    const mergedAccounts = normalizeStoredAccounts([...authState.accounts, activeAccount]);

    return createPersistedState({
      appState: {
        ...appState,
        activeUserId: activeAccount.id
      },
      authState: createAuthState(mergedAccounts, activeAccount.id),
      accountSettings: {
        ...accountSettings,
        [activeAccount.id]: accountSettings[activeAccount.id] ?? createDefaultAccountSettings(activeAccount)
      },
      messages,
      createDrafts,
      socialState
    });
  }

  useEffect(() => {
    if (!embeddedAccount) {
      return;
    }

    const bootstrap = buildEmbeddedBootstrap(embeddedAccount);
    applyBootstrapState(bootstrap);
    setFeedback(
      embeddedAccount.role === "admin"
        ? "Admin Console ready through the shared MainAP session."
        : "Prediction Pad ready through the shared MainAP session."
    );
    setAuthFeedback(`Connected through MainAP as ${embeddedAccount.name}.`);

    if (!isAppPath(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [embeddedAccount, location.pathname, navigate]);

  useEffect(() => {
    writeStorageJSON(
      CENTRAL_STORAGE_KEY,
      createPersistedState({
        appState,
        authState,
        accountSettings,
        messages,
        createDrafts,
        socialState
      })
    );
  }, [accountSettings, appState, authState, createDrafts, messages, socialState]);

  const visibleMessages = activeUser
    ? messages
        .filter((message) => message.senderId === activeUser.id || message.recipientId === activeUser.id)
        .slice()
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    : [];
  const unreadMessagesCount = activeUser
    ? visibleMessages.filter((message) => message.recipientId === activeUser.id && !message.readBy.includes(activeUser.id))
        .length
    : 0;
  const sentMessagesCount = activeUser
    ? visibleMessages.filter((message) => message.senderId === activeUser.id).length
    : 0;
  const inboxMessagesCount = activeUser
    ? visibleMessages.filter((message) => message.recipientId === activeUser.id).length
    : 0;
  const durationHoursValue = Number(createForm.durationHours);
  const normalizedDurationHours = Number.isFinite(durationHoursValue)
    ? Math.min(168, Math.max(1, Math.round(durationHoursValue)))
    : 24;
  const maxEntriesValue = Number(createForm.maxEntriesPerViewer);
  const normalizedMaxEntries = Number.isFinite(maxEntriesValue) ? Math.min(10, Math.max(1, Math.round(maxEntriesValue))) : 1;
  const fallbackStartAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const scheduledStartAt = createForm.startsAt
    ? toISOStringOrFallback(createForm.startsAt, fallbackStartAt)
    : fallbackStartAt;
  const createPreviewCloseTime = formatDateTime(
    new Date(getValidTimestamp(scheduledStartAt)! + normalizedDurationHours * 60 * 60 * 1000).toISOString()
  );
  const activeBlindCueConflict = Boolean(
    createForm.blindCue.trim() &&
      activeExercises.some(
        (exercise) =>
          exercise.id !== createForm.exerciseId &&
          exercise.blindCue.trim().toLowerCase() === createForm.blindCue.trim().toLowerCase()
      )
  );
  const creationChecklist = [
    { label: "Exercise title", complete: Boolean(createForm.title.trim()) },
    { label: "Blind cue", complete: Boolean(createForm.blindCue.trim()) },
    { label: "Viewer prompt", complete: Boolean(createForm.viewerPrompt.trim()) },
    { label: "Hidden target", complete: Boolean(createForm.hiddenTarget.trim()) },
    { label: "Reveal summary", complete: Boolean(createForm.revealSummary.trim()) },
    { label: "Start time", complete: Boolean(createForm.startsAt) },
    { label: "Reveal image optional", complete: Boolean(createForm.targetImageData) }
  ];
  const completedChecklistCount = creationChecklist.filter((item) => item.complete).length;
  const socialPosts = useMemo<SocialPost[]>(() => {
    const creatorLabel = (userId: string) => authState.accounts.find((account) => account.id === userId)?.name ?? "PsyPerspective";
    const viewerSpotlights = authState.accounts
      .filter((account) => account.role === "viewer")
      .map<SocialPost | null>((account) => {
        const predictionCount = sortedExercises.reduce(
          (total, exercise) => total + exercise.predictions.filter((prediction) => prediction.userId === account.id).length,
          0
        );

        if (predictionCount === 0) {
          return null;
        }

        return {
          id: `viewer-${account.id}`,
          authorId: account.id,
          kind: "viewer_spotlight",
          headline: `${account.name} is building steady practice volume`,
          body: `${account.name} has submitted ${predictionCount} saved impression${predictionCount === 1 ? "" : "s"} across the current exercise archive.`,
          createdAt: account.createdAt,
          exerciseId: null,
          statsLabel: `${predictionCount} saved prediction${predictionCount === 1 ? "" : "s"}`,
          audience: "Community",
          ctaLabel: "Open Review Archive",
          ctaPath: "/review"
        } satisfies SocialPost;
      })
      .filter((post): post is SocialPost => post !== null)
      .sort((left, right) => {
        const rightCount = Number.parseInt(right.statsLabel, 10);
        const leftCount = Number.parseInt(left.statsLabel, 10);
        return rightCount - leftCount;
      })
      .slice(0, 2);

    const exercisePosts = sortedExercises.slice(0, 6).map((exercise) => {
      const closed = isClosed(exercise);

      if (closed) {
        return {
          id: `reveal-${exercise.id}`,
          authorId: exercise.creatorId,
          kind: "reveal",
          headline: `${creatorLabel(exercise.creatorId)} released the reveal for ${exercise.title}`,
          body: exercise.revealSummary.trim() || "The archive is now open for comparison and scoring.",
          createdAt: exercise.closesAt,
          exerciseId: exercise.id,
          statsLabel: `${exercise.predictions.length} prediction${exercise.predictions.length === 1 ? "" : "s"} • ${exercise.scores.length} score${exercise.scores.length === 1 ? "" : "s"}`,
          audience: "Public archive",
          ctaLabel: "Open Review",
          ctaPath: "/review"
        } satisfies SocialPost;
      }

      return {
        id: `active-${exercise.id}`,
        authorId: exercise.creatorId,
        kind: "creator_update",
        headline: `${creatorLabel(exercise.creatorId)} opened a new blind target: ${exercise.title}`,
        body: exercise.viewerPrompt.trim() || `Blind cue ${exercise.blindCue} is now collecting impressions.`,
        createdAt: exercise.startsAt,
        exerciseId: exercise.id,
        statsLabel: `${exercise.predictions.length} submission${exercise.predictions.length === 1 ? "" : "s"} so far`,
        audience: "Blind-safe",
        ctaLabel: "Open Exercise Feed",
        ctaPath: "/exercises"
      } satisfies SocialPost;
    });

    const systemPost: SocialPost = {
      id: "system-community",
      authorId: activeUser?.id ?? authState.accounts[0]?.id ?? "system",
      kind: "system",
      headline: "PsyPerspective community stream is live",
      body: "Use this page to track creator publishing activity, reveal openings, and aggregate viewer practice without exposing hidden targets early.",
      createdAt: new Date().toISOString(),
      exerciseId: null,
      statsLabel: `${activeExercises.length} active • ${closedExercises.length} closed`,
      audience: "All signed-in users",
      ctaLabel: "Open Analytics",
      ctaPath: "/analytics"
    };

    const communityPosts = socialState.customPosts.map((post) => ({
      ...post,
      statsLabel:
        post.exerciseId && sortedExercises.some((exercise) => exercise.id === post.exerciseId)
          ? "Linked to an exercise"
          : "Community post"
    }));

    return [systemPost, ...communityPosts, ...exercisePosts, ...viewerSpotlights]
      .map((post) => {
        const interaction = socialState.interactions[post.id] ?? createEmptySocialInteraction();
        const reactionTotal =
          interaction.reactions.resonates.length + interaction.reactions.curious.length + interaction.reactions.sharp.length;

        return {
          ...post,
          statsLabel:
            post.kind === "creator_update" && socialState.customPosts.some((customPost) => customPost.id === post.id)
              ? `${reactionTotal} reaction${reactionTotal === 1 ? "" : "s"} • ${interaction.comments.length} comment${interaction.comments.length === 1 ? "" : "s"}`
              : post.statsLabel
        };
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [activeExercises.length, activeUser?.id, authState.accounts, closedExercises.length, socialState, sortedExercises]);

  async function publishSocialPost() {
    if (!activeUser) {
      setSocialFeedback("Sign in before posting to the community feed.");
      return;
    }

    if (!isCreatorRole(activeUser.role)) {
      setSocialFeedback("Only creator and admin accounts can publish community posts.");
      return;
    }

    if (isPublishingSocialPost) {
      return;
    }

    const headline = socialDraft.headline.trim();
    const body = socialDraft.body.trim();

    if (!headline) {
      setSocialFeedback("Add a short headline for the post.");
      return;
    }

    if (!body) {
      setSocialFeedback("Write the body of the post before publishing.");
      return;
    }

    const linkedExercise = sortedExercises.find((exercise) => exercise.id === socialDraft.exerciseId) ?? null;
    setIsPublishingSocialPost(true);
    try {
      const payload = await publishSocialPostRequest({
        headline,
        body,
        exerciseId: linkedExercise?.id ?? ""
      });
      const publishedPost = { ...payload.post, kind: "creator_update" as const };
      setSocialState((current) => {
        const nextPosts = payload.socialState.customPosts.some((post) => post.id === publishedPost.id)
          ? payload.socialState.customPosts
          : [publishedPost, ...payload.socialState.customPosts.filter((post) => post.id !== publishedPost.id)];

        return {
          customPosts: nextPosts,
          interactions: {
            ...current.interactions,
            ...payload.socialState.interactions,
            [publishedPost.id]:
              payload.socialState.interactions[publishedPost.id] ??
              current.interactions[publishedPost.id] ??
              createEmptySocialInteraction()
          }
        };
      });
      setSocialDraft(createEmptySocialPostDraft());
      setSocialFeedback("Community post published to the shared feed.");
    } catch (error) {
      if (isBackendUnavailableError(error) || isRouteNotFoundError(error)) {
        const fallbackPost: SocialState["customPosts"][number] = {
          id: createId("social"),
          authorId: activeUser.id,
          kind: "creator_update",
          headline,
          body,
          createdAt: new Date().toISOString(),
          exerciseId: linkedExercise?.id ?? null,
          statsLabel: "Community post",
          audience: linkedExercise ? (isClosed(linkedExercise) ? "Public archive" : "Blind-safe") : "Community",
          ctaLabel: linkedExercise ? (isClosed(linkedExercise) ? "Open Review" : "Open Exercise Feed") : "Open Social Feed",
          ctaPath: linkedExercise ? (isClosed(linkedExercise) ? "/review" : "/exercises") : "/social"
        };
        let nextSocialState: SocialState | null = null;

        setSocialState((current) => {
          nextSocialState = {
            customPosts: [fallbackPost, ...current.customPosts.filter((post) => post.id !== fallbackPost.id)],
            interactions: {
              ...current.interactions,
              [fallbackPost.id]: current.interactions[fallbackPost.id] ?? createEmptySocialInteraction()
            }
          };

          return nextSocialState;
        });

        if (nextSocialState) {
          await writeDatabaseJSON(SOCIAL_STATE_DATABASE_KEY, nextSocialState, SOCIAL_STATE_UPDATED_EVENT);
        }

        setSocialDraft(createEmptySocialPostDraft());
        setSocialFeedback("Community post published to the browser-backed social feed.");
        return;
      }

      setSocialFeedback(error instanceof Error ? error.message : "Unable to publish the community post.");
    } finally {
      setIsPublishingSocialPost(false);
    }
  }

  async function toggleSocialReaction(postId: string, reaction: SocialReactionKey) {
    if (!activeUser) {
      setSocialFeedback("Sign in before reacting to community posts.");
      return;
    }

    try {
      setSocialState(await toggleSocialReactionRequest(postId, reaction));
      setSocialFeedback("Post interaction updated across the shared feed.");
    } catch (error) {
      if (isBackendUnavailableError(error) || isRouteNotFoundError(error)) {
        let nextSocialState: SocialState | null = null;

        setSocialState((current) => {
          const existing = current.interactions[postId] ?? createEmptySocialInteraction();
          const nextReactions = {
            resonates: existing.reactions.resonates.filter((userId) => userId !== activeUser.id),
            curious: existing.reactions.curious.filter((userId) => userId !== activeUser.id),
            sharp: existing.reactions.sharp.filter((userId) => userId !== activeUser.id)
          };

          if (!existing.reactions[reaction].includes(activeUser.id)) {
            nextReactions[reaction].push(activeUser.id);
          }

          nextSocialState = {
            ...current,
            interactions: {
              ...current.interactions,
              [postId]: {
                ...existing,
                reactions: nextReactions
              }
            }
          };

          return nextSocialState;
        });

        if (nextSocialState) {
          await writeDatabaseJSON(SOCIAL_STATE_DATABASE_KEY, nextSocialState, SOCIAL_STATE_UPDATED_EVENT);
        }

        setSocialFeedback("Post interaction updated in local mode.");
        return;
      }

      setSocialFeedback(error instanceof Error ? error.message : "Unable to update the post interaction.");
    }
  }

  async function addSocialComment(postId: string) {
    if (!activeUser) {
      setSocialFeedback("Sign in before commenting on community posts.");
      return;
    }

    if (postingCommentIds.includes(postId)) {
      return;
    }

    const body = commentDrafts[postId]?.trim() ?? "";

    if (!body) {
      setSocialFeedback("Write a comment before posting it.");
      return;
    }

    setPostingCommentIds((current) => [...current, postId]);
    try {
      const payload = await addSocialCommentRequest(postId, body);
      setSocialState(payload.socialState);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setSocialFeedback("Comment posted to the shared feed.");
    } catch (error) {
      if (isBackendUnavailableError(error) || isRouteNotFoundError(error)) {
        const nextComment: SocialComment = {
          id: createId("comment"),
          authorId: activeUser.id,
          body,
          createdAt: new Date().toISOString()
        };
        let nextSocialState: SocialState | null = null;

        setSocialState((current) => {
          const existing = current.interactions[postId] ?? createEmptySocialInteraction();
          nextSocialState = {
            ...current,
            interactions: {
              ...current.interactions,
              [postId]: {
                ...existing,
                comments: [nextComment, ...existing.comments]
              }
            }
          };

          return nextSocialState;
        });

        if (nextSocialState) {
          await writeDatabaseJSON(SOCIAL_STATE_DATABASE_KEY, nextSocialState, SOCIAL_STATE_UPDATED_EVENT);
        }

        setCommentDrafts((current) => ({ ...current, [postId]: "" }));
        setSocialFeedback("Comment posted in local mode.");
        return;
      }

      setSocialFeedback(error instanceof Error ? error.message : "Unable to post the comment.");
    } finally {
      setPostingCommentIds((current) => current.filter((id) => id !== postId));
    }
  }
  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { path: "/", label: "Overview", detail: "Session summary and live metrics." },
      { path: "/account", label: "Account Settings", detail: "Update profile, password, and shared preferences." },
      {
        path: "/analytics",
        label: "Analytics",
        detail:
          activeUser && isCreatorRole(activeUser.role)
            ? "Exercise performance, scoring depth, and creator reach."
            : "Track prediction activity, archive health, and scoring trends."
      },
      {
        path: "/messages",
        label: "User Messages",
        detail:
          unreadMessagesCount > 0
            ? `${unreadMessagesCount} unread direct message${unreadMessagesCount === 1 ? "" : "s"}.`
            : "Direct notes between creators and viewers."
      },
      {
        path: "/social",
        label: "Social Posts",
        detail: socialPosts[0]?.statsLabel ?? "Community activity, reveal drops, and creator updates."
      },
      { path: "/exercises", label: "Exercise Feed", detail: "Browse active and archived targets." },
      {
        path: "/console",
        label: "Exercise Console",
        detail:
          activeUser && isCreatorRole(activeUser.role)
            ? "Manage live targets, reveal packages, and prediction intake."
            : "Creator-only management surface."
      },
      {
        path: "/workspace",
        label: activeUser ? getWorkspaceLabel(activeUser.role) : "Prediction Pad",
        detail:
          activeUser && isCreatorRole(activeUser.role)
            ? "Publish new blind targets and reveals."
            : "Draw, write, and save your impression."
      },
      {
        path: "/review",
        label: selectedExercise && isClosed(selectedExercise) ? "Closed Review" : "Review Lock",
        detail:
          selectedExercise && isClosed(selectedExercise)
            ? "Score accuracy after the archive opens."
            : "Archive opens when the selected exercise closes."
      }
    ],
    [activeUser?.role, selectedExercise, socialPosts, unreadMessagesCount]
  );

  function updateCreateForm(nextValue: CreateFormState | ((current: CreateFormState) => CreateFormState)) {
    if (!activeCreatorId) {
      return;
    }

    setCreateDrafts((current) => {
      const currentDraft = current[activeCreatorId] ?? createEmptyCreateForm();
      const nextDraft = typeof nextValue === "function" ? nextValue(currentDraft) : nextValue;

      if (areCreateFormsEqual(currentDraft, nextDraft)) {
        return current;
      }

      if (isCreateFormEmpty(nextDraft)) {
        if (!(activeCreatorId in current)) {
          return current;
        }

        const nextDrafts = { ...current };
        delete nextDrafts[activeCreatorId];
        return nextDrafts;
      }

      return {
        ...current,
        [activeCreatorId]: nextDraft
      };
    });
  }

  useEffect(() => {
    if (!databaseHydrated || !activeCreatorId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveCreateDraft(createDrafts[activeCreatorId] ?? createEmptyCreateForm()).catch((error) => {
        console.error(error);
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeCreatorId, createDrafts, databaseHydrated]);

  useEffect(() => {
    if (!databaseHydrated) {
      return;
    }

    void writeDatabaseJSON(SOCIAL_STATE_DATABASE_KEY, socialState, SOCIAL_STATE_UPDATED_EVENT).catch((error) => {
      console.error(error);
    });
  }, [databaseHydrated, socialState]);

  function isClosed(exercise: Exercise) {
    const closesAt = getValidTimestamp(exercise.closesAt);
    return closesAt !== null ? closesAt <= Date.now() || exercise.status === "closed" : exercise.status === "closed";
  }

  function isStarted(exercise: Exercise) {
    const startsAt = getValidTimestamp(exercise.startsAt);
    return startsAt !== null && startsAt <= Date.now() && exercise.status !== "draft";
  }

  function canEditExercise(exercise: Exercise) {
    return isCreatorRole(activeUser?.role ?? "viewer") && managedExercises.some((item) => item.id === exercise.id) && !isStarted(exercise);
  }

  function canSeeLivePredictions(exercise: Exercise) {
    return Boolean(
      activeUser &&
        (exercise.creatorId === activeUser.id ||
          activeUser.role === "admin" ||
          exercise.coCreatorIds.includes(activeUser.id))
    );
  }

  function canSeeReveal(exercise: Exercise) {
    if (isClosed(exercise) || canSeeLivePredictions(exercise)) {
      return true;
    }

    if (exercise.revealPolicy === "on_start") {
      return isStarted(exercise);
    }

    if (exercise.revealPolicy !== "on_completion" || !activeUser) {
      return false;
    }

    return exercise.predictions.filter((prediction) => prediction.userId === activeUser.id).length >= exercise.maxEntriesPerViewer;
  }

  function loadExerciseIntoDraft(exercise: Exercise) {
    const startsAt = getValidTimestamp(exercise.startsAt);
    const closesAt = getValidTimestamp(exercise.closesAt);
    const durationHours = Math.max(
      1,
      Math.round((((closesAt ?? Date.now()) - (startsAt ?? Date.now())) / (60 * 60 * 1000)))
    );

    updateCreateForm({
      exerciseId: exercise.id,
      exerciseNumber: exercise.exerciseNumber,
      title: exercise.title,
      blindCue: exercise.blindCue,
      viewerPrompt: exercise.viewerPrompt,
      hiddenTarget: exercise.hiddenTarget,
      revealSummary: exercise.revealSummary,
      targetImageData: exercise.targetImageData,
      targetImageName: exercise.targetImageName,
      startsAt: startsAt === null ? "" : new Date(startsAt).toISOString().slice(0, 16),
      durationHours: String(durationHours),
      maxEntriesPerViewer: String(exercise.maxEntriesPerViewer),
      revealPolicy: exercise.revealPolicy,
      coCreatorIds: exercise.coCreatorIds,
      publishMode: exercise.status === "draft" ? "draft" : "publish"
    });
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#fbf7ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setFeedback("Sketchpad cleared.");
  }

  function handleTargetImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Choose an image file for the hidden target reveal.");
      event.target.value = "";
      return;
    }

    if (file.size > TARGET_IMAGE_LIMIT_BYTES) {
      setFeedback("Target images must stay under 2 MB in this shared demo.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setFeedback("The selected target image could not be read.");
        return;
      }

      updateCreateForm((current) => ({
        ...current,
        targetImageData: reader.result as string,
        targetImageName: file.name
      }));
      setFeedback(`Reveal image "${file.name}" added to the exercise draft.`);
      event.target.value = "";
    };

    reader.onerror = () => {
      setFeedback("The selected target image could not be read.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function removeTargetImage() {
    updateCreateForm((current) => ({
      ...current,
      targetImageData: "",
      targetImageName: ""
    }));
    setFeedback("Reveal image removed from the exercise draft.");
  }

  function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(event);
    drawingRef.current = true;
    lastPointRef.current = point;
    canvas.setPointerCapture(event.pointerId);

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const lastPoint = lastPointRef.current;

    if (!canvas || !context || !lastPoint) {
      return;
    }

    const point = getCanvasPoint(event);
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      console.error("PsyPerspective pointer release failed", error);
    }
  }

  async function savePrediction() {
    if (!activeUser) {
      setFeedback("Sign in before saving a prediction.");
      return;
    }

    if (!selectedExercise) {
      setFeedback("Pick an exercise before submitting a prediction.");
      return;
    }

    if (selectedExercise.creatorId === activeUser.id) {
      setFeedback("Creators cannot submit predictions to their own target.");
      return;
    }

    if (isClosed(selectedExercise)) {
      setFeedback("This exercise is closed. Review and scoring are open instead.");
      return;
    }

    if (!isStarted(selectedExercise)) {
      setFeedback("This exercise has not started yet.");
      return;
    }

    const currentEntryCount = selectedExercise.predictions.filter((prediction) => prediction.userId === activeUser.id).length;
    if (currentEntryCount >= selectedExercise.maxEntriesPerViewer) {
      setFeedback("You have reached the submission limit for this exercise.");
      return;
    }

    const canvas = canvasRef.current;
    const imageData = canvas?.toDataURL("image/png") ?? "";

    if (!imageData) {
      setFeedback("Sketchpad is unavailable right now.");
      return;
    }

    const nextPrediction: Prediction = {
      id: createId("prediction"),
      userId: activeUser.id,
      submittedAt: new Date().toISOString(),
      imageData,
      notes: predictionNotes.trim(),
      entryNumber: currentEntryCount + 1
    };

    try {
      const updatedExercise = await savePredictionRequest(selectedExercise.id, { imageData, notes: nextPrediction.notes });

      setAppState((current) => ({
        ...current,
        exercises: current.exercises.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise))
      }));
      setFeedback(
        `Entry ${nextPrediction.entryNumber}/${selectedExercise.maxEntriesPerViewer} saved. It stays hidden from other viewers until reveal unlocks.`
      );
    } catch (error) {
      console.error(error);
      setFeedback("Prediction save failed. Check the backend connection and try again.");
    }
  }

  async function saveExercise(publishMode: "draft" | "publish") {
    if (!activeUser) {
      setFeedback("Sign in before creating an exercise.");
      return;
    }

    if (!isCreatorRole(activeUser.role)) {
      setFeedback("Only creator or admin accounts can open new targets.");
      return;
    }

    if (
      publishMode === "publish" &&
      (
        !createForm.title.trim() ||
        !createForm.blindCue.trim() ||
        !createForm.viewerPrompt.trim() ||
        !createForm.hiddenTarget.trim() ||
        !createForm.revealSummary.trim()
      )
    ) {
      setFeedback("Complete all target fields before creating an exercise.");
      return;
    }

    if (publishMode === "publish" && activeBlindCueConflict) {
      setFeedback("Use a blind cue that is not already active in the feed.");
      return;
    }

    const durationHours = Number(createForm.durationHours);

    if (publishMode === "publish" && (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 168)) {
      setFeedback("Set a duration between 1 and 168 hours.");
      return;
    }

    const startsAt = createForm.startsAt ? new Date(createForm.startsAt).toISOString() : "";
    if (publishMode === "publish" && (!createForm.startsAt || Number.isNaN(new Date(startsAt).getTime()))) {
      setFeedback("Set a valid live start time.");
      return;
    }

    const closesAt =
      publishMode === "publish" && startsAt
        ? new Date(new Date(startsAt).getTime() + durationHours * 60 * 60 * 1000).toISOString()
        : "";

    try {
      const payload = {
        title: createForm.title.trim(),
        blindCue: createForm.blindCue.trim(),
        viewerPrompt: createForm.viewerPrompt.trim(),
        hiddenTarget: createForm.hiddenTarget.trim(),
        revealSummary: createForm.revealSummary.trim(),
        targetImageData: createForm.targetImageData,
        targetImageName: createForm.targetImageName,
        startsAt,
        closesAt,
        revealPolicy: createForm.revealPolicy,
        maxEntriesPerViewer: normalizedMaxEntries,
        coCreatorIds: createForm.coCreatorIds,
        publishMode
      };
      const savedExercise = createForm.exerciseId
        ? await updateExerciseRequest(createForm.exerciseId, payload)
        : await createExerciseRequest(payload);

      setAppState((current) => ({
        ...current,
        exercises: current.exercises.some((exercise) => exercise.id === savedExercise.id)
          ? current.exercises.map((exercise) => (exercise.id === savedExercise.id ? savedExercise : exercise))
          : [savedExercise, ...current.exercises]
      }));
      setSelectedExerciseId(savedExercise.id);
      updateCreateForm(createEmptyCreateForm());
      setFeedback(
        publishMode === "draft"
          ? `Draft #${savedExercise.exerciseNumber} saved. You can edit it until the scheduled start.`
          : `Exercise #${savedExercise.exerciseNumber} saved. Only creators can watch predictions arrive before reveal unlocks.`
      );
    } catch (error) {
      console.error(error);
      setFeedback("Exercise save failed. Check the backend connection and try again.");
    }
  }

  function updateScoreDraft(predictionId: string, field: "accuracy" | "comment", value: number | string) {
    setScoreDrafts((current) => ({
      ...current,
      [predictionId]: {
        accuracy: current[predictionId]?.accuracy ?? 3,
        comment: current[predictionId]?.comment ?? "",
        [field]: value
      }
    }));
  }

  async function saveScore(exerciseId: string, predictionId: string) {
    if (!activeUser) {
      setFeedback("Sign in before saving a score.");
      return;
    }

    const draft = scoreDrafts[predictionId];

    if (!draft) {
      setFeedback("Set a score before saving.");
      return;
    }

    try {
      const updatedExercise = await saveScoreRequest(exerciseId, predictionId, draft);
      setAppState((current) => ({
        ...current,
        exercises: current.exercises.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise))
      }));
      setFeedback("Accuracy score saved to the shared database.");
    } catch (error) {
      console.error(error);
      setFeedback("Accuracy score save failed. Check the backend connection and try again.");
    }
  }

  const creatorName = selectedExercise
    ? authState.accounts.find((user) => user.id === selectedExercise.creatorId)?.name ?? "Unknown creator"
    : "";
  const activeUserSettings = activeUser ? accountSettings[activeUser.id] ?? createDefaultAccountSettings(activeUser) : null;
  const accountCompletion = activeUser
    ? [
        hasText(activeUser.name),
        hasText(activeUser.email),
        hasText(activeUserSettings?.communityAlias),
        hasText(activeUserSettings?.profileNote)
      ].filter(Boolean).length
    : 0;
  const savedPredictionCount = activeUser
    ? sortedExercises.reduce(
        (total, exercise) => total + exercise.predictions.filter((prediction) => prediction.userId === activeUser.id).length,
        0
      )
    : 0;

  async function loginAs(email: string, password: string) {
    try {
      const bootstrap = applyBootstrapState(await login(email, password));
      const matchedAccount =
        bootstrap.authState.accounts.find((account) => account.id === bootstrap.authState.activeUserId) ?? null;

      if (matchedAccount) {
        setFeedback(
          isCreatorRole(matchedAccount.role)
            ? `${getWorkspaceLabel(matchedAccount.role)} ready. You can open a target and monitor predictions.`
            : "Viewer workspace ready. Pick a target and submit an impression."
        );
        setAuthFeedback(`Signed in as ${matchedAccount.name}.`);
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      if (isBackendUnavailableError(error)) {
        const offlineAccounts = mergeOfflineAccounts(authState.accounts);
        const normalizedEmail = normalizeEmail(email);
        const matchedAccount =
          offlineAccounts.find(
            (account) => normalizeEmail(account.email) === normalizedEmail && account.password === password
          ) ?? null;

        if (!matchedAccount) {
          setAuthFeedback("Shared API offline. Use one of the local demo account credentials.");
          return;
        }

        applyBootstrapState(buildLocalBootstrap(matchedAccount, offlineAccounts));
        setFeedback(
          isCreatorRole(matchedAccount.role)
            ? `${getWorkspaceLabel(matchedAccount.role)} ready in local mode.`
            : "Viewer workspace ready in local mode."
        );
        setAuthFeedback(`Signed in as ${matchedAccount.name} using local mode.`);
        navigate("/", { replace: true });
        return;
      }

      setAuthFeedback(error instanceof Error ? error.message : "Sign in failed.");
    }
  }

  function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loginAs(loginEmail, loginPassword);
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!registerForm.name.trim()) {
      setAuthFeedback("Add a display name for the new account.");
      return;
    }

    const normalizedEmail = normalizeEmail(registerForm.email);

    if (!isValidEmail(normalizedEmail)) {
      setAuthFeedback("Enter a valid email address.");
      return;
    }

    if (registerForm.password.length < 6) {
      setAuthFeedback("Use a password with at least 6 characters.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthFeedback("Passwords do not match.");
      return;
    }

    if (authState.accounts.some((account) => normalizeEmail(account.email) === normalizedEmail)) {
      setAuthFeedback("An account with that email already exists.");
      return;
    }

    try {
      const bootstrap = applyBootstrapState(
        await register(registerForm.name.trim(), normalizedEmail, registerForm.password, registerForm.role)
      );
      const nextAccount =
        bootstrap.authState.accounts.find((account) => account.id === bootstrap.authState.activeUserId) ?? null;
      setLoginEmail(normalizedEmail);
      setLoginPassword(registerForm.password);
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "viewer"
      });

      if (nextAccount) {
        setFeedback(
          isCreatorRole(nextAccount.role)
            ? `${getWorkspaceLabel(nextAccount.role)} ready. You can open a target and monitor predictions.`
            : "Viewer workspace ready. Pick a target and submit an impression."
        );
        setAuthFeedback(`Account created and signed in as ${nextAccount.name}.`);
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      if (isBackendUnavailableError(error)) {
        const offlineAccounts = mergeOfflineAccounts(authState.accounts);

        if (offlineAccounts.some((account) => normalizeEmail(account.email) === normalizedEmail)) {
          setAuthFeedback("An account with that email already exists.");
          return;
        }

        const nextAccount: User = {
          id: createId("user"),
          name: registerForm.name.trim(),
          email: normalizedEmail,
          password: registerForm.password,
          role: registerForm.role,
          source: "registered",
          createdAt: new Date().toISOString()
        };
        const nextAccounts = normalizeStoredAccounts([...offlineAccounts, nextAccount]);

        applyBootstrapState(buildLocalBootstrap(nextAccount, nextAccounts));
        setLoginEmail(normalizedEmail);
        setLoginPassword(registerForm.password);
        setRegisterForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "viewer"
        });
        setFeedback(
          isCreatorRole(nextAccount.role)
            ? `${getWorkspaceLabel(nextAccount.role)} ready in local mode.`
            : "Viewer workspace ready in local mode."
        );
        setAuthFeedback(`Account created and signed in as ${nextAccount.name} using local mode.`);
        navigate("/", { replace: true });
        return;
      }

      setAuthFeedback(error instanceof Error ? error.message : "Account creation failed.");
    }
  }

  async function handleLogout() {
    if (embeddedAccount) {
      applyBootstrapState(buildEmbeddedBootstrap(embeddedAccount));
      setAuthFeedback(`Connected through MainAP as ${embeddedAccount.name}.`);
      navigate("/", { replace: true });
      return;
    }

    try {
      await logout();
    } catch (error) {
      console.error(error);
    }

    const fallbackState = createBackendFallbackState();
    setAppState(fallbackState.appState);
    setAuthState(fallbackState.authState);
    setAccountSettings({});
    setMessages([]);
    setCreateDrafts({});
    setAuthFeedback("Signed out. Sign in with a shared account.");
    navigate("/", { replace: true });
  }

  async function saveAccountSettings() {
    if (!activeUser) {
      setAccountFeedback("Sign in before editing account settings.");
      return;
    }

    if (!accountForm.name.trim()) {
      setAccountFeedback("Add a display name before saving.");
      return;
    }

    const normalizedEmail = normalizeEmail(accountForm.email);

    if (!isValidEmail(normalizedEmail)) {
      setAccountFeedback("Enter a valid email address.");
      return;
    }

    if (accountForm.password && accountForm.password.length < 6) {
      setAccountFeedback("Use a password with at least 6 characters.");
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      setAccountFeedback("Password confirmation does not match.");
      return;
    }

    if (
      authState.accounts.some(
        (account) => account.id !== activeUser.id && normalizeEmail(account.email) === normalizedEmail
      )
    ) {
      setAccountFeedback("That email is already assigned to another account.");
      return;
    }

    try {
      applyBootstrapState(
        await saveAccount(accountForm.name.trim(), normalizedEmail, accountForm.password, {
          communityAlias: accountForm.communityAlias.trim() || accountForm.name.trim(),
          profileNote: accountForm.profileNote.trim(),
          focusMode: accountForm.focusMode,
          revealAlerts: accountForm.revealAlerts
        })
      );
      setLoginEmail(normalizedEmail);
      if (accountForm.password) {
        setLoginPassword(accountForm.password);
      }
      setAuthFeedback(`Account settings saved for ${accountForm.name.trim()}.`);
      setFeedback("Account settings updated.");
      setAccountFeedback("Saved. Your account profile and preferences are now updated.");
    } catch (error) {
      console.error(error);
      setAccountFeedback(error instanceof Error ? error.message : "Account save failed.");
    }
  }

  function resetAccountForm() {
    if (!activeUser) {
      return;
    }

    const settings = accountSettings[activeUser.id] ?? createDefaultAccountSettings(activeUser);
    setAccountForm({
      name: activeUser.name,
      email: activeUser.email,
      password: "",
      confirmPassword: "",
      communityAlias: settings.communityAlias,
      profileNote: settings.profileNote,
      focusMode: settings.focusMode,
      revealAlerts: settings.revealAlerts
    });
    setAccountFeedback("Reverted the form to the last saved account settings.");
  }

  async function sendMessage() {
    if (!activeUser) {
      setMessageFeedback("Sign in before sending a message.");
      return;
    }

    if (!messageDraft.recipientId) {
      setMessageFeedback("Choose a recipient before sending.");
      return;
    }

    if (messageDraft.recipientId === activeUser.id) {
      setMessageFeedback("Send the message to another account.");
      return;
    }

    const recipient = authState.accounts.find((account) => account.id === messageDraft.recipientId);

    if (!recipient) {
      setMessageFeedback("The selected recipient is no longer available.");
      return;
    }

    const trimmedBody = messageDraft.body.trim();

    if (!trimmedBody) {
      setMessageFeedback("Write a message before sending.");
      return;
    }

    const linkedExercise = appState.exercises.find((exercise) => exercise.id === messageDraft.exerciseId);
    const subject =
      messageDraft.subject.trim() || (linkedExercise ? `Exercise note: ${linkedExercise.title}` : "General note");

    try {
      const nextMessage = await sendMessageRequest({
        ...messageDraft,
        exerciseId: linkedExercise?.id ?? "",
        subject,
        body: trimmedBody
      });

      setMessages((current) => [nextMessage, ...current]);
      setMessageDraft((current) => ({
        ...current,
        subject: "",
        body: ""
      }));
      setMessageFeedback(`Message sent to ${recipient.name}.`);
      setFeedback("User message sent.");
    } catch (error) {
      console.error(error);
      setMessageFeedback("Message send failed. Check the backend connection and try again.");
    }
  }

  if (!activeUser) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-left" />
        <div className="ambient ambient-right" />

        <main className="app-frame">
          <section className="hero-card auth-hero-card">
            <div className="hero-copy">
              <span className="eyebrow">PsyPerspective</span>
              <h1>Blind target practice with gated creator, viewer, and admin access.</h1>
              <p>
                Sign in to create hidden target exercises, submit blind sketches, and join the delayed reveal archive
                after each session closes.
              </p>
              <div className="auth-demo-list">
                {users.map((account) => (
                  <button
                    className="detail-card auth-demo-card"
                    key={account.id}
                    onClick={() => {
                      setLoginEmail(account.email);
                      setLoginPassword(account.password);
                      void loginAs(account.email, account.password);
                    }}
                    type="button"
                  >
                    <span>{account.role === "admin" ? "Demo admin" : account.role === "creator" ? "Demo creator" : "Demo viewer"}</span>
                    <strong>{account.name}</strong>
                    <p>{account.email}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-stack">
              <article className="hero-panel">
                <span>Sign In</span>
                <strong>Access an existing account</strong>
                <p aria-live="polite">{authFeedback}</p>
                <form className="stack-list" onSubmit={handleLoginSubmit}>
                  <label className="field">
                    <span>Email</span>
                    <input
                      onChange={(event) => setLoginEmail(event.target.value)}
                      type="email"
                      value={loginEmail}
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      onChange={(event) => setLoginPassword(event.target.value)}
                      type="password"
                      value={loginPassword}
                    />
                  </label>
                  <button className="button-primary" type="submit">
                    Sign In
                  </button>
                </form>
              </article>

              <article className="panel auth-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Register</span>
                    <h2>Create a shared account</h2>
                  </div>
                  <p>Choose whether the new account should publish targets or submit predictions.</p>
                  <p aria-live="polite">{authFeedback}</p>
                </div>
                <form className="stack-list" onSubmit={handleRegisterSubmit}>
                  <label className="field">
                    <span>Name</span>
                    <input
                      onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                      value={registerForm.name}
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      type="email"
                      value={registerForm.email}
                    />
                  </label>
                  <div className="form-grid form-grid-2">
                    <label className="field">
                      <span>Password</span>
                      <input
                        onChange={(event) =>
                          setRegisterForm((current) => ({ ...current, password: event.target.value }))
                        }
                        type="password"
                        value={registerForm.password}
                      />
                    </label>
                    <label className="field">
                      <span>Confirm password</span>
                      <input
                        onChange={(event) =>
                          setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        type="password"
                        value={registerForm.confirmPassword}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Account role</span>
                    <select
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          role: event.target.value as User["role"]
                        }))
                      }
                      value={registerForm.role}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="creator">Creator</option>
                    </select>
                  </label>
                  <button className="button-primary" type="submit">
                    Create Account
                  </button>
                </form>
              </article>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="app-frame">
        <div className="workspace-shell">
          <PsySidebar
            activeUser={activeUser}
            feedback={feedback}
            isClosed={isClosed}
            onLogout={handleLogout}
            selectedExercise={selectedExercise}
            sidebarItems={sidebarItems}
          />

          <div className="workspace-content">
            <Routes>
              <Route
                element={
                  <OverviewPage
                    activeExercises={activeExercises}
                    activeUser={activeUser}
                    closedExercises={closedExercises}
                    feedback={feedback}
                    savedPredictionCount={sortedExercises.reduce(
                      (total, exercise) =>
                        total + exercise.predictions.filter((prediction) => prediction.userId === activeUser.id).length,
                      0
                    )}
                    selectedExercise={selectedExercise}
                    unreadMessagesCount={unreadMessagesCount}
                  />
                }
                path="/"
              />
              <Route
                element={
                  <AccountSettingsPage
                    accountCompletion={accountCompletion}
                    accountFeedback={accountFeedback}
                    accountForm={accountForm}
                    activeUser={activeUser}
                    activeUserSettings={activeUserSettings}
                    onReset={resetAccountForm}
                    onSave={saveAccountSettings}
                    setAccountForm={setAccountForm}
                  />
                }
                path="/account"
              />
              <Route
                element={
                  <AnalyticsPage
                    accounts={authState.accounts}
                    activeUser={activeUser}
                    formatDateTime={formatDateTime}
                    sortedExercises={sortedExercises}
                  />
                }
                path="/analytics"
              />
              <Route
                element={
                  <MessagesPage
                    accounts={authState.accounts}
                    activeUser={activeUser}
                    formatDateTime={formatDateTime}
                    inboxMessagesCount={inboxMessagesCount}
                    isClosed={isClosed}
                    messageDraft={messageDraft}
                    messageFeedback={messageFeedback}
                    messageRecipients={messageRecipients}
                    onSendMessage={sendMessage}
                    sentMessagesCount={sentMessagesCount}
                    setMessageDraft={setMessageDraft}
                    sortedExercises={sortedExercises}
                    unreadMessagesCount={unreadMessagesCount}
                    visibleMessages={visibleMessages}
                  />
                }
                path="/messages"
              />
              <Route
                element={
                  <SocialPostsPage
                    accounts={authState.accounts}
                    activeExercises={activeExercises}
                    activeUser={activeUser}
                    closedExercises={closedExercises}
                    commentDrafts={commentDrafts}
                    formatDateTime={formatDateTime}
                    onAddComment={addSocialComment}
                    postingCommentIds={postingCommentIds}
                    isPublishingSocialPost={isPublishingSocialPost}
                    onPublishPost={publishSocialPost}
                    onToggleReaction={toggleSocialReaction}
                    setCommentDrafts={setCommentDrafts}
                    setSocialDraft={setSocialDraft}
                    socialDraft={socialDraft}
                    socialFeedback={socialFeedback}
                    socialInteractions={socialState.interactions}
                    socialPosts={socialPosts}
                    sortedExercises={sortedExercises}
                  />
                }
                path="/social"
              />
              <Route
                element={
                  <ExercisesPage
                    accounts={authState.accounts}
                    activeUser={activeUser}
                    canSeeLivePredictions={canSeeLivePredictions}
                    canSeeReveal={canSeeReveal}
                    creatorName={creatorName}
                    formatDateTime={formatDateTime}
                    isClosed={isClosed}
                    onSelectExercise={setSelectedExerciseId}
                    selectedExercise={selectedExercise}
                    sortedExercises={feedExercises}
                  />
                }
                path="/exercises"
              />
              <Route
                element={
                  <ExerciseConsolePage
                    accounts={authState.accounts}
                    activeUser={activeUser}
                    activeBlindCueConflict={activeBlindCueConflict}
                    canEditExercise={canEditExercise}
                    completedChecklistCount={completedChecklistCount}
                    creatorAccounts={authState.accounts.filter((account) => isCreatorRole(account.role) && account.id !== activeUser.id)}
                    createForm={createForm}
                    createPreviewCloseTime={createPreviewCloseTime}
                    creationChecklist={creationChecklist}
                    formatDateTime={formatDateTime}
                    isClosed={isClosed}
                    onEditExercise={loadExerciseIntoDraft}
                    managedExercises={managedExercises}
                    onSelectExercise={setSelectedExerciseId}
                    selectedExercise={selectedManagedExercise}
                  />
                }
                path="/console"
              />
              <Route
                element={
                  <WorkspacePage
                    activeBlindCueConflict={activeBlindCueConflict}
                    activeUser={activeUser}
                    canvasRef={canvasRef}
                    completedChecklistCount={completedChecklistCount}
                    creatorAccounts={authState.accounts.filter((account) => isCreatorRole(account.role) && account.id !== activeUser.id)}
                    createForm={createForm}
                    createPreviewCloseTime={createPreviewCloseTime}
                    creationChecklist={creationChecklist}
                    formatDateTime={formatDateTime}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                    handleTargetImageChange={handleTargetImageChange}
                    onCreateExercise={saveExercise}
                    onClearCanvas={clearCanvas}
                    onRemoveTargetImage={removeTargetImage}
                    onSavePrediction={savePrediction}
                    predictionNotes={predictionNotes}
                    selectedExercise={selectedExercise}
                    selectedPrediction={selectedPrediction}
                    setPredictionNotes={setPredictionNotes}
                    updateCreateForm={updateCreateForm}
                  />
                }
                path="/workspace"
              />
              <Route
                element={
                  <ReviewPage
                    accounts={authState.accounts}
                    activeUser={activeUser}
                    formatDateTime={formatDateTime}
                    onSaveScore={saveScore}
                    onUpdateScoreDraft={updateScoreDraft}
                    scoreDrafts={scoreDrafts}
                    selectedExercise={selectedExercise}
                  />
                }
                path="/review"
              />
              <Route element={<Navigate replace to="/" />} path="*" />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
