import {
  getExpectedRevision,
  rememberRevision,
} from "./MovieMentorDurableStateSync.js";
import requestMovieMentorTurn from "./MovieMentorTurnClient.js";

const MOVIE_MENTOR_LIVE_GATEWAY_SERVICE_VERSION = "1.0.0";
const WORKSPACE_SESSION_KEY = "iband.movie-mentor.workspace-session";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function apiBase() {
  return cleanString(
    import.meta?.env?.VITE_API_BASE_URL ||
      import.meta?.env?.VITE_BACKEND_URL ||
      ""
  ).replace(/\/$/, "");
}

function createSessionId() {
  if (typeof globalThis?.crypto?.randomUUID === "function") {
    return `movie-workspace-${globalThis.crypto.randomUUID()}`;
  }
  return `movie-workspace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveWorkspaceIdentity({ request = {}, storage = globalThis?.localStorage } = {}) {
  const projectId = cleanString(
    request?.projectId ||
      request?.projectJourneySnapshot?.projectId ||
      request?.projectJourney?.projectId ||
      request?.movieJourneyContext?.projectId ||
      ""
  );

  if (projectId) {
    return { projectId, creatorSessionId: null };
  }

  let creatorSessionId = "";
  try {
    creatorSessionId = cleanString(storage?.getItem?.(WORKSPACE_SESSION_KEY));
  } catch {}

  if (!creatorSessionId) {
    creatorSessionId = createSessionId();
    try {
      storage?.setItem?.(WORKSPACE_SESSION_KEY, creatorSessionId);
    } catch {}
  }

  return { projectId: null, creatorSessionId };
}

function createWorkspaceConfirmedContext(request = {}) {
  return [
    {
      key: "creator-mode",
      value: {
        creatorType: cleanString(request?.creatorType) || "video",
        creatorLabel: cleanString(request?.creatorLabel) || null,
        creatorMode: cleanString(request?.creatorMode) || "ai-movie",
        creatorModeLabel: cleanString(request?.creatorModeLabel) || null,
        creatorJourney: cleanString(request?.creatorJourney) || "guide",
      },
      source: "creator-workspace",
      certainty: "confirmed",
    },
  ];
}

async function syncWorkspaceReality({
  request = {},
  identity,
  fetchImpl = globalThis?.fetch,
  storage = globalThis?.localStorage,
} = {}) {
  if (typeof fetchImpl !== "function") {
    const error = new Error("Movie Mentor cannot sync workspace reality because fetch is unavailable.");
    error.code = "MOVIE_MENTOR_WORKSPACE_SYNC_FETCH_UNAVAILABLE";
    throw error;
  }

  const expectedRevision = getExpectedRevision({ ...identity, storage });
  const response = await fetchImpl(`${apiBase()}/api/movie-mentor/state/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...identity,
      source: "creator-workspace",
      expectedRevision,
      state: {
        creatorConfirmedContext: createWorkspaceConfirmedContext(request),
        projectJourney: clone(
          request?.projectJourneySnapshot ||
            request?.projectJourney ||
            null
        ),
        memoryContext: clone(request?.movieJourneyContext?.memoryContext || null),
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    const error = new Error(
      cleanString(payload?.message) || "Movie Mentor workspace reality sync failed."
    );
    error.code = cleanString(payload?.code) || "MOVIE_MENTOR_WORKSPACE_SYNC_FAILED";
    error.status = response.status;
    throw error;
  }

  rememberRevision({
    ...identity,
    revision: payload?.state?.revision,
    storage,
  });

  return payload;
}

function toCreatorWorkspaceResult(turn) {
  const text = cleanString(turn?.text);
  const semanticIntelligence = clone(turn?.semanticIntelligence || null);

  return {
    success: true,
    status: turn?.status || "mentor-response-ready",
    prompt: text,
    content: text,
    preview: text,
    response: {
      text,
      structured: {
        movieJourneyIntelligence: semanticIntelligence,
      },
    },
    movieJourneyIntelligence: semanticIntelligence,
    specialistAgentPlan: clone(turn?.specialistPlan || null),
    specialistExecution: clone(turn?.specialistResult || null),
    mentorSynthesis: clone(turn?.synthesisResult || null),
    turnContextProof: clone(turn?.turnContextProof || null),
    authority: clone(turn?.authority || null),
    mayAdvanceJourney: turn?.mayAdvanceJourney === true,
    metadata: {
      ...(turn?.metadata || {}),
      movieMentorLiveGatewayServiceVersion: MOVIE_MENTOR_LIVE_GATEWAY_SERVICE_VERSION,
      liveBackendTurn: true,
      localResponseGeneratorUsed: false,
    },
  };
}

async function generateMovieMentorLiveResponse(
  request = {},
  {
    fetchImpl = globalThis?.fetch,
    storage = globalThis?.localStorage,
  } = {}
) {
  const message = cleanString(request?.idea);
  if (!message) {
    const error = new Error("Movie Mentor needs the creator's idea before a live turn can run.");
    error.code = "MOVIE_MENTOR_TURN_MESSAGE_REQUIRED";
    throw error;
  }

  const identity = resolveWorkspaceIdentity({ request, storage });
  await syncWorkspaceReality({ request, identity, fetchImpl, storage });

  const turn = await requestMovieMentorTurn({
    message,
    ...identity,
    fetchImpl,
    storage,
  });

  return toCreatorWorkspaceResult(turn);
}

export {
  MOVIE_MENTOR_LIVE_GATEWAY_SERVICE_VERSION,
  WORKSPACE_SESSION_KEY,
  resolveWorkspaceIdentity,
  createWorkspaceConfirmedContext,
  syncWorkspaceReality,
  toCreatorWorkspaceResult,
  generateMovieMentorLiveResponse,
};

export default generateMovieMentorLiveResponse;
