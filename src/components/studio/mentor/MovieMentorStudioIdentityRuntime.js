import createCreatorMemory, { PROJECT_STATUSES } from "./CreatorMemory.js";

const MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION = "1.0.0";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function issueWorkingSessionId({ cryptoImpl = globalThis?.crypto } = {}) {
  if (!cryptoImpl || typeof cryptoImpl.randomUUID !== "function") {
    const error = new Error("Movie Mentor working-session identity requires crypto.randomUUID().");
    error.code = "MOVIE_MENTOR_WORKING_SESSION_CRYPTO_REQUIRED";
    throw error;
  }
  return `movie-session-${cryptoImpl.randomUUID()}`;
}

function isMovieMentorProject(project) {
  return Boolean(
    project &&
    clean(project.id) &&
    project.creatorType === "video" &&
    project.metadata?.creatorMode === "ai-movie"
  );
}

function createMovieMentorStudioIdentityRuntime({
  memory = createCreatorMemory(),
  cryptoImpl = globalThis?.crypto,
} = {}) {
  const creatorSessionId = issueWorkingSessionId({ cryptoImpl });

  function getActiveProject() {
    const project = memory.getActiveProject?.() || null;
    return isMovieMentorProject(project) ? project : null;
  }

  function ensureProject({ projectJourney = null, title = "Untitled Movie" } = {}) {
    const existing = getActiveProject();
    if (existing) return existing;
    return memory.saveProject({
      title,
      creatorType: "video",
      status: PROJECT_STATUSES.CREATING,
      metadata: {
        creatorMode: "ai-movie",
        creatorModeLabel: "AI Movie Making",
        projectJourney,
        createdFrom: "CreatorWorkspace",
      },
    });
  }

  function persistJourney(projectId, projectJourney) {
    const project = memory.getProject?.(projectId);
    if (!project) return null;
    return memory.updateProject(projectId, {
      metadata: {
        ...(project.metadata || {}),
        creatorMode: "ai-movie",
        creatorModeLabel: project.metadata?.creatorModeLabel || "AI Movie Making",
        projectJourney,
      },
    });
  }

  function getResumeSnapshot() {
    const project = getActiveProject();
    if (!project) return null;
    return {
      project,
      projectId: project.id,
      creatorSessionId,
      projectJourney: project.metadata?.projectJourney || null,
    };
  }

  return {
    version: MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
    memory,
    creatorSessionId,
    getActiveProject,
    ensureProject,
    persistJourney,
    getResumeSnapshot,
  };
}

export {
  MOVIE_MENTOR_STUDIO_IDENTITY_RUNTIME_VERSION,
  issueWorkingSessionId,
  isMovieMentorProject,
  createMovieMentorStudioIdentityRuntime,
};

export default createMovieMentorStudioIdentityRuntime;
