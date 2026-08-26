const MOVIE_MENTOR_JOURNEY_PROJECTION_RUNTIME_VERSION = "1.0.0";

function clone(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function positionOf(journey = {}) {
  return {
    currentStageId: journey?.currentStageId ?? null,
    currentTaskId: journey?.currentTaskId ?? null,
    resumePoint: clone(journey?.resumePoint ?? null),
    stages: clone(journey?.stages ?? []),
  };
}

function projectCommittedCreatorAuthorityIntoJourney({
  journeyEngine,
  identityRuntime,
  projectJourney,
  projectId,
  turnResult,
} = {}) {
  const authority = turnResult?.postCommitCreatorAuthority || null;
  if (!authority) {
    return { status: "no-post-commit-authority", projectJourney, projected: false };
  }
  if (!projectJourney || !projectId) {
    const error = new Error("Live creator authority cannot be projected without the active project Journey and project identity.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_CONTEXT_REQUIRED";
    throw error;
  }
  if (!journeyEngine || typeof journeyEngine.reconcileAuthoritativeCreatorTruth !== "function") {
    const error = new Error("Canonical CreatorJourneyEngine projection API is required.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_ENGINE_REQUIRED";
    throw error;
  }
  if (!identityRuntime || typeof identityRuntime.persistJourney !== "function") {
    const error = new Error("Movie Mentor identity runtime persistence is required.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_PERSISTENCE_REQUIRED";
    throw error;
  }

  const before = positionOf(projectJourney);
  const projectedJourney = journeyEngine.reconcileAuthoritativeCreatorTruth(projectJourney, authority);
  const after = positionOf(projectedJourney);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    const error = new Error("Live creator authority projection attempted to move Journey position.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_MOVED_POSITION";
    throw error;
  }

  const persistedProject = identityRuntime.persistJourney(projectId, projectedJourney);
  if (!persistedProject) {
    const error = new Error("Projected creator authority could not be persisted into the active Movie Mentor project.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_PERSIST_FAILED";
    throw error;
  }

  return {
    status: "projected-and-persisted",
    projectJourney: projectedJourney,
    persistedProject,
    projected: true,
    authorityRevision: authority.revision ?? null,
  };
}

export {
  MOVIE_MENTOR_JOURNEY_PROJECTION_RUNTIME_VERSION,
  positionOf,
  projectCommittedCreatorAuthorityIntoJourney,
};
export default projectCommittedCreatorAuthorityIntoJourney;
