import createJourneyCreatorTruthProjectionExecutionRuntime from "./JourneyCreatorTruthProjectionExecutionRuntime.js";

const MOVIE_MENTOR_JOURNEY_PROJECTION_RUNTIME_VERSION = "2.0.0";

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

async function projectCommittedCreatorAuthorityIntoJourney({
  identityRuntime,
  projectJourney,
  projectId,
  turnResult,
  creatorTruthProjectionRuntime = null,
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
  if (!identityRuntime?.memory?.getProject) {
    const error = new Error("Movie Mentor identity runtime project access is required.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_RUNTIME_REQUIRED";
    throw error;
  }

  const runtime = creatorTruthProjectionRuntime || createJourneyCreatorTruthProjectionExecutionRuntime({ identityRuntime });
  if (!runtime || typeof runtime.execute !== "function") {
    const error = new Error("Journey Authority creator-truth projection runtime is required.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_AUTHORITY_RUNTIME_REQUIRED";
    throw error;
  }

  const result = await runtime.execute({ projectId, postCommitCreatorAuthority: authority });
  const authoritativeJourney = clone(result?.projectJourney || null);
  if (!authoritativeJourney) {
    const error = new Error("Projected creator authority could not be verified in Journey Authority.");
    error.code = "MOVIE_MENTOR_LIVE_JOURNEY_PROJECTION_AUTHORITY_COMMIT_FAILED";
    throw error;
  }

  return {
    status: result.status,
    projectJourney: authoritativeJourney,
    persistedProject: null,
    projected: result.status !== "already-projected",
    authorityCommitted: result.authorityCommitted === true,
    authorityGeneration: result.authorityGeneration ?? null,
    progressionRevision: result.progressionRevision ?? null,
    authorityRevision: result.creatorAuthorityRevision ?? authority.revision ?? null,
    operationId: result.operationId ?? null,
    serialization: clone(result.serialization ?? null),
  };
}

export {
  MOVIE_MENTOR_JOURNEY_PROJECTION_RUNTIME_VERSION,
  positionOf,
  projectCommittedCreatorAuthorityIntoJourney,
};
export default projectCommittedCreatorAuthorityIntoJourney;
