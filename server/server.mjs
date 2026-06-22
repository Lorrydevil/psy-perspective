import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DATABASE_PATH = path.join(DATA_DIR, "psy-perspective-db.json");
const HOST = process.env.API_HOST || "0.0.0.0";
const PORT = Number(process.env.API_PORT || "8787");
const APP_PATHS = new Set(["/", "/account", "/messages", "/social", "/exercises", "/workspace", "/review", "/analytics", "/console"]);

const SESSION_HEADER = "authorization";
const SEED_USERS = [
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isoHoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function createSeedTargetImage(label, background, accent, detail) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="${background}"/><circle cx="120" cy="84" r="44" fill="${detail}" opacity="0.85"/><path d="M0 256 C120 220 180 220 320 256 S520 292 640 244 V360 H0 Z" fill="${accent}" opacity="0.95"/><rect x="256" y="112" width="128" height="180" rx="16" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.55)" stroke-width="6"/><text x="320" y="324" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#10233a">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function generateSeedExercises() {
  const activeExerciseId = createId("exercise");
  const closedExerciseId = createId("exercise");
  const closedPredictionA = createId("prediction");
  const closedPredictionB = createId("prediction");

  return [
    {
      id: activeExerciseId,
      exerciseNumber: 1001,
      title: "Quiet Structure",
      blindCue: "Target 241",
      viewerPrompt: "Focus on the largest shape first, then any motion, temperature, or structural rhythm that follows.",
      hiddenTarget: "A red suspension bridge stretching over misty water at sunrise.",
      revealSummary: "Bridge silhouette, cables, fog and warm dawn light over water.",
      targetImageData: createSeedTargetImage("Bridge Target", "#efc178", "#d6694f", "#ffe8b8"),
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
      targetImageData: createSeedTargetImage("Lighthouse Target", "#89b6ff", "#17395e", "#fef0b0"),
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

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash || !passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedHash] = passwordHash.split(":");
  const inputHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");
  return expectedHash.length === inputHash.length && timingSafeEqual(expectedHash, inputHash);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    source: user.source,
    createdAt: user.createdAt
  };
}

function createDefaultAccountSettings(user) {
  const creatorLike = user.role === "creator" || user.role === "admin";
  return {
    communityAlias: user.name.split(" ")[0] || user.name,
    profileNote: creatorLike
      ? "Publishing blind targets and managing reveals."
      : "Practising blind impressions and scoring closed sessions.",
    focusMode: creatorLike ? "structured" : "freeform",
    revealAlerts: creatorLike
  };
}

function createEmptySocialInteraction() {
  return {
    reactions: {
      resonates: [],
      curious: [],
      sharp: []
    },
    comments: []
  };
}

function normalizeSocialComment(comment, validUserIds) {
  if (
    !comment ||
    typeof comment !== "object" ||
    typeof comment.id !== "string" ||
    typeof comment.authorId !== "string" ||
    !validUserIds.has(comment.authorId) ||
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

function normalizeSocialInteraction(interaction, validUserIds) {
  if (!interaction || typeof interaction !== "object") {
    return createEmptySocialInteraction();
  }

  const normalizeReactionUsers = (value) =>
    Array.isArray(value) ? value.filter((entry) => typeof entry === "string" && validUserIds.has(entry)) : [];

  return {
    reactions: {
      resonates: normalizeReactionUsers(interaction.reactions?.resonates),
      curious: normalizeReactionUsers(interaction.reactions?.curious),
      sharp: normalizeReactionUsers(interaction.reactions?.sharp)
    },
    comments: Array.isArray(interaction.comments)
      ? interaction.comments
          .map((comment) => normalizeSocialComment(comment, validUserIds))
          .filter((comment) => comment !== null)
      : []
  };
}

function normalizeSocialState(socialState, users, exercises) {
  const validUserIds = new Set(users.map((user) => user.id));
  const validExerciseIds = new Set(exercises.map((exercise) => exercise.id));
  const source = socialState && typeof socialState === "object" ? socialState : {};
  const customPosts = Array.isArray(source.customPosts)
    ? source.customPosts
        .map((post) => {
          if (
            !post ||
            typeof post !== "object" ||
            typeof post.id !== "string" ||
            typeof post.authorId !== "string" ||
            !validUserIds.has(post.authorId) ||
            typeof post.headline !== "string" ||
            typeof post.body !== "string" ||
            typeof post.createdAt !== "string" ||
            (post.exerciseId !== null && post.exerciseId !== undefined && typeof post.exerciseId !== "string") ||
            (typeof post.exerciseId === "string" && !validExerciseIds.has(post.exerciseId)) ||
            typeof post.statsLabel !== "string" ||
            typeof post.audience !== "string" ||
            typeof post.ctaLabel !== "string" ||
            typeof post.ctaPath !== "string" ||
            !APP_PATHS.has(post.ctaPath)
          ) {
            return null;
          }

          return {
            id: post.id,
            authorId: post.authorId,
            kind: "creator_update",
            headline: post.headline,
            body: post.body,
            createdAt: post.createdAt,
            exerciseId: post.exerciseId ?? null,
            statsLabel: post.statsLabel,
            audience: post.audience,
            ctaLabel: post.ctaLabel,
            ctaPath: post.ctaPath
          };
        })
        .filter((post) => post !== null)
    : [];

  const interactions = Object.fromEntries(
    Object.entries(source.interactions && typeof source.interactions === "object" ? source.interactions : {}).map(
      ([postId, interaction]) => [postId, normalizeSocialInteraction(interaction, validUserIds)]
    )
  );

  return {
    customPosts,
    interactions
  };
}

function getSocialPostIds(data) {
  const ids = new Set(["system-community"]);

  for (const post of data.socialState.customPosts) {
    ids.add(post.id);
  }

  for (const exercise of data.exercises) {
    ids.add(`${deriveExerciseStatus(exercise) === "closed" ? "reveal" : "active"}-${exercise.id}`);
  }

  for (const user of data.users.filter((entry) => entry.role === "viewer")) {
    const predictionCount = data.exercises.reduce(
      (total, exercise) => total + exercise.predictions.filter((prediction) => prediction.userId === user.id).length,
      0
    );

    if (predictionCount > 0) {
      ids.add(`viewer-${user.id}`);
    }
  }

  return ids;
}

function ensureDataFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(DATABASE_PATH)) {
    const seededUsers = SEED_USERS.map((user) => ({
      ...user,
      email: normalizeEmail(user.email),
      passwordHash: hashPassword(user.password)
    })).map(({ password, ...user }) => user);

    const data = {
      version: 1,
      users: seededUsers,
      sessions: [],
      accountSettings: Object.fromEntries(seededUsers.map((user) => [user.id, createDefaultAccountSettings(user)])),
      exercises: generateSeedExercises(),
      messages: [],
      createDrafts: {},
      socialState: {
        customPosts: [],
        interactions: {}
      },
      metadata: {
        createdAt: new Date().toISOString(),
        migrationCompletedAt: null,
        nextExerciseNumber: 1003
      }
    };

    writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
  }
}

function readDatabase() {
  ensureDataFile();
  const data = JSON.parse(readFileSync(DATABASE_PATH, "utf8"));
  return normalizeDatabase(data);
}

function deriveExerciseStatus(exercise) {
  if (exercise.status === "draft") {
    return "draft";
  }

  const now = Date.now();
  const startTime = new Date(exercise.startsAt || exercise.createdAt).getTime();
  const closeTime = new Date(exercise.closesAt).getTime();

  if (Number.isFinite(closeTime) && closeTime <= now) {
    return "closed";
  }

  if (Number.isFinite(startTime) && startTime > now) {
    return "scheduled";
  }

  return "active";
}

function normalizeExercise(exercise, fallbackNumber) {
  const predictions = Array.isArray(exercise.predictions) ? exercise.predictions : [];
  const createdAt = typeof exercise.createdAt === "string" ? exercise.createdAt : new Date().toISOString();
  const startsAt = typeof exercise.startsAt === "string" && exercise.startsAt ? exercise.startsAt : createdAt;
  const nextExercise = {
    ...exercise,
    exerciseNumber: Number.isFinite(Number(exercise.exerciseNumber)) ? Number(exercise.exerciseNumber) : fallbackNumber,
    coCreatorIds: Array.isArray(exercise.coCreatorIds)
      ? exercise.coCreatorIds.filter((entry) => typeof entry === "string")
      : [],
    startsAt,
    status: deriveExerciseStatus({ ...exercise, startsAt, createdAt }),
    revealPolicy:
      exercise.revealPolicy === "on_completion" || exercise.revealPolicy === "on_start"
        ? exercise.revealPolicy
        : "on_expiry",
    maxEntriesPerViewer: Math.max(1, Number.isFinite(Number(exercise.maxEntriesPerViewer)) ? Number(exercise.maxEntriesPerViewer) : 1),
    predictions: predictions.map((prediction, index) => ({
      ...prediction,
      entryNumber: Number.isFinite(Number(prediction.entryNumber)) ? Number(prediction.entryNumber) : index + 1
    })),
    scores: Array.isArray(exercise.scores) ? exercise.scores : []
  };

  return nextExercise;
}

function normalizeDatabase(data) {
  const exercises = Array.isArray(data.exercises) ? data.exercises : [];
  let nextNumber = 1001;
  data.exercises = exercises.map((exercise) => {
    const normalized = normalizeExercise(exercise, nextNumber);
    nextNumber = Math.max(nextNumber, normalized.exerciseNumber + 1);
    return normalized;
  });

  data.metadata = {
    ...(data.metadata || {}),
    createdAt: data.metadata?.createdAt || new Date().toISOString(),
    migrationCompletedAt: data.metadata?.migrationCompletedAt || null,
    nextExerciseNumber: Math.max(nextNumber, Number(data.metadata?.nextExerciseNumber) || 1001)
  };

  data.socialState = normalizeSocialState(data.socialState, Array.isArray(data.users) ? data.users : [], data.exercises);

  return data;
}

function writeDatabase(data) {
  writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
}

function json(response, statusCode, payload, origin) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin || "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET,POST,PUT,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getOrigin(request) {
  return request.headers.origin || "*";
}

function getSessionToken(request) {
  const header = request.headers[SESSION_HEADER];
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function getSessionUser(data, request) {
  const token = getSessionToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = data.sessions.find((entry) => entry.tokenHash === tokenHash);
  if (!session) {
    return null;
  }

  session.lastSeenAt = new Date().toISOString();
  return data.users.find((user) => user.id === session.userId) || null;
}

function buildBootstrap(data, activeUser) {
  return {
    authState: {
      accounts: data.users.map(sanitizeUser),
      activeUserId: activeUser ? activeUser.id : null
    },
    appState: {
      activeUserId: activeUser ? activeUser.id : "",
      exercises: data.exercises
        .filter((exercise) => exercise.status !== "draft" || canManageExercise(activeUser, exercise))
        .map((exercise) => sanitizeExercise(exercise, activeUser))
    },
    accountSettings: activeUser
      ? { [activeUser.id]: data.accountSettings[activeUser.id] || createDefaultAccountSettings(activeUser) }
      : {},
    messages: activeUser
      ? data.messages.filter((message) => message.senderId === activeUser.id || message.recipientId === activeUser.id)
      : [],
    createDrafts: activeUser && data.createDrafts[activeUser.id] ? { [activeUser.id]: data.createDrafts[activeUser.id] } : {},
    socialState: data.socialState
  };
}

function hasUserOwnedData(data, userId) {
  return Boolean(
    data.messages.some((message) => message.senderId === userId || message.recipientId === userId) ||
      data.exercises.some(
        (exercise) =>
          exercise.creatorId === userId ||
          exercise.predictions.some((prediction) => prediction.userId === userId) ||
          exercise.scores.some((score) => score.userId === userId)
      ) ||
      data.socialState.customPosts.some((post) => post.authorId === userId) ||
      Object.values(data.socialState.interactions).some(
        (interaction) =>
          interaction.comments.some((comment) => comment.authorId === userId) ||
          interaction.reactions.resonates.includes(userId) ||
          interaction.reactions.curious.includes(userId) ||
          interaction.reactions.sharp.includes(userId)
      ) ||
      data.createDrafts[userId] ||
      data.accountSettings[userId]
  );
}

function isExerciseClosed(exercise) {
  return deriveExerciseStatus(exercise) === "closed";
}

function isExerciseStarted(exercise) {
  const status = deriveExerciseStatus(exercise);
  return status === "active" || status === "closed";
}

function canManageExercise(activeUser, exercise) {
  return Boolean(
    activeUser &&
      (activeUser.id === exercise.creatorId ||
        activeUser.role === "admin" ||
        (Array.isArray(exercise.coCreatorIds) && exercise.coCreatorIds.includes(activeUser.id)))
  );
}

function canEditExercise(activeUser, exercise) {
  return canManageExercise(activeUser, exercise) && !isExerciseStarted(exercise);
}

function hasViewerCompletedExercise(exercise, userId) {
  const submissions = exercise.predictions.filter((prediction) => prediction.userId === userId).length;
  return submissions >= exercise.maxEntriesPerViewer;
}

function sanitizeExercise(exercise, activeUser) {
  const closed = isExerciseClosed(exercise);
  const canManage = canManageExercise(activeUser, exercise);
  const ownPredictionId = activeUser ? exercise.predictions.find((prediction) => prediction.userId === activeUser.id)?.id : null;
  const viewerCompleted = activeUser ? hasViewerCompletedExercise(exercise, activeUser.id) : false;
  const started = isExerciseStarted(exercise);
  const canRevealToViewer =
    closed ||
    canManage ||
    (exercise.revealPolicy === "on_start" && started) ||
    (exercise.revealPolicy === "on_completion" && viewerCompleted);

  return {
    ...exercise,
    status: deriveExerciseStatus(exercise),
    hiddenTarget: canRevealToViewer ? exercise.hiddenTarget : "",
    revealSummary: canRevealToViewer ? exercise.revealSummary : "",
    targetImageData: canRevealToViewer ? exercise.targetImageData : "",
    targetImageName: canRevealToViewer ? exercise.targetImageName : "",
    predictions: closed
      ? exercise.predictions
      : canManage
        ? exercise.predictions
        : activeUser
          ? exercise.predictions.filter((prediction) => prediction.userId === activeUser.id)
          : [],
    scores: closed
      ? exercise.scores
      : ownPredictionId
        ? exercise.scores.filter((score) => score.predictionId === ownPredictionId && score.userId === activeUser?.id)
        : []
  };
}

function importLegacyData(data, payload) {
  const accounts = Array.isArray(payload?.authState?.accounts) ? payload.authState.accounts : [];
  const exercises = Array.isArray(payload?.appState?.exercises) ? payload.appState.exercises : [];
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const createDrafts = payload?.createDrafts && typeof payload.createDrafts === "object" ? payload.createDrafts : {};
  const settings = payload?.accountSettings && typeof payload.accountSettings === "object" ? payload.accountSettings : {};

  let importedUsers = 0;
  let importedExercises = 0;
  let importedMessages = 0;
  let importedDrafts = 0;
  let importedSocialPosts = 0;
  let importedSocialInteractions = 0;

  for (const account of accounts) {
    if (!account || typeof account !== "object" || typeof account.email !== "string" || typeof account.password !== "string") {
      continue;
    }

    const email = normalizeEmail(account.email);
    if (!email || !account.name || !account.id || !account.role || !account.source || !account.createdAt) {
      continue;
    }

    const existingUser = data.users.find((user) => user.email === email || user.id === account.id);
    if (existingUser) {
      continue;
    }

    data.users.push({
      id: account.id,
      name: account.name,
      email,
      passwordHash: hashPassword(account.password),
      role: account.role,
      source: account.source,
      createdAt: account.createdAt
    });
    data.accountSettings[account.id] = settings[account.id] || createDefaultAccountSettings(account);
    importedUsers += 1;
  }

  const exerciseIds = new Set(data.exercises.map((exercise) => exercise.id));
  for (const exercise of exercises) {
    if (!exercise || typeof exercise !== "object" || typeof exercise.id !== "string" || exerciseIds.has(exercise.id)) {
      continue;
    }

    data.exercises.push(exercise);
    exerciseIds.add(exercise.id);
    importedExercises += 1;
  }

  const messageIds = new Set(data.messages.map((message) => message.id));
  for (const message of messages) {
    if (!message || typeof message !== "object" || typeof message.id !== "string" || messageIds.has(message.id)) {
      continue;
    }

    data.messages.push(message);
    messageIds.add(message.id);
    importedMessages += 1;
  }

  for (const [userId, draft] of Object.entries(createDrafts)) {
    if (!draft || typeof draft !== "object") {
      continue;
    }

    data.createDrafts[userId] = draft;
    importedDrafts += 1;
  }

  for (const [userId, accountSetting] of Object.entries(settings)) {
    if (!accountSetting || typeof accountSetting !== "object") {
      continue;
    }

    data.accountSettings[userId] = accountSetting;
  }

  const socialState = normalizeSocialState(payload?.socialState, data.users, data.exercises);

  const customPostIds = new Set(data.socialState.customPosts.map((post) => post.id));
  for (const post of socialState.customPosts) {
    if (customPostIds.has(post.id)) {
      continue;
    }

    data.socialState.customPosts.push(post);
    customPostIds.add(post.id);
    importedSocialPosts += 1;
  }

  for (const [postId, interaction] of Object.entries(socialState.interactions)) {
    if (!(postId in data.socialState.interactions)) {
      data.socialState.interactions[postId] = interaction;
      importedSocialInteractions += 1;
    }
  }

  if (
    importedUsers > 0 ||
    importedExercises > 0 ||
    importedMessages > 0 ||
    importedDrafts > 0 ||
    importedSocialPosts > 0 ||
    importedSocialInteractions > 0
  ) {
    data.metadata.migrationCompletedAt = new Date().toISOString();
  }

  return { importedUsers, importedExercises, importedMessages, importedDrafts, importedSocialPosts, importedSocialInteractions };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRole(role) {
  return role === "creator" || role === "viewer" || role === "admin";
}

function findExercise(data, exerciseId) {
  return data.exercises.find((exercise) => exercise.id === exerciseId) || null;
}

function validateExerciseManagers(data, creatorId, coCreatorIds) {
  const validManagerIds = new Set(
    data.users
      .filter((user) => user.role === "creator" || user.role === "admin")
      .map((user) => user.id)
  );

  return coCreatorIds.every((userId) => userId !== creatorId && validManagerIds.has(userId));
}

function requireAuthenticatedUser(activeUser, response, origin) {
  if (activeUser) {
    return true;
  }

  json(response, 401, { error: "Authentication required." }, origin);
  return false;
}

function sendNotFound(response, request) {
  json(response, 404, { error: "Not found" }, getOrigin(request));
}

ensureDataFile();
console.log(`[psy-backend] database path: ${DATABASE_PATH}`);

const server = http.createServer(async (request, response) => {
  const origin = getOrigin(request);
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,PUT,OPTIONS"
    });
    response.end();
    return;
  }

  try {
    const data = readDatabase();
    const activeUser = getSessionUser(data, request);

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      console.log(`[psy-backend] bootstrap requested by ${activeUser ? activeUser.email : "guest"}`);
      writeDatabase(data);
      json(response, 200, buildBootstrap(data, activeUser), origin);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/social/state") {
      writeDatabase(data);
      json(response, 200, { socialState: data.socialState }, origin);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/session") {
      writeDatabase(data);
      json(
        response,
        200,
        {
          authenticated: Boolean(activeUser),
          user: activeUser ? sanitizeUser(activeUser) : null
        },
        origin
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await readBody(request);
      const name = String(body.name || "").trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const role = body.role;

      console.log(`[psy-backend] registration attempt for ${email}`);

      if (!name || !validateEmail(email) || password.length < 6 || !validateRole(role) || role === "admin") {
        json(response, 400, { error: "Invalid registration payload." }, origin);
        return;
      }

      if (data.users.some((user) => user.email === email)) {
        json(response, 409, { error: "An account with that email already exists." }, origin);
        return;
      }

      const nextUser = {
        id: createId(role),
        name,
        email,
        passwordHash: hashPassword(password),
        role,
        source: "registered",
        createdAt: new Date().toISOString()
      };

      data.users.push(nextUser);
      data.accountSettings[nextUser.id] = createDefaultAccountSettings(nextUser);
      const token = randomBytes(32).toString("hex");
      data.sessions.push({
        tokenHash: hashToken(token),
        userId: nextUser.id,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      });
      writeDatabase(data);
      console.log(`[psy-backend] registration success for ${email}`);
      json(response, 201, { token, bootstrap: buildBootstrap(data, nextUser) }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      const user = data.users.find((entry) => entry.email === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        console.log(`[psy-backend] login failure for ${email}`);
        json(response, 401, { error: "Those credentials did not match an account." }, origin);
        return;
      }

      const token = randomBytes(32).toString("hex");
      data.sessions = data.sessions.filter((entry) => entry.userId !== user.id);
      data.sessions.push({
        tokenHash: hashToken(token),
        userId: user.id,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      });
      writeDatabase(data);
      console.log(`[psy-backend] login success for ${email}`);
      json(response, 200, { token, bootstrap: buildBootstrap(data, user) }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      const token = getSessionToken(request);
      if (token) {
        data.sessions = data.sessions.filter((entry) => entry.tokenHash !== hashToken(token));
        writeDatabase(data);
      }
      json(response, 200, { ok: true }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/migration/import") {
      const body = await readBody(request);
      const migration = importLegacyData(data, body);
      writeDatabase(data);
      console.log(
        `[psy-backend] migration import by ${activeUser ? activeUser.email : "guest"}: users=${migration.importedUsers}, exercises=${migration.importedExercises}, messages=${migration.importedMessages}, drafts=${migration.importedDrafts}`
      );
      json(response, 200, { migrated: Object.values(migration).some((count) => count > 0), migration }, origin);
      return;
    }

    if (!activeUser) {
      json(response, 401, { error: "Authentication required." }, origin);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/account") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const body = await readBody(request);
      const name = String(body.name || "").trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const accountSetting = body.accountSettings;

      if (!name || !validateEmail(email) || (password && password.length < 6)) {
        json(response, 400, { error: "Invalid account update payload." }, origin);
        return;
      }

      if (data.users.some((user) => user.id !== activeUser.id && user.email === email)) {
        json(response, 409, { error: "That email is already assigned to another account." }, origin);
        return;
      }

      const userRecord = data.users.find((user) => user.id === activeUser.id);
      userRecord.name = name;
      userRecord.email = email;
      if (password) {
        userRecord.passwordHash = hashPassword(password);
      }
      data.accountSettings[activeUser.id] = accountSetting || data.accountSettings[activeUser.id];
      writeDatabase(data);
      json(response, 200, { bootstrap: buildBootstrap(data, userRecord) }, origin);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/drafts/create") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const body = await readBody(request);
      if (body && typeof body === "object" && Object.values(body).some((value) => String(value || "").trim() !== "")) {
        data.createDrafts[activeUser.id] = body;
      } else {
        delete data.createDrafts[activeUser.id];
      }
      writeDatabase(data);
      console.log(`[psy-backend] draft save for ${activeUser.email}`);
      json(response, 200, { ok: true }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/exercises") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      if (activeUser.role !== "creator" && activeUser.role !== "admin") {
        json(response, 403, { error: "Only creator or admin accounts can create exercises." }, origin);
        return;
      }

      const body = await readBody(request);
      const publishMode = body.publishMode === "draft" ? "draft" : "publish";
      const startsAt = String(body.startsAt || "");
      const closesAt = String(body.closesAt || "");
      const startsAtTime = new Date(startsAt).getTime();
      const closesAtTime = new Date(closesAt).getTime();
      const coCreatorIds = Array.isArray(body.coCreatorIds)
        ? body.coCreatorIds.filter((entry) => typeof entry === "string")
        : [];
      const revealPolicy =
        body.revealPolicy === "on_completion" || body.revealPolicy === "on_start" ? body.revealPolicy : "on_expiry";
      const maxEntriesPerViewer = Math.max(1, Number.isFinite(Number(body.maxEntriesPerViewer)) ? Number(body.maxEntriesPerViewer) : 1);
      const nextExercise = {
        id: createId("exercise"),
        exerciseNumber: data.metadata.nextExerciseNumber,
        title: String(body.title || "").trim(),
        blindCue: String(body.blindCue || "").trim(),
        viewerPrompt: String(body.viewerPrompt || "").trim(),
        hiddenTarget: String(body.hiddenTarget || "").trim(),
        revealSummary: String(body.revealSummary || "").trim(),
        targetImageData: String(body.targetImageData || ""),
        targetImageName: String(body.targetImageName || ""),
        creatorId: activeUser.id,
        coCreatorIds,
        createdAt: new Date().toISOString(),
        startsAt: startsAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        closesAt: closesAt || new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        status: publishMode === "draft" ? "draft" : "scheduled",
        revealPolicy,
        maxEntriesPerViewer,
        predictions: [],
        scores: []
      };

      if (!validateExerciseManagers(data, activeUser.id, coCreatorIds)) {
        json(response, 400, { error: "Invalid co-creator selection." }, origin);
        return;
      }

      if (
        publishMode === "publish" &&
        (
          !nextExercise.title ||
          !nextExercise.blindCue ||
          !nextExercise.viewerPrompt ||
          !nextExercise.hiddenTarget ||
          !nextExercise.revealSummary ||
          !nextExercise.startsAt ||
          !nextExercise.closesAt ||
          !Number.isFinite(startsAtTime) ||
          !Number.isFinite(closesAtTime) ||
          startsAtTime <= Date.now() ||
          closesAtTime <= startsAtTime
        )
      ) {
        json(response, 400, { error: "Incomplete exercise payload." }, origin);
        return;
      }

      nextExercise.status = publishMode === "draft" ? "draft" : deriveExerciseStatus(nextExercise);
      data.exercises.unshift(nextExercise);
      data.metadata.nextExerciseNumber += 1;
      writeDatabase(data);
      console.log(`[psy-backend] exercise created by ${activeUser.email}: ${nextExercise.id}`);
      json(response, 201, { exercise: sanitizeExercise(nextExercise, activeUser) }, origin);
      return;
    }

    if (request.method === "PUT" && /^\/api\/exercises\/[^/]+$/.test(url.pathname)) {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const exerciseId = url.pathname.split("/")[3];
      const body = await readBody(request);
      const publishMode = body.publishMode === "draft" ? "draft" : "publish";
      const exercise = findExercise(data, exerciseId);

      if (!exercise) {
        sendNotFound(response, request);
        return;
      }

      if (!canEditExercise(activeUser, exercise)) {
        json(response, 403, { error: "This exercise can no longer be edited." }, origin);
        return;
      }

      const startsAt = String(body.startsAt || "");
      const closesAt = String(body.closesAt || "");
      const startsAtTime = new Date(startsAt).getTime();
      const closesAtTime = new Date(closesAt).getTime();
      const coCreatorIds = Array.isArray(body.coCreatorIds)
        ? body.coCreatorIds.filter((entry) => typeof entry === "string")
        : [];

      if (!validateExerciseManagers(data, exercise.creatorId, coCreatorIds)) {
        json(response, 400, { error: "Invalid co-creator selection." }, origin);
        return;
      }

      if (
        publishMode === "publish" &&
        (
          !String(body.title || "").trim() ||
          !String(body.blindCue || "").trim() ||
          !String(body.viewerPrompt || "").trim() ||
          !String(body.hiddenTarget || "").trim() ||
          !String(body.revealSummary || "").trim() ||
          !Number.isFinite(startsAtTime) ||
          !Number.isFinite(closesAtTime) ||
          startsAtTime <= Date.now() ||
          closesAtTime <= startsAtTime
        )
      ) {
        json(response, 400, { error: "Invalid exercise payload." }, origin);
        return;
      }

      exercise.title = String(body.title || "").trim();
      exercise.blindCue = String(body.blindCue || "").trim();
      exercise.viewerPrompt = String(body.viewerPrompt || "").trim();
      exercise.hiddenTarget = String(body.hiddenTarget || "").trim();
      exercise.revealSummary = String(body.revealSummary || "").trim();
      exercise.targetImageData = String(body.targetImageData || "");
      exercise.targetImageName = String(body.targetImageName || "");
      exercise.coCreatorIds = coCreatorIds;
      exercise.startsAt = startsAt || exercise.startsAt;
      exercise.closesAt = closesAt || exercise.closesAt;
      exercise.revealPolicy =
        body.revealPolicy === "on_completion" || body.revealPolicy === "on_start" ? body.revealPolicy : "on_expiry";
      exercise.maxEntriesPerViewer = Math.max(
        1,
        Number.isFinite(Number(body.maxEntriesPerViewer)) ? Number(body.maxEntriesPerViewer) : exercise.maxEntriesPerViewer
      );
      exercise.status = publishMode === "draft" ? "draft" : deriveExerciseStatus(exercise);

      writeDatabase(data);
      console.log(`[psy-backend] exercise updated by ${activeUser.email}: ${exercise.id}`);
      json(response, 200, { exercise: sanitizeExercise(exercise, activeUser) }, origin);
      return;
    }

    if (request.method === "PUT" && /^\/api\/exercises\/[^/]+\/prediction$/.test(url.pathname)) {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const exerciseId = url.pathname.split("/")[3];
      const body = await readBody(request);
      const exercise = findExercise(data, exerciseId);

      if (!exercise) {
        sendNotFound(response, request);
        return;
      }

      if (canManageExercise(activeUser, exercise)) {
        json(response, 403, { error: "Creators cannot submit predictions to their own exercises." }, origin);
        return;
      }

      if (isExerciseClosed(exercise)) {
        json(response, 409, { error: "This exercise is closed." }, origin);
        return;
      }

      if (!isExerciseStarted(exercise)) {
        json(response, 409, { error: "This exercise has not started yet." }, origin);
        return;
      }

      const userPredictions = exercise.predictions.filter((prediction) => prediction.userId === activeUser.id);
      if (userPredictions.length >= exercise.maxEntriesPerViewer) {
        json(response, 409, { error: "You have reached the submission limit for this exercise." }, origin);
        return;
      }

      const nextPrediction = {
        id: createId("prediction"),
        userId: activeUser.id,
        submittedAt: new Date().toISOString(),
        imageData: String(body.imageData || ""),
        notes: String(body.notes || "").trim(),
        entryNumber: userPredictions.length + 1
      };

      exercise.predictions.unshift(nextPrediction);
      writeDatabase(data);
      console.log(`[psy-backend] prediction save for ${activeUser.email} on ${exerciseId}`);
      json(response, 200, { exercise: sanitizeExercise(exercise, activeUser) }, origin);
      return;
    }

    if (request.method === "PUT" && /^\/api\/exercises\/[^/]+\/scores\/[^/]+$/.test(url.pathname)) {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const [, , , exerciseId, , predictionId] = url.pathname.split("/");
      const body = await readBody(request);
      const exercise = findExercise(data, exerciseId);

      if (!exercise) {
        sendNotFound(response, request);
        return;
      }

      if (!isExerciseClosed(exercise)) {
        json(response, 409, { error: "Scores can only be submitted after an exercise closes." }, origin);
        return;
      }

      if (!exercise.predictions.some((prediction) => prediction.id === predictionId)) {
        json(response, 404, { error: "Prediction not found." }, origin);
        return;
      }

      const nextScore = {
        predictionId,
        userId: activeUser.id,
        accuracy: Number(body.accuracy || 0),
        comment: String(body.comment || "").trim()
      };
      const existingIndex = exercise.scores.findIndex(
        (score) => score.predictionId === predictionId && score.userId === activeUser.id
      );
      if (existingIndex >= 0) {
        exercise.scores[existingIndex] = nextScore;
      } else {
        exercise.scores.push(nextScore);
      }
      writeDatabase(data);
      console.log(`[psy-backend] score save for ${activeUser.email} on ${exerciseId}/${predictionId}`);
      json(response, 200, { exercise: sanitizeExercise(exercise, activeUser) }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/messages") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const body = await readBody(request);
      const nextMessage = {
        id: createId("message"),
        senderId: activeUser.id,
        recipientId: String(body.recipientId || ""),
        exerciseId: body.exerciseId ? String(body.exerciseId) : null,
        subject: String(body.subject || "").trim(),
        body: String(body.body || "").trim(),
        createdAt: new Date().toISOString(),
        readBy: [activeUser.id]
      };

      if (!nextMessage.recipientId || !nextMessage.body) {
        json(response, 400, { error: "Invalid message payload." }, origin);
        return;
      }

      data.messages.unshift(nextMessage);
      writeDatabase(data);
      console.log(`[psy-backend] message save from ${activeUser.email} to ${nextMessage.recipientId}`);
      json(response, 201, { message: nextMessage }, origin);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/messages/read") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const body = await readBody(request);
      const ids = Array.isArray(body.messageIds) ? body.messageIds : [];
      let changed = 0;
      for (const message of data.messages) {
        if (ids.includes(message.id) && message.recipientId === activeUser.id && !message.readBy.includes(activeUser.id)) {
          message.readBy.push(activeUser.id);
          changed += 1;
        }
      }
      writeDatabase(data);
      console.log(`[psy-backend] message read update for ${activeUser.email}: ${changed}`);
      json(response, 200, { ok: true }, origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/social/posts") {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      if (activeUser.role !== "creator" && activeUser.role !== "admin") {
        json(response, 403, { error: "Only creator or admin accounts can publish social posts." }, origin);
        return;
      }

      const body = await readBody(request);
      const headline = String(body.headline || "").trim();
      const postBody = String(body.body || "").trim();
      const exerciseId = String(body.exerciseId || "").trim();
      const linkedExercise = exerciseId ? findExercise(data, exerciseId) : null;

      if (!headline || !postBody) {
        json(response, 400, { error: "Headline and post body are required." }, origin);
        return;
      }

      const nextPost = {
        id: createId("social"),
        authorId: activeUser.id,
        kind: "creator_update",
        headline,
        body: postBody,
        createdAt: new Date().toISOString(),
        exerciseId: linkedExercise ? linkedExercise.id : null,
        statsLabel: "Community post",
        audience: linkedExercise ? (isExerciseClosed(linkedExercise) ? "Public archive" : "Blind-safe") : "Community",
        ctaLabel: linkedExercise ? (isExerciseClosed(linkedExercise) ? "Open Review" : "Open Exercise Feed") : "Open Social Feed",
        ctaPath: linkedExercise ? (isExerciseClosed(linkedExercise) ? "/review" : "/exercises") : "/social"
      };

      data.socialState.customPosts.unshift(nextPost);
      data.socialState.interactions[nextPost.id] = createEmptySocialInteraction();
      writeDatabase(data);
      console.log(`[psy-backend] social post created by ${activeUser.email}: ${nextPost.id}`);
      json(response, 201, { post: nextPost, socialState: data.socialState }, origin);
      return;
    }

    if (request.method === "PUT" && /^\/api\/social\/posts\/[^/]+\/reactions$/.test(url.pathname)) {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const postId = decodeURIComponent(url.pathname.split("/")[4]);
      const body = await readBody(request);
      const reaction = String(body.reaction || "");

      if (reaction !== "resonates" && reaction !== "curious" && reaction !== "sharp") {
        json(response, 400, { error: "Invalid reaction." }, origin);
        return;
      }

      if (!getSocialPostIds(data).has(postId)) {
        json(response, 404, { error: "Social post not found." }, origin);
        return;
      }

      const existing = data.socialState.interactions[postId] || createEmptySocialInteraction();
      const nextReactions = {
        resonates: existing.reactions.resonates.filter((userId) => userId !== activeUser.id),
        curious: existing.reactions.curious.filter((userId) => userId !== activeUser.id),
        sharp: existing.reactions.sharp.filter((userId) => userId !== activeUser.id)
      };

      if (!existing.reactions[reaction].includes(activeUser.id)) {
        nextReactions[reaction].push(activeUser.id);
      }

      data.socialState.interactions[postId] = {
        ...existing,
        reactions: nextReactions
      };
      writeDatabase(data);
      console.log(`[psy-backend] social reaction update by ${activeUser.email}: ${postId}/${reaction}`);
      json(response, 200, { socialState: data.socialState }, origin);
      return;
    }

    if (request.method === "POST" && /^\/api\/social\/posts\/[^/]+\/comments$/.test(url.pathname)) {
      if (!requireAuthenticatedUser(activeUser, response, origin)) {
        return;
      }

      const postId = decodeURIComponent(url.pathname.split("/")[4]);
      const body = await readBody(request);
      const commentBody = String(body.body || "").trim();

      if (!commentBody) {
        json(response, 400, { error: "Comment body is required." }, origin);
        return;
      }

      if (!getSocialPostIds(data).has(postId)) {
        json(response, 404, { error: "Social post not found." }, origin);
        return;
      }

      const nextComment = {
        id: createId("comment"),
        authorId: activeUser.id,
        body: commentBody,
        createdAt: new Date().toISOString()
      };
      const existing = data.socialState.interactions[postId] || createEmptySocialInteraction();
      data.socialState.interactions[postId] = {
        ...existing,
        comments: [nextComment, ...existing.comments]
      };
      writeDatabase(data);
      console.log(`[psy-backend] social comment created by ${activeUser.email}: ${postId}/${nextComment.id}`);
      json(response, 201, { comment: nextComment, socialState: data.socialState }, origin);
      return;
    }

    sendNotFound(response, request);
  } catch (error) {
    console.error("[psy-backend] request failure", error);
    json(response, 500, { error: "Internal server error." }, getOrigin(request));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[psy-backend] listening on http://${HOST}:${PORT}`);
});
