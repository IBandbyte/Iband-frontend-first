import {
  flushMovieMentorDurableStateSync,
  getDurableSyncStatus,
} from "./MovieMentorDurableStateSync.js";

const MOVIE_MENTOR_TURN_CLIENT_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function apiBase() {
  return cleanString(
    import.meta?.env?.VITE_API_BASE_URL ||
      import.meta?.env?.VITE_BACKEND_URL ||
      ""
  ).replace(/\/$/, "");
}

function createTurnError(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  return error;
}

function resolveIdentity({ projectId, creatorSessionId } = {}) {
  const project = cleanString(projectId);
  const session = cleanString(creatorSessionId);

  if (!project && !session) {
    throw createTurnError(
      "MOVIE_MENTOR_TURN_IDENTITY_REQUIRED",
      "Movie Mentor needs a projectId or creatorSessionId before a live turn can run."
    );
  }

  return {
    projectId: project || null,
    creatorSessionId: session || null,
  };
}

function assertDurableRealityAcknowledged(status) {
  if (!status) return;

  if (status.status === "acknowledged") return;

  if (
    status.status === "queued" ||
    status.status === "syncing" ||
    status.status === "retry-pending" ||
    status.status === "conflict-pending"
  ) {
    throw createTurnError(
      "MOVIE_MENTOR_DURABLE_REALITY_NOT_ACKNOWLEDGED",
      "The creator's latest durable reality has not been acknowledged yet, so Movie Mentor will not reason against an older snapshot.",
      { durableSyncStatus: status }
    );
  }
}

async function requestMovieMentorTurn({
  message,
  projectId = null,
  creatorSessionId = null,
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  const creatorMessage = cleanString(message);
  if (!creatorMessage) {
    throw createTurnError(
      "MOVIE_MENTOR_TURN_MESSAGE_REQUIRED",
      "A creator message is required for a live Movie Mentor turn."
    );
  }

  if (typeof fetchImpl !== "function") {
    throw createTurnError(
      "MOVIE_MENTOR_TURN_FETCH_UNAVAILABLE",
      "Movie Mentor cannot reach the backend turn gateway because fetch is unavailable."
    );
  }

  const identity = resolveIdentity({ projectId, creatorSessionId });

  await flushMovieMentorDurableStateSync({
    ...identity,
    fetchImpl,
    storage,
  });

  const durableStatus = getDurableSyncStatus({
    ...identity,
    storage,
  });
  assertDurableRealityAcknowledged(durableStatus);

  const response = await fetchImpl(`${apiBase()}/api/movie-mentor/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...identity,
      message: creatorMessage,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success !== true) {
    throw createTurnError(
      cleanString(payload?.code) || "MOVIE_MENTOR_LIVE_TURN_FAILED",
      cleanString(payload?.message) ||
        "The authoritative Movie Mentor turn did not complete.",
      {
        status: response.status,
        validationIssues: Array.isArray(payload?.validationIssues)
          ? payload.validationIssues
          : [],
      }
    );
  }

  const text = cleanString(payload?.text);
  if (!text) {
    throw createTurnError(
      "MOVIE_MENTOR_LIVE_TURN_EMPTY_RESPONSE",
      "The authoritative Movie Mentor turn returned no creator-facing response."
    );
  }

  return {
    ...payload,
    text,
    durableSyncStatus: durableStatus,
    metadata: {
      ...(payload?.metadata || {}),
      turnClientVersion: MOVIE_MENTOR_TURN_CLIENT_VERSION,
      liveBackendTurn: true,
      localResponseGeneratorUsed: false,
    },
  };
}

export {
  MOVIE_MENTOR_TURN_CLIENT_VERSION,
  resolveIdentity,
  assertDurableRealityAcknowledged,
  requestMovieMentorTurn,
};

export default requestMovieMentorTurn;
